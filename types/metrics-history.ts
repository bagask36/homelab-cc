import { z } from "zod";

export const metricsHistoryRangeSchema = z.enum([
  "live",
  "1h",
  "6h",
  "24h",
  "7d",
  "30d",
]);

export const metricsHistorySnapshotSchema = z.object({
  timestamp: z.string(),
  cpu: z.number(),
  memory: z.number(),
  storage: z.number().optional(),
  networkRxRate: z.number().optional(),
  networkTxRate: z.number().optional(),
});

export const metricsHistoryResponseSchema = z.object({
  status: z.enum(["ok", "unavailable"]),
  range: metricsHistoryRangeSchema,
  points: z.array(metricsHistorySnapshotSchema),
  errors: z.array(z.string()).optional(),
});

export type MetricsHistoryRange = z.infer<typeof metricsHistoryRangeSchema>;
export type MetricsHistorySnapshot = z.infer<
  typeof metricsHistorySnapshotSchema
>;
export type MetricsHistoryResponse = z.infer<
  typeof metricsHistoryResponseSchema
>;

export const METRICS_HISTORY_RANGES = metricsHistoryRangeSchema.options;

export const METRICS_HISTORY_RANGE_LABELS: Record<
  MetricsHistoryRange,
  string
> = {
  live: "Live",
  "1h": "1h",
  "6h": "6h",
  "24h": "24h",
  "7d": "7d",
  "30d": "30d",
};
