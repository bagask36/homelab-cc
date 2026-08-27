import type { CpuMetrics, MemoryMetrics, MetricsResponse } from "@/types/metrics";
import type { MetricsHistoryRange } from "@/types/metrics-history";
import type { StorageSummary } from "@/types/storage";
import type { StatusLevel } from "@/components/shared/status-indicator";

export function formatPercent(value: number | undefined): string {
  if (value === undefined) return "—";
  return `${value.toFixed(1)}%`;
}

export function formatBytesGB(bytes: number | undefined): string {
  if (bytes === undefined) return "—";
  return (bytes / 1024 ** 3).toFixed(1);
}

export function formatMemorySummary(memory: MemoryMetrics | undefined): string {
  if (!memory) return "— / — GB";
  const summary = `${formatBytesGB(memory.used)} / ${formatBytesGB(memory.total)} GB`;
  if (!memory.cached) return summary;
  return `${summary} · ${formatBytesGB(memory.cached)} GB cache`;
}

export function formatSwapSummary(memory: MemoryMetrics | undefined): string {
  if (!memory || !memory.swapTotal) return "No swap";
  return `${formatBytesGB(memory.swapUsed)} / ${formatBytesGB(memory.swapTotal)} GB`;
}

export function formatStorageSummary(storage: StorageSummary | undefined): string {
  if (!storage) return "— / — GB";
  return `${formatBytesGB(storage.used)} / ${formatBytesGB(storage.total)} GB`;
}

export function formatBytesPerSecond(bytesPerSecond: number | undefined): string {
  if (bytesPerSecond === undefined || !Number.isFinite(bytesPerSecond)) {
    return "—";
  }

  if (bytesPerSecond >= 1024 ** 2) {
    return `${(bytesPerSecond / 1024 ** 2).toFixed(2)} MB/s`;
  }

  if (bytesPerSecond >= 1024) {
    return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  }

  return `${bytesPerSecond.toFixed(0)} B/s`;
}

export function formatBytesCompact(bytes: number | undefined): string {
  if (bytes === undefined) return "—";

  if (bytes >= 1024 ** 4) return `${(bytes / 1024 ** 4).toFixed(2)} TB`;
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export function formatUptime(seconds: number | undefined): string {
  if (seconds === undefined) return "—";

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatTimestamp(iso: string | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatChartAxisLabel(
  iso: string,
  range: MetricsHistoryRange
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  if (range === "7d" || range === "30d") {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }

  if (range === "24h") {
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatLoadAverage(load: CpuMetrics["loadAverage"] | undefined): string {
  if (!load) return "—";
  return load.map((value) => value.toFixed(2)).join(" / ");
}

export function deriveSystemStatus(
  metrics: MetricsResponse | undefined
): StatusLevel {
  if (!metrics || metrics.status === "unavailable") return "unknown";

  const cpu = metrics.cpu?.usage ?? 0;
  const memory = metrics.memory?.usagePercent ?? 0;

  if (cpu >= 95 || memory >= 95) return "critical";
  if (cpu >= 80 || memory >= 85) return "warning";
  if (metrics.status === "ok" || metrics.status === "partial") return "healthy";

  return "unknown";
}

export function deriveSystemStatusLabel(status: StatusLevel): string {
  switch (status) {
    case "healthy":
      return "Healthy";
    case "warning":
      return "Warning";
    case "critical":
      return "Critical";
    default:
      return "Unknown";
  }
}
