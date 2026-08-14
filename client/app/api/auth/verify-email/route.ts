import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { z } from 'zod';

const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifyEmailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
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
      return NextResponse.json({ error: 'Verification link is invalid or expired' }, { status: 400 });
    }

    await db.client.otpCode.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });

    await db.client.user.update({
      where: { email: otpRecord.email },
      data: { emailVerified: true },
    });

    return NextResponse.json({ success: true, message: 'Email fully verified! You can now log in.' });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Verify Email Error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
