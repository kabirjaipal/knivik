import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { db } from '../lib/db.js';
import { config } from '../lib/config.js';
import logger from '../lib/logger.js';
import { sendEmail } from '../lib/mailer.js';
import { z } from 'zod';

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

/** Session duration shared across login, Google OAuth, and the JWT. */
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─────────────────────────────────────────────
// VALIDATION SCHEMAS
// ─────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email(),
  // Usernames: alphanumeric + underscores + hyphens only. Prevents injection / path weirdness.
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username may only contain letters, numbers, underscores, and hyphens'
    ),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  // Keep password validation minimal on login — never expose what the rules are on failure.
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

const verifyEmailSchema = z.object({
  email: z.string().email(),
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
// REGISTER
// ─────────────────────────────────────────────

export const register = async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid input parameters', details: parsed.error.issues });
      return;
    }

    const { email, username, password } = parsed.data;

    // Normalise email to avoid duplicate accounts from case differences
    const normalisedEmail = email.toLowerCase().trim();

    // Check if user exists
    const existingUser = await db.client.user.findFirst({
      where: { OR: [{ email: normalisedEmail }, { username }] },
    });

    if (existingUser) {
      res.status(409).json({ error: 'User with this email or username already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, config.BCRYPT_ROUNDS);

    const user = await db.client.user.create({
      data: {
        email: normalisedEmail,
        username,
        password: hashedPassword,
      },
    });

    // Generate and store a hashed email-verification token
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(verifyToken, config.BCRYPT_ROUNDS);

    await db.client.otpCode.create({
      data: {
        userId: user.id,
        email: user.email,
        code: hashedToken,
        type: 'VERIFY_EMAIL',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    const verifyUrl = `${config.FRONTEND_URL}/verify-email?token=${verifyToken}&email=${encodeURIComponent(user.email)}`;

    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
        <h2 style="color: #0f172a;">Welcome to ${config.PROJECT_NAME}!</h2>
        <p>Please confirm your email address so you can log into your dashboard.</p>
        <br/>
        <a href="${verifyUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
        <br/>
      </div>
    `;

    await sendEmail(user.email, `Verify Your ${config.PROJECT_NAME} Account`, htmlTemplate);

    // Only log verify links in non-production environments
    if (config.NODE_ENV !== 'production') {
      logger.info(`🚨 DEV VERIFY LINK: ${verifyUrl}`);
    }

    res.status(201).json({
      success: true,
      message: 'Account created. Please check your email to verify your address.',
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
    logger.error({ error }, 'Registration error');
    res.status(500).json({ error: 'Internal server error' });
  }
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
      // Constant-time check to prevent timing attacks that reveal whether an
      // email exists in the DB (run a throwaway bcrypt compare regardless).
      await bcrypt.compare(
        password,
        '$2b$12$invalidhashpadding000000000000000000000000000000000000000'
      );
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Validate password before checking email verification so we don't leak
    // whether an unverified account exists via the different error message.
    const isValidPassword = await bcrypt.compare(password, user.password);
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

    if (token) {
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
    const hashedToken = await bcrypt.hash(resetToken, config.BCRYPT_ROUNDS);

    await db.client.otpCode.create({
      data: {
        userId: user.id,
        email: user.email,
        code: hashedToken,
        type: 'RESET_PASSWORD',
        expiresAt: new Date(Date.now() + 20 * 60 * 1000), // 20 minutes
      },
    });

    const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
        <h2 style="color: #0f172a;">Password Reset Request</h2>
        <p>You requested to reset your password for ${config.PROJECT_NAME}. Please click the button below to choose a new password. This link will expire in 20 minutes.</p>
        <br/>
        <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Your Password</a>
        <br/>
        <p style="margin-top: 30px; font-size: 12px; color: #64748b;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;

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

    const { email, token, newPassword } = parsed.data;
    const normalisedEmail = email.toLowerCase().trim();

    const otpCodes = await db.client.otpCode.findMany({
      where: {
        email: normalisedEmail,
        type: 'RESET_PASSWORD',
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (otpCodes.length === 0) {
      res.status(400).json({ error: 'Token is invalid or expired' });
      return;
    }

    let matchingOtp = null;
    for (const otp of otpCodes) {
      if (await bcrypt.compare(token, otp.code)) {
        matchingOtp = otp;
        break; // Stop on first match — no need to check the rest
      }
    }

    if (!matchingOtp) {
      res.status(400).json({ error: 'Token is invalid or expired' });
      return;
    }

    // Mark token as used first (prevents a race-condition replay attack)
    await db.client.otpCode.update({
      where: { id: matchingOtp.id },
      data: { usedAt: new Date() },
    });

    const hashedPassword = await bcrypt.hash(newPassword, config.BCRYPT_ROUNDS);

    await db.client.user.update({
      where: { email: normalisedEmail },
      data: { password: hashedPassword },
    });

    // Invalidate ALL existing sessions for the user on password reset for security.
    if (matchingOtp.userId) {
      await db.client.session.deleteMany({ where: { userId: matchingOtp.userId } });
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

    const { email, token } = parsed.data;
    const normalisedEmail = email.toLowerCase().trim();

    const otpCodes = await db.client.otpCode.findMany({
      where: {
        email: normalisedEmail,
        type: 'VERIFY_EMAIL',
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (otpCodes.length === 0) {
      res.status(400).json({ error: 'Verification link is invalid or expired' });
      return;
    }

    let matchingOtp = null;
    for (const otp of otpCodes) {
      if (await bcrypt.compare(token, otp.code)) {
        matchingOtp = otp;
        break;
      }
    }

    if (!matchingOtp) {
      res.status(400).json({ error: 'Verification link is invalid or expired' });
      return;
    }

    // Mark token as used before updating the user (prevents replay attacks)
    await db.client.otpCode.update({
      where: { id: matchingOtp.id },
      data: { usedAt: new Date() },
    });

    await db.client.user.update({
      where: { email: normalisedEmail },
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
    res.redirect(`${config.FRONTEND_URL}/login?error=Invalid+state+parameter`);
    return;
  }

  if (!code) {
    res.redirect(`${config.FRONTEND_URL}/login?error=Missing+Google+Auth+Code`);
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

    // Issue a session JWT identical to the standard login flow.
    const token = await issueSession(res, user.id);

    // Redirect to the frontend callback so it can set the cookie in a first-party context
    res.redirect(`${config.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (error) {
    logger.error({ error }, 'Google OAuth Error');
    res.redirect(`${config.FRONTEND_URL}/login?error=Google+Authentication+Failed`);
  }
};
