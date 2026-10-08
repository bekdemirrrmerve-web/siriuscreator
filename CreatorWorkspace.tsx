import {
  CalendarDays,
  Copy,
  Instagram,
  Layers,
  Linkedin,
  Music2,
  Save,
  Sparkles,
  Youtube,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ChatThread } from "@/components/chat/ChatThread";
import { Composer } from "@/components/chat/Composer";
import { BrandKitDialog } from "@/components/creator/BrandKitDialog";
import { MediaPanel } from "@/components/creator/MediaPanel";
import { StageCard } from "@/components/creator/StageCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sirius, SiriusError } from "@/lib/sirius/client";
import { uid, useStudio } from "@/lib/store";
import { cn } from "@/lib/utils";
import type {
  Attachment,
  ChatMessage,
  ContentFormat,
  ContentStage,
  ContentStageKey,
  CreatorProject,
  GenerationJob,
  Platform,
  Tone,
} from "@/lib/types";

const QUICK_STARTS: { id: ContentFormat; label: string }[] = [
  { id: "reels", label: "Reels" },
  { id: "tiktok", label: "TikTok" },
  { id: "carousel", label: "Instagram carousel" },
  { id: "story", label: "Story" },
  { id: "short", label: "YouTube Short" },
  { id: "product-ad", label: "Ürün reklamı" },
  { id: "ugc", label: "UGC" },
  { id: "educational", label: "Eğitici içerik" },
];

const PLATFORMS: { id: Platform; label: string; icon?: typeof Instagram }[] = [
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "tiktok", label: "TikTok", icon: Music2 },
  { id: "youtube", label: "YouTube", icon: Youtube },
  { id: "x", label: "X" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin },
  { id: "pinterest", label: "Pinterest" },
];

const TONES: Tone[] = ["samimi", "profesyonel", "esprili", "ilham-verici", "bilgilendirici"];

const STAGE_TITLES: Record<ContentStageKey, string> = {
  research: "Araştırma & trend bağlamı",
  hook: "Hook alternatifleri",
  script: "Senaryo",
  shotlist: "Çekim listesi",
  caption: "Açıklama metni",
  cta: "CTA",
  hashtags: "Hashtag & anahtar kelimeler",
  imagePrompts: "Görsel istemleri",
  voiceover: "Seslendirme yönergesi",
};

const STAGE_ORDER: ContentStageKey[] = [
  "research",
  "hook",
  "script",
  "shotlist",
  "caption",
  "cta",
  "hashtags",
  "imagePrompts",
  "voiceover",
];

function emptyStages(): ContentStage[] {
  return STAGE_ORDER.map((key) => ({
    key,
    title: STAGE_TITLES[key],
    status: "idle",
    content: "",
  }));
}

const MODES = [
  { id: "research", label: "Viral fikir bul" },
  { id: "hooks", label: "Hook üret" },
  { id: "repurpose", label: "Repurpose" },
  { id: "calendar", label: "Takvim" },
];

export function CreatorWorkspace({
  sessionId,
  onSessionCreated,
  initialIdea,
}: {
  sessionId?: string | undefined;
  onSessionCreated: (id: string) => void;
  initialIdea?: string | undefined;
}) {
  const {
    sessions,
    projects,
    brandKit,
    model,
    createSession,
    appendMessage,
    patchMessage,
    upsertProject,
    toggleSaved,
    updateSession,
  } = useStudio();

  const session = sessions.find((s) => s.id === sessionId && s.product === "creator");
  const project = projects.find((p) => p.id === session?.artifactId);

  const [platform, setPlatform] = useState<Platform>("instagram");
  const [format, setFormat] = useState<ContentFormat>("reels");
  const [language, setLanguage] = useState("Türkçe");
  const [tone, setTone] = useState<Tone>("samimi");
  const [activeModes, setActiveModes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const messages = session?.messages ?? [];

  const stages = useMemo(() => project?.stages ?? emptyStages(), [project]);

  const say = (sid: string, content: string, stageLabel?: string, status: ChatMessage["status"] = "complete") => {
    const msg: ChatMessage = {
      id: uid("msg"),
      role: "assistant",
      content,
      createdAt: new Date().toISOString(),
      status,
      ...(stageLabel ? { stageLabel } : {}),
    };
    appendMessage(sid, msg);
    return msg.id;
  };

  const runPipeline = async (sid: string, proj: CreatorProject) => {
    setBusy(true);
    const pending = say(sid, "", undefined, "pending");
    let current = proj;

    const setStage = (key: ContentStageKey, patch: Partial<ContentStage>) => {
      current = {
        ...current,
        updatedAt: new Date().toISOString(),
        stages: current.stages.map((s) => (s.key === key ? { ...s, ...patch } : s)),
      };
      upsertProject(current);
    };

    try {
      setStage("research", { status: "running" });
      const research = await sirius.researchTrends({ prompt: proj.idea, platform: proj.platform });
      setStage("research", {
        status: "done",
        content: research.trends.map((t) => `• ${t.title}\n  ${t.why}`).join("\n"),
      });

      STAGE_ORDER.slice(1).forEach((k) => setStage(k, { status: "running" }));
      const pkg = await sirius.creatorPackage({
        idea: proj.idea,
        platform: proj.platform,
        format: proj.format,
        language: proj.language,
        tone: proj.tone,
        brandKit,
        model,
      });

      (["hook", "script", "shotlist", "caption", "cta", "hashtags", "imagePrompts", "voiceover"] as ContentStageKey[]).forEach(
        (key) => setStage(key, { status: "done", content: pkg[key] ?? "" }),
      );

      patchMessage(sid, pending, {
        status: "complete",
        stageLabel: "İçerik paketi hazır",
        content:
          "İçerik paketini oluşturdum: araştırma, hook, senaryo, çekim listesi, caption, CTA, hashtag ve görsel istemleri. Sağdaki kartlardan hepsini düzenleyebilirsin.",
      });
    } catch (error) {
      const message = error instanceof SiriusError ? error.message : "Üretim tamamlanamadı.";
      current.stages
        .filter((s) => s.status === "running")
        .forEach((s) => setStage(s.key, { status: "error", content: message }));
      patchMessage(sid, pending, { status: "error", content: message });
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const start = async (idea: string, attachments: Attachment[]) => {
    const newSession = createSession("creator", idea.slice(0, 48) || "Yeni içerik");
    const proj: CreatorProject = {
      id: uid("prj"),
      title: idea.slice(0, 60) || "İçerik projesi",
      idea,
      platform,
      format,
      language,
      tone,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stages: emptyStages(),
      jobs: [],
    };
    upsertProject(proj);
    appendMessage(newSession.id, {
      id: uid("msg"),
      role: "user",
      content: idea,
      createdAt: new Date().toISOString(),
      status: "complete",
      ...(attachments.length ? { attachments } : {}),
    });
    onSessionCreated(newSession.id);
    updateSession(newSession.id, { artifactId: proj.id });
    await runPipeline(newSession.id, { ...proj });
  };

  const handleSend = async (text: string, attachments: Attachment[]) => {
    if (!session) {
      await start(text, attachments);
      return;
    }
    appendMessage(session.id, {
      id: uid("msg"),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
      status: "complete",
      ...(attachments.length ? { attachments } : {}),
    });

    setBusy(true);
    const pending = say(session.id, "", undefined, "pending");
    try {
      if (activeModes.includes("research")) {
        const r = await sirius.researchTrends({ prompt: text || project?.idea || "" });
        patchMessage(session.id, pending, {
          status: "complete",
          stageLabel: "Viral fikirler",
          content: r.trends.map((t) => `• ${t.title}\n  ${t.why}`).join("\n\n"),
        });
      } else if (activeModes.includes("hooks")) {
        const r = await sirius.creatorHooks({ prompt: text || project?.idea || "" });
        patchMessage(session.id, pending, {
          status: "complete",
          stageLabel: "Hook alternatifleri",
          content: r.hooks.map((h, i) => `${i + 1}. ${h}`).join("\n"),
        });
      } else if (activeModes.includes("repurpose") && project) {
        const r = await sirius.creatorRepurpose({ idea: project.idea });
        upsertProject({ ...project, repurposed: r.variants, updatedAt: new Date().toISOString() });
        patchMessage(session.id, pending, {
          status: "complete",
          stageLabel: "Repurpose",
          content: r.variants.map((v) => `${v.label}: ${v.content}`).join("\n\n"),
        });
      } else if (activeModes.includes("calendar") && project) {
        const r = await sirius.creatorCalendar({ idea: project.idea });
        upsertProject({ ...project, calendar: r.calendar, updatedAt: new Date().toISOString() });
        patchMessage(session.id, pending, {
          status: "complete",
          stageLabel: "İçerik takvimi",
          content: r.calendar.map((c) => `${c.day}: ${c.item}`).join("\n"),
        });
      } else {
        const r = await sirius.chat({ message: text, product: "creator", model });
        patchMessage(session.id, pending, { status: "complete", content: r.message });
      }
    } catch (error) {
      patchMessage(session.id, pending, {
        status: "error",
        content: error instanceof SiriusError ? error.message : "İstek tamamlanamadı.",
      });
    } finally {
      setBusy(false);
      setActiveModes([]);
    }
  };

  const regenerateStage = async (key: ContentStageKey) => {
    if (!project) return;
    const patchStage = (patch: Partial<ContentStage>) =>
      upsertProject({
        ...project,
        stages: project.stages.map((s) => (s.key === key ? { ...s, ...patch } : s)),
        updatedAt: new Date().toISOString(),
      });
    patchStage({ status: "running" });
    try {
      const pkg = await sirius.creatorPackage({
        idea: project.idea,
        platform: project.platform,
        format: project.format,
        language: project.language,
        tone: project.tone,
        brandKit,
        regenerate: key,
        nonce: Date.now(),
      });
      patchStage({ status: "done", content: pkg[key] ?? "" });
      toast.success(`${STAGE_TITLES[key]} yenilendi`);
    } catch (error) {
      patchStage({
        status: "error",
        content: error instanceof SiriusError ? error.message : "Yenilenemedi.",
      });
    }
  };

  const addJob = (job: GenerationJob) => {
    if (!project) return;
    const exists = project.jobs.some((j) => j.id === job.id);
    upsertProject({
      ...project,
      jobs: exists ? project.jobs.map((j) => (j.id === job.id ? job : j)) : [job, ...project.jobs],
      updatedAt: new Date().toISOString(),
    });
  };

  /* ------------------------------- home view ------------------------------- */

  if (!session) {
    return (
      <div className="hero-gradient min-h-[calc(100vh-57px)]">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 md:py-20">
          <Badge variant="secondary" className="mb-4 gap-1.5 rounded-full">
            <Sparkles className="size-3" aria-hidden /> Sirius Creator
          </Badge>
          <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
            Bugün ne <span className="brand-gradient-text">üretmek</span> istiyorsun?
          </h2>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
            Tek bir fikir ver; Sirius araştırmadan senaryoya, caption'dan görsel istemlerine kadar
            eksiksiz bir sosyal içerik paketi kursun.
          </p>

          <div className="mt-8">
            <Composer
              placeholder="Örn: Ev kahvesini 60 saniyede profesyonelleştiren bir Reels fikri"
              modes={[]}
              initialValue={initialIdea}
              onSend={(t, a) => void handleSend(t, a)}
              busy={busy}
              hint="Enter ile gönder · Shift+Enter yeni satır · Ürün/kişi görseli ekleyebilirsin"
            />
          </div>

          <div className="mt-8 space-y-6">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Hızlı başlangıç
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_STARTS.map((q) => (
                  <Button
                    key={q.id}
                    variant={format === q.id ? "default" : "outline"}
                    size="sm"
                    className="rounded-full"
                    aria-pressed={format === q.id}
                    onClick={() => setFormat(q.id)}
                  >
                    {q.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Platform
              </p>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => {
                  const Icon = p.icon;
                  return (
                    <Button
                      key={p.id}
                      variant={platform === p.id ? "default" : "outline"}
                      size="sm"
                      className="gap-1.5 rounded-full"
                      aria-pressed={platform === p.id}
                      onClick={() => setPlatform(p.id)}
                    >
                      {Icon && <Icon className="size-3.5" aria-hidden />}
                      {p.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="lang">
                  Dil
                </label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="lang" className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Türkçe", "English", "Deutsch", "Español"].map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="tone">
                  Ton
                </label>
                <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
                  <SelectTrigger id="tone" className="w-[170px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <BrandKitDialog />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ----------------------------- workspace view ---------------------------- */

  return (
    <div className="grid min-h-[calc(100vh-57px)] grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
      <section className="flex min-w-0 flex-col border-border xl:border-r">
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          <ChatThread messages={messages} />
        </div>
        <div className="sticky bottom-0 bg-background/80 p-3 backdrop-blur-xl md:p-4">
          <Composer
            placeholder="Değişiklik iste: 'hook'u daha cesur yap', 'caption'ı kısalt'…"
            modes={MODES}
            activeModes={activeModes}
            onToggleMode={(id) =>
              setActiveModes((prev) => (prev.includes(id) ? [] : [id]))
            }
            onSend={(t, a) => void handleSend(t, a)}
            busy={busy}
          />
        </div>
      </section>

      <aside className="min-w-0 bg-sidebar/40 px-4 py-5 md:px-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold">{project?.title ?? "İçerik paketi"}</h2>
          <Badge variant="secondary" className="capitalize">
            {project?.platform}
          </Badge>
          <Badge variant="outline">{project?.format}</Badge>
          <div className="ml-auto flex gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                if (!project) return;
                upsertProject({ ...project, updatedAt: new Date().toISOString() });
                toast.success("Proje kaydedildi");
              }}
            >
              <Save className="size-3.5" aria-hidden /> Kaydet
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                const all = stages.map((s) => `## ${s.title}\n${s.content}`).join("\n\n");
                void navigator.clipboard.writeText(all).then(
                  () => toast.success("Tüm paket kopyalandı"),
                  () => toast.error("Kopyalanamadı"),
                );
              }}
            >
              <Copy className="size-3.5" aria-hidden /> Dışa aktar
            </Button>
          </div>
        </div>

        <Tabs defaultValue="timeline">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="timeline" className="flex-1">
              Akış
            </TabsTrigger>
            <TabsTrigger value="media" className="flex-1">
              Medya
            </TabsTrigger>
            <TabsTrigger value="more" className="flex-1">
              Dağıtım
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-3">
            {stages.map((stage, i) => (
              <div key={stage.key} className="relative pl-6">
                <span
                  className={cn(
                    "absolute left-0 top-5 size-2.5 rounded-full",
                    stage.status === "done"
                      ? "bg-primary"
                      : stage.status === "running"
                        ? "bg-accent animate-pulse"
                        : stage.status === "error"
                          ? "bg-destructive"
                          : "bg-border",
                  )}
                  aria-hidden
                />
                {i < stages.length - 1 && (
                  <span className="absolute left-[4px] top-8 h-[calc(100%-1rem)] w-px bg-border" aria-hidden />
                )}
                <StageCard
                  stage={stage}
                  onChange={(content) =>
                    project &&
                    upsertProject({
                      ...project,
                      stages: project.stages.map((s) =>
                        s.key === stage.key ? { ...s, content } : s,
                      ),
                      updatedAt: new Date().toISOString(),
                    })
                  }
                  onRegenerate={() => void regenerateStage(stage.key)}
                  onSave={() =>
                    toggleSaved({
                      id: uid("sav"),
                      product: "creator",
                      label: `${stage.title} · ${project?.title ?? ""}`,
                      content: stage.content,
                      createdAt: new Date().toISOString(),
                    })
                  }
                />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="media" className="space-y-3">
            <MediaPanel
              capability="image.create"
              title="Görsel üretimi"
              description="Kapak ve carousel görselleri üret."
              placeholder="Görsel istemi…"
              jobs={(project?.jobs ?? []).filter((j) => j.kind === "image")}
              onJob={addJob}
            />
            <MediaPanel
              capability="image.edit"
              title="Görsel düzenleme"
              description="Yüklediğin ürün görselini düzenle."
              placeholder="Örn: arka planı sadeleştir"
              jobs={(project?.jobs ?? []).filter((j) => j.kind === "image-edit")}
              onJob={addJob}
            />
            <MediaPanel
              capability="audio.create"
              title="Seslendirme"
              description="Senaryodan seslendirme üret."
              placeholder="Seslendirme notu…"
              jobs={(project?.jobs ?? []).filter((j) => j.kind === "audio")}
              onJob={addJob}
            />
            <MediaPanel
              capability="video.create"
              title="Video üretimi"
              description="Senaryodan kısa video işi başlat."
              placeholder="Video istemi…"
              jobs={(project?.jobs ?? []).filter((j) => j.kind === "video")}
              onJob={addJob}
            />
            <MediaPanel
              capability="avatar.talk"
              title="Konuşan avatar"
              description="Senaryoyu avatara okut."
              placeholder="Avatar metni…"
              jobs={(project?.jobs ?? []).filter((j) => j.kind === "avatar")}
              onJob={addJob}
            />
          </TabsContent>

          <TabsContent value="more" className="space-y-3">
            <section className="rounded-2xl border border-border bg-card p-4">
              <header className="mb-2 flex items-center gap-2">
                <Layers className="size-4 text-primary" aria-hidden />
                <h3 className="text-sm font-semibold">Repurpose</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto h-7"
                  onClick={() => {
                    setActiveModes(["repurpose"]);
                    void handleSend("Bu fikri tüm formatlara uyarla.", []);
                  }}
                >
                  Üret
                </Button>
              </header>
              {project?.repurposed?.length ? (
                <ul className="space-y-2">
                  {project.repurposed.map((v) => (
                    <li key={v.label} className="rounded-xl bg-muted/40 p-3 text-xs">
                      <p className="font-medium">{v.label}</p>
                      <p className="mt-1 text-muted-foreground">{v.content}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Tek fikri Reel, Story, carousel ve kısa caption'a dönüştür.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-card p-4">
              <header className="mb-2 flex items-center gap-2">
                <CalendarDays className="size-4 text-primary" aria-hidden />
                <h3 className="text-sm font-semibold">İçerik takvimi</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto h-7"
                  onClick={() => {
                    setActiveModes(["calendar"]);
                    void handleSend("Haftalık içerik takvimi oluştur.", []);
                  }}
                >
                  Üret
                </Button>
              </header>
              {project?.calendar?.length ? (
                <ul className="space-y-1.5">
                  {project.calendar.map((c) => (
                    <li key={c.day} className="flex gap-2 text-xs">
                      <span className="w-20 shrink-0 font-medium">{c.day}</span>
                      <span className="text-muted-foreground">{c.item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">Haftalık yayın planı önizlemesi.</p>
              )}
            </section>
          </TabsContent>
        </Tabs>
      </aside>
    </div>
  );
}
