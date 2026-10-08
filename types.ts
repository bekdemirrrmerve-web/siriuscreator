/**
 * Shared domain types for Sirius Studio.
 * Kept backend-agnostic so a real database/auth layer can be added later.
 */

export type ProductKey = "creator";

/* ------------------------------ capabilities ------------------------------ */

export const CAPABILITY_ROUTES = {
  chat: "/v1/chat",
  generate: "/v1/generate",
  agent: "/v1/agent",
  research: "/v1/research",
  memory: "/v1/memory",
  tools: "/v1/tools",
  "image.create": "/v1/image/create",
  "image.edit": "/v1/image/edit",
  "video.create": "/v1/video/create",
  "audio.create": "/v1/audio/create",
  "avatar.create": "/v1/avatar/create",
  "avatar.talk": "/v1/avatar/talk",
} as const;

export type CapabilityKey = keyof typeof CAPABILITY_ROUTES;

export type CapabilityState = "available" | "unavailable" | "unknown" | "checking";

export type CapabilityInfo = {
  key: CapabilityKey;
  route: string;
  state: CapabilityState;
  message?: string;
};

export type CapabilityReport = {
  mode: "live" | "mock";
  checkedAt: string;
  baseUrlConfigured: boolean;
  capabilities: CapabilityInfo[];
};

/* --------------------------------- chat ---------------------------------- */

export type AttachmentKind = "image" | "file";

export type Attachment = {
  id: string;
  name: string;
  size: number;
  kind: AttachmentKind;
  mimeType: string;
  /** Local object/data URL for preview only. Never sent to a provider directly. */
  previewUrl?: string;
};

export type MessageRole = "user" | "assistant" | "system";

export type MessageStatus = "pending" | "complete" | "error";

export type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  status: MessageStatus;
  attachments?: Attachment[];
  /** Short label of what the assistant did, e.g. "Araştırma" */
  stageLabel?: string;
  errorCode?: string;
};

export type ModelId = "sirius-1-pro" | "sirius-1-flash" | "sirius-1-research";

export type ModelOption = {
  id: ModelId;
  name: string;
  description: string;
};

export type Session = {
  id: string;
  product: ProductKey;
  title: string;
  createdAt: string;
  updatedAt: string;
  model: ModelId;
  messages: ChatMessage[];
  /** Linked artifact id (creator project or trip) */
  artifactId?: string;
};

/* -------------------------------- creator -------------------------------- */

export type Platform = "instagram" | "tiktok" | "youtube" | "x" | "linkedin" | "pinterest";

export type ContentFormat =
  | "reels"
  | "tiktok"
  | "carousel"
  | "story"
  | "short"
  | "product-ad"
  | "ugc"
  | "educational";

export type Tone = "samimi" | "profesyonel" | "esprili" | "ilham-verici" | "bilgilendirici";

export type ShotListItem = {
  id: string;
  timecode: string;
  visual: string;
  action: string;
};

export type ContentStageKey =
  | "research"
  | "hook"
  | "script"
  | "shotlist"
  | "caption"
  | "cta"
  | "hashtags"
  | "imagePrompts"
  | "voiceover";

export type ContentStage = {
  key: ContentStageKey;
  title: string;
  status: "idle" | "running" | "done" | "error";
  /** Editable text output. Shot list is serialized as lines. */
  content: string;
};

export type GenerationJobKind = "image" | "image-edit" | "video" | "audio" | "avatar";

export type GenerationJob = {
  id: string;
  kind: GenerationJobKind;
  prompt: string;
  status: "queued" | "running" | "done" | "error" | "unavailable";
  createdAt: string;
  resultUrl?: string;
  message?: string;
};

export type BrandKit = {
  brandVoice: string;
  audience: string;
  colors: string[];
  forbiddenTerms: string[];
  preferredCta: string;
  keyMessages?: string[];
  description?: string;
};

export type CreatorProject = {
  id: string;
  title: string;
  idea: string;
  platform: Platform;
  format: ContentFormat;
  language: string;
  tone: Tone;
  createdAt: string;
  updatedAt: string;
  stages: ContentStage[];
  jobs: GenerationJob[];
  repurposed?: { label: string; content: string }[];
  calendar?: { day: string; item: string }[];
};

/* --------------------------------- saved ---------------------------------- */

export type SavedItem = {
  id: string;
  product: ProductKey;
  label: string;
  content: string;
  createdAt: string;
};

/* ------------------------------- planning -------------------------------- */

export type PostStatus = "draft" | "scheduled" | "published" | "failed";

export type ScheduledPost = {
  id: string;
  platform: Platform;
  /** ISO datetime */
  scheduledAt: string;
  caption: string;
  mediaName?: string;
  status: PostStatus;
  demo?: boolean;
};

export type InboxMessage = {
  id: string;
  platform: Platform;
  kind: "comment" | "dm";
  author: string;
  handle: string;
  text: string;
  postRef?: string;
  createdAt: string;
  read: boolean;
  replied: boolean;
  reply?: string;
};

export type Competitor = {
  id: string;
  handle: string;
  platform: Platform;
  followers: number;
  avgEngagement: number;
  postsPerWeek: number;
  topFormat: string;
  demo?: boolean;
};

export type LinkInBio = {
  title: string;
  bio: string;
  links: { id: string; label: string; url: string }[];
};
