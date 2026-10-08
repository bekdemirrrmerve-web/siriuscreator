import { AlertTriangle, Loader2, RotateCw, Sparkle } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";

export function ChatThread({
  messages,
  onRetry,
  emptyState,
}: {
  messages: ChatMessage[];
  onRetry?: (message: ChatMessage) => void;
  emptyState?: React.ReactNode;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  if (messages.length === 0 && emptyState) return <>{emptyState}</>;

  return (
    <div className="flex flex-col gap-5" role="log" aria-live="polite">
      {messages.map((m) => (
        <div
          key={m.id}
          className={cn("flex w-full", m.role === "user" ? "justify-end" : "justify-start")}
        >
          <div className={cn("max-w-[88%] space-y-2", m.role === "user" && "items-end")}>
            {m.role === "assistant" && m.stageLabel && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
                <Sparkle className="size-3" aria-hidden />
                {m.stageLabel}
              </p>
            )}

            {m.attachments && m.attachments.length > 0 && (
              <div className="flex flex-wrap justify-end gap-2">
                {m.attachments.map((a) =>
                  a.previewUrl ? (
                    <img
                      key={a.id}
                      src={a.previewUrl}
                      alt={a.name}
                      className="size-20 rounded-xl border border-border object-cover"
                    />
                  ) : (
                    <span
                      key={a.id}
                      className="rounded-lg border border-border bg-muted px-2 py-1 text-xs"
                    >
                      {a.name}
                    </span>
                  ),
                )}
              </div>
            )}

            {m.role === "user" ? (
              <p className="whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground">
                {m.content}
              </p>
            ) : m.status === "pending" ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                Sirius düşünüyor…
              </p>
            ) : m.status === "error" ? (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
                <p className="flex items-center gap-2 font-medium text-destructive">
                  <AlertTriangle className="size-4" aria-hidden />
                  İşlem tamamlanamadı
                </p>
                <p className="mt-1 text-muted-foreground">{m.content}</p>
                {onRetry && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 h-8"
                    onClick={() => onRetry(m)}
                  >
                    <RotateCw className="size-3.5" aria-hidden /> Tekrar dene
                  </Button>
                )}
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {m.content}
              </p>
            )}
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
