import { Palette } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStudio } from "@/lib/store";

export function BrandKitDialog() {
  const { brandKit, setBrandKit } = useStudio();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(brandKit);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setDraft(brandKit);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 rounded-full">
          <Palette className="size-3.5" aria-hidden />
          Marka kiti
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Marka kiti</DialogTitle>
          <DialogDescription>
            Sirius tüm içerik üretiminde bu kuralları dikkate alır.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bk-voice">Marka sesi</Label>
            <Textarea
              id="bk-voice"
              value={draft.brandVoice}
              onChange={(e) => setDraft({ ...draft, brandVoice: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bk-audience">Hedef kitle</Label>
            <Textarea
              id="bk-audience"
              value={draft.audience}
              onChange={(e) => setDraft({ ...draft, audience: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bk-colors">Renkler (virgülle)</Label>
            <Input
              id="bk-colors"
              value={draft.colors.join(", ")}
              onChange={(e) =>
                setDraft({ ...draft, colors: e.target.value.split(",").map((c) => c.trim()) })
              }
            />
            <div className="flex gap-1.5 pt-1">
              {draft.colors.filter(Boolean).map((c) => (
                <span
                  key={c}
                  className="size-6 rounded-full border border-border"
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bk-forbidden">Yasaklı ifadeler (virgülle)</Label>
            <Input
              id="bk-forbidden"
              value={draft.forbiddenTerms.join(", ")}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  forbiddenTerms: e.target.value.split(",").map((c) => c.trim()),
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bk-cta">Tercih edilen CTA</Label>
            <Input
              id="bk-cta"
              value={draft.preferredCta}
              onChange={(e) => setDraft({ ...draft, preferredCta: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => {
              setBrandKit(draft);
              setOpen(false);
              toast.success("Marka kiti kaydedildi");
            }}
          >
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
