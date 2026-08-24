import { z } from "zod";

export const filesystemSchema = z.object({
  fs: z.string(),
  type: z.string(),
  mount: z.string(),
  size: z.number(),
  used: z.number(),
  available: z.number(),
  usagePercent: z.number(),
});

export const storageSummarySchema = z.object({
  total: z.number(),
  used: z.number(),
  available: z.number(),
  usagePercent: z.number(),
});

export const storageResponseSchema = z.object({
  status: z.enum(["ok", "partial", "unavailable"]),
  timestamp: z.string(),
  summary: storageSummarySchema.optional(),
  primary: filesystemSchema.optional(),
  filesystems: z.array(filesystemSchema).optional(),
  errors: z.array(z.string()).optional(),
});

export type Filesystem = z.infer<typeof filesystemSchema>;
export type StorageSummary = z.infer<typeof storageSummarySchema>;
export type StorageResponse = z.infer<typeof storageResponseSchema>;
