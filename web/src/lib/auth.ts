import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthOptions, Session, User } from "next-auth";
import type { AdapterUser } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";
import bcrypt from "bcrypt";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
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
    async jwt({ token, user }: { token: JWT; user?: User | AdapterUser | null }) {
      if (user && (user as User & { role?: string }).role) {
        (token as JWT & { role?: string }).role = (user as User & { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      (session as Session & { role?: string }).role = (token as JWT & { role?: string }).role;
      return session;
    },
  },
};
