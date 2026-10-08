import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { CAPABILITY_ROUTES, type CapabilityInfo, type CapabilityKey } from "@/lib/types";
import { MOCK_UNAVAILABLE_ROUTES, mockResponse } from "./mock";

/**
 * Server boundary for the Sirius API.
 *
 * The base URL and API key live ONLY on the server (SIRIUS_API_URL / SIRIUS_API_KEY).
 * The browser never sees a provider secret; it calls these server functions instead.
 *
 * TODO(sirius): when the real backend is reachable, remove the mock fallback below.
 */

const invokeSchema = z.object({
  route: z.string().min(1),
  task: z.string().optional(),
  payload: z.record(z.unknown()).default({}),
});

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export type SiriusInvokeResult =
  | { ok: true; mode: "live" | "mock"; data: Json }
  | { ok: false; mode: "live" | "mock"; code: string; message: string };

function serverConfig() {
  const baseUrl = process.env["SIRIUS_API_URL"] ?? "";
  const apiKey = process.env["SIRIUS_API_KEY"] ?? "";
  return { baseUrl: baseUrl.replace(/\/$/, ""), apiKey, live: Boolean(baseUrl) };
}

export const siriusInvoke = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => invokeSchema.parse(data))
  .handler(async ({ data }): Promise<SiriusInvokeResult> => {
    const { baseUrl, apiKey, live } = serverConfig();

    if (!live) {
      // Dev/mock mode: some media routes are intentionally reported as unavailable
      // so the UI never claims media was generated when it was not.
      if (MOCK_UNAVAILABLE_ROUTES.has(data.route)) {
        return {
          ok: false,
          mode: "mock",
          code: "capability_unavailable",
          message: "Bu medya servisi henüz bağlı değil.",
        };
      }
      await new Promise((r) => setTimeout(r, 450));
      return { ok: true, mode: "mock", data: mockResponse(data) as Json };
    }

    try {
      const res = await fetch(`${baseUrl}${data.route}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({ task: data.task, ...data.payload }),
      });

      if (res.status === 404 || res.status === 501) {
        return {
          ok: false,
          mode: "live",
          code: "capability_unavailable",
          message: "Bu servis şu anda kullanılamıyor.",
        };
      }
      if (!res.ok) {
        const body = await res.text();
        return {
          ok: false,
          mode: "live",
          code: `http_${res.status}`,
          message: body.slice(0, 400) || "Sirius servisinden hata döndü.",
        };
      }
      return {
        ok: true,
        mode: "live",
        data: (await res.json()) as Json,
      };
    } catch (error) {
      return {
        ok: false,
        mode: "live",
        code: "network_error",
        message: error instanceof Error ? error.message : "Bağlantı kurulamadı.",
      };
    }
  });

export const siriusHealth = createServerFn({ method: "GET" }).handler(async () => {
  const { baseUrl, apiKey, live } = serverConfig();
  const keys = Object.keys(CAPABILITY_ROUTES) as CapabilityKey[];

  if (!live) {
    const capabilities: CapabilityInfo[] = keys.map((key) => {
      const route = CAPABILITY_ROUTES[key];
      const unavailable = MOCK_UNAVAILABLE_ROUTES.has(route);
      return {
        key,
        route,
        state: unavailable ? "unavailable" : "available",
        ...(unavailable ? { message: "Demo modunda bağlı değil" } : {}),
      };
    });
    return {
      mode: "mock" as const,
      checkedAt: new Date().toISOString(),
      baseUrlConfigured: false,
      capabilities,
    };
  }

  // TODO(sirius): replace with the backend's real capability/health endpoint
  // once it exists (expected: GET /v1/tools or /v1/health).
  let available: string[] | null = null;
  try {
    const res = await fetch(`${baseUrl}/v1/tools`, {
      headers: apiKey ? { authorization: `Bearer ${apiKey}` } : {},
    });
    if (res.ok) {
      const body = (await res.json()) as { tools?: string[]; capabilities?: string[] };
      available = body.tools ?? body.capabilities ?? null;
    }
  } catch {
    available = null;
  }

  const capabilities: CapabilityInfo[] = keys.map((key) => ({
    key,
    route: CAPABILITY_ROUTES[key],
    state: available ? (available.includes(key) ? "available" : "unavailable") : "unknown",
    ...(available ? {} : { message: "Servis durumu doğrulanamadı" }),
  }));

  return {
    mode: "live" as const,
    checkedAt: new Date().toISOString(),
    baseUrlConfigured: true,
    capabilities,
  };
});
