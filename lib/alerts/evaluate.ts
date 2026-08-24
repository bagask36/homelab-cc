import { getCloudflareTunnelHealth } from "@/lib/cloudflare/client";
import { getDockerMetrics } from "@/lib/docker/containers";
import { getServicesHealth } from "@/lib/monitoring/services";
import { getStorageMetrics } from "@/lib/monitoring/storage";
import { getSystemMetrics } from "@/lib/monitoring/system";
import {
  ALERT_THRESHOLDS,
  resolveThresholdSeverity,
} from "@/lib/alerts/thresholds";
import type { Alert, AlertsResponse, AlertsSummary } from "@/types/alert";

export async function getAlerts(): Promise<AlertsResponse> {
  const timestamp = new Date().toISOString();
  const errors: string[] = [];
  const alerts: Alert[] = [];

  const [metricsResult, storageResult, dockerResult, servicesResult, tunnelResult] =
    await Promise.allSettled([
      getSystemMetrics(),
      getStorageMetrics(),
      getDockerMetrics(),
      getServicesHealth(),
      getCloudflareTunnelHealth(),
    ]);

  if (metricsResult.status === "fulfilled") {
    alerts.push(...evaluateResourceAlerts(metricsResult.value));
  } else {
    errors.push(
      metricsResult.reason instanceof Error
        ? metricsResult.reason.message
        : "System metrics unavailable"
    );
  }

  if (storageResult.status === "fulfilled") {
    alerts.push(...evaluateStorageAlerts(storageResult.value.summary.usagePercent));
  } else {
    errors.push(
      storageResult.reason instanceof Error
        ? storageResult.reason.message
        : "Storage metrics unavailable"
    );
  }

  if (dockerResult.status === "fulfilled") {
    alerts.push(...evaluateContainerAlerts(dockerResult.value.containers));
  } else {
    errors.push(
      dockerResult.reason instanceof Error
        ? dockerResult.reason.message
        : "Docker metrics unavailable"
    );
  }

  if (servicesResult.status === "fulfilled") {
    alerts.push(...evaluateServiceAlerts(servicesResult.value));
  } else {
    errors.push(
      servicesResult.reason instanceof Error
        ? servicesResult.reason.message
        : "Service health unavailable"
    );
  }

  if (tunnelResult.status === "fulfilled") {
    alerts.push(...evaluateTunnelAlerts(tunnelResult.value));
  } else {
    errors.push(
      tunnelResult.reason instanceof Error
        ? tunnelResult.reason.message
        : "Tunnel health unavailable"
    );
  }

  const sortedAlerts = sortAlerts(alerts);
  const summary = summarizeAlerts(sortedAlerts);
  const hasData = sortedAlerts.length > 0 || errors.length === 0;
  const status =
    errors.length === 0 ? "ok" : hasData ? "partial" : "unavailable";

  return {
    status,
    timestamp,
    summary,
    alerts: sortedAlerts,
    errors: errors.length > 0 ? errors : undefined,
  };
}

function evaluateResourceAlerts(
  metrics: Awaited<ReturnType<typeof getSystemMetrics>>
): Alert[] {
  const alerts: Alert[] = [];

  if (metrics.cpu?.usage !== undefined) {
    const severity = resolveThresholdSeverity(
      metrics.cpu.usage,
      ALERT_THRESHOLDS.cpu
    );

    if (severity) {
      alerts.push({
        id: "cpu-usage",
        type: "cpu",
        severity,
        title: severity === "critical" ? "CPU critical" : "CPU warning",
        message: `CPU usage is ${metrics.cpu.usage.toFixed(1)}%`,
        source: "system",
      });
    }
  }

  if (metrics.memory?.usagePercent !== undefined) {
    const severity = resolveThresholdSeverity(
      metrics.memory.usagePercent,
      ALERT_THRESHOLDS.memory
    );

    if (severity) {
      alerts.push({
        id: "memory-usage",
        type: "memory",
        severity,
        title: severity === "critical" ? "Memory critical" : "Memory warning",
        message: `Memory usage is ${metrics.memory.usagePercent.toFixed(1)}%`,
        source: "system",
      });
    }
  }

  return alerts;
}

function evaluateStorageAlerts(usagePercent: number): Alert[] {
  const severity = resolveThresholdSeverity(
    usagePercent,
    ALERT_THRESHOLDS.storage
  );

  if (!severity) {
    return [];
  }

  return [
    {
      id: "storage-usage",
      type: "storage",
      severity,
      title: severity === "critical" ? "Storage critical" : "Storage warning",
      message: `Storage usage is ${usagePercent.toFixed(1)}%`,
      source: "system",
    },
  ];
}

function evaluateContainerAlerts(
  containers: Awaited<ReturnType<typeof getDockerMetrics>>["containers"]
): Alert[] {
  return containers
    .filter((container) => container.health === "unhealthy")
    .map((container) => ({
      id: `container-${container.id}`,
      type: "container" as const,
      severity: "critical" as const,
      title: "Container unhealthy",
      message: `${container.name} is unhealthy`,
      source: container.name,
    }));
}

function evaluateServiceAlerts(
  services: Awaited<ReturnType<typeof getServicesHealth>>
): Alert[] {
  const alerts: Alert[] = [];

  for (const service of services) {
    if (service.status === "down") {
      alerts.push({
        id: `service-${service.id}`,
        type: "service",
        severity: "critical",
        title: "Service down",
        message: service.message,
        source: service.name,
      });
      continue;
    }

    if (service.status === "degraded") {
      alerts.push({
        id: `service-${service.id}`,
        type: "service",
        severity: "warning",
        title: "Service degraded",
        message: service.message,
        source: service.name,
      });
    }
  }

  return alerts;
}

function evaluateTunnelAlerts(
  tunnel: Awaited<ReturnType<typeof getCloudflareTunnelHealth>>
): Alert[] {
  if (tunnel.online) {
    return [];
  }

  return [
    {
      id: "tunnel-disconnected",
      type: "tunnel",
      severity: "critical",
      title: "Tunnel disconnected",
      message: tunnel.message,
      source: "Cloudflare Tunnel",
    },
  ];
}

function sortAlerts(alerts: Alert[]): Alert[] {
  const severityRank = { critical: 0, warning: 1 };

  return [...alerts].sort((left, right) => {
    const severityDiff =
      severityRank[left.severity] - severityRank[right.severity];
    if (severityDiff !== 0) return severityDiff;
    return left.title.localeCompare(right.title);
  });
}

function summarizeAlerts(alerts: Alert[]): AlertsSummary {
  return alerts.reduce(
    (summary, alert) => {
      summary.total += 1;
      summary[alert.severity] += 1;
      return summary;
    },
    { total: 0, critical: 0, warning: 0 }
  );
}
