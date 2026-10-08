import { siriusHealth, siriusInvoke, type SiriusInvokeResult } from "./api.functions";
import { CAPABILITY_ROUTES, type CapabilityKey, type CapabilityReport } from "@/lib/types";

/**
 * Typed browser-side wrappers around the Sirius server boundary.
 * No API key or base URL ever reaches this file.
 */

export class SiriusError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "SiriusError";
  }
}

async function call<T>(
  capability: CapabilityKey,
  task: string | undefined,
  payload: Record<string, unknown>,
): Promise<T> {
  let result: SiriusInvokeResult;
  try {
    result = (await siriusInvoke({
      data: { route: CAPABILITY_ROUTES[capability], task, payload },
    })) as SiriusInvokeResult;
  } catch (error) {
    throw new SiriusError(
      "network_error",
      error instanceof Error ? error.message : "Sirius servisine ulaşılamadı.",
    );
  }
  if (!result.ok) throw new SiriusError(result.code, result.message);
  return result.data as T;
}

export const sirius = {
  health: (): Promise<CapabilityReport> => siriusHealth() as Promise<CapabilityReport>,

  chat: (payload: { message: string; product: string; model: string; context?: unknown }) =>
    call<{ message: string }>("chat", "chat", payload),

  researchTrends: (payload: { prompt: string; platform?: string }) =>
    call<{ trends: { title: string; why: string }[]; keywords: string[] }>(
      "research",
      "creator.trends",
      payload,
    ),

  creatorPackage: (payload: Record<string, unknown>) =>
    call<Record<string, string>>("generate", "creator.package", payload),

  creatorHooks: (payload: { prompt: string }) =>
    call<{ hooks: string[] }>("generate", "creator.hooks", payload),

  creatorRepurpose: (payload: { idea: string }) =>
    call<{ variants: { label: string; content: string }[] }>(
      "generate",
      "creator.repurpose",
      payload,
    ),

  creatorCalendar: (payload: { idea: string }) =>
    call<{ calendar: { day: string; item: string }[] }>("generate", "creator.calendar", payload),


  saveMemory: (payload: Record<string, unknown>) => call<{ ok: boolean }>("memory", "save", payload),

  createImage: (payload: { prompt: string }) =>
    call<{ resultUrl: string | null; message?: string; demo?: boolean }>(
      "image.create",
      "image.create",
      payload,
    ),

  editImage: (payload: { prompt: string; sourceName?: string }) =>
    call<{ resultUrl: string | null; message?: string; demo?: boolean }>(
      "image.edit",
      "image.edit",
      payload,
    ),

  createVideo: (payload: { prompt: string }) =>
    call<{ resultUrl: string | null; message?: string }>("video.create", "video.create", payload),

  createAudio: (payload: { prompt: string }) =>
    call<{ resultUrl: string | null; message?: string; demo?: boolean }>(
      "audio.create",
      "audio.create",
      payload,
    ),

  createAvatar: (payload: { prompt: string }) =>
    call<{ resultUrl: string | null; message?: string }>("avatar.create", "avatar.create", payload),

  talkAvatar: (payload: { prompt: string }) =>
    call<{ resultUrl: string | null; message?: string }>("avatar.talk", "avatar.talk", payload),
};
