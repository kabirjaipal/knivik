import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { requireAdmin } from '@/lib/auth-server';
import { sendEmail, renderBaseEmail } from '@/lib/mailer';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { errorResponse } = await requireAdmin();
    if (errorResponse) return errorResponse;

    const { id: userId } = await params;

    const user = (await db.client.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        referralPartner: {
          select: { id: true },
        },
      },
    })) as { id: string; email: string | null; username: string | null; referralPartner: { id: string } | null } | null;

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const isApproved = !!user.referralPartner;

    if (isApproved) {
      await db.client.referralPartner.delete({
        where: { userId },
      });
    } else {
      await db.client.referralPartner.create({
        data: {
          userId,
        },
      });

      if (user.email) {
        const emailHtml = renderBaseEmail({
          title: 'Referral Partner Program Approved! 🎉',
          preheader: 'Congratulations! You have been approved as a Knivik Referral Partner.',
          bodyHtml: `
            <p>Hi ${user.username || 'Creator'},</p>
            <p>We are thrilled to inform you that your application to join the <strong>Knivik Creator/Referral Partner Program</strong> has been approved! 🚀</p>
            <p>You can now start sharing Knivik with your audience and earn a recurring commission for every customer you refer.</p>
            <p><strong>Next Steps:</strong></p>
            <ol style="font-size: 15px; color: #475569; line-height: 1.6; padding-left: 20px;">
              <li>Log in to your Knivik account.</li>
              <li>Go to your <strong>Referral Dashboard</strong>.</li>
              <li>Get your unique referral link/code.</li>
              <li>Share the link and start tracking your signups and payouts in real-time!</li>
            </ol>
          `,
          ctaText: 'Go to Referral Dashboard',
          ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/referrals`,
          footerText: `Sent to ${user.email}.`,
        });

        sendEmail(user.email, 'Your Knivik Creator Partnership is Approved! 🚀', emailHtml).catch((err) => {
          logger.error({ err, userId }, 'Failed to send referral partner approval email');
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `User referral access ${!isApproved ? 'enabled' : 'disabled'} successfully`,
      allowReferrals: !isApproved,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Toggle creator referral access error');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
