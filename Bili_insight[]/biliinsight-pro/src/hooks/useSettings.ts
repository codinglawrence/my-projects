/**
 * useSettings - 设置读写 Hook
 * 经 /api/settings 与后端交互：拉取 / 保存偏好与密钥。
 * 安全约束：api_key 仅“发送”到后端（由 KeyProvider 落系统凭据/加密文件），
 * 前端不回显、不存储 key 明文；只读 has_key 标记判断是否已设置。
 */

import { useState, useEffect, useCallback } from 'react';
import { getSettings, saveSettings } from '@/src/api/client';
import type { SettingsData, SaveSettingsRequest } from '@/src/types';

/**
 * 设置管理 Hook
 * @returns 设置状态、加载态、保存方法
 */
export function useSettings() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /** 挂载时拉取设置 */
  useEffect(() => {
    getSettings()
      .then((data) => setSettings(data))
      .catch(() => {
        // 后端不可用时给一份本地默认，保证 UI 不崩
        setSettings({
          provider: 'dashscope',
          has_key: false,
          temperature: 0.3,
          max_tokens: 1024,
          max_videos: 5,
          save_path: 'results',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  /**
   * 保存设置
   * @param payload - 设置（api_key 可选，仅发送不回显）
   */
  const save = useCallback(async (payload: SaveSettingsRequest) => {
    setSaving(true);
    try {
      const res = await saveSettings(payload);
      setSettings((prev) => ({
        ...(prev as SettingsData),
        provider: payload.provider,
        has_key: res.has_key,
        temperature: payload.temperature,
        max_tokens: payload.max_tokens,
        max_videos: payload.max_videos,
        save_path: payload.save_path,
      }));
      return { ok: true as const };
    } finally {
      setSaving(false);
    }
  }, []);

  return { settings, loading, saving, save, setSettings };
}
