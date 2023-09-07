import { z } from "zod";

export const loginSchema = z.object({
  firstName: z.string().min(1, "First name can't be empty"),
  lastName: z.string().min(1, "Last name can't be empty"),
  password: z.string().min(1, "Password can't be empty"),
});

export const signUpSchema = z.object({
  secretCode: z.string().min(1, "Secret code can't be empty"),
  firstName: z
    .string()
    .min(1, "First name can't be empty")
    .max(20, "First name must contain at most 20 characters"),
  lastName: z
    .string()
    .min(1, "Last name can't be empty")
    .max(20, "Last name must contain at most 20 characters"),
  password: z.string().min(4, "Password must contain at least 4 characters"),
});
