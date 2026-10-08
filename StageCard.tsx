import { Bookmark, Check, Copy, Loader2, RotateCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import type { ContentStage } from "@/lib/types";

export function StageCard({
  stage,
  onChange,
  onRegenerate,
  onSave,
}: {
  stage: ContentStage;
  onChange: (content: string) => void;
  onRegenerate?: () => void;
  onSave?: () => void;
}) {
  const [value, setValue] = useState(stage.content);
  const [copied, setCopied] = useState(false);

  useEffect(() => setValue(stage.content), [stage.content]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Kopyalanamadı");
    }
  };

  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <header className="mb-2 flex items-center gap-2">
        <h3 className="text-sm font-semibold">{stage.title}</h3>
        {stage.status === "running" && (
          <Loader2 className="size-3.5 animate-spin text-primary" aria-hidden />
        )}
        <div className="ml-auto flex items-center gap-1">
          {onSave && (
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={onSave} aria-label={`${stage.title} kaydet`}>
              <Bookmark className="size-3.5" aria-hidden />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={() => void copy()}
            aria-label={`${stage.title} kopyala`}
          >
            {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
          </Button>
          {onRegenerate && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              onClick={onRegenerate}
              disabled={stage.status === "running"}
              aria-label={`${stage.title} yeniden üret`}
            >
              <RotateCw className="size-3.5" aria-hidden />
            </Button>
          )}
        </div>
      </header>

      {stage.status === "running" && !stage.content ? (
        <div className="space-y-2">
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-3/5" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ) : stage.status === "error" ? (
        <p className="text-sm text-destructive">{stage.content || "Bu adım üretilemedi."}</p>
      ) : (
        <Textarea
          value={value}
          aria-label={`${stage.title} içeriği`}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => value !== stage.content && onChange(value)}
          className="min-h-[96px] resize-y border-0 bg-muted/40 text-sm leading-relaxed"
        />
      )}
    </article>
  );
}
