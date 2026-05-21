import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import logger from '../lib/logger.js';
import { db } from '../lib/db.js';
import { getPlanFromProductId } from '../lib/plans.js';
import { dodo } from '../lib/dodo.js';
import { getFrontendUrl } from '../lib/url.js';

const router = Router();

/**
 * POST /api/billing/create-checkout
 * Create a Dodo Payments checkout session
 */
router.post('/create-checkout', requireAuth, async (req: any, res: any) => {
  try {
    const { productId, email, name } = req.body;
    const userId = req.user?.id;

    if (!productId) {
      return res.status(400).json({ success: false, error: 'productId is required' });
    }

    // SECURITY: Validate that the productId belongs to a defined plan
    const planInfo = getPlanFromProductId(String(productId));
    if (!planInfo) {
      logger.warn({ userId, productId }, 'Attempted checkout with invalid productId');
      return res.status(400).json({ success: false, error: 'Invalid plan selected' });
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
    let checkoutName = name || req.user?.displayUsername || req.user?.username;

    // Fallback: Fetch from DB if email is missing
    if (!checkoutEmail && userId) {
      const user = await db.client.user.findUnique({ where: { id: userId } });
      checkoutEmail = user?.email || '';
      if (!checkoutName) checkoutName = user?.displayUsername || user?.username || '';
    }

    logger.info(
      { userId, productId, email: checkoutEmail, name: checkoutName },
      'Creating Dodo Payments checkout'
    );

    const checkout = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: {
        email: checkoutEmail,
        name: checkoutName || 'Customer',
      },
      metadata: {
        userId: userId,
      },
      return_url: `${getFrontendUrl(req)}/api/checkout-return`,
    });

    res.json({
      success: true,
      checkoutUrl: checkout.checkout_url,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Create checkout error');
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
