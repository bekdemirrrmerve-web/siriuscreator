import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

export function DemoBadge({ label = "Demo veri" }: { label?: string }) {
  return (
    <Badge variant="outline" className="border-accent/50 text-accent">
      {label}
    </Badge>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  demo,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  demo?: boolean;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
          {demo && <DemoBadge />}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">{children}</div>;
}

export function fmt(n: number) {
  return new Intl.NumberFormat("tr-TR", { notation: n >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(n);
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
