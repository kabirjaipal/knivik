import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username } from "better-auth/plugins";
import { z } from "zod"; // Required to fix "portable" type error
import { db } from "./db.js";
import { config } from "./config.js";

export const auth: any = betterAuth({
  database: prismaAdapter(db.client, { provider: "postgresql" }),
  secret: config.BETTER_AUTH_SECRET,
  baseURL: `${config.BETTER_AUTH_URL}/api/auth`,

  plugins: [
    username()
  ],
  user: {
    additionalFields: {
      role: { type: "string" },
      plan: { type: "string" },
      subscriptionStatus: { type: "string" },
      dodoCustomerId: { type: "string" },
      isScanning: { type: "boolean" },
      lastScanStatus: { type: "string" },
    }
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
    password: {
      hash: async (password: string) => {
        const bcrypt = await import("bcryptjs");
        return bcrypt.hash(password, 12);
      },
      verify: async ({ hash, password }: { hash: string; password: string }) => {
        try {
          const bcrypt = await import("bcryptjs");
          return await bcrypt.compare(password, hash);
        } catch (e) {
          return false;
        }
      },
    },
  },

  socialProviders: config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: config.GOOGLE_CLIENT_ID,
          clientSecret: config.GOOGLE_CLIENT_SECRET,
          mapProfileToUser: (profile) => {
            return {
              username: profile.email.split("@")[0],
            };
          },
        },
      }
    : undefined,

  trustedOrigins: [config.FRONTEND_URL],

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
  },

  advanced: {
    useSecureCookies: config.NODE_ENV === "production",
    crossSubDomainCookies: {
      enabled: false,
    },
    defaultCookieAttributes: {
      secure: config.NODE_ENV === "production",
      sameSite: config.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      httpOnly: true,
    },
  },

  rateLimit: {
    window: 60, // 1 minute window
    max: 100,   // 100 requests per window
  },

  callbacks: {
    async session({ session, user }: any) {
      const userData = await db.client.user.findUnique({
        where: { id: user.id },
        select: {
          role: true,
          plan: true,
          subscriptionStatus: true,
          dodoCustomerId: true,
          isScanning: true,
          lastScanStatus: true,
        },
      });

      if (userData) {
        return {
          session,
          user: {
            ...user,
            role: userData.role,
            plan: userData.plan,
            subscriptionStatus: userData.subscriptionStatus,
            dodoCustomerId: userData.dodoCustomerId,
            isScanning: userData.isScanning,
            lastScanStatus: userData.lastScanStatus,
          },
        };
      }
      return { session, user };
    },
  },
});
