"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Copy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { RunPromptButton } from "@/components/prompts/run-prompt-button";
import { LivePlaygroundDialog } from "@/components/prompts/live-playground-dialog";
import { analyticsPrompt } from "@/lib/analytics";
import { parseVariables, getUniqueVariables, hasVariables } from "@/lib/variables";

export { hasVariables };

interface VariableFillModalProps {
  content: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "copy" | "run";
  promptId?: string;
  categoryName?: string;
  parentCategoryName?: string;
}

export function VariableFillModal({ 
  content, 
  open, 
  onOpenChange, 
  mode,
  promptId,
  categoryName,
  parentCategoryName
}: VariableFillModalProps) {
  const t = useTranslations("common");

  // Parse variables from content
  const variables = useMemo(() => parseVariables(content), [content]);
  const uniqueVariables = useMemo(() => getUniqueVariables(variables), [variables]);

  // Initialize values with defaults
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const { name, defaultValue } of uniqueVariables) {
      initial[name] = defaultValue;
    }
    return initial;
  });

  // Get the final content with variables replaced
  const getFinalContent = useCallback(() => {
    let result = content;
    for (const variable of variables) {
      const value = values[variable.name] || variable.defaultValue || variable.fullMatch;
      result = result.replaceAll(variable.fullMatch, value);
    }
    return result;
  }, [content, variables, values]);

  // Update a variable value
  const updateValue = useCallback((name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Handle copy
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getFinalContent());
      analyticsPrompt.fillVariables(promptId);
      analyticsPrompt.copy(promptId);
      toast.success(t("copied"));
      onOpenChange(false);
    } catch {
      toast.error(t("failedToCopy"));
    }
  };

  const finalContent = getFinalContent();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center justify-between">
            <span>{t("variables")}</span>
            <span className="text-xs text-muted-foreground font-normal">
              {uniqueVariables.length} biến số phát hiện
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
          {uniqueVariables.map(({ name, defaultValue }) => (
            <div key={name} className="space-y-1">
              <Label htmlFor={`modal-var-${name}`} className="text-xs text-muted-foreground">
                {name}
              </Label>
              <Input
                id={`modal-var-${name}`}
                value={values[name] || ""}
                onChange={(e) => updateValue(name, e.target.value)}
                placeholder={defaultValue || `Nhập ${name}...`}
                className="h-8 text-sm"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center gap-2 pt-2 border-t">
          <LivePlaygroundDialog
            promptContent={finalContent}
            trigger={
              <Button size="sm" variant="outline" className="gap-1.5 text-xs text-orange-600 border-orange-200">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Chạy thử</span>
              </Button>
            }
          />
          <div className="flex gap-2">
            {mode === "copy" ? (
              <Button onClick={handleCopy} size="sm">
                <Copy className="h-4 w-4 mr-1.5" />
                {t("copy")}
              </Button>
            ) : (
              <RunPromptButton content={finalContent} size="sm" categoryName={categoryName} parentCategoryName={parentCategoryName} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Render content with styled variable placeholders (non-editable)
export function renderContentWithVariables(content: string): React.ReactNode {
  const variables = parseVariables(content);
  if (variables.length === 0) return content;

  // Split and replace with badge
  const parts: React.ReactNode[] = [];
  let currentIndex = 0;
  let keyIndex = 0;

  for (const v of variables) {
    const idx = content.indexOf(v.fullMatch, currentIndex);
    if (idx !== -1) {
      if (idx > currentIndex) {
        parts.push(content.slice(currentIndex, idx));
      }
      parts.push(
        <span
          key={keyIndex++}
          className="inline-block px-1 py-0.5 mx-0.5 rounded bg-primary/15 text-primary text-[10px] font-medium"
        >
          {v.defaultValue || v.name}
        </span>
      );
      currentIndex = idx + v.fullMatch.length;
    }
  }

  if (currentIndex < content.length) {
    parts.push(content.slice(currentIndex));
  }

  return parts;
}
