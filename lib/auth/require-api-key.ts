import { NextResponse } from "next/server";

import { openaiError } from "@/lib/ollama/v1-proxy";
import { verifyApiKey, type VerifiedApiKey } from "@/lib/ollama/api-keys";

export async function requireBearerApiKey(
  request: Request
): Promise<VerifiedApiKey | NextResponse> {
  const header = request.headers.get("authorization");
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    return openaiError("Missing API key", 401);
  }

  const token = header.slice("bearer ".length).trim();
  const key = await verifyApiKey(token);
  if (!key) {
    return openaiError("Invalid API key", 401);
  }

  return key;
}

export function isVerifiedApiKey(
  value: VerifiedApiKey | NextResponse
): value is VerifiedApiKey {
  return !(value instanceof NextResponse);
}
