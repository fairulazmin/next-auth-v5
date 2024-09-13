import z from "zod";
import { company } from "@/lib/def";

export const signInSchema = z.object({
  email: z.union([
    z
      .string()
      .email("Invalid email format")
      .refine(
        (email) => email.endsWith(`@${company.email_domain}`),
        `Email must end with @${company.email_domain}`,
      ),
    z
      .string()
      .min(1, "Username is required")
      .max(64, "Username must be 64 characters or less")
      .transform((username) => `${username}@${company.email_domain}`),
  ]),
  password: z.string().min(8, {
    message: "Password is required",
  }),
});

export const signUpSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(8, {
    message: "Password is required",
  }),
});
