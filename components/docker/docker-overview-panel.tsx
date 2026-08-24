"use client";

import Link from "next/link";

import { DashboardPanel } from "@/components/dashboard/panel";
import { StatusIndicator } from "@/components/shared/status-indicator";
import { Button } from "@/components/ui/button";
import { useDocker } from "@/hooks/useDocker";
import {
  formatBytesCompact,
  formatPercent,
} from "@/lib/monitoring/format";
import {
  getContainerStatusLabel,
  getContainerStatusLevel,
} from "@/lib/docker/format";

export function DockerOverviewPanel() {
  const { data, error, isLoading } = useDocker();

  if (error && !data) {
    return (
      <DashboardPanel title="Docker Overview" description="Container status">
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">Docker unavailable</p>
          <p className="mt-1 text-xs text-muted-foreground">{error.message}</p>
        </div>
      </DashboardPanel>
    );
  }

  const runningContainers =
    data?.containers?.filter((container) => container.state === "running") ?? [];

  return (
    <DashboardPanel title="Docker Overview" description="Container status">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Running", value: data?.summary?.running ?? "—" },
            { label: "Stopped", value: data?.summary?.stopped ?? "—" },
            { label: "Unhealthy", value: data?.summary?.unhealthy ?? "—" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-border bg-muted/20 px-3 py-4"
            >
              <p className="text-lg font-semibold">
                {isLoading && !data ? "…" : item.value}
              </p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>

        {runningContainers.length > 0 ? (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {runningContainers.slice(0, 5).map((container) => (
              <li
                key={container.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{container.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {container.cpuPercent !== null
                      ? `${formatPercent(container.cpuPercent)} CPU`
                      : "— CPU"}
                    {" · "}
                    {container.memoryUsage !== null
                      ? formatBytesCompact(container.memoryUsage)
                      : "— RAM"}
                  </p>
                </div>
                <StatusIndicator
                  status={getContainerStatusLevel(
                    container.state,
                    container.health
                  )}
                  label={getContainerStatusLabel(
                    container.state,
                    container.health
                  )}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            {isLoading ? "Loading containers…" : "No running containers"}
          </p>
        )}

        <Button variant="outline" size="sm" className="w-full" render={<Link href="/containers" />}>
          View all containers
        </Button>
      </div>
    </DashboardPanel>
  );
}
