import { z } from "zod";

export const tunnelResponseSchema = z.object({
  status: z.enum(["ok", "partial", "unavailable"]),
  timestamp: z.string(),
  online: z.boolean().optional(),
  responseTimeMs: z.number().nullable().optional(),
  message: z.string().optional(),
  errors: z.array(z.string()).optional(),
});

export type TunnelResponse = z.infer<typeof tunnelResponseSchema>;
