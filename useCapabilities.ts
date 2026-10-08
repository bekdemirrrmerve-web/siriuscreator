import { useQuery } from "@tanstack/react-query";

import { sirius } from "@/lib/sirius/client";
import type { CapabilityKey, CapabilityReport, CapabilityState } from "@/lib/types";

/** Lightweight capability registry backed by the Sirius health check. */
export function useCapabilities() {
  const query = useQuery<CapabilityReport>({
    queryKey: ["sirius", "health"],
    queryFn: () => sirius.health(),
    staleTime: 60_000,
    retry: 1,
  });

  const stateOf = (key: CapabilityKey): CapabilityState => {
    if (query.isPending) return "checking";
    if (query.isError || !query.data) return "unknown";
    return query.data.capabilities.find((c) => c.key === key)?.state ?? "unknown";
  };

  const isAvailable = (key: CapabilityKey) => stateOf(key) === "available";

  return {
    report: query.data,
    mode: query.data?.mode ?? "mock",
    isLoading: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
    stateOf,
    isAvailable,
  };
}
