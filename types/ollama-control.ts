import { z } from "zod";

export const ollamaRunRequestSchema = z.object({
  model: z.string().min(1, "Model name is required"),
  prompt: z.string().optional(),
  /** Keep loaded indefinitely when true (default for load-only). */
  keepAlive: z.union([z.string(), z.number(), z.literal(-1)]).optional(),
});

export const ollamaStopRequestSchema = z.object({
  model: z.string().min(1, "Model name is required"),
});

export const ollamaActionResponseSchema = z.object({
  status: z.enum(["ok", "unavailable"]),
  message: z.string().optional(),
  model: z.string().optional(),
  response: z.string().optional(),
  responseTimeMs: z.number().nullable().optional(),
  errors: z.array(z.string()).optional(),
});

export type OllamaRunRequest = z.infer<typeof ollamaRunRequestSchema>;
export type OllamaStopRequest = z.infer<typeof ollamaStopRequestSchema>;
export type OllamaActionResponse = z.infer<typeof ollamaActionResponseSchema>;
