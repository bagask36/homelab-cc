import { z } from "zod";

export const tunnelIngressSchema = z.object({
  id: z.string(),
  hostname: z.string().nullable(),
  service: z.string(),
  sortOrder: z.number(),
  enabled: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const tunnelSettingsSchema = z.object({
  tunnelId: z.string(),
  credentialsFile: z.string(),
  configPath: z.string(),
  configWritable: z.boolean(),
  configExists: z.boolean(),
  reloadCommand: z.string().nullable(),
});

export const tunnelConfigResponseSchema = z.object({
  status: z.enum(["ok", "unavailable"]),
  timestamp: z.string().optional(),
  settings: tunnelSettingsSchema.optional(),
  ingress: z.array(tunnelIngressSchema).optional(),
  configPreview: z.string().optional(),
  errors: z.array(z.string()).optional(),
});

export const tunnelIngressInputSchema = z.object({
  hostname: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
  service: z.string().trim().min(1, "Service URL is required"),
  enabled: z.boolean().optional(),
});

export const tunnelIngressUpdateSchema = tunnelIngressInputSchema.partial();

export const tunnelActionResponseSchema = z.object({
  status: z.enum(["ok", "unavailable"]),
  message: z.string().optional(),
  ingress: tunnelIngressSchema.optional(),
  errors: z.array(z.string()).optional(),
});

export type TunnelIngress = z.infer<typeof tunnelIngressSchema>;
export type TunnelSettings = z.infer<typeof tunnelSettingsSchema>;
export type TunnelConfigResponse = z.infer<typeof tunnelConfigResponseSchema>;
export type TunnelIngressInput = z.infer<typeof tunnelIngressInputSchema>;
export type TunnelActionResponse = z.infer<typeof tunnelActionResponseSchema>;
