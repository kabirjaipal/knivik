import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { requireAuth } from '@/lib/auth-server';
import { getPlanFromProductId } from '@/lib/plans';
import { dodo } from '@/lib/dodo';

export async function POST(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const userId = session.user.id;
    const body = await req.json();
    const { productId, email, name, skipTrial, discountCode } = body;

    if (!productId) {
      return NextResponse.json({ success: false, error: 'productId is required' }, { status: 400 });
    }

    const planInfo = getPlanFromProductId(String(productId));
    if (!planInfo) {
      logger.warn({ userId, productId }, 'Attempted checkout with invalid productId');
      return NextResponse.json({ success: false, error: 'Invalid plan selected' }, { status: 400 });
    }

    const existingSubscription = await db.client.subscription.findFirst({
      where: {
        userId,
        status: 'active',
      },
    });

    if (existingSubscription) {
      return NextResponse.json(
        {
          success: false,
          error: 'You already have an active subscription. Please manage it from your billing dashboard.',
        },
        { status: 400 }
      );
    }

    let checkoutEmail = email || session.user.email;
    let checkoutName = name || session.user.displayUsername || session.user.username;

    if (!checkoutEmail && userId) {
      const user = await db.client.user.findUnique({ where: { id: userId } });
      checkoutEmail = user?.email || '';
      if (!checkoutName) checkoutName = user?.displayUsername || user?.username || '';
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const checkout = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: {
        email: checkoutEmail,
        name: checkoutName || 'Customer',
      },
      metadata: {
        userId,
      },
      discount_code: typeof discountCode === 'string' && discountCode.trim().length > 0
        ? discountCode.trim()
        : undefined,
      subscription_data: skipTrial
        ? {
            trial_period_days: 0,
          }
        : undefined,
      return_url: `${origin}/api/checkout-return`,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: checkout.checkout_url,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Create checkout error');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
