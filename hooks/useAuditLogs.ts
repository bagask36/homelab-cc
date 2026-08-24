import useSWR from "swr";

import type { AuditLogsResponse } from "@/types/audit";

async function fetchAuditLogs(url: string): Promise<AuditLogsResponse> {
  const response = await fetch(url, { credentials: "same-origin" });

  if (!response.ok) {
    throw new Error("Failed to load audit logs");
  }

  return response.json() as Promise<AuditLogsResponse>;
}

export function useAuditLogs(limit = 50) {
  return useSWR<AuditLogsResponse>(`/api/audit?limit=${limit}`, fetchAuditLogs, {
    revalidateOnFocus: true,
    keepPreviousData: true,
  });
}
