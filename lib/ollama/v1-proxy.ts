import { NextResponse } from "next/server";

import { serviceEnv } from "@/lib/monitoring/service-config";
import {
  touchApiKeyLastUsed,
  type VerifiedApiKey,
} from "@/lib/ollama/api-keys";

const ALLOWED_PATHS = new Set([
  "models",
  "chat/completions",
  "completions",
  "embeddings",
]);

function ollamaBaseUrl(): string {
  return serviceEnv.ollamaBaseUrl.replace(/\/$/, "");
}

export function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

export function openaiError(message: string, status: number): NextResponse {
  return NextResponse.json(
    {
      error: {
        message,
        type: status === 401 ? "invalid_request_error" : "api_error",
      },
    },
    { status, headers: corsHeaders() }
  );
}

export function isAllowedV1Path(path: string): boolean {
  return ALLOWED_PATHS.has(path);
}

function parseJsonObject(raw: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }
  return null;
}

function applyModelRestriction(
  path: string,
  body: Record<string, unknown>,
  restrictedModel: string
): string | null {
  if (path === "models") {
    return null;
  }

  const requested = body.model;
  if (typeof requested === "string" && requested && requested !== restrictedModel) {
    return `This API key is restricted to model "${restrictedModel}"`;
  }

  body.model = restrictedModel;
  return null;
}

export async function proxyOllamaV1(options: {
  request: Request;
  path: string;
  search: string;
  key: VerifiedApiKey;
}): Promise<Response> {
  const { request, path, search, key } = options;
  const target = `${ollamaBaseUrl()}/v1/${path}${search}`;
  const method = request.method.toUpperCase();

  let body: string | undefined;
  const headers = new Headers();

  if (method !== "GET" && method !== "HEAD") {
    body = await request.text();
    const contentType = request.headers.get("content-type");
    if (contentType) {
      headers.set("Content-Type", contentType);
    }

    if (key.model) {
      const parsed = parseJsonObject(body);
      if (!parsed) {
        return openaiError("Request body must be JSON", 400);
      }
      const restrictionError = applyModelRestriction(path, parsed, key.model);
      if (restrictionError) {
        return openaiError(restrictionError, 403);
      }
      body = JSON.stringify(parsed);
      headers.set("Content-Type", "application/json");
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method,
      headers,
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(300_000),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Request failed";
    return openaiError(`Cannot reach Ollama (${detail})`, 502);
  }

  void touchApiKeyLastUsed(key.id);

  if (path === "models" && key.model && upstream.ok) {
    const payload = (await upstream.json().catch(() => null)) as {
      data?: Array<{ id?: string }>;
      object?: string;
    } | null;

    const data = (payload?.data ?? []).filter((item) => item.id === key.model);
    return NextResponse.json(
      { object: payload?.object ?? "list", data },
      { headers: corsHeaders() }
    );
  }

  const responseHeaders = new Headers(corsHeaders());
  const contentType = upstream.headers.get("content-type");
  if (contentType) {
    responseHeaders.set("Content-Type", contentType);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}
