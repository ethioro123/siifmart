import { PrismaAdapter } from "@next-auth/prisma-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { AuthOptions as NextAuthConfig } from "next-auth";
import bcrypt from "bcrypt";
import { prisma } from "./prisma";

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: Record<string, string> | undefined) {
        const email = (credentials?.email ?? "").toLowerCase();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;
        const ok = await bcrypt.compare(credentials?.password ?? "", user.passwordHash);
        if (!ok) return null;
        return { id: user.id, name: user.name ?? undefined, email: user.email ?? undefined, role: user.role } as { id: string; name?: string; email?: string; role: string };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: { role?: string } & Record<string, unknown>; user?: { role?: string } | null }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: { role?: string } & Record<string, unknown>; token: { role?: string } & Record<string, unknown> }) {
      session.role = token.role;
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);
