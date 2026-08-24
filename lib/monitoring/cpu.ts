import os from "os";

import si from "systeminformation";

import type { CpuMetrics } from "@/types/metrics";

export async function getCpuMetrics(): Promise<CpuMetrics> {
  const currentLoad = await si.currentLoad();
  const [one, five, fifteen] = os.loadavg();

  return {
    usage: round(currentLoad.currentLoad),
    loadAverage: [round(one), round(five), round(fifteen)],
  };
}

function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
