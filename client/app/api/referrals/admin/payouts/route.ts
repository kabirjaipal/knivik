import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-server';
import { sendEmail, renderBaseEmail } from '@/lib/mailer';

const recordPayoutSchema = z.object({
  creatorId: z.string().min(1, 'Creator ID is required'),
  amount: z.number().int().min(100, 'Amount must be at least 100 cents'),
  currency: z.literal('USD').default('USD'),
  notes: z.string().max(500).optional().or(z.literal('')),
});

export async function GET() {
  try {
    const { errorResponse } = await requireAdmin();
    if (errorResponse) return errorResponse;

    const payouts = await db.client.referralPayout.findMany({
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const approvedCreators = await db.client.user.findMany({
      where: {
        NOT: {
          referralPartner: null,
        },
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        role: true,
        referralPartner: {
          select: {
            createdAt: true,
          },
        },
        referralCodes: {
          select: {
            id: true,
            code: true,
            referrals: {
              select: {
                id: true,
                status: true,
                referredUser: {
                  select: {
                    payments: {
                      where: { status: { in: ['paid', 'succeeded', 'success'] } },
                      select: { amount: true, tax: true, currency: true },
                    },
                  },
                },
              },
            },
          },
        },
        referralPayouts: {
          select: {
            amount: true,
            currency: true,
          },
        },
      },
    });

    const creatorsWithStats = approvedCreators.map((creator) => {
      let totalSignups = 0;
      let totalConversions = 0;
      let totalEarned = 0;

      if (creator.referralCodes) {
        for (const code of creator.referralCodes) {
          if (code.referrals) {
            for (const ref of code.referrals) {
              totalSignups++;
              if (ref.status === 'CONVERTED') {
                totalConversions++;
                const payments = ref.referredUser?.payments;
                if (payments) {
                  for (const payment of payments) {
                    if (payment.currency?.toUpperCase() === 'USD') {
                      const baseAmount = Math.max(0, payment.amount - (payment.tax || 0));
                      totalEarned += Math.round(baseAmount * 0.3);
                    }
                  }
                }
              }
            }
          }
        }
      }

      const totalPaidOut = creator.referralPayouts.reduce((sum, p) => {
        if (p.currency?.toUpperCase() === 'USD') {
          return sum + p.amount;
        }
        return sum;
      }, 0);

      const unpaidBalance = Math.max(0, totalEarned - totalPaidOut);

      return {
        id: creator.id,
        username: creator.username,
        email: creator.email,
        createdAt: creator.createdAt,
        approvedAt: creator.referralPartner?.createdAt,
        role: creator.role,
        referralCode: creator.referralCodes?.[0]?.code ?? null,
        stats: {
          totalSignups,
          totalConversions,
          totalEarned,
          totalPaidOut,
          unpaidBalance,
        },
      };
    });

    creatorsWithStats.sort((a, b) => {
      const dateA = a.approvedAt ? new Date(a.approvedAt).getTime() : 0;
      const dateB = b.approvedAt ? new Date(b.approvedAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({
      success: true,
      payouts,
      creators: creatorsWithStats,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Get admin payouts error');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { errorResponse } = await requireAdmin();
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const parsed = recordPayoutSchema.safeParse(body);
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

    const { creatorId, amount, currency, notes } = parsed.data;

    const creator = await db.client.user.findUnique({
      where: { id: creatorId },
      select: {
        id: true,
        email: true,
        username: true,
        referralPartner: {
          select: { id: true },
        },
      },
    });

    if (!creator) {
      return NextResponse.json({ success: false, error: 'Creator not found' }, { status: 404 });
    }

    if (!creator.referralPartner) {
      return NextResponse.json({ success: false, error: 'This user is not approved for referrals' }, { status: 400 });
    }

    const payout = await db.client.referralPayout.create({
      data: {
        creatorId,
        amount,
        currency,
        status: 'PAID',
        notes: notes || null,
      },
    });

    if (creator.email) {
      const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100);
      const emailHtml = renderBaseEmail({
        title: 'Referral Payout Processed!',
        preheader: `You received a payout of ${formattedAmount} for your referrals on Knivik!`,
        bodyHtml: `
          <p>Hi ${creator.username || 'Creator'},</p>
          <p>Great news! We have processed a referral commission payout for your account.</p>
          <p><strong>Payout Details:</strong></p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <ul style="margin: 0; padding-left: 20px; font-size: 15px; color: #475569; line-height: 1.6;">
              <li>Amount: <strong style="color: #0b0f19;">${formattedAmount}</strong></li>
              <li>Status: <strong style="color: #10b981;">PAID</strong></li>
              <li>Date: <strong>${new Date().toLocaleDateString()}</strong></li>
              ${notes ? `<li>Notes: <em>${notes}</em></li>` : ''}
            </ul>
          </div>
          <p>Thank you for partnering with us and sharing Knivik with your audience.</p>
        `,
        ctaText: 'View Referrals Portal',
        ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/referrals`,
        footerText: `Sent to ${creator.email}.`,
      });

      sendEmail(creator.email, 'Your Knivik Referral Payout Has Been Processed! 🚀', emailHtml).catch((err) => {
        logger.error({ err, creatorId }, 'Failed to send referral payout email');
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Payout recorded successfully',
        payout,
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error({ error: error.message }, 'Record payout error');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
