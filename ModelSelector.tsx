import { Cpu } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MODELS, useStudio } from "@/lib/store";
import type { ModelId } from "@/lib/types";

export function ModelSelector({ compact = false }: { compact?: boolean }) {
  const { model, setModel } = useStudio();

  return (
    <Select value={model} onValueChange={(v) => setModel(v as ModelId)}>
      <SelectTrigger
        aria-label="Model seç"
        className={compact ? "h-9 w-[150px] rounded-full text-xs" : "h-9 w-[190px] rounded-full"}
      >
        <Cpu className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <SelectValue placeholder="Model" />
      </SelectTrigger>
      <SelectContent>
        {MODELS.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            <span className="flex flex-col items-start">
              <span className="text-sm font-medium">{m.name}</span>
              <span className="text-xs text-muted-foreground">{m.description}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
