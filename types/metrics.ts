import { z } from "zod";

export const cpuMetricsSchema = z.object({
  usage: z.number(),
  loadAverage: z.tuple([z.number(), z.number(), z.number()]),
});

export const memoryNodeSchema = z.object({
  id: z.number(),
  name: z.string(),
  total: z.number(),
  used: z.number(),
  free: z.number(),
  cached: z.number().optional(),
  usagePercent: z.number(),
});

export const memoryModuleSchema = z.object({
  bank: z.string(),
  size: z.number(),
  type: z.string(),
  clockSpeed: z.number().nullable(),
  formFactor: z.string(),
});

export const memoryMetricsSchema = z.object({
  total: z.number(),
  used: z.number(),
  available: z.number(),
  cached: z.number().optional(),
  usagePercent: z.number(),
  swapTotal: z.number().optional(),
  swapUsed: z.number().optional(),
  swapUsagePercent: z.number().optional(),
  nodes: z.array(memoryNodeSchema).optional(),
  modules: z.array(memoryModuleSchema).optional(),
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
export type MemoryNode = z.infer<typeof memoryNodeSchema>;
export type MemoryModule = z.infer<typeof memoryModuleSchema>;
export type MemoryMetrics = z.infer<typeof memoryMetricsSchema>;
export type OsInfo = z.infer<typeof osInfoSchema>;
export type MetricsResponse = z.infer<typeof metricsResponseSchema>;

export type MetricsHistoryPoint = {
  time: string;
  cpu: number;
  memory: number;
} & Record<string, string | number>;
