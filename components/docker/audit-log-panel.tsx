"use client";

import { DashboardPanel } from "@/components/dashboard/panel";
import { Badge } from "@/components/ui/badge";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { formatTimestamp } from "@/lib/monitoring/format";
import { auditActionLabel } from "@/types/audit";

export function AuditLogPanel() {
  const { data, error, isLoading, mutate } = useAuditLogs(30);

  return (
    <DashboardPanel
      title="Audit log"
      description="Recent container control actions"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          All start, stop, restart, and log view actions are recorded
        </p>
        <button
          type="button"
          className="text-xs text-primary hover:underline"
          onClick={() => void mutate()}
        >
          Refresh
        </button>
      </div>

      {error && !data ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
          Audit log unavailable. {error.message}
        </div>
      ) : data?.logs && data.logs.length > 0 ? (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {data.logs.map((entry) => (
            <li key={entry.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {auditActionLabel(entry.action)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {entry.targetName ?? entry.target} · {entry.username}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={entry.success ? "secondary" : "destructive"}>
                    {entry.success ? "Success" : "Failed"}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                </div>
              </div>
              {entry.message && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {entry.message}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
          <p className="text-xs text-muted-foreground">
            {isLoading ? "Loading audit log…" : "No control actions recorded yet"}
          </p>
        </div>
      )}
    </DashboardPanel>
  );
}
