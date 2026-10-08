import { Activity, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCapabilities } from "@/hooks/useCapabilities";
import { cn } from "@/lib/utils";
import type { CapabilityState } from "@/lib/types";

const LABELS: Record<string, string> = {
  chat: "Sohbet",
  generate: "Üretim",
  agent: "Ajan",
  research: "Araştırma",
  memory: "Hafıza",
  tools: "Araçlar",
  "image.create": "Görsel üretimi",
  "image.edit": "Görsel düzenleme",
  "video.create": "Video üretimi",
  "audio.create": "Seslendirme",
  "avatar.create": "Avatar",
  "avatar.talk": "Konuşan avatar",
};

const STATE_TEXT: Record<CapabilityState, string> = {
  available: "Aktif",
  unavailable: "Kapalı",
  unknown: "Bilinmiyor",
  checking: "Kontrol ediliyor",
};

function dotClass(state: CapabilityState) {
  if (state === "available") return "bg-success";
  if (state === "unavailable") return "bg-destructive";
  if (state === "checking") return "bg-muted-foreground animate-pulse";
  return "bg-warning";
}

export function CapabilityStatus() {
  const { report, mode, isLoading, isError, refetch } = useCapabilities();
  const caps = report?.capabilities ?? [];
  const down = caps.filter((c) => c.state !== "available").length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 rounded-full border border-border"
          aria-label="Servis durumu"
        >
          <span
            className={cn(
              "size-2 rounded-full",
              isLoading ? "bg-muted-foreground animate-pulse" : isError ? "bg-warning" : down > 0 ? "bg-warning" : "bg-success",
            )}
            aria-hidden
          />
          <span className="hidden text-xs font-medium sm:inline">
            {mode === "mock" ? "Demo mod" : "Canlı"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-primary" aria-hidden />
            <p className="text-sm font-semibold">Servis durumu</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void refetch()}
            aria-label="Servis durumunu yenile"
          >
            <RefreshCw className="size-3.5" aria-hidden />
          </Button>
        </div>

        <Badge variant="secondary" className="mb-3">
          {mode === "mock" ? "Demo veri modu" : "Sirius API bağlı"}
        </Badge>

        {isError && (
          <p className="mb-3 text-xs text-destructive">
            Durum bilgisi alınamadı. Tekrar denemek için yenile.
          </p>
        )}

        <ul className="space-y-1.5">
          {caps.map((c) => (
            <li key={c.key} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-2">
                <span className={cn("size-1.5 rounded-full", dotClass(c.state))} aria-hidden />
                {LABELS[c.key] ?? c.key}
              </span>
              <span className="text-muted-foreground">{STATE_TEXT[c.state]}</span>
            </li>
          ))}
          {caps.length === 0 && (
            <li className="text-xs text-muted-foreground">Yetenekler yükleniyor…</li>
          )}
        </ul>

        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          Kapalı servisler arayüzde devre dışı bırakılır; metin çıktısı görsel/video yerine
          geçmez.
        </p>
      </PopoverContent>
    </Popover>
  );
}
