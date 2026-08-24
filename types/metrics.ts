import { z } from "zod";

export const cpuMetricsSchema = z.object({
  usage: z.number(),
  loadAverage: z.tuple([z.number(), z.number(), z.number()]),
});

export const memoryMetricsSchema = z.object({
  total: z.number(),
  used: z.number(),
  available: z.number(),
  usagePercent: z.number(),
});

export const osInfoSchema = z.object({
  platform: z.string(),
  distro: z.string(),
  release: z.string(),
  arch: z.string(),
});

export const metricsResponseSchema = z.object({
  status: z.enum(["ok", "partial", "unavailable"]),
  timestamp: z.string(),
  hostname: z.string(),
  uptime: z.number(),
  os: osInfoSchema.optional(),
  cpu: cpuMetricsSchema.optional(),
  memory: memoryMetricsSchema.optional(),
  errors: z.array(z.string()).optional(),
});

export type CpuMetrics = z.infer<typeof cpuMetricsSchema>;
export type MemoryMetrics = z.infer<typeof memoryMetricsSchema>;
export type OsInfo = z.infer<typeof osInfoSchema>;
export type MetricsResponse = z.infer<typeof metricsResponseSchema>;

export type MetricsHistoryPoint = {
  time: string;
  cpu: number;
  memory: number;
};
