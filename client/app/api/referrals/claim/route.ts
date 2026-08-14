import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-server';

const claimReferralSchema = z.object({
  referralCode: z.string().min(2, 'Referral code must be at least 2 characters').max(30, 'Referral code is too long'),
});

export async function POST(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const currentUserId = session.user.id;
    const body = await req.json();
    const parsed = claimReferralSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input data',
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const existingReferral = await db.client.referral.findUnique({
      where: { referredUserId: currentUserId },
    });

    if (existingReferral) {
      return NextResponse.json(
        {
          success: false,
          error: 'You have already claimed a referral code or were already referred.',
        },
        { status: 400 }
      );
    }

    const { referralCode } = parsed.data;
    const normalizedCode = referralCode.trim().toUpperCase();

    const referralCodeRecord = await db.client.referralCode.findUnique({
      where: { code: normalizedCode },
      include: {
        creator: {
          select: {
            id: true,
            referralPartner: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!referralCodeRecord) {
      return NextResponse.json({ success: false, error: 'Referral code not found' }, { status: 404 });
    }

    if (!referralCodeRecord.creator.referralPartner) {
      return NextResponse.json({ success: false, error: 'This referral code is currently inactive.' }, { status: 400 });
    }

    if (referralCodeRecord.creatorId === currentUserId) {
      return NextResponse.json({ success: false, error: 'You cannot use your own referral code' }, { status: 400 });
    }

    const referral = await db.client.referral.create({
      data: {
        referralCodeId: referralCodeRecord.id,
        referredUserId: currentUserId,
        status: 'SIGNED_UP',
      },
    });

    logger.info(
      { referralId: referral.id, referredUserId: currentUserId, code: normalizedCode },
      'User claimed a referral code successfully'
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Referral code claimed successfully',
        referral,
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error({ error: error.message }, 'Claim referral error');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
