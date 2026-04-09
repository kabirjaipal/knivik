import { Router } from 'express';
import { Paddle, EventName } from '@paddle/paddle-node-sdk';
import { db } from '../lib/db.js';
import config from '../lib/config.js';
import logger from '../lib/logger.js';
import { 
  updateUserPlan, 
  downgradeToFree, 
  recordPayment, 
  upsertSubscription 
} from '../lib/billing.js';
import { getPlanFromPriceId } from '../lib/plans.js';

const router = Router();

const paddle = new Paddle(config.PADDLE_API_KEY || '', {
  environment: (config.PADDLE_ENVIRONMENT === 'production' ? 'production' : 'sandbox') as any,
});

/**
 * POST /api/webhooks/paddle
 * Handle Paddle webhook events
 */
router.post('/paddle', async (req, res, next) => {
  try {
    const signature = req.headers['x-paddle-signature'] as string || '';
    const rawBody = JSON.stringify(req.body); // Express.json() is used, but Paddle SDK might need raw body for verification if not handled by SDK
    
    // In production, we MUST verify the signature
    if (config.PADDLE_WEBHOOK_SECRET) {
      try {
        const event = paddle.webhooks.unmarshal(rawBody, config.PADDLE_WEBHOOK_SECRET, signature);
        if (!event) {
          throw new Error('Invalid webhook signature');
        }
        
        const eventType = event.eventType;
        const payload = event.data;
        
        logger.info({ eventType }, 'Received verified Paddle webhook');
        await processPaddleEvent(eventType as any, payload);
      } catch (err) {
        logger.error({ err, signature }, 'Paddle signature verification failed');
        res.status(401).json({ success: false, error: 'Invalid signature' });
        return;
      }
    } else {
      // In development/test if secret is missing, skip verification (NOT recommended for prod)
      const eventType = req.body.event_type;
      const payload = req.body.data;
      logger.warn({ eventType }, 'Processing UNVERIFIED Paddle webhook (PADDLE_WEBHOOK_SECRET missing)');
      await processPaddleEvent(eventType, payload);
    }

    res.json({ success: true });
  } catch (error: any) {
    logger.error({ error }, 'Paddle webhook processing failed');
    next(error);
  }
});

async function processPaddleEvent(eventType: EventName, payload: any) {
  switch (eventType) {
    case 'subscription.created':
    case 'subscription.updated':
      await handleSubscriptionCreatedOrUpdated(payload);
      break;

    case 'subscription.canceled':
      await handleSubscriptionCanceled(payload);
      break;

    case 'transaction.completed':
      await handleTransactionCompleted(payload);
      break;

    default:
      logger.info({ eventType }, 'Unhandled Paddle event type');
  }
}

async function handleSubscriptionCreatedOrUpdated(payload: any) {
  const {
    id: paddleSubscriptionId,
    customer_id: paddleCustomerId,
    items,
    status,
    current_billing_period: { ends_at } = {},
    custom_data,
  } = payload;

  // Get price ID from first item
  const priceId = items?.[0]?.price?.id;
  if (!priceId) {
    throw new Error('No price ID found in subscription');
  }

  // Map price ID to plan
  const planMapping = getPlanFromPriceId(priceId);
  if (!planMapping) {
    throw new Error(`Unknown price ID: ${priceId}`);
  }

  const { plan, billingCycle } = planMapping;

  // Find user by paddleCustomerId or custom_data.userId
  let userId = custom_data?.userId || custom_data?.user_id;
  
  if (!userId && paddleCustomerId) {
    const user = await db.client.user.findFirst({
      where: { paddleCustomerId },
    });
    if (user) {
      userId = user.id;
    }
  }

  if (!userId) {
    throw new Error('Could not determine user for subscription');
  }

  // Update user
  await updateUserPlan(
    userId,
    plan,
    status,
    billingCycle,
    ends_at ? new Date(ends_at) : null,
    paddleCustomerId
  );

  // Upsert subscription record
  await upsertSubscription(
    userId,
    paddleSubscriptionId,
    paddleCustomerId,
    plan,
    billingCycle,
    status,
    ends_at ? new Date(ends_at) : null
  );

  logger.info({ userId, plan, status }, 'Subscription processed');
}

async function handleSubscriptionCanceled(payload: any) {
  const {
    id: paddleSubscriptionId,
    customer_id: paddleCustomerId,
  } = payload;

  // Find user
  const user = await db.client.user.findFirst({
    where: { 
      OR: [
        { paddleCustomerId },
        { subscriptions: { some: { paddleSubscriptionId } } },
      ],
    },
  });

  if (!user) {
    logger.warn({ paddleSubscriptionId }, 'User not found for canceled subscription');
    return;
  }

  // Downgrade to Free
  await downgradeToFree(user.id);

  // Update subscription status
  await db.client.subscription.updateMany({
    where: { paddleSubscriptionId },
    data: { status: 'canceled' },
  });

  logger.info({ userId: user.id }, 'User downgraded after cancellation');
}

async function handleTransactionCompleted(payload: any) {
  const {
    id: paddlePaymentId,
    customer_id: paddleCustomerId,
    details: { totals: { total: amount } = { total: '0' } } = {},
    currency_code: currency,
    custom_data,
  } = payload;

  // Find user
  let userId = custom_data?.userId;
  
  if (!userId && paddleCustomerId) {
    const user = await db.client.user.findFirst({
      where: { paddleCustomerId },
    });
    if (user) {
      userId = user.id;
    }
  }

  if (!userId) {
    logger.warn({ paddlePaymentId }, 'Could not determine user for payment');
    return;
  }

  // Record payment
  await recordPayment(
    userId,
    paddlePaymentId,
    Math.round(parseFloat(amount)), // Paddle already sends in cents/smallest unit
    currency,
    'completed'
  );

  logger.info({ userId, paddlePaymentId, amount, currency }, 'Payment recorded');
}

export default router;
