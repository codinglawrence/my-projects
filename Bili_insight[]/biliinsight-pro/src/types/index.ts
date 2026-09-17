/**
 * BiliInsight Pro - TypeScript 类型定义
 * 统一管理项目中所有共享类型接口
 */

/** 单个视频的分析结果 */
export interface VideoResult {
  bvid: string;
  title: string;
  created: string;
  core_views: string[];
  summary: string;
  url: string;
}

/** 一次提取会话的完整数据 */
export interface ExtractionSession {
  id: string;
  uid: string;
  timestamp: string;
  totalVideos: number;
  results: VideoResult[];
  overall_summary: string;
}

/** 聊天消息 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** API 提取请求参数 */
export interface ExtractRequest {
  uid: string;
  max_videos: number;
  model_type: string;
}

/** API 提取响应 */
export interface ExtractResponse {
  success: boolean;
  message?: string;
  total: number;
  results: Array<Record<string, string>>;
  overall_summary: string;
}

/** API 聊天响应 */
export interface ChatResponse {
  answer: string;
}

/** 异步提取请求：仅传 uid / max_videos / model_type，不传 key */
export interface ExtractRequest {
  uid: string;
  max_videos: number;
  model_type?: string;
}

/** 异步提取返回：仅 task_id 与初始状态 */
export interface ExtractTaskResponse {
  success: boolean;
  message?: string;
  data: {
    task_id: string;
    status: string;
  };
}

/** 任务进度状态（轮询） */
export interface TaskStatusData {
  id: string;
  status: 'pending' | 'running' | 'done' | 'error';
  stage: string;
  processed: number;
  total: number;
  current_title: string;
  error?: string | null;
}

/** 任务结果 */
export interface TaskResultData {
  id: string;
  status: string;
  results: Array<Record<string, string>>;
  overall_summary: string;
  error?: string | null;
}

/** 设置项（key 不出现在前端类型中，仅 has_key 标记） */
export interface SettingsData {
  provider: string;
  has_key: boolean;
  temperature: number;
  max_tokens: number;
  max_videos: number;
  save_path: string;
}

/** 保存设置请求：api_key 仅“发送”，前端不回显、不存储 */
export interface SaveSettingsRequest {
  provider: string;
  api_key?: string;
  temperature: number;
  max_tokens: number;
  max_videos: number;
  save_path: string;
}

/** 历史记录响应 */
export interface HistoryResponse {
  success: boolean;
  data: {
    sessions: ExtractionSession[];
  };
}

/** 导出请求 */
export interface ExportRequest {
  format: 'excel' | 'markdown' | 'json';
  path?: string;
  results: Array<Record<string, string>>;
  overall_summary: string;
}

/** 模型供应商选项 */
export const PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'siliconflow', label: 'SiliconFlow' },
  { value: 'dashscope', label: 'DashScope' },
] as const;
