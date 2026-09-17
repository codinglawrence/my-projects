/**
 * BiliInsight Pro — 应用主入口
 * Bilibili 风格：粉蓝渐变 + 温暖色调 + 活力排版
 */
import { useState } from "react";
import { PlayCircle, LayoutDashboard, MessageSquareText, Save, Zap } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Header } from "@/src/components/Header";
import { ExtractionPanel } from "@/src/components/ExtractionPanel";
import { HistoryPanel } from "@/src/components/HistoryPanel";
import { ResultsView } from "@/src/components/ResultsView";
import { ChatPanel } from "@/src/components/ChatPanel";
import { useHistory } from "@/src/hooks/useHistory";
import { useExtraction } from "@/src/hooks/useExtraction";
import { useChat } from "@/src/hooks/useChat";
import { useSettings } from "@/src/hooks/useSettings";
import { SettingsPanel } from "@/src/components/SettingsPanel";

export default function App() {
  const { history, saveToHistory, clearHistory } = useHistory();
  const { settings, saving, save } = useSettings();
  // 模型供应商来自统一设置（替代原硬编码 'dashscope'）
  const modelType = settings?.provider || 'dashscope';
  const { uid, setUid, maxVideos, setMaxVideos, loading, progress, status, currentSession, setCurrentSession, handleExtract } = useExtraction(saveToHistory, modelType);
  const { chatMessages, setChatMessages, question, setQuestion, isChatLoading, chatEndRef, handleAsk } = useChat(currentSession);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleClearHistory = () => { clearHistory(); toast.success("历史记录已清除"); };

  const onExtract = async () => {
    if (!uid) { toast.error("请输入UP主UID"); return; }
    setChatMessages([]);
    try { await handleExtract(); toast.success("成功分析！"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "提取失败，请检查后端服务是否运行"); }
  };

  return (
    <div className="min-h-screen text-warm-900 font-sans selection:bg-brand-200 selection:text-brand-900">
      {/* Subtle animated gradient background */}
      <div className="fixed inset-0 -z-10 bg-bili-gradient-subtle" />
      <div className="fixed -top-40 -right-40 -z-10 h-[500px] w-[500px] rounded-full bg-brand-500/5 blur-3xl" />
      <div className="fixed -bottom-40 -left-40 -z-10 h-[500px] w-[500px] rounded-full bg-accent-400/5 blur-3xl" />

      <Toaster position="top-center" toastOptions={{ className: "!bg-white !text-warm-800 !border-warm-200 !shadow-lg !rounded-2xl" }} />
      <Header onOpenSettings={() => setSettingsOpen(true)} />

      <main className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <ExtractionPanel uid={uid} onUidChange={setUid} maxVideos={maxVideos} onMaxVideosChange={setMaxVideos} loading={loading} progress={progress} status={status} onExtract={onExtract} />
            <HistoryPanel history={history} currentSessionId={currentSession?.id ?? null} onSelectSession={setCurrentSession} onClearHistory={handleClearHistory} />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8 space-y-6">
            {!currentSession && !loading ? (
              <div className="flex flex-col items-center justify-center py-32 text-center space-y-8 bg-white/80 backdrop-blur rounded-3xl border-2 border-dashed border-warm-200 shadow-sm">
                <div className="relative">
                  <div className="h-24 w-24 rounded-2xl bg-bili-gradient flex items-center justify-center shadow-brand-glow">
                    <LayoutDashboard className="h-12 w-12 text-white" />
                  </div>
                  <Zap className="absolute -top-2 -right-2 h-7 w-7 text-brand-400 animate-bounce" />
                </div>
                <div className="max-w-md space-y-3">
                  <h2 className="text-2xl font-bold text-warm-800">准备好开始了吗？</h2>
                  <p className="text-warm-500 text-sm leading-relaxed">
                    在左侧输入 UP 主 UID 并点击开始提取，我们将为您深度分析视频内容。
                  </p>
                </div>
                <div className="flex gap-2 text-[11px] font-bold uppercase tracking-widest text-warm-400">
                  <span className="px-3 py-1.5 rounded-full bg-brand-50 text-brand-600">AI 驱动</span>
                  <span className="px-3 py-1.5 rounded-full bg-warm-100 text-warm-600">深度分析</span>
                  <span className="px-3 py-1.5 rounded-full bg-warm-100 text-warm-600">智能问答</span>
                </div>
              </div>
            ) : (
              <Tabs defaultValue="insights" className="w-full">
                <div className="flex items-center justify-between mb-6">
                  <TabsList className="bg-warm-100/80 backdrop-blur p-1 rounded-xl">
                    <TabsTrigger value="insights" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-brand-600 text-warm-500 font-bold text-xs uppercase tracking-widest px-4">
                      <LayoutDashboard className="h-3.5 w-3.5 mr-2" />核心观点
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-brand-600 text-warm-500 font-bold text-xs uppercase tracking-widest px-4">
                      <MessageSquareText className="h-3.5 w-3.5 mr-2" />智能问答
                    </TabsTrigger>
                  </TabsList>
                  {currentSession && (
                    <Button variant="outline" size="sm" className="rounded-xl h-9 border-warm-200 bg-white/80 backdrop-blur text-xs font-bold text-warm-600 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-600 shadow-sm transition-all">
                      <Save className="h-3.5 w-3.5 mr-2 text-warm-400" />保存结果
                    </Button>
                  )}
                </div>
                <TabsContent value="insights" className="space-y-8 mt-0">
                  <ResultsView loading={loading} currentSession={currentSession} />
                </TabsContent>
                <TabsContent value="chat" className="mt-0">
                  <ChatPanel chatMessages={chatMessages} question={question} onQuestionChange={setQuestion} isChatLoading={isChatLoading} hasSession={!!currentSession} onAsk={handleAsk} chatEndRef={chatEndRef} />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      {/* 设置面板（key 仅在此提交，不回显） */}
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        saving={saving}
        onSave={save}
      />

      <footer className="border-t border-warm-100 bg-white/60 backdrop-blur py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-bili-gradient flex items-center justify-center">
              <PlayCircle className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-warm-800 text-lg">
              BiliInsight <span className="text-gradient-brand">Pro</span>
            </span>
          </div>
          <p className="text-xs text-warm-400">© 2024 BiliInsight Pro. Powered by DeepSeek AI.</p>
        </div>
      </footer>
    </div>
  );
}
