import { z } from "zod";

export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters")
    .optional(),
  phone: z
    .string()
    .max(20, "Phone number cannot exceed 20 characters")
    .regex(/^[+0-9\s\-()]*$/, "Invalid phone number format")
    .nullable()
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
