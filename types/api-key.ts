import { z } from "zod";

export const apiKeySchema = z.object({
  id: z.string(),
  name: z.string(),
  keyPrefix: z.string(),
  model: z.string().nullable(),
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
  createdAt: z.string(),
  lastUsedAt: z.string().nullable(),
});

export const apiKeyCreateInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(64),
  model: z
    .string()
    .trim()
    .max(128)
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
});

export const apiKeyListResponseSchema = z.object({
  status: z.enum(["ok", "unavailable"]),
  keys: z.array(apiKeySchema).optional(),
  errors: z.array(z.string()).optional(),
});

export const apiKeyCreateResponseSchema = z.object({
  status: z.enum(["ok", "unavailable"]),
  message: z.string().optional(),
  key: apiKeySchema.optional(),
  token: z.string().optional(),
  errors: z.array(z.string()).optional(),
});

export const apiKeyActionResponseSchema = z.object({
  status: z.enum(["ok", "unavailable"]),
  message: z.string().optional(),
  errors: z.array(z.string()).optional(),
});

export type ApiKey = z.infer<typeof apiKeySchema>;
export type ApiKeyCreateInput = z.infer<typeof apiKeyCreateInputSchema>;
export type ApiKeyListResponse = z.infer<typeof apiKeyListResponseSchema>;
export type ApiKeyCreateResponse = z.infer<typeof apiKeyCreateResponseSchema>;
export type ApiKeyActionResponse = z.infer<typeof apiKeyActionResponseSchema>;
