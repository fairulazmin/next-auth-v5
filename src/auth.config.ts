import { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";

import prisma from "../prisma/db";
import { signInSchema } from "./app/auth/auth-type";

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/auth/signin",
    newUser: "/auth/signup",
  },
  callbacks: {
    // authorized({ auth, request: { nextUrl } }) {
    //   return true;
    // },
    async session({ token, session }) {
      return { ...session, id: token.sub };
    },
    async jwt({ token }) {
      return token;
    },
  },
  providers: [
    Google,
    Credentials({
      async authorize(credentials) {
        const results = signInSchema.safeParse(credentials);

        if (results.success) {
          const { email, password } = results.data;

          const user = await prisma.user.findUnique({
            where: {
              email,
            },
          });

          if (!user || !user.password) return null;

          const passwordMatch = await bcrypt.compare(password, user.password);

          if (passwordMatch) return user;
        }
        return null;
      },
    }),
  ],
} satisfies NextAuthConfig;
