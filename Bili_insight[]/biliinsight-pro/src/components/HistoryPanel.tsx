/**
 * HistoryPanel — 历史记录侧边栏
 * Bilibili 风格展示过往提取会话列表
 */
import { History, Film, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import type { ExtractionSession } from "@/src/types";

interface HistoryPanelProps {
  history: ExtractionSession[];
  currentSessionId: string | null;
  onSelectSession: (session: ExtractionSession) => void;
  onClearHistory: () => void;
}

export function HistoryPanel({
  history, currentSessionId, onSelectSession, onClearHistory,
}: HistoryPanelProps) {
  return (
    <Card className="border-none shadow-lg shadow-brand-500/5 bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-warm-700">
            <div className="h-6 w-6 rounded-md bg-warm-100 flex items-center justify-center">
              <History className="h-3.5 w-3.5 text-warm-500" />
            </div>
            历史记录
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-[10px] font-bold uppercase tracking-widest text-warm-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            onClick={onClearHistory}
          >
            清空
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-2">
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-1.5 px-2">
            {history.length === 0 ? (
              <div className="text-center py-12 text-warm-300 text-xs font-medium">
                暂无历史记录
              </div>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  className={
                    "w-full text-left p-3 rounded-xl transition-all border " +
                    (currentSessionId === item.id
                      ? "bg-brand-50/50 border-brand-200 ring-1 ring-brand-200"
                      : "hover:bg-warm-50/80 border-transparent")
                  }
                  onClick={() => onSelectSession(item)}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="font-bold text-xs text-warm-700">
                      UID: {item.uid}
                    </span>
                    <span className="text-[9px] text-warm-400 font-medium flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {format(new Date(item.timestamp), "MM-dd HH:mm")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-warm-400 uppercase tracking-wide">
                    <Film className="h-3 w-3" />
                    {item.totalVideos} Videos
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
