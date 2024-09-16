<p align="center">
  <h3 align="center">Next Auth v5</h3>
    <p align="center" style="align: center;">
    <a href="https://authjs.dev/getting-started"><img src="https://authjs.dev/img/logo-sm.png" alt="AuthJs" height=20 width="auto"/></a>
    <a href=""><img src="https://lucide.dev/library-logos/shadcn-ui-dark.svg" height=20 width="auto"/></a>
    <a href="https://authjs.dev/getting-started/adapters/prisma"><img src="https://cdn.worldvectorlogo.com/logos/prisma-2.svg" height=20 width="auto"/></a>
    <img src="https://cdn.worldvectorlogo.com/logos/sqlite.svg" alt="SQLite" height=20 width="auto"/>
    <img src="https://shields.io/badge/TypeScript-3178C6?logo=TypeScript&logoColor=fff&style=flat-square" alt="TypeScript" />
  </p>
</p>



1) Set up a new Next.js project:
```bash
npx create-next-app@latest next-auth-v5 --typescript --tailwind --eslint
```

choose the following options:
- Yes to `src/` directory
- Yes to App Router
- No to customize import alias

2) Install prisma, next-auth and necessary dependencies:
```bash
cd next-auth-v5
npm i prisma @types/bcrypt --save-dev 
npm i @prisma/client @auth/prisma-adapter next-auth@beta sqlite bcryptjs
npx auth secret
npx prisma init --datasource-provider sqlite
```

3) Create a new [`prisma/db.ts`](https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices) file
```ts
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
```

4) Edit schema file at [`prisma/schema.prisma`](https://authjs.dev/getting-started/adapters/prisma) with the following models:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  password      String?
  accounts      Account[]
  sessions      Session[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

model Account {
  id                 String  @id @default(cuid())
  userId             String
  type               String
  provider           String
  providerAccountId  String
  refresh_token      String?
  access_token       String?
  expires_at         Int?
  token_type         String?
  scope              String?
  id_token           String?
  session_state      String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verificationtokens")
}
```

5) Run the following command to create the SQLite database:
```bash
npx prisma migrate dev --name init
```

6) Add `Handlers` at `api/auth/[...nextauth]/route.ts` so that Auth.js can run on any incoming request
```ts
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

7) Add [Google](https://authjs.dev/getting-started/providers/google) Provider
- Create new project
- Configure [Google OAuth consent screen](https://console.cloud.google.com/apis/consent)

  ✅ User Type: External

  ✅ Give App name
  
  ✅ Enter user support email
  
  ✅ Enter developer contact information
  
  ✅ Under ADD OR REMOVE SCOPES: checked userinfo.email & userinfo.profile
- Configure [Google Credentials](https://console.cloud.google.com/apis/credentials)
  
  ✅ Click CREATE CREDENTIALS and select OAuth client ID
  
  ✅ Select `Web application` for Application type
  
  ✅ Insert `https://localhost:3000/api/auth/callback/google` for Authorized redirect URIs
- Add environment variables in `.env.local` file
  ```
  AUTH_GOOGLE_ID="xxx"
  AUTH_GOOGLE_SECRET="xxx"
  ```

8) Set up `Auth Config` at `app/auth.config.ts`
```ts
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
```

9) Set up `Auth` at `app/auth.ts`
```ts
import NextAuth from "next-auth";

import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
});
```

10) Create `Routes` at `lib/routes.ts`
```ts
/**
 * An array of routes that are accessible to the public
 * These routes do not require authentication
 * @type {string[]}
 */
export const publicRoutes: string[] = [];

/**
 * An array of routes that are used for authentication
 * These routes will redirect logged in users to /
 * @type {string[]}
 */
export const authRoutes: string[] = ["/auth/signin", "/auth/signup"];

/**
 * The prefix for API authentication routes
 * Routes that start with this prefix are used for API authentication process
 * @type {string}
 */
export const apiAuthPrefix: string = "/api/auth";

/**
 * The default redirect path after logged in
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT: string = "/";
```
11) Set up `Middleware` at `app/middleware.ts`
```ts
import { authConfig } from "./auth.config";
import NextAuth from "next-auth";
import {
  publicRoutes,
  authRoutes,
  apiAuthPrefix,
  DEFAULT_LOGIN_REDIRECT,
} from "./lib/route";

const { auth: middleware } = NextAuth(authConfig);

export default middleware((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  if (isApiAuthRoute) return;

  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    } else {
      return;
    }
  }

  if (!isLoggedIn && !isPublicRoute)
    return Response.redirect(new URL("/auth/signin", nextUrl));

  return;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
```


12) Setup `User Schema & type` at `auth/auth-actions.ts`
```ts
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
``` 

13) Install [shadcn](https://ui.shadcn.com/docs/installation/next) and its components
```bash
npx shadcn@latest init
npx shadcn@latest add input card form toast dropdown-menu checkbox sheet avatar
```

14) Set up `Auth Types` at `auth/auth-type.ts`
```ts
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
```

15) Set up `Auth Actions` at `auth/auth-actions.ts`
```ts
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
```

16) Set up Sign In page at `auth/signin/page.tsx`
```tsx
"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { signInSchema, SignInValues } from "@/app/auth/auth-type";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { company } from "@/lib/def";
import { GoogleSignIn } from "@/components/custom/google-signin-button";
import { loginUser } from "../auth-actions";
import { useTransition } from "react";
import { toast } from "@/hooks/use-toast";

const SignInPage = () => {
  const [isLoading, startTransition] = useTransition();
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: SignInValues) => {
    startTransition(async () => {
      const login = await loginUser(values);
      login?.error &&
        toast({
          title: "Toast",
          description: login.error,
          variant: "destructive",
          duration: 2000,
        });
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="grid gap-4"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              className="pr-32"
                              placeholder="username"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <span className="absolute right-1 top-2 mr-2 text-muted-foreground">
                            @{company.email_domain}
                          </span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    Login
                    {isLoading && (
                      <Loader2 className="ml-2 w-4 h-4 animate-spin" />
                    )}
                  </Button>
                </form>
              </Form>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <GoogleSignIn />
          </div>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="underline">
              Sign Up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignInPage;
```

17) Set up Sign Up page at `auth/signup/page.tsx`
```tsx
"use client";

import Link from "next/link";
import { redirect } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signUpSchema, SignUpValues } from "@/app/auth/auth-type";
import { company } from "@/lib/def";
import { createUser } from "../auth-actions";
import { GoogleSignIn } from "@/components/custom/google-signin-button";

const SignUpPage = () => {
  const [isLoading, startTransition] = useTransition();

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: SignUpValues) => {
    startTransition(async () => {
      const login = await createUser(values);
      if (login.error) {
        toast({
          title: "Toast",
          description: login.error,
          variant: "destructive",
          duration: 2000,
        });
      }
      toast({
        title: "Toast",
        description: login.success,
        duration: 2000,
      });
      redirect("/auth/signin");
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Register</CardTitle>
          <CardDescription>Enter your email below to register</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="grid gap-4"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              className="pr-32"
                              placeholder="username"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <span className="absolute right-1 top-2 mr-2 text-muted-foreground">
                            @{company.email_domain}
                          </span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isLoading} className="w-full">
                    Register
                    {isLoading && (
                      <Loader2 className="ml-2 w-4 h-4 animate-spin" />
                    )}
                  </Button>
                </form>
              </Form>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <GoogleSignIn />
          </div>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/auth/signin" className="underline">
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUpPage;
```

18) Alter `next.config.mjs`
```mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**", // Allow all paths
      },
    ],
  },
};

export default nextConfig;
```
