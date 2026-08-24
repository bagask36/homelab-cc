"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  METRICS_HISTORY_RANGE_LABELS,
  METRICS_HISTORY_RANGES,
  type MetricsHistoryRange,
} from "@/types/metrics-history";

type ChartRangeSelectorProps = {
  value: MetricsHistoryRange;
  onChange: (range: MetricsHistoryRange) => void;
  className?: string;
};

export function ChartRangeSelector({
  value,
  onChange,
  className,
}: ChartRangeSelectorProps) {
  return (
    <div
      className={cn(
        "inline-flex flex-wrap gap-1 rounded-lg border border-border bg-muted/30 p-1",
        className
      )}
      role="group"
      aria-label="Chart time range"
    >
      {METRICS_HISTORY_RANGES.map((range) => (
        <Button
          key={range}
          type="button"
          size="xs"
          variant={value === range ? "secondary" : "ghost"}
          className={cn(
            "h-7 px-2.5 text-xs",
            value === range && "shadow-sm"
          )}
          onClick={() => onChange(range)}
          aria-pressed={value === range}
        >
          {METRICS_HISTORY_RANGE_LABELS[range]}
        </Button>
      ))}
    </div>
  );
}
