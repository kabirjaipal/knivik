import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { requireAuth } from '@/lib/auth-server';
import { getPaymentHistory, getActiveSubscription, getPrices } from '@/lib/billing';

export async function GET() {
  try {
    const { session, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const userId = session.user.id;
    const prices = await getPrices();

    const [payments, subscription, freshUser] = await Promise.all([
      getPaymentHistory(userId),
      getActiveSubscription(userId),
      db.client.user.findUnique({ where: { id: userId } }),
    ]);

    if (!freshUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: freshUser.id,
          email: freshUser.email,
          username: freshUser.username,
          plan: freshUser.plan,
          subscriptionStatus: freshUser.subscriptionStatus || (freshUser.plan === 'FREE' ? 'inactive' : 'active'),
          billingCycle: freshUser.billingCycle,
          currentPeriodEnd: freshUser.currentPeriodEnd,
          dodoCustomerId: freshUser.dodoCustomerId,
        },
        subscription,
        dodoSubscriptionId: subscription?.dodoSubscriptionId,
        payments,
        prices,
      },
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Get billing hub error');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
