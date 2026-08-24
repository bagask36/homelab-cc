function hostDefault(): string {
  return process.env.SERVICE_HOST ?? "host.docker.internal";
}

export const serviceEnv = {
  postgresHost: process.env.POSTGRES_HOST ?? hostDefault(),
  postgresPort: Number(process.env.POSTGRES_PORT ?? "5432"),
  redisHost: process.env.REDIS_HOST ?? hostDefault(),
  redisPort: Number(process.env.REDIS_PORT ?? "6379"),
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? `http://${hostDefault()}:11434`,
  openWebUiUrl: process.env.OPENWEBUI_URL ?? `http://${hostDefault()}:8080`,
  npmUrl: process.env.NPM_URL ?? `http://${hostDefault()}:81`,
  cloudflareTunnelMetricsUrl:
    process.env.CLOUDFLARE_TUNNEL_METRICS_URL ??
    `http://${hostDefault()}:20241/metrics`,
};
