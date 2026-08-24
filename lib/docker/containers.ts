import type Docker from "dockerode";

import { getDockerClient } from "@/lib/docker/client";
import type {
  ContainerHealth,
  ContainerMetrics,
  ContainerState,
  DockerSummary,
} from "@/types/docker";

export type DockerMetrics = {
  summary: DockerSummary;
  containers: ContainerMetrics[];
};

export async function getDockerMetrics(): Promise<DockerMetrics> {
  const docker = getDockerClient();
  await docker.ping();

  const listed = await docker.listContainers({ all: true });
  const containers = await Promise.all(
    listed.map((entry) => mapContainer(docker, entry))
  );

  containers.sort((a, b) => {
    if (a.state === "running" && b.state !== "running") return -1;
    if (b.state === "running" && a.state !== "running") return 1;
    return a.name.localeCompare(b.name);
  });

  return {
    summary: summarize(containers),
    containers,
  };
}

async function mapContainer(
  docker: Docker,
  entry: Docker.ContainerInfo
): Promise<ContainerMetrics> {
  const container = docker.getContainer(entry.Id);
  const [inspect, stats] = await Promise.all([
    container.inspect(),
    entry.State === "running"
      ? getContainerStats(container).catch(() => null)
      : Promise.resolve(null),
  ]);

  const health = mapHealth(inspect.State.Health?.Status);
  const state = mapState(entry.State);

  return {
    id: entry.Id.slice(0, 12),
    name: formatContainerName(entry.Names[0] ?? entry.Id.slice(0, 12)),
    image: entry.Image,
    state,
    status: entry.Status,
    health,
    created: entry.Created,
    restartCount: inspect.RestartCount ?? 0,
    cpuPercent: stats ? round(stats.cpuPercent) : null,
    memoryUsage: stats?.memoryUsage ?? null,
    memoryLimit: stats?.memoryLimit ?? null,
    networkRx: stats?.networkRx ?? null,
    networkTx: stats?.networkTx ?? null,
  };
}

async function getContainerStats(container: Docker.Container) {
  const stats = (await container.stats({ stream: false })) as Docker.ContainerStats;

  return {
    cpuPercent: calculateCpuPercent(stats),
    memoryUsage: stats.memory_stats?.usage ?? null,
    memoryLimit: stats.memory_stats?.limit ?? null,
    networkRx: sumNetworkBytes(stats, "rx_bytes"),
    networkTx: sumNetworkBytes(stats, "tx_bytes"),
  };
}

function calculateCpuPercent(stats: Docker.ContainerStats): number {
  const cpuStats = stats.cpu_stats;
  const preCpuStats = stats.precpu_stats;

  if (!cpuStats?.cpu_usage || !preCpuStats?.cpu_usage) {
    return 0;
  }

  const cpuDelta =
    cpuStats.cpu_usage.total_usage - preCpuStats.cpu_usage.total_usage;
  const systemDelta =
    cpuStats.system_cpu_usage - preCpuStats.system_cpu_usage;

  if (systemDelta <= 0 || cpuDelta < 0) {
    return 0;
  }

  const onlineCpus = cpuStats.online_cpus ?? 1;
  return (cpuDelta / systemDelta) * onlineCpus * 100;
}

function sumNetworkBytes(
  stats: Docker.ContainerStats,
  key: "rx_bytes" | "tx_bytes"
): number {
  const networks = stats.networks ?? {};
  return Object.values(networks).reduce(
    (total, iface) => total + (iface[key] ?? 0),
    0
  );
}

function summarize(containers: ContainerMetrics[]): DockerSummary {
  return containers.reduce(
    (acc, container) => {
      acc.total += 1;

      if (container.state === "running") {
        acc.running += 1;
      } else {
        acc.stopped += 1;
      }

      if (container.health === "unhealthy") {
        acc.unhealthy += 1;
      }

      return acc;
    },
    { running: 0, stopped: 0, unhealthy: 0, total: 0 }
  );
}

function mapState(state: string): ContainerState {
  switch (state.toLowerCase()) {
    case "running":
      return "running";
    case "exited":
      return "exited";
    case "paused":
      return "paused";
    case "restarting":
      return "restarting";
    case "dead":
      return "dead";
    case "created":
      return "created";
    default:
      return state ? "unknown" : "stopped";
  }
}

function mapHealth(status: string | undefined): ContainerHealth {
  switch (status?.toLowerCase()) {
    case "healthy":
      return "healthy";
    case "unhealthy":
      return "unhealthy";
    case "starting":
      return "starting";
    case "none":
      return "none";
    default:
      return "unknown";
  }
}

function formatContainerName(name: string): string {
  return name.replace(/^\//, "");
}

function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
