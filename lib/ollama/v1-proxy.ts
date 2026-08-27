import { NextResponse } from "next/server";

import { serviceEnv } from "@/lib/monitoring/service-config";
import {
  recordApiKeyUsage,
  touchApiKeyLastUsed,
  type ApiKeyTokenUsage,
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

function extractUsage(payload: Record<string, unknown> | null): ApiKeyTokenUsage | null {
  if (!payload) return null;
  const usage = payload.usage;
  if (!usage || typeof usage !== "object" || Array.isArray(usage)) {
    return null;
  }

  const record = usage as Record<string, unknown>;
  const promptTokens = Number(record.prompt_tokens ?? 0);
  const completionTokens = Number(record.completion_tokens ?? 0);
  const totalTokens = Number(
    record.total_tokens ?? promptTokens + completionTokens
  );

  if (
    !Number.isFinite(promptTokens) ||
    !Number.isFinite(completionTokens) ||
    !Number.isFinite(totalTokens)
  ) {
    return null;
  }

  if (promptTokens <= 0 && completionTokens <= 0 && totalTokens <= 0) {
    return null;
  }

  return {
    promptTokens: Math.max(0, promptTokens),
    completionTokens: Math.max(0, completionTokens),
    totalTokens: Math.max(0, totalTokens),
  };
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

function trackUsageFromSseStream(
  keyId: string,
  upstream: ReadableStream<Uint8Array>
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  let buffer = "";
  let recorded = false;
  const reader = upstream.getReader();

  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }

      controller.enqueue(value);
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      if (recorded) return;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (!data || data === "[DONE]") continue;

        const usage = extractUsage(parseJsonObject(data));
        if (usage) {
          recorded = true;
          void recordApiKeyUsage(keyId, usage);
          break;
        }
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
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

    const parsed = parseJsonObject(body);
    let bodyChanged = false;

    if (key.model) {
      if (!parsed) {
        return openaiError("Request body must be JSON", 400);
      }
      const restrictionError = applyModelRestriction(path, parsed, key.model);
      if (restrictionError) {
        return openaiError(restrictionError, 403);
      }
      bodyChanged = true;
    }

    // Ask upstream for usage on the final SSE chunk when streaming.
    if (
      parsed &&
      parsed.stream === true &&
      (path === "chat/completions" || path === "completions")
    ) {
      const existing =
        parsed.stream_options &&
        typeof parsed.stream_options === "object" &&
        !Array.isArray(parsed.stream_options)
          ? (parsed.stream_options as Record<string, unknown>)
          : {};
      parsed.stream_options = { ...existing, include_usage: true };
      bodyChanged = true;
    }

    if (parsed && bodyChanged) {
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

  const isEventStream = contentType?.includes("text/event-stream") ?? false;
  const shouldTrackTokens =
    upstream.ok &&
    (path === "chat/completions" ||
      path === "completions" ||
      path === "embeddings");

  if (shouldTrackTokens && isEventStream && upstream.body) {
    return new Response(trackUsageFromSseStream(key.id, upstream.body), {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  }

  if (shouldTrackTokens && !isEventStream) {
    const text = await upstream.text();
    const usage = extractUsage(parseJsonObject(text));
    if (usage) {
      void recordApiKeyUsage(key.id, usage);
    }

    return new Response(text, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}
