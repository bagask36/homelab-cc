import useSWR from "swr";

import { fetchMonitoring } from "@/lib/api/fetch-monitoring";
import type {
  MetricsHistoryRange,
  MetricsHistoryResponse,
} from "@/types/metrics-history";

const HISTORY_REFRESH_MS = 60_000;

export function useMetricsHistory(range: MetricsHistoryRange) {
  const isHistorical = range !== "live";

  return useSWR<MetricsHistoryResponse>(
    isHistorical ? `/api/metrics/history?range=${range}` : null,
    fetchMonitoring,
    {
      refreshInterval: HISTORY_REFRESH_MS,
      revalidateOnFocus: true,
      keepPreviousData: true,
    }
  );
}
