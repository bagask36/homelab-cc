import useSWR from "swr";

import {
  fetchMonitoring,
  getPollInterval,
} from "@/lib/api/fetch-monitoring";
import type { TunnelResponse } from "@/types/tunnel";

export function useTunnel() {
  return useSWR<TunnelResponse>("/api/tunnel", fetchMonitoring, {
    refreshInterval: getPollInterval(),
    revalidateOnFocus: true,
    keepPreviousData: true,
  });
}
