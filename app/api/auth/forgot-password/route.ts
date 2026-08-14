import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import config from '@/lib/config';
import logger from '@/lib/logger';
import { sendEmail, renderBaseEmail } from '@/lib/mailer';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    const successResponse = {
      success: true,
      message: 'If the email exists, a reset link will be sent shortly.',
    };

    if (!parsed.success) {
      return NextResponse.json(successResponse, { status: 200 });
    }

    const { email } = parsed.data;
    const normalisedEmail = email.toLowerCase().trim();

    const user = await db.client.user.findUnique({ where: { email: normalisedEmail } });
    if (!user) {
      return NextResponse.json(successResponse, { status: 200 });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await db.client.otpCode.create({
      data: {
        userId: user.id,
        email: user.email,
        code: hashedToken,
        type: 'RESET_PASSWORD',
        expiresAt: new Date(Date.now() + 20 * 60 * 1000),
      },
    });

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${origin}/reset-password?token=${resetToken}`;

    const htmlTemplate = renderBaseEmail({
      title: 'Reset your password',
      preheader: 'Click the link to set a new password for your Knivik account.',
      bodyHtml: `<p>Click the button below to set a new password for your <strong>${config.PROJECT_NAME}</strong> account.</p>
                 <p style="margin-top: 12px; font-size: 13px; color: #ef4444; font-weight: 600;">This link expires in 20 minutes.</p>`,
      ctaText: 'Reset Password',
      ctaUrl: resetUrl,
      footerText: `Sent to ${user.email}. If you did not request a password reset, you can safely ignore this email.`,
    });

    await sendEmail(user.email, `Reset your ${config.PROJECT_NAME} Password`, htmlTemplate);

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Forgot password error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
