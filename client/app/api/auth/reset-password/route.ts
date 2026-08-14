import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { hashPassword } from 'better-auth/crypto';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
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
      return NextResponse.json({ error: 'Token is invalid or expired' }, { status: 400 });
    }

    await db.client.otpCode.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });

    const hashedPassword = await hashPassword(newPassword);

    const updatedUser = await db.client.user.update({
      where: { email: otpRecord.email },
      data: { password: hashedPassword },
    });

    const targetUserId = String(updatedUser.id);

    await db.client.account.updateMany({
      where: {
        userId: { equals: targetUserId },
        providerId: { equals: 'credential' },
      },
      data: { password: hashedPassword },
    });

    if (otpRecord.userId && typeof otpRecord.userId === 'string') {
      await db.client.session.deleteMany({ where: { userId: otpRecord.userId } });
    }

    return NextResponse.json({ success: true, message: 'Password reset successfully' });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Reset password error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
