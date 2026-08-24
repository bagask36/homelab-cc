import { z } from "zod";

export const ollamaModelSchema = z.object({
  name: z.string(),
  size: z.number().optional(),
  modifiedAt: z.string().optional(),
});

export const ollamaResponseSchema = z.object({
  status: z.enum(["ok", "partial", "unavailable"]),
  timestamp: z.string(),
  online: z.boolean().optional(),
  responseTimeMs: z.number().nullable().optional(),
  models: z.array(ollamaModelSchema).optional(),
  runningModels: z.array(z.string()).optional(),
  errors: z.array(z.string()).optional(),
});

export type OllamaModel = z.infer<typeof ollamaModelSchema>;
export type OllamaResponse = z.infer<typeof ollamaResponseSchema>;
