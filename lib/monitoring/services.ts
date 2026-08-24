import { serviceEnv } from "@/lib/monitoring/service-config";
import { probeHttp, probeRedis, probeTcp } from "@/lib/monitoring/health";
import { getOllamaHealth } from "@/lib/ollama/client";
import { getCloudflareTunnelHealth } from "@/lib/cloudflare/client";
import { isDockerAvailable } from "@/lib/docker/client";
import type { ServiceHealth } from "@/types/service";

export async function getServicesHealth(): Promise<ServiceHealth[]> {
  const checks = await Promise.allSettled([
    checkDocker(),
    checkPostgreSQL(),
    checkRedis(),
    checkOllama(),
    checkOpenWebUI(),
    checkCloudflareTunnel(),
    checkNginxProxyManager(),
  ]);

  return checks.map((result, index) => {
    const names = [
      "Docker",
      "PostgreSQL",
      "Redis",
      "Ollama",
      "Open WebUI",
      "Cloudflare Tunnel",
      "Nginx Proxy Manager",
    ];
    const ids = [
      "docker",
      "postgresql",
      "redis",
      "ollama",
      "open-webui",
      "cloudflare-tunnel",
      "nginx-proxy-manager",
    ];

    if (result.status === "fulfilled") {
      return result.value;
    }

    return {
      id: ids[index] ?? `service-${index}`,
      name: names[index] ?? "Unknown",
      status: "unknown" as const,
      responseTimeMs: null,
      message:
        result.reason instanceof Error
          ? result.reason.message
          : "Health check failed",
    };
  });
}

async function checkDocker(): Promise<ServiceHealth> {
  const start = Date.now();
  const ok = await isDockerAvailable();

  return buildResult("docker", "Docker", ok, Date.now() - start, ok ? "Daemon reachable" : "Daemon unavailable");
}

async function checkPostgreSQL(): Promise<ServiceHealth> {
  const result = await probeTcp(
    serviceEnv.postgresHost,
    serviceEnv.postgresPort
  );

  return buildResult(
    "postgresql",
    "PostgreSQL",
    result.ok,
    result.responseTimeMs,
    result.message
  );
}

async function checkRedis(): Promise<ServiceHealth> {
  const result = await probeRedis(serviceEnv.redisHost, serviceEnv.redisPort);

  return buildResult(
    "redis",
    "Redis",
    result.ok,
    result.responseTimeMs,
    result.message
  );
}

async function checkOllama(): Promise<ServiceHealth> {
  const health = await getOllamaHealth();

  return buildResult(
    "ollama",
    "Ollama",
    health.online,
    health.responseTimeMs,
    health.online
      ? `${health.models.length} model(s) available`
      : health.message
  );
}

async function checkOpenWebUI(): Promise<ServiceHealth> {
  const result = await probeHttp(serviceEnv.openWebUiUrl);

  return buildResult(
    "open-webui",
    "Open WebUI",
    result.ok,
    result.responseTimeMs,
    result.message
  );
}

async function checkCloudflareTunnel(): Promise<ServiceHealth> {
  const health = await getCloudflareTunnelHealth();

  return buildResult(
    "cloudflare-tunnel",
    "Cloudflare Tunnel",
    health.online,
    health.responseTimeMs,
    health.message
  );
}

async function checkNginxProxyManager(): Promise<ServiceHealth> {
  const result = await probeHttp(serviceEnv.npmUrl);

  return buildResult(
    "nginx-proxy-manager",
    "Nginx Proxy Manager",
    result.ok,
    result.responseTimeMs,
    result.message
  );
}

function buildResult(
  id: string,
  name: string,
  ok: boolean,
  responseTimeMs: number | null,
  message: string
): ServiceHealth {
  return {
    id,
    name,
    status: ok ? "healthy" : "down",
    responseTimeMs:
      responseTimeMs === null ? null : round(responseTimeMs),
    message,
  };
}

function round(value: number): number {
  return Math.round(value);
}
