import { Router } from 'express';
import { createCheckout, lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';
import config from '../lib/config.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import logger from '../lib/logger.js';
import { db } from '../lib/db.js';

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
    const { variantId, email } = req.body;
    const userId = req.user?.id;

    if (!variantId) {
      return res.status(400).json({ success: false, error: 'variantId is required' });
    }

    const storeId = config.LEMON_SQUEEZY_STORE_ID;
    if (!storeId) {
      return res.status(500).json({ success: false, error: 'LEMON_SQUEEZY_STORE_ID is not configured' });
    }

    // SMART CHECK: Prevent double subscriptions
    const existingSubscription = await db.client.subscription.findFirst({
      where: { 
        userId,
        status: 'active'
      }
    });

    if (existingSubscription) {
      return res.status(400).json({ 
        success: false, 
        error: 'You already have an active subscription. Please manage it from your billing dashboard.' 
      });
    }

    let checkoutEmail = email || req.user?.email;

    // Fallback: Fetch from DB if email is missing
    if (!checkoutEmail && userId) {
      const user = await db.client.user.findUnique({ where: { id: userId } });
      checkoutEmail = user?.email || '';
    }

    logger.info({ userId, variantId, email: checkoutEmail }, 'Creating Lemon Squeezy checkout');

    const { data, error } = await createCheckout(
      storeId,
      variantId,
      {
        checkoutData: {
          email: checkoutEmail,
          name: req.user?.name || req.user?.username || '',
          custom: {
            userId: userId,
          },
        },
        checkoutOptions: {
          embed: true,
          media: true,
          logo: true,
        },
        productOptions: {
          redirectUrl: `${config.FRONTEND_URL}/dashboard/billing?status=success`,
          receiptButtonText: 'Go to Dashboard',
          receiptThankYouNote: 'Thank you for subscribing to Knivik!',
          enabledVariants: [Number(variantId)],
        },
      }
    );

    if (error) {
      logger.error({ error }, 'Lemon Squeezy checkout creation failed');
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ 
      success: true, 
      checkoutUrl: data.data.attributes.url 
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Create checkout error');
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
