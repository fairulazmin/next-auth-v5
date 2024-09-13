1) Set up a new Next.js project:
```
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
npm i @prisma/client @auth/prisma-adapter next-auth@beta sqlite bcrypt
npx auth secret
npx prisma init --datasource-provider sqlite
```

3) [Create a new `prisma/db.ts` file](https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices)
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

4) [Edit schema file at `prisma/schema.prisma` with the following models:](https://authjs.dev/getting-started/adapters/prisma)
```
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

6) Set up `auth.ts` at root of app
```
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Pri
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
})
```

7) Add `handlers` at `api/auth/[...nextauth]/route.ts` so that Auth.js can run on any incoming request
```
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

8) Setup user schema at `auth/actions.ts`
```ts
import z from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .email({
      message: "Email is required",
    })
    .transform((val) => `${val}@mysa.gov.my`),
  password: z.string().min(8, {
    message: "Password is required",
  }),
});

export const registerSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(8, {
    message: "Password is required",
  }),
});
``` 
9) Install (shadcn)[https://ui.shadcn.com/docs/installation/next] and its components
```bash
npx shadcn@latest init
npx shadcn@latest add input card form
```

10) Set up Sign In page at `auth/signin/page.tsx`
```tsx



11) Set up Sign Up page at `auth/signup/page.tsx`
```tsx

```
