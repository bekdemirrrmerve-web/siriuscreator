import { ArrowUp, ImageIcon, Loader2, Paperclip, Plus, X } from "lucide-react";
import { useRef, useState, type DragEvent, type KeyboardEvent } from "react";

import { ModelSelector } from "@/components/shell/ModelSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { uid } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Attachment } from "@/lib/types";

export type ComposerMode = { id: string; label: string };

type ComposerProps = {
  placeholder?: string;
  modes?: ComposerMode[];
  activeModes?: string[];
  onToggleMode?: (id: string) => void;
  onSend: (text: string, attachments: Attachment[]) => void;
  busy?: boolean;
  disabled?: boolean;
  hint?: string;
  initialValue?: string | undefined;
};

function toAttachment(file: File): Attachment {
  const isImage = file.type.startsWith("image/");
  return {
    id: uid("att"),
    name: file.name,
    size: file.size,
    kind: isImage ? "image" : "file",
    mimeType: file.type || "application/octet-stream",
    ...(isImage ? { previewUrl: URL.createObjectURL(file) } : {}),
  };
}

export function Composer({
  placeholder = "Bir şey yaz…",
  modes = [],
  activeModes = [],
  onToggleMode,
  onSend,
  busy = false,
  disabled = false,
  hint,
  initialValue = "",
}: ComposerProps) {
  const [text, setText] = useState(initialValue);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    setAttachments((prev) => [...prev, ...Array.from(files).map(toAttachment)].slice(0, 6));
  };

  const submit = () => {
    if (busy || disabled) return;
    if (!text.trim() && attachments.length === 0) return;
    onSend(text.trim(), attachments);
    setText("");
    setAttachments([]);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        "glass rounded-3xl p-2.5 shadow-soft transition-colors",
        dragging && "border-primary bg-primary/5",
      )}
    >
      {attachments.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-2 px-1">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-2 rounded-full border border-border bg-secondary py-1 pl-1 pr-2 text-xs"
            >
              {a.previewUrl ? (
                <img
                  src={a.previewUrl}
                  alt=""
                  className="size-6 rounded-full object-cover"
                  aria-hidden
                />
              ) : (
                <span className="flex size-6 items-center justify-center rounded-full bg-muted">
                  <Paperclip className="size-3" aria-hidden />
                </span>
              )}
              <span className="max-w-[140px] truncate">{a.name}</span>
              <button
                type="button"
                aria-label={`${a.name} ekini kaldır`}
                onClick={() => setAttachments((p) => p.filter((x) => x.id !== a.id))}
                className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        rows={2}
        disabled={disabled}
        aria-label="Mesaj yaz"
        placeholder={dragging ? "Dosyaları buraya bırak…" : placeholder}
        className="min-h-[56px] resize-none border-0 bg-transparent px-3 py-2 text-base shadow-none focus-visible:ring-0 md:text-sm"
      />

      <div className="flex flex-wrap items-center gap-2 px-1 pt-1">
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,.pdf,.txt,.md,.csv"
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-8 shrink-0 rounded-full border border-border"
          onClick={() => fileRef.current?.click()}
          aria-label="Görsel veya dosya ekle"
          disabled={disabled}
        >
          <Plus className="size-4" aria-hidden />
        </Button>

        {modes.map((m) => {
          const active = activeModes.includes(m.id);
          return (
            <Button
              key={m.id}
              type="button"
              size="sm"
              variant={active ? "default" : "ghost"}
              aria-pressed={active}
              onClick={() => onToggleMode?.(m.id)}
              className="h-8 rounded-full border border-border px-3 text-xs"
            >
              {m.label}
            </Button>
          );
        })}

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:block">
            <ModelSelector compact />
          </div>
          <Button
            type="button"
            size="icon"
            onClick={submit}
            disabled={busy || disabled || (!text.trim() && attachments.length === 0)}
            aria-label="Gönder"
            className="size-9 shrink-0 rounded-full"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <ArrowUp className="size-4" aria-hidden />
            )}
          </Button>
        </div>
      </div>

      {(hint || dragging) && (
        <p className="px-3 pb-1 pt-2 text-[11px] text-muted-foreground">
          {dragging ? (
            <span className="flex items-center gap-1">
              <ImageIcon className="size-3" aria-hidden /> Dosyaları bırak
            </span>
          ) : (
            hint
          )}
        </p>
      )}

      {disabled && (
        <Badge variant="secondary" className="mx-3 mb-1">
          Servis şu anda kullanılamıyor
        </Badge>
      )}
    </div>
  );
}
