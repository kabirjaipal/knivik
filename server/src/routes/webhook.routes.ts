import { Router } from 'express';
import { db } from '../lib/db.js';
import logger from '../lib/logger.js';
import { 
  updateUserPlan, 
  downgradeToFree, 
  recordPayment, 
  upsertSubscription 
} from '../lib/billing.js';
import { getPlanFromProductId } from '../lib/plans.js';

import { dodo } from '../lib/dodo.js';

const router = Router();

/**
 * POST /api/webhooks/dodopayments
 * Handle Dodo Payments webhook events
 */
router.post('/dodopayments', async (req: any, res: any) => {
  logger.info('🔔 Webhook request received at /api/webhooks/dodopayments');
  
  try {
    const rawBody = req.rawBody;
    
    if (!rawBody) {
      logger.error('No raw body found for webhook verification');
      return res.status(400).json({ success: false, error: 'Missing raw body' });
    }

    // Official Dodo SDK helper for Svix (Standard Webhooks) verification
    let payload;
    try {
      payload = dodo.webhooks.unwrap(rawBody, { headers: req.headers });
    } catch (err) {
      logger.error({ err, headers: req.headers }, 'Dodo Payments signature verification failed via SDK');
      return res.status(401).json({ success: false, error: 'Invalid signature' });
    }

    const eventName = payload.type;
    const data = payload.data;

    logger.info({ eventName, payload }, 'Verified Dodo Payments webhook received');

    // IDEMPOTENCY CHECK
    const eventId = (payload as any).event_id || (req.headers['webhook-signature'] as string);
    const existingEvent = await db.client.webhookEvent.findUnique({
      where: { eventId }
    });

    if (existingEvent) {
      logger.info({ eventId, eventName }, 'Webhook event already processed (idempotent skip)');
      return res.json({ success: true, message: 'Already processed' });
    }

    // Record the event
    const webhookEvent = await db.client.webhookEvent.create({
      data: {
        eventId,
        eventName,
        payload: payload as any,
        processed: false
      }
    });

    logger.info({ eventName, webhookEventId: webhookEvent.id }, 'Received verified Dodo Payments webhook');

    // RESPOND EARLY
    res.json({ success: true });

    // PROCESS ASYNCHRONOUSLY
    (async () => {
      try {
        await processDodoEvent(eventName, data);
        
        await db.client.webhookEvent.update({
          where: { id: webhookEvent.id },
          data: { processed: true }
        });
        
        logger.info({ eventName }, 'Successfully processed Dodo Payments event');
      } catch (error: any) {
        logger.error({ 
          error: error.message, 
          eventName, 
          webhookEventId: webhookEvent.id 
        }, 'Async processing of Dodo Payments event failed');
      }
    })();

  } catch (error: any) {
    logger.error({ error: error.message }, 'Dodo Payments webhook processing failed');
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

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
  // Dodo can put product_id at top level or inside product_cart
  const productId = data.product_id || data.product_cart?.[0]?.product_id;
  const customerId = data.customer?.customer_id;
  const paymentId = data.transaction_id || data.payment_id;
  const amount = data.total_amount || data.amount;
  const currency = data.currency;
  const status = data.status;
  const email = data.customer?.email;

  if (userId) {
    const userExists = await db.client.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      logger.warn({ userId }, 'User ID from payment metadata not found in database, clearing for fallback lookup');
      userId = undefined;
    }
  }

  if (!userId) {
    if (customerId) {
      const userByCustomer = await db.client.user.findUnique({
        where: { dodoCustomerId: customerId }
      });
      if (userByCustomer) {
        userId = userByCustomer.id;
      }
    }
    
    if (!userId && email) {
      const userByEmail = await db.client.user.findUnique({
        where: { email: email }
      });
      if (userByEmail) {
        userId = userByEmail.id;
        if (customerId && !userByEmail.dodoCustomerId) {
          await db.client.user.update({
            where: { id: userByEmail.id },
            data: { dodoCustomerId: customerId }
          });
        }
      }
    }
  }

  if (!userId) {
    logger.error({ paymentId, email, customerId }, 'No userId found in payment metadata or resolved via customerId/email');
    return;
  }

  // Record payment
  await recordPayment(
    userId,
    paymentId,
    amount,
    currency,
    status
  );

  // If it's a subscription, the subscription.active event will also fire
  // but we can proactively upgrade here if we have enough info
  const planInfo = getPlanFromProductId(productId);
  if (planInfo) {
    await updateUserPlan(
      userId,
      planInfo.plan,
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
  const status = data.status; // 'active', 'canceled', etc.
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
      logger.warn({ userId }, 'User ID from subscription metadata not found in database, clearing for fallback lookup');
      userId = undefined;
    }
  }

  if (!userId) {
    if (dodoCustomerId) {
      const userByCustomer = await db.client.user.findUnique({
        where: { dodoCustomerId: dodoCustomerId }
      });
      if (userByCustomer) {
        userId = userByCustomer.id;
      }
    }
    
    if (!userId && email) {
      const userByEmail = await db.client.user.findUnique({
        where: { email: email }
      });
      if (userByEmail) {
        userId = userByEmail.id;
        if (dodoCustomerId && !userByEmail.dodoCustomerId) {
          await db.client.user.update({
            where: { id: userByEmail.id },
            data: { dodoCustomerId }
          });
        }
      }
    }
  }

  if (!userId) {
    logger.error({ dodoSubscriptionId, email, dodoCustomerId }, 'No userId found in subscription metadata or resolved via dodoCustomerId/email');
    return;
  }

  const { plan, billingCycle } = planMapping;

  // Update user plan
  await updateUserPlan(
    userId,
    plan,
    status,
    billingCycle,
    currentPeriodEnd,
    dodoSubscriptionId,
    dodoCustomerId
  );

  // Upsert subscription record
  await upsertSubscription(
    userId,
    dodoSubscriptionId,
    dodoCustomerId,
    plan,
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

  // Check if user has any OTHER active subscriptions
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

export default router;
