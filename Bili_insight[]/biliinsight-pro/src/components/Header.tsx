/**
 * Header — 顶部导航栏
 * Bilibili 风格品牌标识
 */
import { Sparkles, Settings, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-warm-100 bg-white/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bili-gradient shadow-brand-glow">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-warm-900">
              BiliInsight{" "}
              <span className="bg-gradient-to-r from-brand-500 to-accent-400 bg-clip-text text-transparent">
                Pro
              </span>
            </h1>
            <p className="text-[10px] text-warm-500 font-bold uppercase tracking-wider">
              AI-Powered Creator Analytics
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-warm-400 bg-warm-50 px-3 py-1.5 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
            AI 已就绪
          </div>
          {/* 设置按钮：打开设置面板（key 仅在弹窗内提交，不回显） */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-warm-50"
            onClick={onOpenSettings}
            aria-label="打开设置"
          >
            <Settings className="h-5 w-5 text-warm-400" />
          </Button>
        </div>
      </div>
    </header>
  );
}
