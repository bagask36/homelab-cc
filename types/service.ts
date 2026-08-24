import { z } from "zod";

export const serviceStatusSchema = z.enum([
  "healthy",
  "degraded",
  "down",
  "unknown",
]);

export const serviceHealthSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: serviceStatusSchema,
  responseTimeMs: z.number().nullable(),
  message: z.string(),
});

export const servicesResponseSchema = z.object({
  status: z.enum(["ok", "partial", "unavailable"]),
  timestamp: z.string(),
  services: z.array(serviceHealthSchema).optional(),
  errors: z.array(z.string()).optional(),
});

export type ServiceStatus = z.infer<typeof serviceStatusSchema>;
export type ServiceHealth = z.infer<typeof serviceHealthSchema>;
export type ServicesResponse = z.infer<typeof servicesResponseSchema>;

export function serviceStatusToLevel(
  status: ServiceStatus
): "healthy" | "warning" | "critical" | "unknown" {
  switch (status) {
    case "healthy":
      return "healthy";
    case "degraded":
      return "warning";
    case "down":
      return "critical";
    default:
      return "unknown";
  }
}

export function serviceStatusLabel(status: ServiceStatus): string {
  switch (status) {
    case "healthy":
      return "Healthy";
    case "degraded":
      return "Degraded";
    case "down":
      return "Down";
    default:
      return "Unknown";
  }
}
