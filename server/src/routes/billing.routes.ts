import { Router } from 'express';
import { createCheckout, lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';
import config from '../lib/config.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import logger from '../lib/logger.js';
import { db } from '../lib/db.js';
import { getPlanFromVariantId } from '../lib/plans.js';

const router = Router();

// Initialize Lemon Squeezy
lemonSqueezySetup({
  apiKey: config.LEMON_SQUEEZY_API_KEY || '',
});

/**
 * POST /api/billing/create-checkout
 * Create a Lemon Squeezy checkout URL
 */
router.post('/create-checkout', requireAuth, async (req: any, res: any) => {
  try {
    const { variantId, email, name } = req.body;
    const userId = req.user?.id;

    if (!variantId) {
      return res.status(400).json({ success: false, error: 'variantId is required' });
    }

    // SECURITY: Validate that the variantId belongs to a defined plan
    const planInfo = getPlanFromVariantId(String(variantId));
    if (!planInfo) {
      logger.warn({ userId, variantId }, 'Attempted checkout with invalid variantId');
      return res.status(400).json({ success: false, error: 'Invalid plan selected' });
    }

    const storeId = config.LEMON_SQUEEZY_STORE_ID;
    if (!storeId) {
      return res
        .status(500)
        .json({ success: false, error: 'LEMON_SQUEEZY_STORE_ID is not configured' });
    }

    // SMART CHECK: Prevent double subscriptions
    const existingSubscription = await db.client.subscription.findFirst({
      where: {
        userId,
        status: 'active',
      },
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        error:
          'You already have an active subscription. Please manage it from your billing dashboard.',
      });
    }

    let checkoutEmail = email || req.user?.email;
    let checkoutName = name || req.user?.name || req.user?.username;

    // Fallback: Fetch from DB if email is missing
    if (!checkoutEmail && userId) {
      const user = await db.client.user.findUnique({ where: { id: userId } });
      checkoutEmail = user?.email || '';
      if (!checkoutName) checkoutName = user?.name || user?.username || '';
    }

    logger.info(
      { userId, variantId, email: checkoutEmail, name: checkoutName },
      'Creating Lemon Squeezy checkout'
    );

    const { data, error } = await createCheckout(storeId, variantId, {
      checkoutData: {
        email: checkoutEmail,
        ...(checkoutName ? { name: checkoutName } : {}),
        custom: {
          userId: userId,
        },
      },
      productOptions: {
        redirectUrl: `${config.FRONTEND_URL}/dashboard/billing?status=success`,
        receiptButtonText: 'Go to Dashboard',
        receiptThankYouNote: 'Thank you for subscribing to Knivik!',
        enabledVariants: [Number(variantId)],
      },
    });

    if (error) {
      logger.error({ error }, 'Lemon Squeezy checkout creation failed');
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({
      success: true,
      checkoutUrl: data.data.attributes.url,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Create checkout error');
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
