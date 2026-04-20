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
    const signature = req.headers['paddle-signature'] as string || '';
    const rawBody = req.rawBody || JSON.stringify(req.body);
    
    // In production, we MUST verify the signature. 
    // In sandbox/development, it's also highly recommended.
    if (config.PADDLE_WEBHOOK_SECRET) {
      try {
        const event = await paddle.webhooks.unmarshal(rawBody, config.PADDLE_WEBHOOK_SECRET, signature);
        if (!event) {
          logger.error({ signature }, 'Paddle webhook unmarshal returned null (invalid signature)');
          res.status(401).json({ success: false, error: 'Invalid signature' });
          return;
        }
        
        const eventType = event.eventType;
        const payload = event.data;
        
        logger.info({ eventType, eventId: event.eventId }, 'Received verified Paddle webhook');
        await processPaddleEvent(eventType as any, payload);
      } catch (err: any) {
        logger.error({ err: err.message, signature }, 'Paddle signature verification failed');
        res.status(401).json({ success: false, error: 'Invalid signature' });
        return;
      }
    } else {
      // Security warning: Only allow unverified webhooks in development if explicitly configured
      if (config.NODE_ENV === 'production') {
        logger.error('CRITICAL: Paddle webhook received in PRODUCTION without PADDLE_WEBHOOK_SECRET');
        res.status(500).json({ success: false, error: 'Internal configuration error' });
        return;
      }

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
  console.log('Paddle webhook:', eventType);
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
    customerId: paddleCustomerId,
    items,
    status,
    currentBillingPeriod,
    customData,
  } = payload;

  const endsAt = currentBillingPeriod?.endsAt;

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

  // Find user by customData.userId
  let userId = customData?.userId || customData?.user_id;
  
  if (!userId && paddleCustomerId) {
    const user = await db.client.user.findFirst({
      where: { paddleCustomerId },
    });
    if (user) {
      userId = user.id;
    }
  }

  if (!userId) {
    throw new Error(`Could not determine user for subscription. Metadata: ${JSON.stringify(customData)}`);
  }

  // Update user
  if (status === 'canceled' || status === 'past_due') {
    // If subscription is canceled or past due, we downgrade the user
    await downgradeToFree(userId);
  } else {
    // Otherwise, update/confirm their premium plan
    await updateUserPlan(
      userId,
      plan,
      status,
      billingCycle,
      endsAt ? new Date(endsAt) : null,
      paddleCustomerId
    );
  }

  // Upsert subscription record
  await upsertSubscription(
    userId,
    paddleSubscriptionId,
    paddleCustomerId,
    plan,
    billingCycle,
    status,
    endsAt ? new Date(endsAt) : null
  );

  logger.info({ userId, plan, status }, 'Subscription processed');
}

async function handleSubscriptionCanceled(payload: any) {
  const {
    id: paddleSubscriptionId,
    customerId: paddleCustomerId,
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
    customerId: paddleCustomerId,
    details,
    currencyCode: currency,
    customData,
  } = payload;

  const amount = details?.totals?.total || '0';

  // Find user
  let userId = customData?.userId || customData?.user_id;
  
  if (!userId && paddleCustomerId) {
    const user = await db.client.user.findFirst({
      where: { paddleCustomerId },
    });
    if (user) {
      userId = user.id;
    }
  }

  if (!userId) {
    logger.warn({ paddlePaymentId, customData }, 'Could not determine user for payment');
    return;
  }

  // Record payment
  await recordPayment(
    userId,
    paddlePaymentId,
    Math.round(parseFloat(amount)), 
    currency || 'USD',
    'completed'
  );

  logger.info({ userId, paddlePaymentId, amount, currency }, 'Payment recorded');
}

export default router;
