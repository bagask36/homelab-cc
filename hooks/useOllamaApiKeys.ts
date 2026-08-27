import useSWR from "swr";

import { fetchMonitoring } from "@/lib/api/fetch-monitoring";
import type { ApiKeyListResponse } from "@/types/api-key";

export function useOllamaApiKeys() {
  return useSWR<ApiKeyListResponse>("/api/ollama/keys", fetchMonitoring, {
    revalidateOnFocus: true,
    keepPreviousData: true,
  });
}
