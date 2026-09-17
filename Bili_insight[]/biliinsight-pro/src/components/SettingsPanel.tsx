/**
 * SettingsPanel — 设置/偏好弹窗
 * 模型供应商单选、API Key 输入（密码框，仅发送不回显）、温度/最大 token/最大视频数/保存路径。
 * 安全：API Key 提交到后端后本地立即清空，界面仅显示“已设置”标记，绝不回显明文。
 */
import { useEffect, useState } from 'react';
import { Settings, KeyRound, Thermometer, Hash, Film, FolderOpen, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PROVIDER_OPTIONS, type SettingsData, type SaveSettingsRequest } from '@/src/types';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  settings: SettingsData | null;
  saving: boolean;
  onSave: (payload: SaveSettingsRequest) => Promise<{ ok: true }>;
}

export function SettingsPanel({ open, onClose, settings, saving, onSave }: SettingsPanelProps) {
  const [provider, setProvider] = useState('dashscope');
  const [apiKey, setApiKey] = useState(''); // 仅用于输入，提交即清空，绝不存储
  const [temperature, setTemperature] = useState(0.3);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [maxVideos, setMaxVideos] = useState(5);
  const [savePath, setSavePath] = useState('results');

  // 每次打开时从后端设置同步表单
  useEffect(() => {
    if (open && settings) {
      setProvider(settings.provider);
      setTemperature(settings.temperature);
      setMaxTokens(settings.max_tokens);
      setMaxVideos(settings.max_videos);
      setSavePath(settings.save_path);
      setApiKey(''); // 不回显已存 key
    }
  }, [open, settings]);

  if (!open) return null;

  const handleSave = async () => {
    await onSave({
      provider,
      // 仅当用户填写了 key 才发送；空字符串表示“不修改”
      api_key: apiKey.trim() || undefined,
      temperature,
      max_tokens: maxTokens,
      max_videos: maxVideos,
      save_path: savePath,
    });
    setApiKey(''); // 提交后立即清空，避免残留内存明文
    onClose();
  };

  const handlePickPath = async () => {
    // 桌面端经 preload 打开目录选择；浏览器环境回退为文本输入
    const api = (window as unknown as { electron?: any }).electron;
    try {
      if (api?.dialog?.showOpenDialog) {
        const res = await api.dialog.showOpenDialog({ properties: ['openDirectory'] });
        if (!res.canceled && res.filePaths?.[0]) setSavePath(res.filePaths[0]);
      }
    } catch {
      /* 忽略，保持文本输入 */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-3xl">
        <CardHeader className="border-b border-warm-100">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-warm-800">
            <div className="h-8 w-8 rounded-lg bg-bili-gradient flex items-center justify-center">
              <Settings className="h-4 w-4 text-white" />
            </div>
            设置 / 偏好
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-6 max-h-[70vh] overflow-y-auto">
          {/* 模型供应商 */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-warm-500">模型供应商</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="h-11 border-warm-200 bg-warm-50/50 rounded-xl">
                <SelectValue placeholder="选择供应商" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* API Key（密码框，仅发送不回显） */}
          <div className="space-y-2">
            <Label htmlFor="apikey" className="text-xs font-bold uppercase tracking-wider text-warm-500 flex items-center gap-1.5">
              <KeyRound className="h-3 w-3" /> API Key
            </Label>
            <Input
              id="apikey"
              type="password"
              autoComplete="new-password"
              placeholder="填写后保存到系统凭据/加密文件（不回显）"
              className="h-11 border-warm-200 bg-warm-50/50 rounded-xl"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            {settings?.has_key && (
              <p className="text-[11px] font-medium text-brand-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> 已设置自有 Key（明文不在此显示）
              </p>
            )}
          </div>

          {/* 温度 */}
          <div className="space-y-2">
            <Label htmlFor="temperature" className="text-xs font-bold uppercase tracking-wider text-warm-500 flex items-center gap-1.5">
              <Thermometer className="h-3 w-3" /> 温度
            </Label>
            <Input
              id="temperature"
              type="number" step="0.1" min="0" max="1"
              className="h-11 border-warm-200 bg-warm-50/50 rounded-xl"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value) || 0.3)}
            />
          </div>

          {/* 最大 token */}
          <div className="space-y-2">
            <Label htmlFor="maxtokens" className="text-xs font-bold uppercase tracking-wider text-warm-500 flex items-center gap-1.5">
              <Hash className="h-3 w-3" /> 最大 Token
            </Label>
            <Input
              id="maxtokens"
              type="number" step="1" min="1"
              className="h-11 border-warm-200 bg-warm-50/50 rounded-xl"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value, 10) || 1024)}
            />
          </div>

          {/* 最大视频数 */}
          <div className="space-y-2">
            <Label htmlFor="maxvideos" className="text-xs font-bold uppercase tracking-wider text-warm-500 flex items-center gap-1.5">
              <Film className="h-3 w-3" /> 最大视频数
            </Label>
            <Input
              id="maxvideos"
              type="number" step="1" min="1" max="200"
              className="h-11 border-warm-200 bg-warm-50/50 rounded-xl"
              value={maxVideos}
              onChange={(e) => setMaxVideos(parseInt(e.target.value, 10) || 5)}
            />
          </div>

          {/* 保存路径 */}
          <div className="space-y-2">
            <Label htmlFor="savepath" className="text-xs font-bold uppercase tracking-wider text-warm-500 flex items-center gap-1.5">
              <FolderOpen className="h-3 w-3" /> 默认保存路径
            </Label>
            <div className="flex gap-2">
              <Input
                id="savepath"
                className="h-11 border-warm-200 bg-warm-50/50 rounded-xl"
                value={savePath}
                onChange={(e) => setSavePath(e.target.value)}
              />
              <Button variant="outline" className="h-11 rounded-xl border-warm-200" onClick={handlePickPath}>
                浏览
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 border-t border-warm-100">
          <Button variant="ghost" className="rounded-xl" onClick={onClose} disabled={saving}>取消</Button>
          <Button
            className="rounded-xl bg-bili-gradient text-white border-0 hover:opacity-90"
            onClick={handleSave} disabled={saving}
          >
            {saving ? '保存中...' : '保存'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
