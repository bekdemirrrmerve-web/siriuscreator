import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ALL_PLATFORMS, BEST_TIMES, PLATFORM_LABEL } from "@/lib/demo";
import { uid, useStudio } from "@/lib/store";
import type { Platform, PostStatus, ScheduledPost } from "@/lib/types";

export const STATUS_LABEL: Record<PostStatus, string> = {
  draft: "Taslak",
  scheduled: "Planlandı",
  published: "Yayınlandı",
  failed: "Başarısız",
};

export const STATUS_CLASS: Record<PostStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-primary/15 text-primary",
  published: "bg-success/15 text-success",
  failed: "bg-destructive/15 text-destructive",
};

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function SchedulePostDialog({
  open,
  onOpenChange,
  post,
  defaultDate,
  defaultCaption,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  post?: ScheduledPost;
  defaultDate?: Date;
  defaultCaption?: string;
}) {
  const { upsertPost, removePost } = useStudio();
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [when, setWhen] = useState("");
  const [caption, setCaption] = useState("");
  const [mediaName, setMediaName] = useState<string | undefined>();
  const [status, setStatus] = useState<PostStatus>("scheduled");

  useEffect(() => {
    if (!open) return;
    const base = defaultDate ?? new Date(Date.now() + 86400000);
    if (!post && !defaultDate) base.setHours(20, 0, 0, 0);
    setPlatform(post?.platform ?? "instagram");
    setWhen(toLocalInput(post?.scheduledAt ?? base.toISOString()));
    setCaption(post?.caption ?? defaultCaption ?? "");
    setMediaName(post?.mediaName);
    setStatus(post?.status ?? "scheduled");
  }, [open, post, defaultDate, defaultCaption]);

  const save = () => {
    if (!caption.trim()) {
      toast.error("Caption boş olamaz.");
      return;
    }
    upsertPost({
      id: post?.id ?? uid("post"),
      platform,
      scheduledAt: new Date(when).toISOString(),
      caption: caption.trim(),
      ...(mediaName ? { mediaName } : {}),
      status,
    });
    toast.success(post ? "Gönderi güncellendi" : "Gönderi planlandı");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{post ? "Gönderiyi düzenle" : "Yeni gönderi planla"}</DialogTitle>
          <DialogDescription>
            Sosyal hesap bağlanana kadar planlar bu cihazda saklanır.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>{PLATFORM_LABEL[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Durum</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as PostStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABEL) as PostStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sp-when">Tarih / saat</Label>
            <Input id="sp-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Önerilen saatler: {BEST_TIMES[platform].join(" · ")}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sp-cap">Caption</Label>
            <Textarea id="sp-cap" rows={5} value={caption} onChange={(e) => setCaption(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sp-media">Medya</Label>
            <Input
              id="sp-media"
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setMediaName(e.target.files?.[0]?.name)}
            />
            {mediaName && <p className="text-xs text-muted-foreground">Seçili: {mediaName}</p>}
          </div>
        </div>
        <DialogFooter className="gap-2">
          {post && (
            <Button
              variant="ghost"
              className="text-destructive sm:mr-auto"
              onClick={() => {
                removePost(post.id);
                toast("Gönderi silindi");
                onOpenChange(false);
              }}
            >
              Sil
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Vazgeç</Button>
          <Button onClick={save}>Kaydet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function StatusPill({ status }: { status: PostStatus }): ReactNode {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_CLASS[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
