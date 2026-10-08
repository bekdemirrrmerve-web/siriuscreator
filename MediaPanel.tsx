import { AlertCircle, AudioLines, ImageIcon, Loader2, UserSquare, Video, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCapabilities } from "@/hooks/useCapabilities";
import { sirius, SiriusError } from "@/lib/sirius/client";
import { uid } from "@/lib/store";
import type { CapabilityKey, GenerationJob } from "@/lib/types";

const ICONS = {
  "image.create": ImageIcon,
  "image.edit": Wand2,
  "video.create": Video,
  "audio.create": AudioLines,
  "avatar.talk": UserSquare,
} as const;

type MediaKey = keyof typeof ICONS;

const CALLERS: Record<MediaKey, (prompt: string) => Promise<{ resultUrl: string | null; message?: string; demo?: boolean }>> = {
  "image.create": (prompt) => sirius.createImage({ prompt }),
  "image.edit": (prompt) => sirius.editImage({ prompt }),
  "video.create": (prompt) => sirius.createVideo({ prompt }),
  "audio.create": (prompt) => sirius.createAudio({ prompt }),
  "avatar.talk": (prompt) => sirius.talkAvatar({ prompt }),
};

export function MediaPanel({
  capability,
  title,
  description,
  placeholder,
  jobs,
  onJob,
}: {
  capability: MediaKey;
  title: string;
  description: string;
  placeholder: string;
  jobs: GenerationJob[];
  onJob: (job: GenerationJob) => void;
}) {
  const { stateOf } = useCapabilities();
  const state = stateOf(capability as CapabilityKey);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const Icon = ICONS[capability];
  const disabled = state !== "available" || busy;

  const run = async () => {
    if (!prompt.trim()) return;
    setBusy(true);
    const id = uid("job");
    const base: GenerationJob = {
      id,
      kind: capability === "image.edit" ? "image-edit" : (capability.split(".")[0] as GenerationJob["kind"]),
      prompt: prompt.trim(),
      status: "running",
      createdAt: new Date().toISOString(),
    };
    onJob(base);
    try {
      const res = await CALLERS[capability](prompt.trim());
      onJob({
        ...base,
        status: "done",
        ...(res.resultUrl ? { resultUrl: res.resultUrl } : {}),
        message:
          res.resultUrl
            ? "Çıktı hazır."
            : (res.message ?? "Servis çıktı döndürmedi; dosya üretilmedi."),
      });
      setPrompt("");
    } catch (error) {
      const message =
        error instanceof SiriusError ? error.message : "Beklenmeyen bir hata oluştu.";
      onJob({
        ...base,
        status: error instanceof SiriusError && error.code === "capability_unavailable" ? "unavailable" : "error",
        message,
      });
      toast.error(`${title}: ${message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <header className="mb-1 flex items-center gap-2">
        <Icon className="size-4 text-primary" aria-hidden />
        <h3 className="text-sm font-semibold">{title}</h3>
        <Badge
          variant={state === "available" ? "secondary" : "outline"}
          className="ml-auto text-[10px]"
        >
          {state === "available"
            ? "Aktif"
            : state === "checking"
              ? "Kontrol ediliyor"
              : state === "unknown"
                ? "Durum bilinmiyor"
                : "Servis kapalı"}
        </Badge>
      </header>
      <p className="mb-3 text-xs text-muted-foreground">{description}</p>

      {state !== "available" && state !== "checking" && (
        <p className="mb-3 flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-2.5 text-xs text-foreground">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden />
          Bu medya servisi şu anda bağlı değil. Metin çıktısı bu üretimin yerine geçmez.
        </p>
      )}

      <div className="flex gap-2">
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={placeholder}
          aria-label={`${title} istemi`}
          disabled={disabled}
          onKeyDown={(e) => e.key === "Enter" && void run()}
        />
        <Button onClick={() => void run()} disabled={disabled || !prompt.trim()}>
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Üret"}
        </Button>
      </div>

      {jobs.length > 0 && (
        <ul className="mt-3 space-y-2">
          {jobs.map((job) => (
            <li key={job.id} className="rounded-xl border border-border bg-muted/40 p-2.5 text-xs">
              <p className="line-clamp-2 font-medium">{job.prompt}</p>
              <p className="mt-1 text-muted-foreground">
                {job.status === "running" && "İşleniyor…"}
                {job.status === "done" && (job.message ?? "Tamamlandı")}
                {job.status === "unavailable" && "Servis kullanılamıyor — üretim yapılmadı."}
                {job.status === "error" && (job.message ?? "Hata")}
              </p>
              {job.resultUrl && (
                <a
                  href={job.resultUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-primary underline"
                >
                  Çıktıyı aç
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
