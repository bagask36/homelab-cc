import useSWR from "swr";

import {
  fetchMonitoring,
  getPollInterval,
} from "@/lib/api/fetch-monitoring";
import type { NetworkResponse } from "@/types/network";

export function useNetwork() {
  return useSWR<NetworkResponse>("/api/network", fetchMonitoring, {
    refreshInterval: getPollInterval(),
    revalidateOnFocus: true,
    keepPreviousData: true,
  });
}
