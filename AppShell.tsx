import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bookmark,
  CalendarDays,
  Inbox,
  Link2,
  ListOrdered,
  Menu,
  MessageSquare,
  Palette,
  PenLine,
  Plus,
  Swords,
  Trash2,
  TrendingUp,
  User,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { CapabilityStatus } from "@/components/shell/CapabilityStatus";
import { ModelSelector } from "@/components/shell/ModelSelector";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useStudio } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Creator", to: "/", icon: PenLine },
] as const;

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { sessions, saved, inbox, deleteSession, removeSaved } = useStudio();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const unread = inbox.filter((m) => !m.read).length;

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <Link
        to="/"
        onClick={onNavigate}
        className="flex items-center gap-2.5 rounded-xl px-2 py-2"
        aria-label="Sirius Creator ana sayfa"
      >
        <span className="brand-gradient flex size-9 items-center justify-center rounded-xl text-base font-bold text-primary-foreground">
          S
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">Sirius Creator</span>
          <span className="text-[11px] text-muted-foreground">AI içerik stüdyosu</span>
        </span>
      </Link>

      <nav className="space-y-0.5" aria-label="Ana menü">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden />
              <span className="flex-1">{item.label}</span>
              {(item.to as string) === "/inbox" && unread > 0 && (
                <span className="rounded-full bg-accent px-1.5 text-[10px] font-semibold text-accent-foreground">
                  {unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <Separator />

      <ScrollArea className="-mx-1 flex-1 px-1">
        <div className="space-y-4">
          <section>
            <h2 className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Son oturumlar
            </h2>
            {sessions.length === 0 ? (
              <p className="px-2 text-xs text-muted-foreground">Henüz oturum yok.</p>
            ) : (
              <ul className="space-y-0.5">
                {sessions.slice(0, 8).map((s) => (
                  <li key={s.id} className="group flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        void navigate({ to: "/", search: { s: s.id } });
                        onNavigate?.();
                      }}
                      className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                    >
                      <MessageSquare className="size-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{s.title}</span>
                    </button>
                    <button
                      type="button"
                      aria-label={`${s.title} oturumunu sil`}
                      onClick={() => deleteSession(s.id)}
                      className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Kaydedilenler
            </h2>
            {saved.length === 0 ? (
              <p className="px-2 text-xs text-muted-foreground">Kaydedilen öğe yok.</p>
            ) : (
              <ul className="space-y-0.5">
                {saved.slice(0, 10).map((item) => (
                  <li key={item.id} className="group flex items-center gap-1">
                    <button
                      type="button"
                      title="Panoya kopyala"
                      onClick={() => void navigator.clipboard?.writeText(item.content)}
                      className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Bookmark className="size-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{item.label}</span>
                    </button>
                    <button
                      type="button"
                      aria-label={`${item.label} kaydını kaldır`}
                      onClick={() => removeSaved(item.id)}
                      className="rounded-md p-1 text-muted-foreground opacity-0 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </ScrollArea>

      <div className="flex items-center gap-2 rounded-xl border border-sidebar-border p-2">
        <span className="flex size-8 items-center justify-center rounded-full bg-secondary">
          <User className="size-4" aria-hidden />
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-xs font-medium">Misafir hesap</span>
          <span className="text-[11px] text-muted-foreground">Yerel demo verisi</span>
        </span>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const section = NAV.find((n) => (n.to === "/" ? pathname === "/" : pathname.startsWith(n.to)));

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-[248px] shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        <div className="sticky top-0 h-screen">
          <SidebarContent />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-background/80 px-3 py-2.5 backdrop-blur-xl md:px-5">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menüyü aç">
                <Menu className="size-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[270px] bg-sidebar p-0">
              <SheetTitle className="sr-only">Gezinme</SheetTitle>
              <SidebarContent onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <p className="truncate text-sm font-semibold md:text-base">
            Sirius Creator
            {section && section.to !== "/" && (
              <span className="font-normal text-muted-foreground"> / {section.label}</span>
            )}
          </p>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:block">
              <ModelSelector />
            </div>
            <CapabilityStatus />
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 rounded-full"
              onClick={() => void navigate({ to: "/", search: { new: Date.now() } })}
            >
              <Plus className="size-3.5" aria-hidden />
              <span className="hidden sm:inline">Yeni oturum</span>
            </Button>
          </div>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
