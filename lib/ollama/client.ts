import { serviceEnv } from "@/lib/monitoring/service-config";

type OllamaTagsResponse = {
  models?: Array<{
    name: string;
    size?: number;
    modified_at?: string;
  }>;
};

export type OllamaHealth = {
  online: boolean;
  responseTimeMs: number | null;
  message: string;
  models: Array<{ name: string; size?: number; modifiedAt?: string }>;
  runningModels: string[];
};

export async function getOllamaHealth(): Promise<OllamaHealth> {
  const baseUrl = serviceEnv.ollamaBaseUrl.replace(/\/$/, "");
  const start = Date.now();

  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });

    const responseTimeMs = Date.now() - start;

    if (!response.ok) {
      return {
        online: false,
        responseTimeMs,
        message: `HTTP ${response.status}`,
        models: [],
        runningModels: [],
      };
    }

    const data = (await response.json()) as OllamaTagsResponse;
    const models =
      data.models?.map((model) => ({
        name: model.name,
        size: model.size,
        modifiedAt: model.modified_at,
      })) ?? [];

    const runningModels = await getRunningModels(baseUrl).catch(() => []);

    return {
      online: true,
      responseTimeMs,
      message: `${models.length} model(s) available`,
      models,
      runningModels,
    };
  } catch (error) {
    return {
      online: false,
      responseTimeMs: Date.now() - start,
      message: error instanceof Error ? error.message : "Ollama unavailable",
      models: [],
      runningModels: [],
    };
  }
}

async function getRunningModels(baseUrl: string): Promise<string[]> {
  const response = await fetch(`${baseUrl}/api/ps`, {
    signal: AbortSignal.timeout(3000),
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as {
    models?: Array<{ name: string }>;
  };

  return data.models?.map((model) => model.name) ?? [];
}
