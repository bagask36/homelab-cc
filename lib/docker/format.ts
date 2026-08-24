import type { ContainerHealth, ContainerState } from "@/types/docker";
import type { StatusLevel } from "@/components/shared/status-indicator";

export function getContainerStatusLevel(
  state: ContainerState,
  health: ContainerHealth
): StatusLevel {
  if (health === "unhealthy") return "critical";
  if (state === "running") {
    return health === "starting" ? "warning" : "healthy";
  }
  if (state === "restarting" || state === "paused") return "warning";
  return "unknown";
}

export function getContainerStatusLabel(
  state: ContainerState,
  health: ContainerHealth
): string {
  if (health === "unhealthy") return "Unhealthy";
  if (health === "starting") return "Starting";
  if (health === "healthy") return "Healthy";
  if (state === "running") return "Running";
  if (state === "restarting") return "Restarting";
  if (state === "paused") return "Paused";
  if (state === "exited") return "Stopped";
  if (state === "dead") return "Dead";
  if (state === "created") return "Created";
  return "Unknown";
}

export function formatContainerUptime(status: string): string {
  const match = status.match(/\(([^)]+)\)/);
  return match?.[1] ?? status;
}
