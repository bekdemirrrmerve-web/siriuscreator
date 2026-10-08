import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { CreatorWorkspace } from "@/components/creator/CreatorWorkspace";

type Search = { s?: string | undefined; idea?: string | undefined; new?: number | undefined };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    s: typeof search["s"] === "string" ? (search["s"] as string) : undefined,
    idea: typeof search["idea"] === "string" ? (search["idea"] as string) : undefined,
    new: typeof search["new"] === "number" ? (search["new"] as number) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sirius Creator — AI İçerik Stüdyosu" },
      { name: "description", content: "Tek fikirden araştırma, hook, senaryo, caption ve medya içeren eksiksiz sosyal içerik paketi üret." },
      { property: "og:title", content: "Sirius Creator — AI İçerik Stüdyosu" },
      { property: "og:description", content: "Tek fikirden eksiksiz sosyal içerik paketi üret." },
    ],
  }),
  component: CreatorPage,
});

function CreatorPage() {
  const { s, idea, new: fresh } = Route.useSearch();
  const navigate = useNavigate();
  return (
    <CreatorWorkspace
      key={`${s ?? "home"}-${idea ?? ""}-${fresh ?? ""}`}
      sessionId={s}
      initialIdea={idea}
      onSessionCreated={(id) => void navigate({ to: "/", search: { s: id } })}
    />
  );
}
