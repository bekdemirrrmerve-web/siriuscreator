import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { demoCompetitors, demoInbox, demoPosts } from "@/lib/demo";
import type {
  BrandKit,
  ChatMessage,
  CreatorProject,
  ModelId,
  ModelOption,
  ProductKey,
  SavedItem,
  Session,
  Competitor,
  InboxMessage,
  LinkInBio,
  ScheduledPost,
} from "@/lib/types";

/**
 * Local persistence layer.
 * TODO(backend): swap localStorage for Lovable Cloud tables + auth-scoped queries.
 */

const STORAGE_KEY = "sirius-creator-v1";

export const MODELS: ModelOption[] = [
  { id: "sirius-1-pro", name: "Sirius 1 Pro", description: "En yüksek kalite, çok adımlı üretim" },
  { id: "sirius-1-flash", name: "Sirius 1 Flash", description: "Hızlı taslak ve fikir turu" },
  { id: "sirius-1-research", name: "Sirius 1 Research", description: "Güncel araştırma odaklı" },
];

export const DEFAULT_BRAND_KIT: BrandKit = {
  brandVoice: "Sıcak, net, abartısız. Kısa cümleler.",
  audience: "25-40 yaş, İstanbul merkezli, kendi işini büyüten üreticiler",
  colors: ["#5B5BD6", "#F2A65A", "#111827"],
  forbiddenTerms: ["garanti", "kesin sonuç", "bedava"],
  preferredCta: "Kaydet, sonra lazım olacak.",
  keyMessages: ["Evde profesyonel sonuç mümkün", "Az malzeme, çok fikir"],
  description: "Ev kahvesi, üretkenlik ve küçük işletme içerikleri üreten bağımsız bir creator markası.",
};

type StudioState = {
  sessions: Session[];
  projects: CreatorProject[];
  posts: ScheduledPost[];
  inbox: InboxMessage[];
  competitors: Competitor[];
  linkInBio: LinkInBio;
  saved: SavedItem[];
  brandKit: BrandKit;
  model: ModelId;
};

const initialState: StudioState = {
  sessions: [],
  projects: [],
  posts: demoPosts(),
  inbox: demoInbox(),
  competitors: demoCompetitors(),
  linkInBio: {
    title: "Merve · Sirius Creator",
    bio: "Ev kahvesi, üretkenlik ve küçük işletmeler için kısa içerikler ☕",
    links: [
      { id: "l1", label: "Yeni Reels serisi", url: "https://instagram.com" },
      { id: "l2", label: "İş birliği formu", url: "https://example.com/isbirligi" },
    ],
  },
  saved: [],
  brandKit: DEFAULT_BRAND_KIT,
  model: "sirius-1-pro",
};

type StudioContextValue = StudioState & {
  hydrated: boolean;
  setModel: (model: ModelId) => void;
  setBrandKit: (kit: BrandKit) => void;
  createSession: (product: ProductKey, title: string, artifactId?: string) => Session;
  updateSession: (id: string, patch: Partial<Session>) => void;
  appendMessage: (sessionId: string, message: ChatMessage) => void;
  patchMessage: (sessionId: string, messageId: string, patch: Partial<ChatMessage>) => void;
  deleteSession: (id: string) => void;
  upsertProject: (project: CreatorProject) => void;
  upsertPost: (post: ScheduledPost) => void;
  removePost: (id: string) => void;
  setInbox: (fn: (m: InboxMessage[]) => InboxMessage[]) => void;
  setCompetitors: (fn: (c: Competitor[]) => Competitor[]) => void;
  setLinkInBio: (l: LinkInBio) => void;
  toggleSaved: (item: SavedItem) => void;
  removeSaved: (id: string) => void;
};

const StudioContext = createContext<StudioContextValue | null>(null);

export function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function StudioProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StudioState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...initialState, ...(JSON.parse(raw) as StudioState) });
    } catch {
      /* corrupted local state is ignored */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota errors are non-fatal for the demo */
    }
  }, [state, hydrated]);

  const setModel = useCallback((model: ModelId) => setState((s) => ({ ...s, model })), []);
  const setBrandKit = useCallback((brandKit: BrandKit) => setState((s) => ({ ...s, brandKit })), []);

  const createSession = useCallback(
    (product: ProductKey, title: string, artifactId?: string) => {
      const now = new Date().toISOString();
      let session!: Session;
      setState((s) => {
        session = {
          id: uid("ses"),
          product,
          title,
          createdAt: now,
          updatedAt: now,
          model: s.model,
          messages: [],
          ...(artifactId ? { artifactId } : {}),
        };
        return { ...s, sessions: [session, ...s.sessions] };
      });
      return session;
    },
    [],
  );

  const updateSession = useCallback((id: string, patch: Partial<Session>) => {
    setState((s) => ({
      ...s,
      sessions: s.sessions.map((session) =>
        session.id === id ? { ...session, ...patch, updatedAt: new Date().toISOString() } : session,
      ),
    }));
  }, []);

  const appendMessage = useCallback((sessionId: string, message: ChatMessage) => {
    setState((s) => ({
      ...s,
      sessions: s.sessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              messages: [...session.messages, message],
              updatedAt: new Date().toISOString(),
            }
          : session,
      ),
    }));
  }, []);

  const patchMessage = useCallback(
    (sessionId: string, messageId: string, patch: Partial<ChatMessage>) => {
      setState((s) => ({
        ...s,
        sessions: s.sessions.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                messages: session.messages.map((m) =>
                  m.id === messageId ? { ...m, ...patch } : m,
                ),
              }
            : session,
        ),
      }));
    },
    [],
  );

  const deleteSession = useCallback((id: string) => {
    setState((s) => ({ ...s, sessions: s.sessions.filter((session) => session.id !== id) }));
  }, []);

  const upsertProject = useCallback((project: CreatorProject) => {
    setState((s) => ({
      ...s,
      projects: s.projects.some((p) => p.id === project.id)
        ? s.projects.map((p) => (p.id === project.id ? project : p))
        : [project, ...s.projects],
    }));
  }, []);

  const upsertPost = useCallback((post: ScheduledPost) => {
    setState((s) => ({
      ...s,
      posts: s.posts.some((p) => p.id === post.id)
        ? s.posts.map((p) => (p.id === post.id ? post : p))
        : [post, ...s.posts],
    }));
  }, []);
  const removePost = useCallback((id: string) => {
    setState((s) => ({ ...s, posts: s.posts.filter((p) => p.id !== id) }));
  }, []);
  const setInbox = useCallback((fn: (m: InboxMessage[]) => InboxMessage[]) => {
    setState((s) => ({ ...s, inbox: fn(s.inbox) }));
  }, []);
  const setCompetitors = useCallback((fn: (c: Competitor[]) => Competitor[]) => {
    setState((s) => ({ ...s, competitors: fn(s.competitors) }));
  }, []);
  const setLinkInBio = useCallback((linkInBio: LinkInBio) => {
    setState((s) => ({ ...s, linkInBio }));
  }, []);

  const toggleSaved = useCallback((item: SavedItem) => {
    setState((s) => ({
      ...s,
      saved: s.saved.some((i) => i.id === item.id)
        ? s.saved.filter((i) => i.id !== item.id)
        : [item, ...s.saved],
    }));
  }, []);

  const removeSaved = useCallback((id: string) => {
    setState((s) => ({ ...s, saved: s.saved.filter((i) => i.id !== id) }));
  }, []);

  const value = useMemo<StudioContextValue>(
    () => ({
      ...state,
      hydrated,
      setModel,
      setBrandKit,
      createSession,
      updateSession,
      appendMessage,
      patchMessage,
      deleteSession,
      upsertProject,
      upsertPost,
      removePost,
      setInbox,
      setCompetitors,
      setLinkInBio,
      toggleSaved,
      removeSaved,
    }),
    [
      state,
      hydrated,
      setModel,
      setBrandKit,
      createSession,
      updateSession,
      appendMessage,
      patchMessage,
      deleteSession,
      upsertProject,
      upsertPost,
      removePost,
      setInbox,
      setCompetitors,
      setLinkInBio,
      toggleSaved,
      removeSaved,
    ],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("useStudio must be used inside StudioProvider");
  return ctx;
}
