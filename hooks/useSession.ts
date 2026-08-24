import useSWR from "swr";

import type { SessionResponse } from "@/types/auth";

async function fetchSession(url: string): Promise<SessionResponse> {
  const response = await fetch(url, { credentials: "same-origin" });
  if (!response.ok) {
    throw new Error("Unauthorized");
  }
  return response.json() as Promise<SessionResponse>;
}

export function useSession() {
  return useSWR<SessionResponse>("/api/auth/me", fetchSession, {
    revalidateOnFocus: true,
    shouldRetryOnError: false,
  });
}
