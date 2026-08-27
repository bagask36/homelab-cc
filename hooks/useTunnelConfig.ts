import useSWR from "swr";

import {
  fetchMonitoring,
  getPollInterval,
} from "@/lib/api/fetch-monitoring";
import type { TunnelConfigResponse } from "@/types/tunnel-config";

export function useTunnelConfig() {
  return useSWR<TunnelConfigResponse>(
    "/api/tunnel/config",
    fetchMonitoring,
    {
      refreshInterval: getPollInterval() * 2,
      revalidateOnFocus: true,
      keepPreviousData: true,
    }
  );
}
