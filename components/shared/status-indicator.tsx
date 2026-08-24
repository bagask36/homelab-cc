import { cn } from "@/lib/utils";

export type StatusLevel = "healthy" | "warning" | "critical" | "unknown";

const statusConfig: Record<
  StatusLevel,
  { label: string; dotClass: string; textClass: string }
> = {
  healthy: {
    label: "Healthy",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-500",
  },
  warning: {
    label: "Warning",
    dotClass: "bg-amber-500",
    textClass: "text-amber-500",
  },
  critical: {
    label: "Critical",
    dotClass: "bg-red-500",
    textClass: "text-red-500",
  },
  unknown: {
    label: "Unknown",
    dotClass: "bg-muted-foreground/60",
    textClass: "text-muted-foreground",
  },
};

type StatusIndicatorProps = {
  status: StatusLevel;
  label?: string;
  showLabel?: boolean;
  className?: string;
};

export function StatusIndicator({
  status,
  label,
  showLabel = true,
  className,
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const displayLabel = label ?? config.label;

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn("size-2 shrink-0 rounded-full", config.dotClass)}
        aria-hidden
      />
      {showLabel && (
        <span className={cn("text-sm font-medium", config.textClass)}>
          {displayLabel}
        </span>
      )}
    </span>
  );
}
