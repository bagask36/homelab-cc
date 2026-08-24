import useSWR from "swr";

import {
  fetchMonitoring,
  getPollInterval,
} from "@/lib/api/fetch-monitoring";
import type { OllamaResponse } from "@/types/ollama";

export function useOllama() {
  return useSWR<OllamaResponse>("/api/ollama", fetchMonitoring, {
    refreshInterval: getPollInterval(),
    revalidateOnFocus: true,
    keepPreviousData: true,
  });
}
