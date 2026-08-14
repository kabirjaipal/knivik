import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { 
  updateUserPlan, 
  downgradeToFree, 
  recordPayment, 
  upsertSubscription 
} from '@/lib/billing';
import { getPlanFromProductId } from '@/lib/plans';
import { dodo } from '@/lib/dodo';

export async function POST(req: NextRequest) {
  logger.info('🔔 Webhook request received at /api/webhooks/dodopayments');

  try {
    const rawBody = await req.text();

    if (!rawBody) {
      logger.error('No raw body found for webhook verification');
      return NextResponse.json({ success: false, error: 'Missing raw body' }, { status: 400 });
    }

    const headersRecord: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headersRecord[key.toLowerCase()] = value;
    });

    let payload: any;
    try {
      payload = dodo.webhooks.unwrap(rawBody, { headers: headersRecord });
    } catch (err: any) {
      logger.error({ err: err.message }, 'Dodo Payments signature verification failed');
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
    }

    const eventName = payload.type;
    const data = payload.data;

    const eventId = payload.event_id || req.headers.get('webhook-signature') || `dodo-${Date.now()}`;
    const existingEvent = await db.client.webhookEvent.findUnique({
      where: { eventId },
    });

    if (existingEvent) {
      logger.info({ eventId, eventName }, 'Webhook event already processed (idempotent skip)');
      return NextResponse.json({ success: true, message: 'Already processed' });
    }

    const webhookEvent = await db.client.webhookEvent.create({
      data: {
        eventId,
        eventName,
        payload: payload as any,
        processed: false,
      },
    });

    // Process event
    await processDodoEvent(eventName, data);

    await db.client.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: { processed: true },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Dodo Payments webhook processing failed');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

async function processDodoEvent(eventName: string, data: any) {
  switch (eventName) {
    case 'subscription.active':
    case 'subscription.updated':
      await handleSubscriptionEvent(data);
      break;

    case 'subscription.cancelled':
      await handleSubscriptionTerminated(data);
      break;

    case 'payment.succeeded':
      await handleCheckoutCompleted(data);
      break;

    default:
      logger.info({ eventName }, 'Unhandled Dodo Payments event type');
  }
}

async function handleCheckoutCompleted(data: any) {
  let userId = data.metadata?.userId;
  const productId = data.product_id || data.product_cart?.[0]?.product_id;
  const customerId = data.customer?.customer_id;
  const paymentId = data.transaction_id || data.payment_id;
  const amount =
    typeof data.settlement_amount === 'number'
      ? data.settlement_amount
      : typeof data.total_amount === 'number'
      ? data.total_amount
      : typeof data.amount === 'number'
      ? data.amount
      : 0;
  const tax = typeof data.settlement_tax === 'number' ? data.settlement_tax : typeof data.tax === 'number' ? data.tax : 0;
  const currency = data.settlement_currency || data.currency || 'USD';
  const status = data.status;
  const invoiceUrl = data.invoice_url || null;
  const email = data.customer?.email;

  if (userId) {
    const userExists = await db.client.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      userId = undefined;
    }
  }

  if (!userId) {
    if (customerId) {
      const userByCustomer = await db.client.user.findUnique({
        where: { dodoCustomerId: customerId },
      });
      if (userByCustomer) {
        userId = userByCustomer.id;
      }
    }

    if (!userId && email) {
      const userByEmail = await db.client.user.findUnique({
        where: { email },
      });
      if (userByEmail) {
        userId = userByEmail.id;
        if (customerId && !userByEmail.dodoCustomerId) {
          await db.client.user.update({
            where: { id: userByEmail.id },
            data: { dodoCustomerId: customerId },
          });
        }
      }
    }
  }

  if (!userId) {
    logger.error({ paymentId, email, customerId }, 'No userId found in payment metadata');
    return;
  }

  await recordPayment(userId, paymentId, amount, currency, status, tax, invoiceUrl);

  if (status === 'succeeded' || status === 'captured' || status === 'paid' || status === 'success') {
    try {
      const referral = await db.client.referral.findUnique({
        where: { referredUserId: userId },
      });

      if (referral && referral.status !== 'CONVERTED') {
        await db.client.referral.update({
          where: { id: referral.id },
          data: { status: 'CONVERTED' },
        });
      }
    } catch (referralErr: any) {
      logger.error({ error: referralErr.message }, 'Failed to update referral conversion');
    }
  }

  const planInfo = getPlanFromProductId(productId);
  if (planInfo) {
    await updateUserPlan(
      userId,
      planInfo.plan as any,
      'active',
      planInfo.billingCycle,
      null,
      undefined,
      customerId
    );
  }
}

async function handleSubscriptionEvent(data: any) {
  const dodoSubscriptionId = data.subscription_id;
  const dodoCustomerId = data.customer?.customer_id;
  const productId = data.product_id;
  const status = data.status;
  const currentPeriodEnd = data.next_billing_date ? new Date(data.next_billing_date) : null;
  let userId = data.metadata?.userId;
  const email = data.customer?.email;

  const planMapping = getPlanFromProductId(productId);
  if (!planMapping) {
    logger.error({ productId }, 'Unknown product ID in subscription');
    return;
  }

  if (userId) {
    const userExists = await db.client.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      userId = undefined;
    }
  }

  if (!userId) {
    if (dodoCustomerId) {
      const userByCustomer = await db.client.user.findUnique({
        where: { dodoCustomerId },
      });
      if (userByCustomer) {
        userId = userByCustomer.id;
      }
    }

    if (!userId && email) {
      const userByEmail = await db.client.user.findUnique({
        where: { email },
      });
      if (userByEmail) {
        userId = userByEmail.id;
        if (dodoCustomerId && !userByEmail.dodoCustomerId) {
          await db.client.user.update({
            where: { id: userByEmail.id },
            data: { dodoCustomerId },
          });
        }
      }
    }
  }

  if (!userId) {
    logger.error({ dodoSubscriptionId, email, dodoCustomerId }, 'No userId found in subscription');
    return;
  }

  const { plan, billingCycle } = planMapping;

  await updateUserPlan(
    userId,
    plan as any,
    status,
    billingCycle,
    currentPeriodEnd,
    dodoSubscriptionId,
    dodoCustomerId
  );

  await upsertSubscription(
    userId,
    dodoSubscriptionId,
    dodoCustomerId,
    plan as any,
    billingCycle,
    status,
    currentPeriodEnd
  );
}

async function handleSubscriptionTerminated(data: any) {
  const dodoSubscriptionId = data.subscription_id;

  const subscription = await db.client.subscription.findUnique({
    where: { dodoSubscriptionId },
  });

  if (!subscription) {
    logger.warn({ dodoSubscriptionId }, 'Subscription not found for termination');
    return;
  }

  const otherActiveSubscription = await db.client.subscription.findFirst({
    where: {
      userId: subscription.userId,
      status: 'active',
      NOT: { dodoSubscriptionId },
    },
  });

  if (!otherActiveSubscription) {
    await downgradeToFree(subscription.userId);
  }

  await db.client.subscription.update({
    where: { dodoSubscriptionId },
    data: { status: 'canceled' },
  });
}
