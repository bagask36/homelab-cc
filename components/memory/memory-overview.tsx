"use client";

import { DashboardPanel } from "@/components/dashboard/panel";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { MemoryNodeList } from "@/components/memory/memory-node-list";
import { useMetrics } from "@/hooks/useMetrics";
import {
  formatBytesCompact,
  formatMemorySummary,
  formatPercent,
  formatSwapSummary,
  formatTimestamp,
} from "@/lib/monitoring/format";
import { LayersIcon, MemoryStickIcon, ServerIcon } from "lucide-react";

export function MemoryOverview() {
  const { data, error, isLoading } = useMetrics();
  const memory = data?.memory;
  const nodes = memory?.nodes ?? [];
  const modules = memory?.modules ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Memory</h2>
        <p className="text-sm text-muted-foreground">
          RAM usage by node
          {data?.hostname ? ` on ${data.hostname}` : ""}
        </p>
      </div>

      {error && !data && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Unable to load memory metrics. {error.message}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Total Usage"
          value={
            isLoading && !data ? "…" : formatPercent(memory?.usagePercent)
          }
          subtitle={formatMemorySummary(memory)}
          icon={MemoryStickIcon}
        />
        <SummaryCard
          title="Nodes"
          value={isLoading && !data ? "…" : String(nodes.length || "—")}
          subtitle={`Updated ${formatTimestamp(data?.timestamp)}`}
          icon={ServerIcon}
        />
        <SummaryCard
          title="Swap"
          value={
            isLoading && !data
              ? "…"
              : memory?.swapTotal
                ? formatPercent(memory.swapUsagePercent)
                : "—"
          }
          subtitle={formatSwapSummary(memory)}
          icon={LayersIcon}
        />
      </section>

      <DashboardPanel
        title="Memory by node"
        description="Usage per NUMA node, or the host when NUMA is not exposed"
      >
        <MemoryNodeList nodes={nodes} isLoading={isLoading && !data} />
      </DashboardPanel>

      <DashboardPanel
        title="Memory modules"
        description="Installed DIMM layout from firmware"
      >
        {modules.length > 0 ? (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {modules.map((module, index) => (
              <li
                key={`${module.bank}-${module.type}-${index}`}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{module.bank}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {module.type}
                    {module.formFactor ? ` · ${module.formFactor}` : ""}
                    {module.clockSpeed
                      ? ` · ${module.clockSpeed} MHz`
                      : ""}
                  </p>
                </div>
                <p className="font-mono text-xs text-muted-foreground">
                  {formatBytesCompact(module.size)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              {isLoading && !data
                ? "Loading module layout…"
                : "No DIMM layout available from this host"}
            </p>
          </div>
        )}
      </DashboardPanel>
    </div>
  );
}
