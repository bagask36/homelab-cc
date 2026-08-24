import useSWR from "swr";

import {
  fetchMonitoring,
  getPollInterval,
} from "@/lib/api/fetch-monitoring";
import type { AlertsResponse } from "@/types/alert";

export function useAlerts() {
  return useSWR<AlertsResponse>("/api/alerts", fetchMonitoring, {
    refreshInterval: getPollInterval(),
    revalidateOnFocus: true,
    keepPreviousData: true,
  });
}
