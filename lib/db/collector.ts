import { getCpuMetrics } from "@/lib/monitoring/cpu";
import { getMemoryMetrics } from "@/lib/monitoring/memory";
import { getNetworkMetrics } from "@/lib/monitoring/network";
import { getStorageMetrics } from "@/lib/monitoring/storage";

import { getPrisma, isDatabaseConfigured } from "./prisma";

const COLLECTOR_INTERVAL_MS = 30_000;
const RETENTION_DAYS = 30;
const RETENTION_CHECK_INTERVAL_MS = 60 * 60 * 1000;

let collectorTimer: ReturnType<typeof setInterval> | null = null;
let previousNetwork:
  | {
      rxBytes: number;
      txBytes: number;
      timestamp: number;
    }
  | null = null;

export function startMetricsCollector(): void {
  if (!isDatabaseConfigured() || collectorTimer) {
    return;
  }

  void collectSnapshot();

  collectorTimer = setInterval(() => {
    void collectSnapshot();
  }, COLLECTOR_INTERVAL_MS);

  setInterval(() => {
    void pruneOldSnapshots();
  }, RETENTION_CHECK_INTERVAL_MS);
}

async function collectSnapshot(): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;

  try {
    const [cpuResult, memoryResult, storageResult, networkResult] =
      await Promise.allSettled([
        getCpuMetrics(),
        getMemoryMetrics(),
        getStorageMetrics(),
        getNetworkMetrics(),
      ]);

    if (cpuResult.status === "rejected" || memoryResult.status === "rejected") {
      return;
    }

    const storageUsage =
      storageResult.status === "fulfilled"
        ? storageResult.value.summary.usagePercent
        : null;

    let networkRxRate: number | null = null;
    let networkTxRate: number | null = null;

    if (networkResult.status === "fulfilled") {
      const now = Date.now();
      const { rxBytes, txBytes } = networkResult.value.totals;

      if (previousNetwork) {
        const elapsedSeconds = (now - previousNetwork.timestamp) / 1000;
        if (elapsedSeconds > 0) {
          networkRxRate = Math.max(
            0,
            (rxBytes - previousNetwork.rxBytes) / elapsedSeconds
          );
          networkTxRate = Math.max(
            0,
            (txBytes - previousNetwork.txBytes) / elapsedSeconds
          );
        }
      }

      previousNetwork = { rxBytes, txBytes, timestamp: now };
    }

    await prisma.metricSnapshot.create({
      data: {
        cpuUsage: cpuResult.value.usage,
        memoryUsage: memoryResult.value.usagePercent,
        storageUsage,
        networkRxRate,
        networkTxRate,
      },
    });
  } catch (error) {
    console.error(
      "[metrics-collector] Failed to store snapshot:",
      error instanceof Error ? error.message : error
    );
  }
}

async function pruneOldSnapshots(): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;

  try {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

    await prisma.metricSnapshot.deleteMany({
      where: {
        timestamp: {
          lt: cutoff,
        },
      },
    });
  } catch (error) {
    console.error(
      "[metrics-collector] Failed to prune old snapshots:",
      error instanceof Error ? error.message : error
    );
  }
}
