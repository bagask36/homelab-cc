import useSWR from "swr";

import {
  fetchMonitoring,
  getPollInterval,
} from "@/lib/api/fetch-monitoring";
import type { StorageResponse } from "@/types/storage";

export function useStorage() {
  return useSWR<StorageResponse>("/api/storage", fetchMonitoring, {
    refreshInterval: getPollInterval(),
    revalidateOnFocus: true,
    keepPreviousData: true,
  });
}
