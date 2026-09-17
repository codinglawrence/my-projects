/**
 * BiliInsight Pro - 统一 API 客户端
 * 封装所有后端请求，提供类型安全的 fetch 调用和统一错误处理。
 * 注意：API Key 绝不经此客户端回显/存储，仅以“发送”方式提交到 /api/settings。
 */

import type {
  ExtractRequest,
  ExtractTaskResponse,
  TaskStatusData,
  TaskResultData,
  SettingsData,
  SaveSettingsRequest,
  HistoryResponse,
  ExportRequest,
  ChatResponse,
} from '@/src/types';

/** 后端 API 基础地址（桌面内即本机 Flask） */
const API_BASE_URL = 'http://localhost:5000';

/** 统一响应包装（后端约定 { success, data?, message? }） */
interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * 通用 fetch 封装，自动处理 JSON 解析和错误
 * @param endpoint - API 端点路径
 * @param options - fetch 选项
 * @returns 解析后的 data 字段
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // 桌面端（Electron）持有本地一次性令牌，注入 Authorization 头供后端鉴权（修复 H2）；
  // 浏览器开发态无 window.electron，则不携带令牌，由后端按开发模式放行。
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const api = (window as unknown as { electron?: { getLocalToken?: () => Promise<string> } }).electron;
  if (api && api.getLocalToken) {
    try {
      const token = await api.getLocalToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch {
      /* 忽略：无令牌则走开发模式 */
    }
  }

  const response = await fetch(API_BASE_URL + endpoint, {
    headers,
    ...options,
  });

  const envelope: ApiEnvelope<T> = await response.json().catch(() => ({
    success: false,
    message: `HTTP error! status: ${response.status}`,
  }));

  if (!response.ok || !envelope.success) {
    throw new Error(envelope.message || `请求失败：HTTP ${response.status}`);
  }
  return envelope.data as T;
}

/**
 * 发起异步提取任务，立即返回 task_id（真实进度由轮询获取）
 * @param params - 提取请求参数（不含 key）
 * @returns task_id 与初始状态
 */
export async function extractVideos(params: ExtractRequest): Promise<ExtractTaskResponse['data']> {
  return request<ExtractTaskResponse['data']>('/api/extract', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/** 轮询任务真实进度 */
export async function getTaskStatus(taskId: string): Promise<TaskStatusData> {
  return request<TaskStatusData>(`/api/task/${taskId}/status`);
}

/** 任务完成后取最终结果 */
export async function getTaskResult(taskId: string): Promise<TaskResultData> {
  return request<TaskResultData>(`/api/task/${taskId}/result`);
}

/** 拉取设置（不含 key 明文，仅 has_key 标记） */
export async function getSettings(): Promise<SettingsData> {
  return request<SettingsData>('/api/settings');
}

/** 保存设置（api_key 仅发送，前端不回显/不存储） */
export async function saveSettings(payload: SaveSettingsRequest): Promise<{ has_key: boolean }> {
  return request<{ has_key: boolean }>('/api/settings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** 拉取历史记录 */
export async function getHistory(): Promise<HistoryResponse['data']> {
  return request<HistoryResponse['data']>('/api/history');
}

/** 追加一条历史记录 */
export async function addHistory(session: unknown): Promise<void> {
  await request<void>('/api/history', {
    method: 'POST',
    body: JSON.stringify({ session }),
  });
}

/** 清空历史记录 */
export async function clearHistory(): Promise<void> {
  await request<void>('/api/history', { method: 'DELETE' });
}

/** 导出结果到用户选定路径 */
export async function exportResult(payload: ExportRequest): Promise<{ path: string }> {
  return request<{ path: string }>('/api/export', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * 发送 AI 对话请求（基于已提取结果的问答）
 * @param context - 对话上下文（视频分析结果）
 * @param question - 用户问题
 * @returns { answer: string }
 */
export async function askQuestion(context: string, question: string): Promise<ChatResponse> {
  return request<ChatResponse>('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ context, question }),
  });
}
