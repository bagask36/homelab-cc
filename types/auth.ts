import { z } from "zod";

import { MIN_PASSWORD_LENGTH } from "@/lib/auth/constants";

export const loginRequestSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(
      MIN_PASSWORD_LENGTH,
      `New password must be at least ${MIN_PASSWORD_LENGTH} characters`
    ),
});

export const sessionResponseSchema = z.object({
  status: z.enum(["ok", "unavailable"]),
  user: z
    .object({
      id: z.string(),
      username: z.string(),
    })
    .optional(),
  errors: z.array(z.string()).optional(),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
