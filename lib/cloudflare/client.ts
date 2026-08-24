import { serviceEnv } from "@/lib/monitoring/service-config";
import { probeHttp } from "@/lib/monitoring/health";

export type CloudflareTunnelHealth = {
  online: boolean;
  responseTimeMs: number | null;
  message: string;
};

export async function getCloudflareTunnelHealth(): Promise<CloudflareTunnelHealth> {
  const metricsResult = await probeHttp(serviceEnv.cloudflareTunnelMetricsUrl);

  if (metricsResult.ok) {
    return {
      online: true,
      responseTimeMs: metricsResult.responseTimeMs,
      message: "Metrics endpoint reachable",
    };
  }

  return {
    online: false,
    responseTimeMs: metricsResult.responseTimeMs,
    message: metricsResult.message,
  };
}
