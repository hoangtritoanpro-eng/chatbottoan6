"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Copy, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { RunPromptButton } from "./run-prompt-button";
import { TranslateButton } from "./translate-button";
import { DownloadPromptDropdown } from "./download-prompt-dropdown";
import { ShareDropdown } from "./share-dropdown";
import { LivePlaygroundDialog } from "./live-playground-dialog";
import { CodeView } from "@/components/ui/code-view";
import { CodeEditor } from "@/components/ui/code-editor";
import { prettifyJson } from "@/lib/format";
import { parseVariables, getUniqueVariables, type Variable } from "@/lib/variables";

interface InteractivePromptContentProps {
  content: string;
  className?: string;
  isStructured?: boolean;
  structuredFormat?: "json" | "yaml";
  title?: string;
  description?: string;
  isLoggedIn?: boolean;
  categoryName?: string;
  parentCategoryName?: string;
  promptId?: string;
  promptSlug?: string;
  promptType?: string;
  shareTitle?: string;
  promptTitle?: string;
  promptDescription?: string;
}

// Contenteditable span component
function EditableSpan({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const [isShowingPlaceholder, setIsShowingPlaceholder] = useState(!value);

  useEffect(() => {
    if (spanRef.current) {
      if (!value && !document.activeElement?.isSameNode(spanRef.current)) {
        spanRef.current.textContent = placeholder;
        queueMicrotask(() => setIsShowingPlaceholder(true));
      } else if (value && spanRef.current.textContent !== value) {
        spanRef.current.textContent = value;
        queueMicrotask(() => setIsShowingPlaceholder(false));
      }
    }
  }, [value, placeholder]);

  const handleInput = () => {
    if (spanRef.current) {
      const newValue = spanRef.current.textContent || "";
      onChange(newValue);
      setIsShowingPlaceholder(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const handleFocus = () => {
    if (spanRef.current && isShowingPlaceholder) {
      spanRef.current.textContent = "";
      setIsShowingPlaceholder(false);
    }
  };

  const handleBlur = () => {
    if (spanRef.current) {
      const currentText = spanRef.current.textContent || "";
      if (!currentText.trim()) {
        spanRef.current.textContent = placeholder;
        setIsShowingPlaceholder(true);
        onChange("");
      }
    }
  };

  return (
    <span
      ref={spanRef}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={`inline-block px-1.5 py-0.5 rounded border border-dashed transition-colors cursor-text outline-none min-w-[20px] ${
        isShowingPlaceholder
          ? "bg-primary/10 border-primary/40 text-primary font-medium"
          : "bg-primary/20 border-primary text-foreground font-semibold"
      }`}
    />
  );
}

export function InteractivePromptContent({
  content,
  className,
  isStructured,
  structuredFormat = "json",
  title,
  description,
  isLoggedIn,
  categoryName,
  parentCategoryName,
  promptId,
  promptSlug,
  promptType,
  shareTitle,
  promptTitle,
  promptDescription,
}: InteractivePromptContentProps) {
  const t = useTranslations("common");
  const [copied, setCopied] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);

  // Use translated content if available, otherwise original content
  const displayedContent = translatedContent || content;

  // Parse variables from displayed content
  const variables = useMemo(() => parseVariables(displayedContent), [displayedContent]);
  const uniqueVariables = useMemo(() => getUniqueVariables(variables), [variables]);

  // Track values for each variable (keyed by variable name)
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const variable of variables) {
      if (!(variable.name in initial)) {
        initial[variable.name] = variable.defaultValue;
      }
    }
    return initial;
  });

  // Check if any variable has been modified from its default
  const isModified = useMemo(() => {
    return uniqueVariables.some(({ name, defaultValue }) => {
      const currentValue = values[name] ?? "";
      return currentValue !== defaultValue && currentValue !== "";
    });
  }, [uniqueVariables, values]);

  // Reset all variables to their defaults
  const handleReset = useCallback(() => {
    const resetValues: Record<string, string> = {};
    for (const { name, defaultValue } of uniqueVariables) {
      resetValues[name] = defaultValue;
    }
    setValues(resetValues);
  }, [uniqueVariables]);

  // Reset values when variables change (e.g., on translation)
  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const variable of variables) {
      if (!(variable.name in initial)) {
        initial[variable.name] = variable.defaultValue;
      }
    }
    setValues(initial);
  }, [variables]);

  // Get the final content with variables replaced
  const getFinalContent = useCallback(() => {
    let result = displayedContent;
    for (const variable of variables) {
      const value = values[variable.name] || variable.defaultValue || variable.fullMatch;
      result = result.replaceAll(variable.fullMatch, value);
    }
    return result;
  }, [displayedContent, variables, values]);

  // Get content with custom variable values (for RunPromptButton dialog)
  const getContentWithVariables = useCallback((customValues: Record<string, string>) => {
    let result = displayedContent;
    for (const variable of variables) {
      const value = customValues[variable.name] || values[variable.name] || variable.defaultValue || variable.fullMatch;
      result = result.replaceAll(variable.fullMatch, value);
    }
    return result;
  }, [displayedContent, variables, values]);

  // Get unfilled variables (empty current value and no default)
  const unfilledVariables = useMemo(() => {
    return uniqueVariables.filter(v => {
      const currentValue = values[v.name];
      return !currentValue || currentValue.trim() === "";
    }).map(v => ({ name: v.name, defaultValue: v.defaultValue }));
  }, [uniqueVariables, values]);

  // Handle variables filled from RunPromptButton dialog
  const handleVariablesFilled = useCallback((newValues: Record<string, string>) => {
    setValues(prev => ({ ...prev, ...newValues }));
  }, []);

  // Update a variable value
  const updateValue = useCallback((name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Copy to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getFinalContent());
      setCopied(true);
      toast.success(t("copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("failedToCopy"));
    }
  };

  // Prettify JSON content for display
  const displayContent = isStructured && structuredFormat === "json" 
    ? prettifyJson(displayedContent) 
    : displayedContent;

  // Handle translation callback
  const handleTranslate = useCallback((translated: string) => {
    setTranslatedContent(translated);
  }, []);

  // Check if this is a SKILL or TASTE type prompt
  const isSkill = promptType === "SKILL";
  const isTaste = promptType === "TASTE";

  // Common Action Buttons Toolbar
  const renderToolbar = (finalPromptText: string) => (
    <div className="flex items-center gap-2">
      {isModified && (
        <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 px-2 text-xs">
          <RotateCcw className="h-3 w-3 mr-1" />
          {t("reset")}
        </Button>
      )}
      {promptId && <DownloadPromptDropdown promptId={promptId} promptSlug={promptSlug} promptType={promptType} />}
      {shareTitle && <ShareDropdown title={shareTitle} />}
      <Button variant="ghost" size="sm" onClick={copyToClipboard}>
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
      <LivePlaygroundDialog
        promptContent={finalPromptText}
        promptTitle={promptTitle || title}
      />
      <RunPromptButton 
        content={finalPromptText}
        title={promptTitle || title}
        description={promptDescription || description}
        unfilledVariables={unfilledVariables}
        onVariablesFilled={handleVariablesFilled}
        getContentWithVariables={getContentWithVariables}
        categoryName={categoryName}
        parentCategoryName={parentCategoryName}
        promptType={promptType as "TEXT" | "IMAGE" | "VIDEO" | "AUDIO" | "STRUCTURED" | "SKILL"}
        emphasized
      />
    </div>
  );

  // If no variables, render simple content
  if (variables.length === 0) {
    if (isSkill || isTaste) {
      return (
        <div className={className}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              <h3 className="text-base font-semibold">{isTaste ? "taste.md" : (title || "SKILL.md")}</h3>
              <TranslateButton
                content={content}
                onTranslate={handleTranslate}
                isLoggedIn={isLoggedIn}
              />
            </div>
            {renderToolbar(displayedContent)}
          </div>
          <CodeEditor
            value={displayedContent}
            onChange={() => {}}
            language="markdown"
            minHeight="400px"
            className="text-sm"
            readOnly={true}
          />
        </div>
      );
    }
    if (isStructured) {
      return (
        <div className={className}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              {title && <h3 className="text-base font-semibold">{title}</h3>}
              <TranslateButton
                content={content}
                onTranslate={handleTranslate}
                isLoggedIn={isLoggedIn}
              />
            </div>
            {renderToolbar(displayContent)}
          </div>
          <CodeView 
            content={displayContent} 
            language={structuredFormat}
            className="text-sm"
            wordWrap
          />
        </div>
      );
    }
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            {title && <h3 className="text-base font-semibold">{title}</h3>}
            <TranslateButton
              content={content}
              onTranslate={handleTranslate}
              isLoggedIn={isLoggedIn}
            />
          </div>
          {renderToolbar(displayedContent)}
        </div>
        <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg font-mono border max-h-[500px] overflow-y-auto">
          {displayedContent}
        </pre>
      </div>
    );
  }

  // Render content with inline contenteditable spans
  const renderContent = () => {
    const parts: React.ReactNode[] = [];
    interface Occurrence {
      start: number;
      end: number;
      name: string;
      fullMatch: string;
    }
    const occurrences: Occurrence[] = [];

    for (const v of variables) {
      let startIndex = 0;
      while ((startIndex = displayedContent.indexOf(v.fullMatch, startIndex)) !== -1) {
        occurrences.push({
          start: startIndex,
          end: startIndex + v.fullMatch.length,
          name: v.name,
          fullMatch: v.fullMatch,
        });
        startIndex += v.fullMatch.length;
      }
    }

    occurrences.sort((a, b) => a.start - b.start);

    const nonOverlapping: Occurrence[] = [];
    let lastEnd = 0;
    for (const occ of occurrences) {
      if (occ.start >= lastEnd) {
        nonOverlapping.push(occ);
        lastEnd = occ.end;
      }
    }

    let currentIndex = 0;
    let keyIdx = 0;
    for (const occ of nonOverlapping) {
      if (occ.start > currentIndex) {
        parts.push(displayedContent.slice(currentIndex, occ.start));
      }

      const currentValue = values[occ.name] || "";
      parts.push(
        <EditableSpan
          key={keyIdx++}
          value={currentValue}
          onChange={(newValue) => updateValue(occ.name, newValue)}
          placeholder={occ.name}
        />
      );
      currentIndex = occ.end;
    }

    if (currentIndex < displayedContent.length) {
      parts.push(displayedContent.slice(currentIndex));
    }

    return parts;
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          {title && <h3 className="text-base font-semibold">{title}</h3>}
          <TranslateButton
            content={content}
            onTranslate={handleTranslate}
            isLoggedIn={isLoggedIn}
          />
        </div>
        {renderToolbar(getFinalContent())}
      </div>

      {/* Dynamic Variable Form */}
      <div className="mb-4 p-4 rounded-lg border bg-muted/30 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t("variables")}</span>
          <span className="text-xs text-muted-foreground">
            {uniqueVariables.length} biến số phát hiện
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {uniqueVariables.map(({ name, defaultValue }) => (
            <div key={name} className="space-y-1">
              <Label htmlFor={`var-text-${name}`} className="text-xs text-muted-foreground">
                {name}
              </Label>
              <Input
                id={`var-text-${name}`}
                value={values[name] || ""}
                onChange={(e) => updateValue(name, e.target.value)}
                placeholder={defaultValue || `Nhập ${name}...`}
                className="h-8 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {isStructured ? (
        <CodeView 
          content={getFinalContent()} 
          language={structuredFormat}
          className="text-sm"
          wordWrap
        />
      ) : (
        <div className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg font-mono border leading-relaxed max-h-[500px] overflow-y-auto">
          {renderContent()}
        </div>
      )}
    </div>
  );
}
