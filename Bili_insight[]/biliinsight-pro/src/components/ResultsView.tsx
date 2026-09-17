/**
 * ResultsView — 结果展示面板
 * Bilibili 风格：整体总结 + 视频卡片列表 + 核心观点
 */
import { Brain, Film, ExternalLink, Lightbulb, FileSpreadsheet, FileText, FileJson, Download } from "lucide-react";
import { motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { exportResult } from "@/src/api/client";
import type { ExtractionSession } from "@/src/types";

interface ResultsViewProps {
  loading: boolean;
  currentSession: ExtractionSession | null;
}

export function ResultsView({ loading, currentSession }: ResultsViewProps) {
  // 加载态：尚未拿到首份结果时显示骨架屏占位，避免首屏空白闪烁
  if (loading && !currentSession) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px] w-full rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[300px] rounded-2xl" />
          <Skeleton className="h-[300px] rounded-2xl" />
        </div>
      </div>
    );
  }

  // 无当前会话时直接不渲染结果区
  if (!currentSession) return null;

  /** 把前端结构转回后端导出所需的中文键原始记录（与 main.py 输出字段对齐） */
  const toRawRecords = () =>
    currentSession.results.map((v) => ({
      '视频标题': v.title,
      '视频链接': v.url,
      '发布时间': v.created,
      '核心观点': v.summary,
    }));

  /** 导出：优先用桌面端保存对话框选文件名；后端仅接受 basename 并写入安全目录（修复 H1） */
  const handleExport = async (format: 'excel' | 'markdown' | 'json') => {
    const api = (window as unknown as { electron?: any }).electron;
    let path: string | undefined;
    try {
      if (api?.dialog?.showSaveDialog) {
        const res = await api.dialog.showSaveDialog({
          defaultPath: `up_core_views.${format === 'excel' ? 'xlsx' : format}`,
          filters:
            format === 'excel'
              ? [{ name: 'Excel', extensions: ['xlsx'] }]
              : format === 'json'
              ? [{ name: 'JSON', extensions: ['json'] }]
              : [{ name: 'Markdown', extensions: ['md'] }],
        });
        if (res.canceled || !res.filePath) return;
        // 仅取文件名（basename）：后端会把文件写入固定的安全导出目录，
        // 拒绝任何目录/绝对路径，从根源上消除路径穿越写文件风险。
        path = res.filePath.split(/[\\/]/).pop();
      }
    } catch {
      /* 忽略，使用后端默认路径 */
    }
    try {
      const r = await exportResult({
        format,
        path,
        results: toRawRecords(),
        overall_summary: currentSession.overall_summary,
      });
      toast.success(`已导出：${r.path}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '导出失败');
    }
  };

  return (
    <>
      {/* 导出工具栏：提供 Excel / Markdown / JSON 三种格式导出入口（经安全目录） */}
      <div className="flex items-center justify-end gap-2 mb-4">
        <span className="text-[11px] font-bold uppercase tracking-widest text-warm-400 mr-1 hidden sm:inline">
          <Download className="h-3 w-3 inline mr-1" />导出
        </span>
        <Button
          variant="outline" size="sm"
          className="rounded-xl h-9 border-warm-200 bg-white/80 text-xs font-bold text-warm-600 hover:bg-brand-50 hover:border-brand-200"
          onClick={() => handleExport('excel')}
        >
          <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5 text-brand-500" />Excel
        </Button>
        <Button
          variant="outline" size="sm"
          className="rounded-xl h-9 border-warm-200 bg-white/80 text-xs font-bold text-warm-600 hover:bg-brand-50 hover:border-brand-200"
          onClick={() => handleExport('markdown')}
        >
          <FileText className="h-3.5 w-3.5 mr-1.5 text-brand-500" />Markdown
        </Button>
        <Button
          variant="outline" size="sm"
          className="rounded-xl h-9 border-warm-200 bg-white/80 text-xs font-bold text-warm-600 hover:bg-brand-50 hover:border-brand-200"
          onClick={() => handleExport('json')}
        >
          <FileJson className="h-3.5 w-3.5 mr-1.5 text-brand-500" />JSON
        </Button>
      </div>

      {/* 整体总结区块：渲染本次全部视频分析后的全局汇总（Markdown 安全渲染） */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-none shadow-xl shadow-brand-500/10 bg-white overflow-hidden rounded-3xl bg-bili-gradient-card">
          <CardHeader className="bg-gradient-to-r from-brand-50 to-white border-b border-brand-100">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-warm-800">
              <div className="h-8 w-8 rounded-lg bg-bili-gradient flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
              整体总结
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-8">
            <div className="prose prose-slate max-w-none">
              <ReactMarkdown>{currentSession.overall_summary}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 视频分析卡片列表：逐视频展示核心观点与内容总结 */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-warm-500 flex items-center gap-2">
          <Film className="h-4 w-4 text-brand-500" />
          视频分析 ({currentSession.totalVideos})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentSession.results.map((video, idx) => (
            <motion.div
              key={video.bvid}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="border-none shadow-lg shadow-brand-500/5 bg-white h-full hover:shadow-xl hover:shadow-brand-500/10 transition-all rounded-2xl overflow-hidden card-lift">
                {/* 卡片顶部品牌色装饰条 */}
                <div className="h-1 bg-bili-gradient" />
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold text-warm-800 leading-snug line-clamp-2">
                    {video.title}
                  </CardTitle>
                  <p className="text-[11px] text-warm-400 font-medium">
                    {video.created}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 核心观点列表：逐条展示该视频提炼出的核心观点 */}
                  {video.core_views.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-warm-400 flex items-center gap-1.5">
                        <Lightbulb className="h-3 w-3 text-brand-400" />
                        核心观点
                      </p>
                      <ul className="space-y-2">
                        {video.core_views.map((view, i) => (
                          <li key={i} className="flex gap-2 text-xs text-warm-600 leading-relaxed">
                            <Badge variant="outline" className="h-5 w-5 rounded-full flex items-center justify-center p-0 text-[10px] font-bold border-brand-200 text-brand-600 shrink-0 mt-0.5">
                              {i + 1}
                            </Badge>
                            <span>{view}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 单视频内容总结：渲染该视频的整体总结（Markdown 安全渲染） */}
                  <div className="pt-2 border-t border-warm-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-warm-400 mb-1">
                      内容总结
                    </p>
                    <div className="prose prose-sm prose-slate max-w-none text-xs">
                      <ReactMarkdown>{video.summary}</ReactMarkdown>
                    </div>
                  </div>

                  {/* 前往 B 站观看外链（新标签打开，rel 防钓鱼） */}
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    前往观看
                  </a>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}
