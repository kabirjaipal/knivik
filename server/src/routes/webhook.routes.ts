import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../lib/db.js';
import config from '../lib/config.js';
import logger from '../lib/logger.js';
import { 
  updateUserPlan, 
  downgradeToFree, 
  recordPayment, 
  upsertSubscription 
} from '../lib/billing.js';
import { getPlanFromVariantId } from '../lib/plans.js';

const router = Router();

/**
 * POST /api/webhooks/lemonsqueezy
 * Handle Lemon Squeezy webhook events
 */
router.post('/lemonsqueezy', async (req: any, res: any, next) => {
  logger.info('🔔 Webhook request received at /api/webhooks/lemonsqueezy');
  try {
    const signature = req.headers['x-signature'] as string || '';
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const secret = config.LEMON_SQUEEZY_WEBHOOK_SECRET || '';

    // Verify signature
    if (secret) {
      const hmac = crypto.createHmac('sha256', secret);
      const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
      const signatureBuffer = Buffer.from(signature, 'utf8');

      if (digest.length !== signatureBuffer.length || !crypto.timingSafeEqual(digest, signatureBuffer)) {
        logger.error({ signature }, 'Lemon Squeezy signature verification failed');
        res.status(401).json({ success: false, error: 'Invalid signature' });
        return;
      }
    } else if (config.NODE_ENV === 'production') {
      logger.error('CRITICAL: Lemon Squeezy webhook received in PRODUCTION without LEMON_SQUEEZY_WEBHOOK_SECRET');
      res.status(500).json({ success: false, error: 'Internal configuration error' });
      return;
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta.event_name;
    const data = payload.data;

    logger.info({ eventName, id: data.id }, 'Received verified Lemon Squeezy webhook');

    await processLemonSqueezyEvent(eventName, data, payload.meta);

    res.json({ success: true });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Lemon Squeezy webhook processing failed');
    next(error);
  }
});

async function processLemonSqueezyEvent(eventName: string, data: any, meta: any) {
  switch (eventName) {
    case 'subscription_created':
    case 'subscription_updated':
      await handleSubscriptionEvent(data, meta);
      break;

    case 'subscription_cancelled':
    case 'subscription_expired':
      await handleSubscriptionTerminated(data);
      break;

    case 'subscription_payment_success':
      await handleOrderCreated(data, meta);
      break;

    case 'order_created':
      // We can log this but we don't need to record a payment here for subscriptions
      // as subscription_payment_success will handle it.
      logger.info({ id: data.id }, 'Order created (subscription initial order)');
      break;

    default:
      logger.info({ eventName }, 'Unhandled Lemon Squeezy event type');
  }
}

async function handleSubscriptionEvent(data: any, meta: any) {
  const attributes = data.attributes;
  const lemonSqueezySubscriptionId = data.id;
  const lemonSqueezyCustomerId = String(attributes.customer_id);
  const variantId = String(attributes.variant_id);
  const status = attributes.status;
  const renewsAt = attributes.renews_at;
  const endsAt = attributes.ends_at;

  const planMapping = getPlanFromVariantId(variantId);
  if (!planMapping) {
    logger.error({ variantId }, 'Unknown variant ID in subscription');
    return;
  }

  const { plan, billingCycle } = planMapping;
  // Look in meta.custom_data
  const userId = meta.custom_data?.user_id || meta.custom_data?.userId;

  if (!userId) {
    logger.error({ lemonSqueezySubscriptionId }, 'No user_id found in webhook meta.custom_data');
    return;
  }

  // Use renews_at for the next billing date, fallback to ends_at
  const nextBillingDate = renewsAt ? new Date(renewsAt) : (endsAt ? new Date(endsAt) : null);

  // Update user plan
  await updateUserPlan(
    userId,
    plan,
    status,
    billingCycle,
    nextBillingDate,
    lemonSqueezySubscriptionId,
    lemonSqueezyCustomerId
  );

  // Upsert subscription record
  await upsertSubscription(
    userId,
    lemonSqueezySubscriptionId,
    lemonSqueezyCustomerId,
    plan,
    billingCycle,
    status,
    nextBillingDate
  );

  logger.info({ userId, plan, status }, 'Subscription event processed');
}

async function handleSubscriptionTerminated(data: any) {
  const lemonSqueezySubscriptionId = data.id;

  const subscription = await db.client.subscription.findUnique({
    where: { lemonSqueezySubscriptionId },
  });

  if (!subscription) {
    logger.warn({ lemonSqueezySubscriptionId }, 'Subscription not found for termination');
    return;
  }

  // Check if user has any OTHER active subscriptions before downgrading
  const otherActiveSubscription = await db.client.subscription.findFirst({
    where: {
      userId: subscription.userId,
      status: 'active',
      NOT: { lemonSqueezySubscriptionId },
    },
  });

  if (!otherActiveSubscription) {
    await downgradeToFree(subscription.userId);
    logger.info({ userId: subscription.userId }, 'User downgraded to FREE');
  } else {
    logger.info({ userId: subscription.userId }, 'User remains PRO due to another active subscription');
  }

  // Update this specific subscription record to match the terminated status
  await db.client.subscription.update({
    where: { lemonSqueezySubscriptionId },
    data: { status: data.attributes.status },
  });
}

async function handleOrderCreated(data: any, meta: any) {
  const attributes = data.attributes;
  const lemonSqueezyPaymentId = data.id;
  const lemonSqueezyCustomerId = String(attributes.customer_id);
  // Look in meta.custom_data
  const userId = meta.custom_data?.user_id || meta.custom_data?.userId;
  const amount = attributes.total; // in cents
  const currency = attributes.currency;
  const status = attributes.status;

  if (!userId) {
    logger.warn({ lemonSqueezyPaymentId }, 'No user_id found in webhook meta.custom_data');
    return;
  }

  await recordPayment(
    userId,
    lemonSqueezyPaymentId,
    amount,
    currency,
    status
  );

  logger.info({ userId, lemonSqueezyPaymentId, amount }, 'Payment recorded from order');
}

export default router;
