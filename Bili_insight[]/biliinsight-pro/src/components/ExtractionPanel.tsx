/**
 * ExtractionPanel — UID 输入、参数设置、提取按钮和进度显示
 * Bilibili 风格操作面板
 */
import { Wand2, UserCircle, Sparkles, Loader2, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface ExtractionPanelProps {
  uid: string;
  onUidChange: (uid: string) => void;
  maxVideos: string;
  onMaxVideosChange: (max: string) => void;
  loading: boolean;
  progress: number;
  status: string;
  onExtract: () => void;
}

export function ExtractionPanel({
  uid, onUidChange, maxVideos, onMaxVideosChange,
  loading, progress, status, onExtract,
}: ExtractionPanelProps) {
  return (
    <>
      {/* Main extraction card */}
      <Card className="border-none shadow-xl shadow-brand-500/10 bg-white overflow-hidden card-lift">
        {/* Gradient top bar */}
        <div className="h-1.5 bg-bili-gradient" />
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-warm-800">
              <Wand2 className="h-5 w-5 text-brand-500" />
              开始分析
            </CardTitle>
            <Badge variant="secondary" className="bg-brand-50 text-brand-600 border-brand-200 text-[10px] font-bold">
              <Zap className="h-3 w-3 mr-1" />AI
            </Badge>
          </div>
          <CardDescription className="text-warm-500">
            输入UP主UID，一键获取视频核心观点
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* UID Input */}
          <div className="space-y-2">
            <Label htmlFor="uid" className="text-xs font-bold uppercase tracking-wider text-warm-500">
              UP主 UID
            </Label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-3 h-4 w-4 text-warm-400" />
              <Input
                id="uid"
                placeholder="例如: 1411721850"
                className="pl-10 h-11 border-warm-200 bg-warm-50/50 focus:bg-white transition-all focus:ring-brand-500 focus:border-brand-300 rounded-xl"
                value={uid}
                onChange={(e) => onUidChange(e.target.value)}
              />
            </div>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs text-brand-600 font-semibold hover:text-brand-700"
              onClick={() => onUidChange("1411721850")}
            >
              使用示例 UID
            </Button>
          </div>

          {/* Settings row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max-videos" className="text-xs font-bold uppercase tracking-wider text-warm-500">
                最大视频数
              </Label>
              <Select value={maxVideos} onValueChange={onMaxVideosChange}>
                <SelectTrigger id="max-videos" className="h-11 border-warm-200 bg-warm-50/50 rounded-xl">
                  <SelectValue placeholder="选择数量" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 个视频</SelectItem>
                  <SelectItem value="5">5 个视频</SelectItem>
                  <SelectItem value="10">10 个视频</SelectItem>
                  <SelectItem value="20">20 个视频</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-warm-500">
                分析模型
              </Label>
              <Badge variant="secondary" className="h-11 w-full justify-center text-xs font-bold bg-warm-50 text-warm-700 border-warm-200 rounded-xl">
                DeepSeek Chat
              </Badge>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <Button
            className="w-full h-12 text-base font-bold bg-bili-gradient hover:opacity-90 text-white shadow-brand-glow transition-all active:scale-[0.98] rounded-xl border-0"
            onClick={onExtract}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                分析中...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                开始提取
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Progress Display */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-warm-100 bg-white shadow-sm">
              <CardContent className="pt-6">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                  <span className="text-warm-500">{status}</span>
                  <span className="text-brand-600">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 w-full bg-warm-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-bili-gradient rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: progress + "%" }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
