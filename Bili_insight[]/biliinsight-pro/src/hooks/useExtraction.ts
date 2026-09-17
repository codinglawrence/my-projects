/**
 * useExtraction - 视频提取逻辑 Hook（真实进度轮询版）
 * 管理提取流程：参数设置、发起异步任务、轮询真实进度、取结果、解析。
 * 关键变更：
 *  - 彻底移除“假进度条 10%→100%”，改为轮询 /api/task/<id>/status 计算真实百分比；
 *  - handleExtract 返回 Promise，任务 done 时 resolve、error 时 reject，
 *    使上层 toast 在真正完成/失败时才弹出（不再提前成功）。
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  extractVideos,
  getTaskStatus,
  getTaskResult,
} from '@/src/api/client';
import type { ExtractionSession, VideoResult } from '@/src/types';

const POLL_INTERVAL_MS = 1000; // 轮询间隔 ~1s（见系统设计）

/**
 * 视频提取 Hook
 * @param saveToHistory - 保存到历史记录的回调
 * @param modelType - 当前模型供应商（来自设置，替代原硬编码 'dashscope'）
 * @returns 提取相关状态和方法
 */
export function useExtraction(
  saveToHistory: (session: ExtractionSession) => void,
  modelType: string = 'dashscope'
) {
  const [uid, setUid] = useState('');
  const [maxVideos, setMaxVideos] = useState('5');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0); // 真实进度 0-100
  const [status, setStatus] = useState('');
  const [currentSession, setCurrentSession] = useState<ExtractionSession | null>(null);

  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

  /** 把后端中文键结果转换为前端结构 */
  const mapResults = (raw: Array<Record<string, string>>): VideoResult[] =>
    raw.map((r) => {
      const coreViewsText = r['核心观点'] || '';
      const coreViews = coreViewsText
        .split(/核心观点\d+：/)
        .filter((s: string) => s.trim())
        .map((s: string) => s.trim().replace(/\n+/g, ' '));
      return {
        bvid: r['视频链接']?.split('/').pop() || '',
        title: r['视频标题'] || '',
        created: r['发布时间'] || '',
        core_views: coreViews,
        summary: r['核心观点'] || '',
        url: r['视频链接'] || '',
      };
    });

  /**
   * 执行视频提取（异步任务 + 真实进度轮询）。
   * 返回 Promise：任务完成 resolve，出错 reject（供上层 toast）。
   */
  const handleExtract = useCallback((): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
      if (!uid) {
        reject(new Error('请输入UP主UID'));
        return;
      }
      if (pollTimer.current) clearInterval(pollTimer.current);

      setLoading(true);
      setProgress(2);
      setStatus('正在创建任务...');

      try {
        // 1) 发起异步任务，立即拿到 task_id（不再同步阻塞）
        const task = await extractVideos({
          uid,
          max_videos: parseInt(maxVideos, 10) || 5,
          model_type: modelType, // 来自设置面板，不再写死
        });

        // 2) 轮询真实进度
        pollTimer.current = setInterval(async () => {
          try {
            const st = await getTaskStatus(task.task_id);
            if (!isMounted.current) return;

            if (st.total > 0) {
              setProgress(Math.min(99, Math.round((st.processed / st.total) * 100)));
            } else {
              setProgress(5); // 已建任务、等待获取视频列表
            }
            setStatus(
              st.current_title
                ? `正在处理 (${st.processed}/${st.total})：${st.current_title}`
                : `准备中 (${st.processed}/${st.total})`
            );

            if (st.status === 'done') {
              if (pollTimer.current) clearInterval(pollTimer.current);
              const res = await getTaskResult(task.task_id);
              if (!isMounted.current) return;
              const results = mapResults(res.results);
              const session: ExtractionSession = {
                id: Date.now().toString(),
                uid,
                timestamp: new Date().toISOString(),
                totalVideos: res.results.length,
                results,
                overall_summary: res.overall_summary || '',
              };
              setCurrentSession(session);
              saveToHistory(session);
              setProgress(100);
              setStatus('提取完成！');
              setTimeout(() => { if (isMounted.current) setLoading(false); }, 800);
              resolve();
            } else if (st.status === 'error') {
              if (pollTimer.current) clearInterval(pollTimer.current);
              setLoading(false);
              setStatus('');
              reject(new Error(st.error || '提取失败'));
            }
          } catch (err) {
            if (pollTimer.current) clearInterval(pollTimer.current);
            if (isMounted.current) {
              setLoading(false);
              setStatus('');
            }
            reject(err instanceof Error ? err : new Error('轮询失败'));
          }
        }, POLL_INTERVAL_MS);
      } catch (error) {
        if (pollTimer.current) clearInterval(pollTimer.current);
        setLoading(false);
        setProgress(0);
        setStatus('');
        reject(error instanceof Error ? error : new Error('创建任务失败'));
      }
    });
  }, [uid, maxVideos, modelType, saveToHistory]);

  return {
    uid, setUid,
    maxVideos, setMaxVideos,
    loading, progress, status,
    currentSession, setCurrentSession,
    handleExtract,
  };
}
