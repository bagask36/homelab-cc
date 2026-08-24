import { z } from "zod";

export const networkInterfaceSchema = z.object({
  iface: z.string(),
  operstate: z.string(),
  rxBytes: z.number(),
  txBytes: z.number(),
});

export const networkTotalsSchema = z.object({
  rxBytes: z.number(),
  txBytes: z.number(),
});

export const networkResponseSchema = z.object({
  status: z.enum(["ok", "partial", "unavailable"]),
  timestamp: z.string(),
  totals: networkTotalsSchema.optional(),
  interfaces: z.array(networkInterfaceSchema).optional(),
  errors: z.array(z.string()).optional(),
});

export type NetworkInterface = z.infer<typeof networkInterfaceSchema>;
export type NetworkTotals = z.infer<typeof networkTotalsSchema>;
export type NetworkResponse = z.infer<typeof networkResponseSchema>;

export type NetworkHistoryPoint = {
  time: string;
  download: number;
  upload: number;
};
