"use client";

import { DashboardPanel } from "@/components/dashboard/panel";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { useStorage } from "@/hooks/useStorage";
import {
  formatBytesCompact,
  formatPercent,
  formatStorageSummary,
  formatTimestamp,
} from "@/lib/monitoring/format";
import { cn } from "@/lib/utils";
import { HardDriveIcon } from "lucide-react";

export function StorageOverview() {
  const { data, error, isLoading } = useStorage();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Storage</h2>
        <p className="text-sm text-muted-foreground">
          Disk usage and mounted filesystems
        </p>
      </div>

      {error && !data && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Unable to load storage metrics. {error.message}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Total Usage"
          value={
            isLoading && !data
              ? "…"
              : formatPercent(data?.summary?.usagePercent)
          }
          subtitle={formatStorageSummary(data?.summary)}
          icon={HardDriveIcon}
        />
        <SummaryCard
          title="Primary Mount"
          value={
            isLoading && !data
              ? "…"
              : formatPercent(data?.primary?.usagePercent)
          }
          subtitle={data?.primary?.mount ?? "—"}
          icon={HardDriveIcon}
        />
        <SummaryCard
          title="Filesystems"
          value={
            isLoading && !data
              ? "…"
              : String(data?.filesystems?.length ?? "—")
          }
          subtitle={`Updated ${formatTimestamp(data?.timestamp)}`}
          icon={HardDriveIcon}
        />
      </section>

      <DashboardPanel
        title="Filesystems"
        description="Usage by mount point"
      >
        {data?.filesystems && data.filesystems.length > 0 ? (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {data.filesystems.map((filesystem) => (
              <li key={`${filesystem.fs}-${filesystem.mount}`} className="px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {filesystem.mount}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {filesystem.fs} · {filesystem.type}
                    </p>
                  </div>
                  <div className="w-full sm:w-56">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {formatBytesCompact(filesystem.used)} /{" "}
                        {formatBytesCompact(filesystem.size)}
                      </span>
                      <span className="font-medium">
                        {formatPercent(filesystem.usagePercent)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full bg-primary transition-all",
                          filesystem.usagePercent >= 90 && "bg-destructive",
                          filesystem.usagePercent >= 75 &&
                            filesystem.usagePercent < 90 &&
                            "bg-amber-500"
                        )}
                        style={{
                          width: `${Math.min(filesystem.usagePercent, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Loading storage data…" : "No filesystem data available"}
            </p>
          </div>
        )}
      </DashboardPanel>
    </div>
  );
}
