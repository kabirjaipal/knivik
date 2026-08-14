import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { username, admin } from 'better-auth/plugins';
import { db } from './db';
import { config } from './config';
import { sendEmail, renderBaseEmail } from './mailer';
import logger from './logger';

export const auth: any = betterAuth({
  database: prismaAdapter(db.client, { provider: 'postgresql' }),
  secret: process.env.BETTER_AUTH_SECRET || config.BETTER_AUTH_SECRET,
  baseURL: `${process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth`,

  databaseHooks: {
    account: {
      create: {
        after: async (account) => {
          if (account.providerId === 'credential' && account.password) {
            await db.client.user.update({
              where: { id: account.userId },
              data: { password: account.password },
            });
          }
        },
      },
      update: {
        after: async (account) => {
          if (account.providerId === 'credential' && account.password) {
            await db.client.user.update({
              where: { id: account.userId },
              data: { password: account.password },
            });
          }
        },
      },
    },
  },

  plugins: [
    username(),
    admin({
      defaultRole: 'user',
      adminRoles: ['admin'],
    }),
  ],
  user: {
    fields: {
      name: 'displayUsername',
    },
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'user'
      }
    }
  },

  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
      if (process.env.NODE_ENV !== 'production') {
        logger.info(`🔗 DEV VERIFY LINK for ${user.email}: ${url}`);
      }

      const htmlTemplate = renderBaseEmail({
        title: 'Confirm your email',
        preheader: `Welcome to ${config.PROJECT_NAME}! Confirm your email address to get started.`,
        bodyHtml: `<p>Welcome to <strong>${config.PROJECT_NAME}</strong>! Click the button below to confirm your email address and unlock your workspace.</p>
                   <p style="margin-top: 12px; font-size: 13px; color: #64748b;">This link expires in 24 hours.</p>`,
        ctaText: 'Verify Email',
        ctaUrl: url,
        footerText: `Sent to ${user.email}. If you didn't sign up for ${config.PROJECT_NAME}, you can safely ignore this email.`,
      });
      sendEmail(user.email, `Verify Your ${config.PROJECT_NAME} Account`, htmlTemplate).catch(
        (err) => logger.error({ err }, 'sendVerificationEmail: mailer error'),
      );
    },
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: false,
    requireEmailVerification: true,
  },

  socialProviders:
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            mapProfileToUser: (profile) => {
              return {
                username: profile.email.split('@')[0],
              };
            },
          },
        }
      : undefined,

  trustedOrigins: (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').split(',').map((url) => url.trim()),

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },

  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
    trustHeaders: true,
    crossSubDomainCookies: {
      enabled: false,
    },
    defaultCookieAttributes: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      httpOnly: true,
    },
  },
});

export default auth;
