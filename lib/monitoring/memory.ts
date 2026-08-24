import si from "systeminformation";

import type { MemoryMetrics } from "@/types/metrics";

export async function getMemoryMetrics(): Promise<MemoryMetrics> {
  const mem = await si.mem();
  const usagePercent = mem.total > 0 ? (mem.used / mem.total) * 100 : 0;

  return {
    total: mem.total,
    used: mem.used,
    available: mem.available,
    usagePercent: round(usagePercent),
  };
}

function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
