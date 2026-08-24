"use client";

import { RefreshCwIcon } from "lucide-react";

import { StatusIndicator } from "@/components/shared/status-indicator";
import type { StatusLevel } from "@/components/shared/status-indicator";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAlerts } from "@/hooks/useAlerts";
import { useMetrics } from "@/hooks/useMetrics";
import {
  deriveSystemStatus,
  deriveSystemStatusLabel,
  formatTimestamp,
} from "@/lib/monitoring/format";
import { cn } from "@/lib/utils";

export function HeaderStatus() {
  const { data, isLoading, isValidating, error } = useMetrics();
  const { data: alertsData } = useAlerts();
  const metricsStatus = deriveSystemStatus(data);
  const systemStatus = deriveOverallStatus(alertsData?.summary, metricsStatus);
  const alertCount = alertsData?.summary.total ?? 0;

  return (
    <div className="hidden items-center gap-4 sm:flex">
      <StatusIndicator
        status={systemStatus}
        label={deriveSystemStatusLabel(systemStatus)}
      />
      {alertCount > 0 && (
        <Badge variant={alertsData?.summary.critical ? "destructive" : "outline"}>
          {alertCount} alert{alertCount === 1 ? "" : "s"}
        </Badge>
      )}
      <Separator orientation="vertical" className="h-6" />
      <div className="text-right">
        <p className="text-xs text-muted-foreground">Last update</p>
        <p className="font-mono text-xs">
          {error && !data
            ? "Error"
            : formatTimestamp(data?.timestamp) || (isLoading ? "Loading…" : "—")}
        </p>
      </div>
      <Badge variant="outline" className="gap-1.5 font-normal">
        <RefreshCwIcon
          className={cn(
            "size-3 text-muted-foreground",
            isValidating && "animate-spin"
          )}
        />
        {isValidating ? "Refreshing" : isLoading ? "Loading" : "Live"}
      </Badge>
    </div>
  );
}

function deriveOverallStatus(
  summary: { critical: number; warning: number; total: number } | undefined,
  metricsStatus: StatusLevel
): StatusLevel {
  if (!summary || summary.total === 0) {
    return metricsStatus;
  }

  if (summary.critical > 0) {
    return "critical";
  }

  if (summary.warning > 0) {
    return "warning";
  }

  return metricsStatus;
}
