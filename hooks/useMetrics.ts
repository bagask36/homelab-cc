import useSWR from "swr";

import type { MetricsResponse } from "@/types/metrics";

const DEFAULT_POLL_INTERVAL = 3000;

async function fetchMetrics(url: string): Promise<MetricsResponse> {
  const response = await fetch(url);

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | MetricsResponse
      | null;

    if (body && body.status === "partial") {
      return body;
    }

    throw new Error(body?.errors?.[0] ?? "Failed to fetch metrics");
  }

  return response.json() as Promise<MetricsResponse>;
}

function getPollInterval(): number {
  const value = Number(process.env.NEXT_PUBLIC_METRICS_POLL_INTERVAL);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_POLL_INTERVAL;
}

export function useMetrics() {
  return useSWR<MetricsResponse>("/api/metrics", fetchMetrics, {
    refreshInterval: getPollInterval(),
    revalidateOnFocus: true,
    keepPreviousData: true,
  });
}
