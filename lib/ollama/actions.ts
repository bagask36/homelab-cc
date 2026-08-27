import { serviceEnv } from "@/lib/monitoring/service-config";
import type { OllamaRunRequest } from "@/types/ollama-control";

export class OllamaActionError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function baseUrl(): string {
  return serviceEnv.ollamaBaseUrl.replace(/\/$/, "");
}

type GenerateResult = {
  response: string;
  responseTimeMs: number;
};

/**
 * Load a model into memory and optionally run a prompt.
 * Uses Ollama POST /api/generate (stream: false).
 */
export async function runOllamaModel(
  request: OllamaRunRequest
): Promise<GenerateResult & { message: string }> {
  const model = request.model.trim();
  if (!model) {
    throw new OllamaActionError("Model name is required");
  }

  const prompt = request.prompt ?? "";
  const keepAlive = request.keepAlive ?? (prompt ? undefined : -1);
  const start = Date.now();

  const body: Record<string, unknown> = {
    model,
    prompt,
    stream: false,
  };

  if (keepAlive !== undefined) {
    body.keep_alive = keepAlive;
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl()}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(prompt ? 180_000 : 120_000),
      cache: "no-store",
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Request failed";
    throw new OllamaActionError(
      `Cannot reach Ollama at ${baseUrl()} (${detail})`,
      503
    );
  }

  const responseTimeMs = Date.now() - start;

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new OllamaActionError(
      text || `Ollama returned HTTP ${response.status}`,
      response.status >= 400 && response.status < 600 ? response.status : 502
    );
  }

  const data = (await response.json()) as { response?: string };

  return {
    response: data.response ?? "",
    responseTimeMs,
    message: prompt
      ? `Ran ${model}`
      : `Loaded ${model} into memory`,
  };
}

/**
 * Unload a model from memory (keep_alive: 0).
 */
export async function stopOllamaModel(
  modelName: string
): Promise<{ message: string; responseTimeMs: number }> {
  const model = modelName.trim();
  if (!model) {
    throw new OllamaActionError("Model name is required");
  }

  const start = Date.now();

  let response: Response;
  try {
    response = await fetch(`${baseUrl()}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: "",
        stream: false,
        keep_alive: 0,
      }),
      signal: AbortSignal.timeout(30_000),
      cache: "no-store",
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Request failed";
    throw new OllamaActionError(
      `Cannot reach Ollama at ${baseUrl()} (${detail})`,
      503
    );
  }

  const responseTimeMs = Date.now() - start;

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new OllamaActionError(
      text || `Ollama returned HTTP ${response.status}`,
      response.status >= 400 && response.status < 600 ? response.status : 502
    );
  }

  return {
    message: `Unloaded ${model}`,
    responseTimeMs,
  };
}
