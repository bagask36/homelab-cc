import { z } from "zod";

export const containerActionRequestSchema = z.object({
  confirmed: z.literal(true),
  containerName: z.string().trim().min(1, "Container name is required"),
});

export const containerActionResponseSchema = z.object({
  status: z.enum(["ok", "unavailable"]),
  message: z.string().optional(),
  errors: z.array(z.string()).optional(),
});

export const containerLogsResponseSchema = z.object({
  status: z.enum(["ok", "unavailable"]),
  containerId: z.string(),
  containerName: z.string(),
  logs: z.string(),
  errors: z.array(z.string()).optional(),
});

export type ContainerActionRequest = z.infer<
  typeof containerActionRequestSchema
>;
export type ContainerActionResponse = z.infer<
  typeof containerActionResponseSchema
>;
export type ContainerLogsResponse = z.infer<typeof containerLogsResponseSchema>;
