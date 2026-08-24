import { z } from "zod";

export const containerStateSchema = z.enum([
  "running",
  "stopped",
  "paused",
  "restarting",
  "exited",
  "dead",
  "created",
  "unknown",
]);

export const containerHealthSchema = z.enum([
  "healthy",
  "unhealthy",
  "starting",
  "none",
  "unknown",
]);

export const containerMetricsSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string(),
  state: containerStateSchema,
  status: z.string(),
  health: containerHealthSchema,
  created: z.number(),
  restartCount: z.number(),
  cpuPercent: z.number().nullable(),
  memoryUsage: z.number().nullable(),
  memoryLimit: z.number().nullable(),
  networkRx: z.number().nullable(),
  networkTx: z.number().nullable(),
});

export const dockerSummarySchema = z.object({
  running: z.number(),
  stopped: z.number(),
  unhealthy: z.number(),
  total: z.number(),
});

export const dockerResponseSchema = z.object({
  status: z.enum(["ok", "partial", "unavailable"]),
  timestamp: z.string(),
  summary: dockerSummarySchema.optional(),
  containers: z.array(containerMetricsSchema).optional(),
  errors: z.array(z.string()).optional(),
});

export type ContainerState = z.infer<typeof containerStateSchema>;
export type ContainerHealth = z.infer<typeof containerHealthSchema>;
export type ContainerMetrics = z.infer<typeof containerMetricsSchema>;
export type DockerSummary = z.infer<typeof dockerSummarySchema>;
export type DockerResponse = z.infer<typeof dockerResponseSchema>;
