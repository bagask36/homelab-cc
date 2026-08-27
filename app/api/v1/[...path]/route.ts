import { NextResponse } from "next/server";

import {
  corsHeaders,
  isAllowedV1Path,
  openaiError,
  proxyOllamaV1,
} from "@/lib/ollama/v1-proxy";
import {
  isVerifiedApiKey,
  requireBearerApiKey,
} from "@/lib/auth/require-api-key";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function handle(
  request: Request,
  context: RouteContext
): Promise<Response> {
  const { path: segments } = await context.params;
  const path = segments.join("/");
  const method = request.method.toUpperCase();

  if (!isAllowedV1Path(path)) {
    return openaiError("Not found", 404);
  }

  if (path === "models" && method !== "GET") {
    return openaiError("Method not allowed", 405);
  }

  if (path !== "models" && method !== "POST") {
    return openaiError("Method not allowed", 405);
  }

  const key = await requireBearerApiKey(request);
  if (!isVerifiedApiKey(key)) {
    return key;
  }

  const url = new URL(request.url);
  return proxyOllamaV1({
    request,
    path,
    search: url.search,
    key,
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(request: Request, context: RouteContext) {
  return handle(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return handle(request, context);
}
