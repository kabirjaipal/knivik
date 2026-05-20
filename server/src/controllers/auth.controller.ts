import { Request, Response } from 'express';
import { hashPassword, verifyPassword } from 'better-auth/crypto';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { db } from '../lib/db.js';
import { config } from '../lib/config.js';
import logger from '../lib/logger.js';
import { sendEmail, renderBaseEmail } from '../lib/mailer.js';
import { z } from 'zod';
import { getFrontendUrl } from '../lib/url.js';

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

/** Session duration shared across login, Google OAuth, and the JWT. */
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─────────────────────────────────────────────
// VALIDATION SCHEMAS
// ─────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email(),
  // Keep password validation minimal on login — never expose what the rules are on failure.
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

// ─────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────

/** Cookie options used consistently across all auth flows. */
const buildCookieOptions = () => ({
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: (config.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  path: '/',
});

/**
 * Creates a server-side session + issues the JWT cookie.
 * Single source of truth for all login flows (email/password and OAuth).
 */
const issueSession = async (res: Response, userId: string): Promise<string> => {
  const token = jwt.sign({ userId }, config.BETTER_AUTH_SECRET, { expiresIn: '7d' });

  await db.client.session.create({
    data: {
      userId,
      token,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    },
  });

  res.cookie('token', token, {
    ...buildCookieOptions(),
    maxAge: SESSION_DURATION_MS,
  });

  return token;
};


// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────

export const login = async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      // Generic error — do not leak which field is wrong (email enumeration)
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const { email, password } = parsed.data;
    const normalisedEmail = email.toLowerCase().trim();

    const user = await db.client.user.findUnique({ where: { email: normalisedEmail } });

    // Guard: user must exist and have a password (i.e. is not OAuth-only)
    if (!user || !user.password) {
      // Run a throwaway compare to prevent timing attacks
      await verifyPassword({
        hash: 'invalid_salt:invalid_key',
        password,
      });
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Validate password before checking email verification so we don't leak
    // whether an unverified account exists via the different error message.
    const isValidPassword = await verifyPassword({
      hash: user.password,
      password,
    });
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Block unverified accounts AFTER password check to avoid user enumeration
    if (!user.emailVerified) {
      res.status(403).json({
        error: 'Please verify your email address before logging in.',
        requiresVerification: true,
      });
      return;
    }

    await issueSession(res, user.id);

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        isScanning: user.isScanning,
        lastScanStatus: user.lastScanStatus,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Login error');
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────

export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.['token'] ?? req.headers.authorization?.split(' ')[1];

    if (token && typeof token === 'string') {
      await db.client.session.deleteMany({ where: { token } });
    }

    res.clearCookie('token', buildCookieOptions());
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error({ error }, 'Logout error');
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────

export const forgotPassword = async (req: Request, res: Response) => {
  // Normalise the success message outside the try so both branches return the
  // same shape — prevents email enumeration via response-time differences.
  const successResponse = {
    success: true,
    message: 'If an account exists, a reset link was sent.',
  };

  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid email' });
      return;
    }

    const { email } = parsed.data;
    const normalisedEmail = email.toLowerCase().trim();

    const user = await db.client.user.findUnique({ where: { email: normalisedEmail } });
    if (!user) {
      // Always return 200 to prevent email enumeration attacks
      res.status(200).json(successResponse);
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await db.client.otpCode.create({
      data: {
        userId: user.id,
        email: user.email,
        code: hashedToken,
        type: 'RESET_PASSWORD',
        expiresAt: new Date(Date.now() + 20 * 60 * 1000), // 20 minutes
      },
    });

    const resetUrl = `${getFrontendUrl(req)}/reset-password?token=${resetToken}`;

    const htmlTemplate = renderBaseEmail({
      title: 'Reset your password',
      preheader: 'Click the link to set a new password for your Knivik account.',
      bodyHtml: `<p>Click the button below to set a new password for your <strong>${config.PROJECT_NAME}</strong> account.</p>
                 <p style="margin-top: 12px; font-size: 13px; color: #ef4444; font-weight: 600;">This link expires in 20 minutes.</p>`,
      ctaText: 'Reset Password',
      ctaUrl: resetUrl,
      footerText: `Sent to ${user.email}. If you did not request a password reset, you can safely ignore this email.`
    });

    await sendEmail(user.email, `Reset your ${config.PROJECT_NAME} Password`, htmlTemplate);

    if (config.NODE_ENV !== 'production') {
      logger.info(`🚨 DEV PASSWORD RESET LINK: ${resetUrl}`);
    }

    res.status(200).json(successResponse);
  } catch (error) {
    logger.error({ error }, 'Forgot password error');
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────────

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid input' });
      return;
    }

    const { token, newPassword } = parsed.data;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const otpRecord = await db.client.otpCode.findFirst({
      where: {
        code: hashedToken,
        type: 'RESET_PASSWORD',
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otpRecord) {
      res.status(400).json({ error: 'Token is invalid or expired' });
      return;
    }

    // Mark token as used first (prevents a race-condition replay attack)
    await db.client.otpCode.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });

    // Hash via Better Auth's own algorithm so login verification works correctly
    const hashedPassword = await hashPassword(newPassword);

    // Update both tables atomically:
    // 1. user.password — read by our custom login flow
    // 2. account.password — read by Better Auth's sign-in/email handler
    const updatedUser = await db.client.user.update({
      where: { email: otpRecord.email },
      data: { password: hashedPassword },
    });

    // Validate and cast userId to prevent NoSQL/query injection via object/operator passing
    const targetUserId = String(updatedUser.id);

    await db.client.account.updateMany({
      where: {
        userId: { equals: targetUserId },
        providerId: { equals: 'credential' },
      },
      data: { password: hashedPassword },
    });

    // Invalidate ALL existing sessions for security on password reset.
    if (otpRecord.userId && typeof otpRecord.userId === 'string') {
      await db.client.session.deleteMany({ where: { userId: otpRecord.userId } });
    }

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    logger.error({ error }, 'Reset password error');
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────
// VERIFY EMAIL
// ─────────────────────────────────────────────

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const parsed = verifyEmailSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid parameters' });
      return;
    }

    const { token } = parsed.data;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const otpRecord = await db.client.otpCode.findFirst({
      where: {
        code: hashedToken,
        type: 'VERIFY_EMAIL',
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otpRecord) {
      res.status(400).json({ error: 'Verification link is invalid or expired' });
      return;
    }

    // Mark token as used before updating the user (prevents replay attacks)
    await db.client.otpCode.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });

    await db.client.user.update({
      where: { email: otpRecord.email },
      data: { emailVerified: true },
    });

    res.status(200).json({ success: true, message: 'Email fully verified! You can now log in.' });
  } catch (error) {
    logger.error({ error }, 'Verify Email Error');
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────
// GET ME
// ─────────────────────────────────────────────

export const getMe = async (req: Request, res: Response) => {
  // req.user is populated by requireAuth middleware
  res.status(200).json({ success: true, user: req.user });
};

// ─────────────────────────────────────────────
// GOOGLE OAUTH FLOW
// ─────────────────────────────────────────────

export const googleAuthUrl = async (_req: Request, res: Response) => {
  if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET) {
    res.status(500).json({ error: 'Google OAuth not configured on this server.' });
    return;
  }

  // Generate a stateless JWT for the state parameter (CSRF protection).
  // This avoids relying on cookies (which get stripped in cross-origin redirect chains)
  // or memory cache (which fails in serverless environments like Vercel).
  const state = jwt.sign({ purpose: 'google_oauth' }, config.BETTER_AUTH_SECRET, {
    expiresIn: '15m',
  });

  const client = new OAuth2Client(
    config.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET,
    config.GOOGLE_REDIRECT_URI
  );

  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['email', 'profile'],
    state,
  });

  res.redirect(authUrl);
};

export const googleCallback = async (req: Request, res: Response) => {
  const code = req.query?.['code'] as string | undefined;
  const returnedState = req.query?.['state'] as string | undefined;

  // Validate the JWT state (CSRF protection — no cookie or cache dependency).
  let isValidState = false;
  if (returnedState) {
    try {
      const decoded = jwt.verify(returnedState, config.BETTER_AUTH_SECRET) as any;
      if (decoded && decoded.purpose === 'google_oauth') {
        isValidState = true;
      }
    } catch (err) {
      logger.warn({ err }, 'OAuth state JWT verification failed');
      isValidState = false;
    }
  }

  if (!isValidState) {
    logger.warn('🚨 Potential CSRF attack detected in Google OAuth callback');
    res.redirect(`${getFrontendUrl(req)}/login?error=Invalid+state+parameter`);
    return;
  }

  if (!code) {
    res.redirect(`${getFrontendUrl(req)}/login?error=Missing+Google+Auth+Code`);
    return;
  }

  try {
    const client = new OAuth2Client(
      config.GOOGLE_CLIENT_ID,
      config.GOOGLE_CLIENT_SECRET,
      config.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await client.getToken(code);

    if (!tokens.id_token) {
      throw new Error('No id_token returned from Google');
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: config.GOOGLE_CLIENT_ID ?? '',
    });

    const payload = ticket.getPayload();
    if (!payload?.email || !payload.sub) {
      throw new Error('Invalid payload returned from Google');
    }

    const googleEmail = payload.email.toLowerCase().trim();
    const googleSub = payload.sub;

    // Find or create the user record.
    let user = await db.client.user.findUnique({ where: { email: googleEmail } });

    if (!user) {
      user = await db.client.user.create({
        data: {
          email: googleEmail,
          emailVerified: true, // OAuth emails are pre-verified by Google.
          username:
            (googleEmail.split('@')[0] ?? 'user').replace(/[^a-zA-Z0-9_-]/g, '') +
            Math.floor(Math.random() * 10000),
        },
      });
    } else if (!user.emailVerified) {
      // Edge-case: user registered with email/password but never verified,
      // then logs in with Google. Auto-verify their email since Google confirms it.
      await db.client.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    }

    // Bind the OAuth account record (upsert enforces uniqueness per provider+account).
    await db.client.oAuthAccount.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'GOOGLE',
          providerAccountId: googleSub,
        },
      },
      update: {},
      create: {
        userId: user.id,
        provider: 'GOOGLE',
        providerAccountId: googleSub,
      },
    });

    // Issue session cookie via the standard login flow.
    // NOTE: Do NOT pass the token in the URL — it leaks into browser history,
    // server access logs, and Referer headers. The HttpOnly cookie set by
    // issueSession() is the secure transport mechanism.
    await issueSession(res, user.id);

    res.redirect(`${getFrontendUrl(req)}/dashboard`);
  } catch (error) {
    logger.error({ error }, 'Google OAuth Error');
    res.redirect(`${getFrontendUrl(req)}/login?error=Google+Authentication+Failed`);
  }
};
