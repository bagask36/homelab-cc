export type ThresholdLevels = {
  warning: number;
  critical: number;
};

export const ALERT_THRESHOLDS = {
  cpu: { warning: 80, critical: 95 },
  memory: { warning: 85, critical: 95 },
  storage: { warning: 85, critical: 95 },
} as const satisfies Record<string, ThresholdLevels>;

export function resolveThresholdSeverity(
  value: number,
  thresholds: ThresholdLevels
): "warning" | "critical" | null {
  if (value >= thresholds.critical) {
    return "critical";
  }

  if (value >= thresholds.warning) {
    return "warning";
  }

  return null;
}
