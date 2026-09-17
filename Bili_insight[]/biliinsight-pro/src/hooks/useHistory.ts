/**
 * useHistory - 历史记录管理 Hook（后端持久化版）
 * 由 localStorage 改为后端 /api/history，支持跨会话持久化。
 * 不再把任何数据（含敏感信息）存到浏览器 localStorage。
 */

import { useState, useEffect, useCallback } from 'react';
import { getHistory, addHistory, clearHistory } from '@/src/api/client';
import type { ExtractionSession } from '@/src/types';

/**
 * 管理提取历史记录的 Hook
 * @returns history - 历史记录列表, saveToHistory - 保存记录, clearHistory - 清空记录
 */
export function useHistory() {
  const [history, setHistory] = useState<ExtractionSession[]>([]);
  const [loaded, setLoaded] = useState(false);

  // 挂载时从后端加载历史
  useEffect(() => {
    getHistory()
      .then((data) => setHistory(data.sessions || []))
      .catch(() => setHistory([]))
      .finally(() => setLoaded(true));
  }, []);

  /** 保存会话到历史记录（后端去重 + 裁剪，前端仅做乐观更新） */
  const saveToHistory = useCallback((session: ExtractionSession) => {
    setHistory((prev) => [session, ...prev.filter((h) => h.id !== session.id)].slice(0, 50));
    addHistory(session).catch(() => {
      /* 离线时静默失败，不影响当前会话 */
    });
  }, []);

  /** 清空所有历史记录 */
  const clear = useCallback(() => {
    setHistory([]);
    clearHistory().catch(() => {});
  }, []);

  return { history, saveToHistory: saveToHistory, clearHistory: clear, loaded };
}
