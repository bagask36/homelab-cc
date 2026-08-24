"use client";

import { RefreshCwIcon } from "lucide-react";

import { StatusIndicator } from "@/components/shared/status-indicator";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useMetrics } from "@/hooks/useMetrics";
import {
  deriveSystemStatus,
  deriveSystemStatusLabel,
  formatTimestamp,
} from "@/lib/monitoring/format";
import { cn } from "@/lib/utils";

export function HeaderStatus() {
  const { data, isLoading, isValidating, error } = useMetrics();
  const systemStatus = deriveSystemStatus(data);

  return (
    <div className="hidden items-center gap-4 sm:flex">
      <StatusIndicator
        status={systemStatus}
        label={deriveSystemStatusLabel(systemStatus)}
      />
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
