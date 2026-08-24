import type { PrismaClient } from "@/lib/generated/prisma/client";
import type {
  MetricsHistoryRange,
  MetricsHistorySnapshot,
} from "@/types/metrics-history";

const RANGE_CONFIG: Record<
  Exclude<MetricsHistoryRange, "live">,
  { durationMs: number; bucketMs: number; maxPoints: number }
> = {
  "1h": {
    durationMs: 60 * 60 * 1000,
    bucketMs: 30 * 1000,
    maxPoints: 120,
  },
  "6h": {
    durationMs: 6 * 60 * 60 * 1000,
    bucketMs: 3 * 60 * 1000,
    maxPoints: 120,
  },
  "24h": {
    durationMs: 24 * 60 * 60 * 1000,
    bucketMs: 12 * 60 * 1000,
    maxPoints: 120,
  },
  "7d": {
    durationMs: 7 * 24 * 60 * 60 * 1000,
    bucketMs: 60 * 60 * 1000,
    maxPoints: 168,
  },
  "30d": {
    durationMs: 30 * 24 * 60 * 60 * 1000,
    bucketMs: 6 * 60 * 60 * 1000,
    maxPoints: 120,
  },
};

type RawSnapshot = {
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: number;
  storageUsage: number | null;
  networkRxRate: number | null;
  networkTxRate: number | null;
};

export async function getMetricsHistory(
  prisma: PrismaClient,
  range: Exclude<MetricsHistoryRange, "live">
): Promise<MetricsHistorySnapshot[]> {
  const config = RANGE_CONFIG[range];
  const since = new Date(Date.now() - config.durationMs);

  const snapshots = await prisma.metricSnapshot.findMany({
    where: {
      timestamp: {
        gte: since,
      },
    },
    orderBy: {
      timestamp: "asc",
    },
    select: {
      timestamp: true,
      cpuUsage: true,
      memoryUsage: true,
      storageUsage: true,
      networkRxRate: true,
      networkTxRate: true,
    },
  });

  return downsampleSnapshots(snapshots, config.bucketMs, config.maxPoints);
}

function downsampleSnapshots(
  snapshots: RawSnapshot[],
  bucketMs: number,
  maxPoints: number
): MetricsHistorySnapshot[] {
  if (snapshots.length === 0) {
    return [];
  }

  const buckets = new Map<
    number,
    {
      count: number;
      cpuUsage: number;
      memoryUsage: number;
      storageUsage: number;
      storageCount: number;
      networkRxRate: number;
      networkRxCount: number;
      networkTxRate: number;
      networkTxCount: number;
    }
  >();

  for (const snapshot of snapshots) {
    const bucketKey =
      Math.floor(snapshot.timestamp.getTime() / bucketMs) * bucketMs;
    const bucket = buckets.get(bucketKey) ?? {
      count: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      storageUsage: 0,
      storageCount: 0,
      networkRxRate: 0,
      networkRxCount: 0,
      networkTxRate: 0,
      networkTxCount: 0,
    };

    bucket.count += 1;
    bucket.cpuUsage += snapshot.cpuUsage;
    bucket.memoryUsage += snapshot.memoryUsage;

    if (snapshot.storageUsage !== null) {
      bucket.storageUsage += snapshot.storageUsage;
      bucket.storageCount += 1;
    }

    if (snapshot.networkRxRate !== null) {
      bucket.networkRxRate += snapshot.networkRxRate;
      bucket.networkRxCount += 1;
    }

    if (snapshot.networkTxRate !== null) {
      bucket.networkTxRate += snapshot.networkTxRate;
      bucket.networkTxCount += 1;
    }

    buckets.set(bucketKey, bucket);
  }

  const points = Array.from(buckets.entries())
    .sort(([left], [right]) => left - right)
    .map(([timestamp, bucket]) => ({
      timestamp: new Date(timestamp).toISOString(),
      cpu: round(bucket.cpuUsage / bucket.count),
      memory: round(bucket.memoryUsage / bucket.count),
      storage:
        bucket.storageCount > 0
          ? round(bucket.storageUsage / bucket.storageCount)
          : undefined,
      networkRxRate:
        bucket.networkRxCount > 0
          ? round(bucket.networkRxRate / bucket.networkRxCount)
          : undefined,
      networkTxRate:
        bucket.networkTxCount > 0
          ? round(bucket.networkTxRate / bucket.networkTxCount)
          : undefined,
    }));

  if (points.length <= maxPoints) {
    return points;
  }

  const stride = Math.ceil(points.length / maxPoints);
  return points.filter((_, index) => index % stride === 0);
}

function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
