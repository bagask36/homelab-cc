"use client";

import {
  AlertTriangleIcon,
  ShieldAlertIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { DashboardPanel } from "@/components/dashboard/panel";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { StatusIndicator } from "@/components/shared/status-indicator";
import { Badge } from "@/components/ui/badge";
import { useAlerts } from "@/hooks/useAlerts";
import { formatTimestamp } from "@/lib/monitoring/format";
import { alertSeverityToStatusLevel, alertTypeLabel } from "@/types/alert";

export function AlertsOverview() {
  const { data, error, isLoading } = useAlerts();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Alerts</h2>
        <p className="text-sm text-muted-foreground">
          Live warnings for CPU, memory, storage, services, containers, and tunnel
        </p>
      </div>

      {error && !data && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Unable to load alerts. {error.message}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total alerts"
          value={isLoading && !data ? "…" : String(data?.summary.total ?? 0)}
          subtitle={`Updated ${formatTimestamp(data?.timestamp)}`}
          icon={TriangleAlertIcon}
        />
        <SummaryCard
          title="Critical"
          value={isLoading && !data ? "…" : String(data?.summary.critical ?? 0)}
          subtitle="Requires immediate attention"
          icon={ShieldAlertIcon}
        />
        <SummaryCard
          title="Warnings"
          value={isLoading && !data ? "…" : String(data?.summary.warning ?? 0)}
          subtitle="Monitor closely"
          icon={AlertTriangleIcon}
        />
        <SummaryCard
          title="Status"
          value={
            isLoading && !data
              ? "…"
              : data?.summary.total
                ? data.summary.critical > 0
                  ? "Critical"
                  : "Warning"
                : "Clear"
          }
          subtitle={
            data?.summary.total
              ? `${data.summary.total} active alert(s)`
              : "All checks passing"
          }
          icon={TriangleAlertIcon}
        />
      </section>

      <DashboardPanel
        title="All active alerts"
        description="Sorted by severity, refreshed every 3 seconds"
      >
        {data?.alerts && data.alerts.length > 0 ? (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {data.alerts.map((alert) => (
              <li
                key={alert.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{alert.title}</p>
                    <Badge variant="outline">{alertTypeLabel(alert.type)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                  {alert.source && (
                    <p className="text-xs text-muted-foreground">
                      Source: {alert.source}
                    </p>
                  )}
                </div>
                <StatusIndicator
                  status={alertSeverityToStatusLevel(alert.severity)}
                  label={alert.severity}
                  className="capitalize"
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Evaluating alerts…" : "No active alerts"}
            </p>
          </div>
        )}
      </DashboardPanel>
    </div>
  );
}
