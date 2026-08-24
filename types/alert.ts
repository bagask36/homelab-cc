import { z } from "zod";

export const alertSeveritySchema = z.enum(["warning", "critical"]);
export const alertTypeSchema = z.enum([
  "cpu",
  "memory",
  "storage",
  "service",
  "container",
  "tunnel",
]);

export const alertSchema = z.object({
  id: z.string(),
  type: alertTypeSchema,
  severity: alertSeveritySchema,
  title: z.string(),
  message: z.string(),
  source: z.string().optional(),
});

export const alertsSummarySchema = z.object({
  total: z.number(),
  critical: z.number(),
  warning: z.number(),
});

export const alertsResponseSchema = z.object({
  status: z.enum(["ok", "partial", "unavailable"]),
  timestamp: z.string(),
  summary: alertsSummarySchema,
  alerts: z.array(alertSchema),
  errors: z.array(z.string()).optional(),
});

export type AlertSeverity = z.infer<typeof alertSeveritySchema>;
export type AlertType = z.infer<typeof alertTypeSchema>;
export type Alert = z.infer<typeof alertSchema>;
export type AlertsSummary = z.infer<typeof alertsSummarySchema>;
export type AlertsResponse = z.infer<typeof alertsResponseSchema>;

export function alertSeverityToStatusLevel(
  severity: AlertSeverity
): "warning" | "critical" {
  return severity;
}

export function alertTypeLabel(type: AlertType): string {
  switch (type) {
    case "cpu":
      return "CPU";
    case "memory":
      return "Memory";
    case "storage":
      return "Storage";
    case "service":
      return "Service";
    case "container":
      return "Container";
    case "tunnel":
      return "Tunnel";
  }
}
