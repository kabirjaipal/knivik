import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { username } from 'better-auth/plugins';
import { db } from './db.js';
import { config } from './config.js';
import { sendEmail, renderBaseEmail } from './mailer.js';
import logger from './logger.js';

export const auth: any = betterAuth({
  database: prismaAdapter(db.client, { provider: 'postgresql' }),
  secret: config.BETTER_AUTH_SECRET,
  baseURL: `${config.BETTER_AUTH_URL}/api/auth`,

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

  plugins: [username()],
  user: {
    fields: {
      name: 'displayUsername',
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
      // Log in dev so you can verify without needing SMTP configured
      if (config.NODE_ENV !== 'production') {
        logger.info(`🔗 DEV VERIFY LINK for ${user.email}: ${url}`);
      }

      // Fire-and-forget — don't let mailer failures block signup
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
    config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: config.GOOGLE_CLIENT_ID,
            clientSecret: config.GOOGLE_CLIENT_SECRET,
            mapProfileToUser: (profile) => {
              return {
                username: profile.email.split('@')[0],
              };
            },
          },
        }
      : undefined,

  trustedOrigins: config.FRONTEND_URL.split(',').map((url) => url.trim()),

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
  },

  advanced: {
    useSecureCookies: config.NODE_ENV === 'production',
    trustHeaders: true,
    crossSubDomainCookies: {
      enabled: false,
    },
    defaultCookieAttributes: {
      secure: config.NODE_ENV === 'production',
      sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      httpOnly: true,
    },
  },

  rateLimit: {
    window: 60, // 1 minute window
    max: 100, // 100 requests per window
  },
});
