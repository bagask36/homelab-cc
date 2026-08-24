"use client";

import Link from "next/link";
import { TriangleAlertIcon } from "lucide-react";

import { DashboardPanel } from "@/components/dashboard/panel";
import { StatusIndicator } from "@/components/shared/status-indicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAlerts } from "@/hooks/useAlerts";
import { alertSeverityToStatusLevel } from "@/types/alert";

type AlertsPanelProps = {
  limit?: number;
  showViewAll?: boolean;
};

export function AlertsPanel({ limit = 5, showViewAll = true }: AlertsPanelProps) {
  const { data, error, isLoading } = useAlerts();
  const alerts = data?.alerts ?? [];
  const visibleAlerts = limit ? alerts.slice(0, limit) : alerts;

  return (
    <DashboardPanel
      title="Alerts"
      description="Active warnings and critical issues"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={data?.summary.critical ? "destructive" : "secondary"}>
            {data?.summary.critical ?? 0} critical
          </Badge>
          <Badge variant="outline">
            {data?.summary.warning ?? 0} warning
          </Badge>
        </div>

        {error && !data ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">Alerts unavailable</p>
            <p className="mt-1 text-xs text-muted-foreground">{error.message}</p>
          </div>
        ) : visibleAlerts.length > 0 ? (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {visibleAlerts.map((alert) => (
              <li
                key={alert.id}
                className="flex items-start justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{alert.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {alert.message}
                  </p>
                  {alert.source && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {alert.source}
                    </p>
                  )}
                </div>
                <StatusIndicator
                  status={alertSeverityToStatusLevel(alert.severity)}
                  label={alert.severity}
                  className="shrink-0 capitalize"
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6">
            <TriangleAlertIcon className="size-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Checking for alerts…" : "No active alerts"}
            </p>
          </div>
        )}

        {showViewAll && alerts.length > limit && (
          <Button variant="outline" size="sm" render={<Link href="/alerts" />}>
            View all {alerts.length} alerts
          </Button>
        )}

        {showViewAll && alerts.length > 0 && alerts.length <= limit && (
          <Button variant="outline" size="sm" render={<Link href="/alerts" />}>
            View alerts page
          </Button>
        )}
      </div>
    </DashboardPanel>
  );
}
