import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { requireAuth } from '@/lib/auth-server';

export async function GET() {
  try {
    const { session, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const currentUserId = session.user.id;

    const partner = await db.client.referralPartner.findUnique({
      where: { userId: currentUserId },
    });

    if (!partner) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access Denied. You are not approved to use the referral system.',
        },
        { status: 403 }
      );
    }

    let codes = await db.client.referralCode.findMany({
      where: { creatorId: currentUserId },
      include: {
        referrals: {
          include: {
            referredUser: {
              select: {
                id: true,
                username: true,
                email: true,
                createdAt: true,
                plan: true,
                payments: {
                  where: { status: { in: ['paid', 'succeeded', 'success'] } },
                  select: { amount: true, tax: true, currency: true },
                },
              },
            },
          },
        },
      },
    });

    if (codes.length === 0) {
      const username = session.user.username || 'CREATOR';
      const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      let finalCode = `${cleanUsername}${randomSuffix}`;

      const existing = await db.client.referralCode.findUnique({
        where: { code: finalCode },
      });
      if (existing) {
        finalCode = `${cleanUsername}${Math.floor(1000 + Math.random() * 9000)}`;
      }

      const newCodeRecord = await db.client.referralCode.create({
        data: {
          code: finalCode,
          creatorId: currentUserId,
        },
        include: {
          referrals: {
            include: {
              referredUser: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  createdAt: true,
                  plan: true,
                  payments: {
                    where: { status: { in: ['paid', 'succeeded', 'success'] } },
                    select: { amount: true, tax: true, currency: true },
                  },
                },
              },
            },
          },
        },
      });
      codes = [newCodeRecord];
    }

    let totalSignups = 0;
    let totalConversions = 0;
    let estimatedEarned = 0;

    const referralsList: any[] = [];

    for (const codeRecord of codes) {
      for (const ref of codeRecord.referrals) {
        totalSignups++;
        const isConverted = ref.status === 'CONVERTED';
        if (isConverted) {
          totalConversions++;
        }

        const referredUser = ref.referredUser;
        if (referredUser) {
          const payments = referredUser.payments;
          if (isConverted && payments) {
            for (const payment of payments) {
              if (payment.currency?.toUpperCase() === 'USD') {
                const baseAmount = Math.max(0, payment.amount - (payment.tax || 0));
                estimatedEarned += Math.round(baseAmount * 0.3);
              }
            }
          }

          referralsList.push({
            id: ref.id,
            code: codeRecord.code,
            status: ref.status,
            createdAt: ref.createdAt,
            user: {
              id: referredUser.id,
              username: referredUser.username,
              plan: referredUser.plan,
              createdAt: referredUser.createdAt,
            },
          });
        }
      }
    }

    const payouts = await db.client.referralPayout.findMany({
      where: { creatorId: currentUserId },
      orderBy: { createdAt: 'desc' },
    });

    const paidCommissions = payouts.reduce((sum, p) => {
      if (p.currency?.toUpperCase() === 'USD') {
        return sum + p.amount;
      }
      return sum;
    }, 0);
    const unpaidCommissions = Math.max(0, estimatedEarned - paidCommissions);

    return NextResponse.json({
      success: true,
      stats: {
        totalSignups,
        totalConversions,
        unpaidCommissions,
        paidCommissions,
      },
      codes: codes.map((c) => ({ id: c.id, code: c.code, createdAt: c.createdAt })),
      referrals: referralsList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      payouts: payouts.map((p) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        notes: p.notes,
        createdAt: p.createdAt,
      })),
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Get creator stats error');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
