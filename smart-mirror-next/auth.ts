import NextAuth, { type DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { JWT } from "next-auth/jwt";

// Extend the Session type
declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string;
    error?: string;
  }
}

// Extend the JWT type
declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  secret: process.env.NEXTAUTH_SECRET || "your-secret-should-be-in-env-file",
  providers: [
    GoogleProvider({
      clientId: process.env.GCP_CLIENT_ID as string,
      clientSecret: process.env.GCP_CLIENT_SECRET as string,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly",
          prompt: "consent",
          access_type: "offline",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Persist the OAuth access_token and refresh_token to the token
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      // Add the access token to the session
      session.accessToken = token.accessToken;
      return session;
    },
  },
}); 