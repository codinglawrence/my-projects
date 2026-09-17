/**
 * ChatPanel — AI 聊天面板
 * Bilibili 风格消息气泡 + 智能问答
 */
import { MessageSquareText, Send, Loader2, Bot, User } from "lucide-react";
import { motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatMessage } from "@/src/types";
import type { RefObject } from "react";

interface ChatPanelProps {
  chatMessages: ChatMessage[];
  question: string;
  onQuestionChange: (q: string) => void;
  isChatLoading: boolean;
  hasSession: boolean;
  onAsk: () => void;
  chatEndRef: RefObject<HTMLDivElement | null>;
}

export function ChatPanel({
  chatMessages, question, onQuestionChange,
  isChatLoading, hasSession, onAsk, chatEndRef,
}: ChatPanelProps) {
  return (
    <Card className="border-none shadow-xl shadow-brand-500/10 bg-white flex flex-col h-[600px] rounded-3xl overflow-hidden">
      <CardHeader className="border-b border-warm-100 bg-gradient-to-r from-brand-50 to-white px-6 py-4">
        <CardTitle className="text-base font-bold flex items-center gap-2 text-warm-800">
          <div className="h-7 w-7 rounded-lg bg-bili-gradient flex items-center justify-center">
            <MessageSquareText className="h-4 w-4 text-white" />
          </div>
          智能问答
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0 bg-warm-50/30">
        <ScrollArea className="h-full p-6">
          <div className="space-y-6">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-5">
                <div className="p-5 bg-white shadow-sm rounded-3xl border border-warm-100">
                  <MessageSquareText className="h-10 w-10 text-warm-300" />
                </div>
                <div className="max-w-xs space-y-2">
                  <h3 className="text-sm font-bold text-warm-700">开始对话</h3>
                  <p className="text-xs text-warm-400 font-medium leading-relaxed">
                    您可以针对该 UP 主的视频内容进行深度提问，AI 将基于分析结果为您解答。
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {["这位UP主的核心风格是什么？", "推荐几个最值得看的视频", "总结视频中的高频关键词"].map((hint) => (
                    <button
                      key={hint}
                      className="text-[10px] font-medium text-warm-500 bg-white border border-warm-200 px-2.5 py-1 rounded-full hover:border-brand-300 hover:text-brand-600 transition-colors"
                      onClick={() => onQuestionChange(hint)}
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {chatMessages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={"flex gap-3 " + (msg.role === "user" ? "justify-end" : "justify-start")}
              >
                {msg.role === "assistant" && (
                  <div className="h-8 w-8 rounded-lg bg-bili-gradient flex items-center justify-center shrink-0 mt-1">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={
                    "max-w-[80%] p-4 rounded-2xl shadow-sm " +
                    (msg.role === "user"
                      ? "bg-bili-gradient text-white rounded-tr-md"
                      : "bg-white text-warm-700 rounded-tl-md border border-warm-100")
                  }
                >
                  <div
                    className={
                      "prose prose-sm max-w-none " +
                      (msg.role === "user" ? "prose-invert" : "prose-slate")
                    }
                  >
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
                {msg.role === "user" && (
                  <div className="h-8 w-8 rounded-lg bg-warm-800 flex items-center justify-center shrink-0 mt-1">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
            {isChatLoading && (
              <div className="flex justify-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-bili-gradient flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-white border border-warm-100 p-4 rounded-2xl rounded-tl-md flex items-center gap-3 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                  <span className="text-xs font-bold text-warm-400 uppercase tracking-widest">
                    AI 思考中...
                  </span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-4 border-t border-warm-100 bg-white">
        <div className="flex w-full items-center gap-3">
          <Input
            placeholder="输入您的问题..."
            className="flex-1 h-12 rounded-2xl border-warm-200 bg-warm-50/50 focus:bg-white transition-all focus:ring-brand-500 focus:border-brand-300"
            value={question}
            onChange={(e) => onQuestionChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onAsk(); }}
            disabled={isChatLoading || !hasSession}
          />
          <Button
            size="icon"
            className="h-12 w-12 rounded-2xl bg-bili-gradient hover:opacity-90 text-white shadow-brand-glow transition-all active:scale-90 border-0"
            onClick={onAsk}
            disabled={isChatLoading || !hasSession || !question.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
