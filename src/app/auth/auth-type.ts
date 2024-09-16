import z from "zod";
import { company } from "@/lib/def";

export const signInSchema = z.object({
  email: z
    .string()
    .min(1, "Email or username is required")
    .refine(
      (value) => {
        if (value.includes("@")) {
          // If it contains '@', validate it's a proper email format and ends with the correct domain
          return z
            .string()
            .email("Invalid email format")
            .endsWith(
              `@${company.email_domain}`,
              `Email must end with @${company.email_domain}`,
            )
            .safeParse(value).success;
        } else {
          // If it does not contain '@', treat it as a username and validate
          return z
            .string()
            .min(3, "Username must be at least 3 characters long")
            .max(30, "Username must be no more than 30 characters long")
            .regex(
              /^[a-zA-Z0-9_-]+$/,
              "Username can only contain letters, numbers, underscores, and hyphens",
            )
            .safeParse(value).success;
        }
      },
      {
        message: "Invalid input: must be a valid email or username",
      },
    )
    .transform((value) => {
      // Transform username to email if it doesn't include '@'
      return value.includes("@") ? value : `${value}@${company.email_domain}`;
    }),
  password: z.string().min(8, {
    message: "Password is required",
  }),
});

export type SignInValues = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  email: z
    .string()
    .min(1, "Email or username is required")
    .refine(
      (value) => {
        if (value.includes("@")) {
          // If it contains '@', validate it's a proper email format and ends with the correct domain
          return z
            .string()
            .email("Invalid email format")
            .endsWith(
              `@${company.email_domain}`,
              `Email must end with @${company.email_domain}`,
            )
            .safeParse(value).success;
        } else {
          // If it does not contain '@', treat it as a username and validate
          return z
            .string()
            .min(3, "Username must be at least 3 characters long")
            .max(30, "Username must be no more than 30 characters long")
            .regex(
              /^[a-zA-Z0-9_-]+$/,
              "Username can only contain letters, numbers, underscores, and hyphens",
            )
            .safeParse(value).success;
        }
      },
      {
        message: "Invalid input: must be a valid email or username",
      },
    )
    .transform((value) => {
      // Transform username to email if it doesn't include '@'
      return value.includes("@") ? value : `${value}@${company.email_domain}`;
    }),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export type SignUpValues = z.infer<typeof signUpSchema>;
