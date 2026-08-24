import useSWR from "swr";

import {
  fetchMonitoring,
  getPollInterval,
} from "@/lib/api/fetch-monitoring";
import type { ServicesResponse } from "@/types/service";

export function useServices() {
  return useSWR<ServicesResponse>("/api/services", fetchMonitoring, {
    refreshInterval: getPollInterval(),
    revalidateOnFocus: true,
    keepPreviousData: true,
  });
}
