import React, { useState } from 'react';
import { X, Smartphone, Monitor, Check, Copy, Wifi, ShieldCheck, RefreshCw, QrCode } from 'lucide-react';

interface MultiDeviceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverStatus: 'online' | 'offline' | 'checking';
  onForceSync: () => void;
  isMobileSimulatorActive: boolean;
  onToggleMobileSimulator: () => void;
}

export const MultiDeviceSyncModal: React.FC<MultiDeviceSyncModalProps> = ({
  isOpen,
  onClose,
  serverStatus,
  onForceSync,
  isMobileSimulatorActive,
  onToggleMobileSimulator,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-...run.app';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // QR Code generator URL using public standard API or data URI
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    currentUrl
  )}&color=121316&bgcolor=FAF9F6`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        id="multi-device-sync-modal" 
        className="w-full max-w-2xl bg-[#FAF9F6] border border-[#E8E6DF] rounded-lg shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#121316] text-[#FAF9F6] px-6 py-4 flex items-center justify-between border-b-2 border-[#C5221F]">
          <div className="flex items-center space-x-3">
            <Smartphone className="w-5 h-5 text-[#C5221F]" />
            <div>
              <h3 className="font-serif text-base font-bold">
                手机端与电脑端云端互通中心
              </h3>
              <p className="text-xs text-stone-400 font-mono">
                CLOUD PERSISTENT SYNC & MULTI-DEVICE ACCESSIBILITY
              </p>
            </div>
          </div>
          <button
            id="close-sync-modal-btn"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-white rounded hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status banner */}
          <div className="flex items-center justify-between p-4 bg-white rounded border border-stone-200">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
              <div>
                <div className="text-sm font-bold text-stone-900 flex items-center space-x-2">
                  <span>云端数据服务状态：</span>
                  <span className="text-emerald-700 font-mono text-xs px-2 py-0.5 bg-emerald-50 rounded">
                    {serverStatus === 'online' ? '在线运行中 · 实时读写' : '就绪'}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  所有复盘记录、个人原则库及AI分析数据均由云端服务持久化存储，手机与电脑操作实时同步。
                </p>
              </div>
            </div>
            <button
              id="sync-refresh-btn"
              onClick={onForceSync}
              className="px-3 py-1.5 text-xs font-mono bg-stone-100 hover:bg-stone-200 text-stone-700 rounded border border-stone-300 flex items-center space-x-1 cursor-pointer transition-colors"
              title="立即触发双向云同步"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>立即同步</span>
            </button>
          </div>

          {/* QR Code & Direct Link */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-5 bg-stone-50 rounded border border-stone-200">
            <div className="md:col-span-4 flex flex-col items-center">
              <div className="p-2 bg-[#FAF9F6] border-2 border-stone-300 rounded shadow-xs">
                <img
                  src={qrCodeUrl}
                  alt="手机扫码访问本应用"
                  className="w-36 h-36 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-[11px] font-mono text-stone-500 mt-2 flex items-center space-x-1">
                <QrCode className="w-3 h-3 text-[#C5221F]" />
                <span>手机相机扫码即开</span>
              </span>
            </div>

            <div className="md:col-span-8 space-y-3">
              <h4 className="font-serif font-bold text-stone-900 text-sm">
                在手机浏览器中打开本应用：
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                无需安装任何客户端应用，支持 iOS Safari 与 Android Chrome，采用自适应响应式设计，随时随地在手机上记录突发挫折或执行清单。
              </p>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={currentUrl}
                  className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-stone-300 rounded text-stone-700 select-all"
                />
                <button
                  id="copy-sync-url-btn"
                  onClick={handleCopyUrl}
                  className="px-3 py-2 bg-[#121316] text-white text-xs font-medium rounded hover:bg-stone-800 flex items-center space-x-1 cursor-pointer transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? '已复制' : '复制网址'}</span>
                </button>
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  id="toggle-mobile-simulator-btn"
                  onClick={onToggleMobileSimulator}
                  className={`px-3 py-1.5 text-xs rounded border font-medium flex items-center space-x-1.5 cursor-pointer transition-colors ${
                    isMobileSimulatorActive
                      ? 'bg-[#C5221F] text-white border-[#C5221F]'
                      : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>
                    {isMobileSimulatorActive ? '退出手机视窗模拟' : '开启桌面端手机视窗模拟'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Sync guarantee checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-start space-x-2.5 p-3 bg-white rounded border border-stone-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-stone-800">云端持久化存储</strong>
                <p className="text-stone-500 mt-0.5">
                  记录实时落盘至云端数据库，即使清空浏览器缓存或更换设备，数据依然完整无损。
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2.5 p-3 bg-white rounded border border-stone-200">
              <Monitor className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-stone-800">桌面与移动体验融合</strong>
                <p className="text-stone-500 mt-0.5">
                  电脑端享受沉浸式大屏数据分析与脑力推演，手机端随时随地速记痛苦与执行打勾。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-100 px-6 py-3 border-t border-stone-200 flex justify-end">
          <button
            id="close-sync-footer-btn"
            onClick={onClose}
            className="px-4 py-2 bg-[#121316] text-white text-xs font-medium rounded hover:bg-stone-800 cursor-pointer"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
