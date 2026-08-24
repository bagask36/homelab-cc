"use client";

import { AuditLogPanel } from "@/components/docker/audit-log-panel";
import { ContainerControls } from "@/components/docker/container-controls";
import { DashboardPanel } from "@/components/dashboard/panel";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { StatusIndicator } from "@/components/shared/status-indicator";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { useDocker } from "@/hooks/useDocker";
import {
  formatBytesCompact,
  formatPercent,
  formatTimestamp,
} from "@/lib/monitoring/format";
import {
  getContainerStatusLabel,
  getContainerStatusLevel,
} from "@/lib/docker/format";
import { PackageIcon, PlayIcon, SquareIcon, TriangleAlertIcon } from "lucide-react";

export function ContainersOverview() {
  const { data, error, isLoading, mutate } = useDocker();
  const { mutate: mutateAuditLogs } = useAuditLogs(30);

  function handleActionComplete() {
    void mutate();
    void mutateAuditLogs();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Containers</h2>
        <p className="text-sm text-muted-foreground">
          Docker containers, status, resource usage, and controls
        </p>
      </div>

      {error && !data && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Docker unavailable. {error.message}
          <p className="mt-2 text-xs text-destructive/80">
            Mount <code className="font-mono">/var/run/docker.sock</code> in
            Docker Compose to enable monitoring.
          </p>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Running"
          value={
            isLoading && !data ? "…" : String(data?.summary?.running ?? "—")
          }
          subtitle={`Total ${data?.summary?.total ?? "—"} containers`}
          icon={PlayIcon}
        />
        <SummaryCard
          title="Stopped"
          value={
            isLoading && !data ? "…" : String(data?.summary?.stopped ?? "—")
          }
          subtitle="Exited or created"
          icon={SquareIcon}
        />
        <SummaryCard
          title="Unhealthy"
          value={
            isLoading && !data ? "…" : String(data?.summary?.unhealthy ?? "—")
          }
          subtitle="Failed health checks"
          icon={TriangleAlertIcon}
        />
        <SummaryCard
          title="Updated"
          value={formatTimestamp(data?.timestamp) || "—"}
          subtitle="Live polling"
          icon={PackageIcon}
        />
      </section>

      <DashboardPanel
        title="All Containers"
        description="Status, image, resource usage, and control actions"
      >
        {data?.containers && data.containers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Image</th>
                  <th className="px-4 py-3 font-medium">CPU</th>
                  <th className="px-4 py-3 font-medium">Memory</th>
                  <th className="px-4 py-3 font-medium">Network</th>
                  <th className="px-4 py-3 font-medium">Restarts</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.containers.map((container) => (
                  <tr
                    key={container.id}
                    className="border-b border-border/70 last:border-b-0"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{container.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {container.id}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
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
                    </td>
                    <td className="max-w-48 truncate px-4 py-3 text-muted-foreground">
                      {container.image}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {container.cpuPercent !== null
                        ? formatPercent(container.cpuPercent)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {container.memoryUsage !== null
                        ? `${formatBytesCompact(container.memoryUsage)}${
                            container.memoryLimit
                              ? ` / ${formatBytesCompact(container.memoryLimit)}`
                              : ""
                          }`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {container.networkRx !== null &&
                      container.networkTx !== null ? (
                        <>
                          ↓ {formatBytesCompact(container.networkRx)}
                          <br />↑ {formatBytesCompact(container.networkTx)}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {container.restartCount}
                    </td>
                    <td className="px-4 py-3">
                      <ContainerControls
                        container={container}
                        onActionComplete={handleActionComplete}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Loading containers…" : "No containers found"}
            </p>
          </div>
        )}
      </DashboardPanel>

      <AuditLogPanel />
    </div>
  );
}
