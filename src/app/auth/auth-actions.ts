"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import {
  SignInValues,
  signInSchema,
  SignUpValues,
  signUpSchema,
} from "./auth-type";
import prisma from "../../../prisma/db";
import { signIn } from "@/auth";

export const createUser = async (values: SignUpValues) => {
  try {
    const result = signUpSchema.safeParse(values);
    if (!result.success) {
      return { error: "Invalid input" };
    }

    const { email, password } = result.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "Email already exists" };
    }

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });
    return { success: "Successfully create user" };
  } catch (error) {
    return { error: "Something went wrong" };
  }
};

export const loginUser = async (values: SignInValues) => {
  try {
    const result = signInSchema.safeParse(values);

    if (!result.success) {
      return { error: "Invalid input" };
    }

    await signIn("credentials", { ...result.data, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials" };
        default:
          return { error: "Something went wrong!" };
      }
    }
    throw error;
  }
};

export const googleSignIn = async () => {
  await signIn("google", { redirectTo: "/" });
};
