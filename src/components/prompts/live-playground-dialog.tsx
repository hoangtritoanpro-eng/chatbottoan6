"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Sparkles, 
  Send, 
  Bot, 
  Key, 
  Copy, 
  Check, 
  RotateCcw, 
  Settings2, 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  User,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface LivePlaygroundDialogProps {
  promptContent: string;
  promptTitle?: string;
  trigger?: React.ReactNode;
}

const STORAGE_KEY_API_KEY = "prompts_chat_playground_api_key";
const STORAGE_KEY_MODEL = "prompts_chat_playground_model";

export function LivePlaygroundDialog({
  promptContent,
  promptTitle = "Prompt",
  trigger,
}: LivePlaygroundDialogProps) {
  const [open, setOpen] = useState(false);
  const [model, setModel] = useState("gemini-3.7-flash");
  const [apiKey, setApiKey] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [responseTimeMs, setResponseTimeMs] = useState<number | null>(null);
  const [responseMode, setResponseMode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPromptDetails, setShowPromptDetails] = useState(false);
  const responseEndRef = useRef<HTMLDivElement>(null);

  // Load stored settings on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedKey = localStorage.getItem(STORAGE_KEY_API_KEY);
      if (storedKey) setApiKey(storedKey);
      const storedModel = localStorage.getItem(STORAGE_KEY_MODEL);
      if (storedModel) setModel(storedModel);
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    if (typeof window !== "undefined") {
      if (key) {
        localStorage.setItem(STORAGE_KEY_API_KEY, key);
      } else {
        localStorage.removeItem(STORAGE_KEY_API_KEY);
      }
    }
  };

  const handleModelChange = (newModel: string) => {
    setModel(newModel);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_MODEL, newModel);
    }
  };

  const handleRunTest = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setResponse(null);
    setResponseTimeMs(null);

    const startTime = performance.now();

    try {
      const res = await fetch("/api/playground/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt: promptContent,
          userMessage: userMessage.trim(),
          model,
          apiKey: apiKey.trim() || undefined,
        }),
      });

      const data = await res.json();
      const endTime = performance.now();
      setResponseTimeMs(Math.round(endTime - startTime));

      if (res.ok && data.reply) {
        setResponse(data.reply);
        setResponseMode(data.mode || "live");
      } else {
        setResponse(data.error || "Không thể tải phản hồi từ API.");
      }
    } catch (err: any) {
      setResponse(`Lỗi kết nối: ${err.message || "Vui lòng thử lại sau"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyResponse = async () => {
    if (!response) return;
    try {
      await navigator.clipboard.writeText(response);
      setCopied(true);
      toast.success("Đã sao chép phản hồi vào bộ nhớ tạm");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Sao chép thất bại");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            size="sm"
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium shadow-sm gap-1.5 h-8 px-3"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Chạy thử (Playground)</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-4 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold flex items-center gap-2">
                  <span>Trình chạy thử Prompt trực tiếp</span>
                  <Badge variant="outline" className="text-xs text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/50">
                    Live Playground
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Thử nghiệm tương tác với mô hình AI ngay trên trang web
                </DialogDescription>
              </div>
            </div>

            {/* Model and Key Settings */}
            <div className="flex items-center gap-2 pr-6">
              <Select value={model} onValueChange={handleModelChange}>
                <SelectTrigger className="h-8 text-xs w-[160px]">
                  <SelectValue placeholder="Chọn mô hình" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-3.7-flash">Google Gemini 3.7 Flash</SelectItem>
                  <SelectItem value="gemini-3.7-pro">Google Gemini 3.7 Pro</SelectItem>
                  <SelectItem value="gemini-3.5-pro">Gemini 3.5 Pro</SelectItem>
                  <SelectItem value="gemini-3.5-flash">Gemini 3.5 Flash</SelectItem>
                  <SelectItem value="gemini-3.1-pro">Gemini 3.1 Pro</SelectItem>
                  <SelectItem value="gemini-3.1-flash">Gemini 3.1 Flash</SelectItem>
                  <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                  <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                  <SelectItem value="gpt-4o">OpenAI GPT-4o</SelectItem>
                  <SelectItem value="deepseek-reasoner">DeepSeek R1 / Reasoner</SelectItem>
                  <SelectItem value="simulation">Mô phỏng Demo</SelectItem>
                </SelectContent>
              </Select>

              {/* API Key Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-2.5 gap-1 text-xs">
                    <Key className="h-3.5 w-3.5" />
                    {apiKey ? <span className="text-green-600 font-medium">Đã có Key</span> : <span>API Key</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4 space-y-3" align="end">
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold">Cài đặt API Key cá nhân</h4>
                    <p className="text-[11px] text-muted-foreground">
                      API Key được lưu an toàn trong trình duyệt của bạn (localStorage), không lưu trữ trên máy chủ.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="custom-key" className="text-xs">
                      Khóa API ({model.includes("gemini") ? "Gemini" : model.includes("gpt") ? "OpenAI" : "DeepSeek"})
                    </Label>
                    <Input
                      id="custom-key"
                      type="password"
                      placeholder="sk-... hoặc AIzaSy..."
                      value={apiKey}
                      onChange={(e) => handleSaveApiKey(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="text-[11px] text-muted-foreground bg-muted p-2 rounded">
                    💡 Nếu không nhập API Key, hệ thống sẽ tự động chuyển sang chế độ **Mô phỏng Sư phạm (Simulation Mode)**.
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 max-h-[calc(90vh-140px)]">
          {/* Prompt Preview Accordion */}
          <div className="border rounded-lg bg-muted/30 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowPromptDetails(!showPromptDetails)}
              className="w-full px-3 py-2 text-xs flex items-center justify-between font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <span>Chỉ thị hệ thống (Prompt đã điền): {promptTitle}</span>
              {showPromptDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            {showPromptDetails && (
              <div className="p-3 border-t bg-background/50 text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">
                {promptContent}
              </div>
            )}
          </div>

          {/* User Test Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="user-test-msg" className="text-xs font-medium flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Câu hỏi / Đầu vào thử nghiệm (User Message):</span>
              </Label>
              <span className="text-[11px] text-muted-foreground">Có thể để trống để bắt đầu</span>
            </div>
            <div className="flex gap-2">
              <Textarea
                id="user-test-msg"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder="Nhập câu hỏi hoặc yêu cầu gửi đến vai trò trong Prompt... (ví dụ: 'Hãy giải thích bài tập này cho tôi' hoặc 'Viết kịch bản mẫu')"
                className="min-h-[70px] text-xs resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleRunTest();
                  }
                }}
              />
            </div>
            <div className="flex justify-end pt-1">
              <Button
                onClick={handleRunTest}
                disabled={isLoading}
                size="sm"
                className="gap-1.5 bg-orange-600 hover:bg-orange-700 text-white h-8 px-4 text-xs font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Đang suy nghĩ...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Gửi & Chạy thử</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* AI Response Box */}
          {(response || isLoading) && (
            <div className="space-y-1.5 pt-2 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                    Kết quả từ AI:
                  </span>
                  {responseMode === "simulation" && (
                    <Badge variant="secondary" className="text-[10px] h-5">
                      Mô phỏng Demo
                    </Badge>
                  )}
                  {responseTimeMs && (
                    <span className="text-[11px] text-muted-foreground font-mono">
                      ⚡ {responseTimeMs}ms
                    </span>
                  )}
                </div>
                {response && !isLoading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyResponse}
                    className="h-7 px-2 text-xs gap-1"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-green-500" />
                        <span className="text-green-600">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Sao chép kết quả</span>
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="p-3.5 rounded-lg border bg-muted/40 font-mono text-xs whitespace-pre-wrap leading-relaxed min-h-[120px] max-h-[300px] overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground py-6 justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                    <span>AI đang phân tích prompt và tạo câu trả lời...</span>
                  </div>
                ) : (
                  response
                )}
                <div ref={responseEndRef} />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
