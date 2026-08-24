import { z } from "zod";

export const auditActionSchema = z.enum([
  "container.start",
  "container.stop",
  "container.restart",
  "container.logs",
]);

export const auditLogSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  userId: z.string(),
  username: z.string(),
  action: auditActionSchema,
  target: z.string(),
  targetName: z.string().nullable().optional(),
  success: z.boolean(),
  message: z.string().nullable().optional(),
});

export const auditLogsResponseSchema = z.object({
  status: z.enum(["ok", "unavailable"]),
  logs: z.array(auditLogSchema),
  errors: z.array(z.string()).optional(),
});

export type AuditAction = z.infer<typeof auditActionSchema>;
export type AuditLogEntry = z.infer<typeof auditLogSchema>;
export type AuditLogsResponse = z.infer<typeof auditLogsResponseSchema>;

export function auditActionLabel(action: AuditAction): string {
  switch (action) {
    case "container.start":
      return "Start container";
    case "container.stop":
      return "Stop container";
    case "container.restart":
      return "Restart container";
    case "container.logs":
      return "View logs";
  }
}
