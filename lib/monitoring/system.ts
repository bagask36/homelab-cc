import os from "os";

import si from "systeminformation";

import { getCpuMetrics } from "@/lib/monitoring/cpu";
import { getMemoryMetrics } from "@/lib/monitoring/memory";
import type { MetricsResponse, OsInfo } from "@/types/metrics";

export async function getSystemMetrics(): Promise<MetricsResponse> {
  const errors: string[] = [];
  const timestamp = new Date().toISOString();
  const hostname = os.hostname();
  const uptime = os.uptime();

  const [osResult, cpuResult, memoryResult] = await Promise.allSettled([
    getOsInfo(),
    getCpuMetrics(),
    getMemoryMetrics(),
  ]);

  let osInfo: OsInfo | undefined;
  let cpu: MetricsResponse["cpu"];
  let memory: MetricsResponse["memory"];

  if (osResult.status === "fulfilled") {
    osInfo = osResult.value;
  } else {
    errors.push(
      osResult.reason instanceof Error
        ? osResult.reason.message
        : "OS information unavailable"
    );
  }

  if (cpuResult.status === "fulfilled") {
    cpu = cpuResult.value;
  } else {
    errors.push(
      cpuResult.reason instanceof Error
        ? cpuResult.reason.message
        : "CPU metrics unavailable"
    );
  }

  if (memoryResult.status === "fulfilled") {
    memory = memoryResult.value;
  } else {
    errors.push(
      memoryResult.reason instanceof Error
        ? memoryResult.reason.message
        : "Memory metrics unavailable"
    );
  }

  const hasData = Boolean(cpu || memory || osInfo);
  const status =
    errors.length === 0 ? "ok" : hasData ? "partial" : "unavailable";

  return {
    status,
    timestamp,
    hostname,
    uptime,
    os: osInfo,
    cpu,
    memory,
    errors: errors.length > 0 ? errors : undefined,
  };
}

async function getOsInfo(): Promise<OsInfo> {
  const info = await si.osInfo();

  return {
    platform: info.platform,
    distro: info.distro || info.platform,
    release: info.release,
    arch: info.arch,
  };
}
