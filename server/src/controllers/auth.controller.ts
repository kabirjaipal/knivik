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

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  token: z.string(),
  newPassword: z.string().min(8),
});

export const register = async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid input parameters', details: parsed.error.issues });
      return;
    }

    const { email, username, password } = parsed.data;

    // Check if user exists
    const existingUser = await db.client.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });

    if (existingUser) {
      res.status(409).json({ error: 'User with this email or username already exists' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, config.BCRYPT_ROUNDS);

    // Create user
    const user = await db.client.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      }
    });

    // Create a VERIFY_EMAIL OtpCode natively
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(verifyToken, config.BCRYPT_ROUNDS);

    await db.client.otpCode.create({
      data: {
        userId: user.id,
        email: user.email,
        code: hashedToken,
        type: 'VERIFY_EMAIL',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    });

    // Send Verification Email
    const verifyUrl = `${config.FRONTEND_URL}/verify-email?token=${verifyToken}&email=${encodeURIComponent(user.email)}`;
    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; max-w-[600px] margin: auto; padding: 20px;">
        <h2 style="color: #0f172a;">Welcome to ${config.PROJECT_NAME}!</h2>
        <p>Please confirm your email address so you can log into your dashboard.</p>
        <br/>
        <a href="${verifyUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
        <br/>
      </div>
    `;

    await sendEmail(user.email, `Verify Your ${config.PROJECT_NAME} Account`, htmlTemplate);
    logger.info(`🚨 DEV VERIFY LINK: ${verifyUrl}`);

    res.status(201).json({
      success: true,
      message: 'Account created. Please check your email to verify your address.',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        isScanning: user.isScanning,
        lastScanStatus: user.lastScanStatus
      }
    });
    return;
  } catch (error) {
    logger.error({ error }, 'Registration error');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid input parameters', details: parsed.error.issues });
      return;
    }

    const { email, password } = parsed.data;

    // Find the user
    const user = await db.client.user.findUnique({
      where: { email }
    });

    if (!user || !user.password) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Explicit Verification Block
    if (!user.emailVerified) {
      res.status(403).json({ error: 'Please verify your email address before logging in.', requiresVerification: true });
      return;
    }

    // Validate password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Create token
    const token = jwt.sign(
      { userId: user.id },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create server-side session
    await db.client.session.create({
      data: {
        userId: user.id,
        sessionToken: token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        isScanning: user.isScanning,
        lastScanStatus: user.lastScanStatus
      }
    });
  } catch (error) {
    logger.error({ error }, 'Login error');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.['token'] || req.headers.authorization?.split(' ')[1];
    
    if (token) {
      // Remove server-side session tracking
      await db.client.session.deleteMany({
        where: { sessionToken: token }
      });
    }

    res.clearCookie('token', {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error({ error }, 'Logout error');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: 'Invalid email' }); return; }

    const { email } = parsed.data;
    const user = await db.client.user.findUnique({ where: { email } });
    if (!user) {
      // Return success anyway to prevent email enumeration attacks
      res.status(200).json({ success: true, message: 'If an account exists, a reset link was sent.' });
      return;
    }

    // Generate token and hash it
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, config.BCRYPT_ROUNDS);

    await db.client.otpCode.create({
      data: {
        userId: user.id,
        email: user.email,
        code: hashedToken,
        type: 'RESET_PASSWORD',
        expiresAt: new Date(Date.now() + 20 * 60 * 1000) // 20 minutes
      }
    });

    // Send the email via Nodemailer
    const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;
    
    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; max-w-[600px] margin: auto; padding: 20px;">
        <h2 style="color: #0f172a;">Password Reset Request</h2>
        <p>You requested to reset your password for ${config.PROJECT_NAME}. Please click the button below to choose a new password. This link will expire in 20 minutes.</p>
        <br/>
        <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Your Password</a>
        <br/>
        <p style="margin-top: 30px; font-size: 12px; color: #64748b;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;

    await sendEmail(user.email, `Reset your ${config.PROJECT_NAME} Password`, htmlTemplate);

    // For local dev, we will log it so we can easily copy-paste
    logger.info(`🚨 DEV PASSWORD RESET LINK: ${resetUrl}`);

    res.status(200).json({ success: true, message: 'If an account exists, a reset link was sent.' });
  } catch (error) {
    logger.error({ error }, 'Forgot password error');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: 'Invalid input' }); return; }

    const { email, token, newPassword } = parsed.data;

    // Find unused OTP codes for this email
    const otpCodes = await db.client.otpCode.findMany({
      where: {
        email,
        type: 'RESET_PASSWORD',
        usedAt: null,
        expiresAt: { gt: new Date() } // not expired
      }
    });

    if (otpCodes.length === 0) {
       res.status(400).json({ error: 'Token is invalid or expired' }); return;
    }

    let matchingOtp = null;
    for (const otp of otpCodes) {
      const isValid = await bcrypt.compare(token, otp.code);
      if (isValid) matchingOtp = otp;
    }

    if (!matchingOtp) { res.status(400).json({ error: 'Token is invalid or expired' }); return; }

    // Mark as used
    await db.client.otpCode.update({
      where: { id: matchingOtp.id },
      data: { usedAt: new Date() }
    });

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, config.BCRYPT_ROUNDS);
    await db.client.user.update({
      where: { email },
      data: { password: hashedPassword }
    });

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    logger.error({ error }, 'Reset password error');
    res.status(500).json({ error: 'Internal server error' });
  }
};

const verifyEmailSchema = z.object({
  email: z.string().email(),
  token: z.string()
});

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const parsed = verifyEmailSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: 'Invalid parameters' }); return; }

    const { email, token } = parsed.data;

    const otpCodes = await db.client.otpCode.findMany({
      where: {
        email,
        type: 'VERIFY_EMAIL',
        usedAt: null,
        expiresAt: { gt: new Date() }
      }
    });

    if (otpCodes.length === 0) {
      res.status(400).json({ error: 'Verification link is invalid or expired' }); return;
    }

    let matchingOtp = null;
    for (const otp of otpCodes) {
      if (await bcrypt.compare(token, otp.code)) matchingOtp = otp;
    }

    if (!matchingOtp) { res.status(400).json({ error: 'Verification link is invalid or expired' }); return; }

    // Mark verified
    await db.client.user.update({
      where: { email },
      data: { emailVerified: new Date() }
    });

    await db.client.otpCode.update({
      where: { id: matchingOtp.id },
      data: { usedAt: new Date() }
    });

    res.status(200).json({ success: true, message: 'Email fully verified! You can now log in.' });
  } catch (error) {
    logger.error({ error }, 'Verify Email Error');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  // @ts-ignore req.user is populated by authMiddleware
  const user = req.user;
  res.status(200).json({ success: true, user });
};

// ─────────────────────────────────────────────
// GOOGLE OAUTH FLOW
// ─────────────────────────────────────────────
export const googleAuthUrl = (_req: Request, res: Response) => {
  if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET) {
    res.status(500).json({ error: 'Google OAuth not configured on this server.' });
    return;
  }

  const client = new OAuth2Client(config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET, 'http://localhost:3001/api/auth/google/callback');
  
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['email', 'profile']
  });
  
  res.redirect(authUrl);
};

export const googleCallback = async (req: Request, res: Response) => {
  const code = req.query?.['code'] as string;
  if (!code) {
    res.redirect(`${config.FRONTEND_URL}/login?error=Missing+Google+Auth+Code`);
    return;
  }

  try {
    const client = new OAuth2Client(config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET, 'http://localhost:3001/api/auth/google/callback');
    const { tokens } = await client.getToken(code);
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token || "",
      audience: config.GOOGLE_CLIENT_ID || ""
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) throw new Error("Invalid payload returned from Google");
    
    const googleEmail = payload.email as string;
    const googleSub = payload.sub as string;

    // 1. Find or create user
    let user = await db.client.user.findUnique({ where: { email: googleEmail } });

    if (!user) {
      user = await db.client.user.create({
        data: {
          email: googleEmail,
          emailVerified: new Date(), // Auto-verify OAuth emails natively!
          username: (googleEmail.split('@')[0] || 'user') + Math.floor(Math.random() * 10000), // Secure fallback name
        }
      });
    }

    // 2. Bind OAuth account record (Upsert enforces uniqueness of provider+account combination)
    await db.client.oAuthAccount.upsert({
      where: { 
        provider_providerAccountId: { 
          provider: 'GOOGLE', 
          providerAccountId: googleSub 
        } 
      },
      update: {},
      create: {
        userId: user.id,
        provider: 'GOOGLE',
        providerAccountId: googleSub,
      }
    });

    // 3. Force-login the user inside our native DB System exactly as standard logins work
    const token = jwt.sign({ userId: user.id }, config.JWT_SECRET, { expiresIn: '7d' });

    await db.client.session.create({
      data: {
        userId: user.id,
        sessionToken: token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // 4. Return them straight to the glorious dashboard
    res.redirect(`${config.FRONTEND_URL}/dashboard`);

  } catch (error) {
    logger.error({ error }, 'Google OAuth Error');
    res.redirect(`${config.FRONTEND_URL}/login?error=Google+Authentication+Failed`);
  }
};
