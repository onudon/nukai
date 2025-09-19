import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { getConnection } from "@/lib/db";

export const { auth, handlers } = NextAuth({
  providers: [
    Credentials({
      name: "Username + Password",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        const conn = await getConnection();
        const [rows] = await conn.execute(
          "SELECT id, username, password, isAdmin FROM users WHERE username = ?",
          [credentials.username]
        );
        await conn.end();
        const user = (rows as any[])[0];
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        return { id: user.id, name: user.username, isAdmin: user.isAdmin };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.isAdmin = user.isAdmin;
      return token;
    },
    async session({ session, token }) {
      session.user.isAdmin = token.isAdmin;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
});