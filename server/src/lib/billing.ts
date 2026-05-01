import { listVariants, lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";
import { UserPlan, type User } from "@prisma/client";
import { db } from "./db.js";
import config from "./config.js";
import logger from "./logger.js";

// Initialize Lemon Squeezy
lemonSqueezySetup({
  apiKey: config.LEMON_SQUEEZY_API_KEY || '',
});

/**
 * Get prices from Lemon Squeezy variants
 */
export async function getPrices() {
  try {
    const storeId = config.LEMON_SQUEEZY_STORE_ID;
    if (!storeId) {
      logger.warn("LEMON_SQUEEZY_STORE_ID not configured, returning empty prices");
      return [];
    }

    logger.info({ storeId }, "Fetching prices for store");
    const { data, error } = await listVariants();

    if (error) {
      logger.error({ error }, "Failed to fetch prices from Lemon Squeezy");
      return [];
    }

    logger.info({ variantCount: data?.data?.length }, "Fetched variants from Lemon Squeezy");

    // Map Lemon Squeezy variants to the format expected by the frontend
    return (data?.data || []).map((variant: any) => ({
      id: variant.id,
      productId: variant.attributes.product_id,
      name: variant.attributes.name,
      amount: variant.attributes.price,
      currency: "USD", // Lemon Squeezy price is in cents/units, attributes.price is amount
      interval: variant.attributes.interval,
      intervalCount: variant.attributes.interval_count,
    }));
  } catch (error) {
    logger.error({ error }, "Error in getPrices");
    return [];
  }
}

/**
 * Get user's effective plan
 * Returns the UserPlan enum value from the User model (source of truth)
 */
export function getUserPlan(user: User): UserPlan {
  return user.plan;
}

/**
 * Check if user is on Free plan
 */
export function isFree(user: User): boolean {
  return user.plan === UserPlan.FREE;
}

/**
 * Check if user is on Pro plan and it is active
 */
export function isPro(user: User): boolean {
  return user.plan === UserPlan.PRO && (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing');
}

/**
 * Check if user has an active subscription
 */
export function hasActiveSubscription(user: User): boolean {
  return (user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing") && 
         user.currentPeriodEnd !== null && 
         user.currentPeriodEnd > new Date();
}

/**
 * Check if user can access premium features
 */
export function canAccessPremium(user: User): boolean {
  return isPro(user);
}

/**
 * Check if user can access Pro-only features
 */
export function canAccessProFeatures(user: User): boolean {
  return isPro(user);
}

/**
 * Get subscription status display
 */
export function getSubscriptionStatusDisplay(user: User): string {
  if (user.plan === UserPlan.FREE) return "Free Plan";
  if (user.subscriptionStatus === "active") {
    return `${user.plan} (Active)`;
  }
  if (user.subscriptionStatus === "past_due") {
    return `${user.plan} (Past Due)`;
  }
  if (user.subscriptionStatus === "canceled") {
    return `${user.plan} (Canceled)`;
  }
  return user.plan;
}

/**
 * Update user's plan after subscription change
 */
export async function updateUserPlan(
  userId: string,
  plan: UserPlan,
  subscriptionStatus: string,
  billingCycle: string | null,
  currentPeriodEnd: Date | null,
  lemonSqueezySubscriptionId?: string,
  lemonSqueezyCustomerId?: string
): Promise<void> {
  let targetPlan = plan;
  const isActive = subscriptionStatus === "active" || subscriptionStatus === "trialing";

  // If subscription is not active, check if user has ANY OTHER active subscription
  if (!isActive) {
    const otherActive = await db.client.subscription.findFirst({
      where: {
        userId,
        status: { in: ['active', 'trialing'] },
        ...(lemonSqueezySubscriptionId && {
          NOT: { lemonSqueezySubscriptionId }
        })
      }
    });

    if (!otherActive) {
      targetPlan = UserPlan.FREE;
    } else {
      // Keep them as PRO because they have another active sub
      targetPlan = UserPlan.PRO;
    }
  }

  try {
    // Check if user exists first to prevent Prisma crash
    const user = await db.client.user.findUnique({ where: { id: userId } });
    if (!user) {
      logger.warn({ userId }, 'Cannot update plan: User not found in database');
      return;
    }

    await db.client.user.update({
      where: { id: userId },
      data: {
        plan: targetPlan,
        subscriptionStatus,
        billingCycle,
        currentPeriodEnd,
        ...(lemonSqueezyCustomerId && { lemonSqueezyCustomerId }),
      },
    });

    logger.info({ userId, plan, subscriptionStatus }, "User plan updated");
  } catch (error) {
    logger.error({ error, userId }, "Failed to update user plan");
    throw error;
  }
}

/**
 * Downgrade user to Free plan (when subscription canceled/expired)
 */
export async function downgradeToFree(userId: string): Promise<void> {
  try {
    await db.client.$transaction([
      db.client.user.update({
        where: { id: userId },
        data: {
          plan: UserPlan.FREE,
          subscriptionStatus: null,
          billingCycle: null,
          currentPeriodEnd: null,
        },
      }),
      db.client.subscription.updateMany({
        where: { userId, status: { in: ['active', 'trialing', 'past_due'] } },
        data: { status: 'canceled' }
      })
    ]);
    logger.info({ userId }, "User downgraded to Free");
  } catch (error) {
    logger.error({ error, userId }, "Failed to downgrade user");
    throw error;
  }
}

/**
 * Record a payment in the database
 */
export async function recordPayment(
  userId: string,
  lemonSqueezyPaymentId: string,
  amount: number,
  currency: string,
  status: string
): Promise<void> {
  try {
    await db.client.payment.upsert({
      where: { lemonSqueezyPaymentId },
      create: {
        userId,
        lemonSqueezyPaymentId,
        amount,
        currency,
        status,
      },
      update: {
        status,
      },
    });
    logger.info({ userId, lemonSqueezyPaymentId, amount, currency }, "Payment recorded");
  } catch (error) {
    logger.error({ error, userId, lemonSqueezyPaymentId }, "Failed to record payment");
    throw error;
  }
}

/**
 * Upsert subscription record
 */
export async function upsertSubscription(
  userId: string,
  lemonSqueezySubscriptionId: string,
  lemonSqueezyCustomerId: string,
  plan: UserPlan,
  billingCycle: string,
  status: string,
  currentPeriodEnd: Date | null
): Promise<void> {
  try {
    await db.client.subscription.upsert({
      where: { lemonSqueezySubscriptionId },
      create: {
        userId,
        lemonSqueezySubscriptionId,
        lemonSqueezyCustomerId,
        plan,
        billingCycle,
        status,
        currentPeriodEnd,
      },
      update: {
        plan,
        billingCycle,
        status,
        currentPeriodEnd,
      },
    });
    logger.info({ userId, lemonSqueezySubscriptionId, status }, "Subscription upserted");
  } catch (error) {
    logger.error({ error, userId, lemonSqueezySubscriptionId }, "Failed to upsert subscription");
    throw error;
  }
}

/**
 * Get user's payment history
 */
export async function getPaymentHistory(userId: string) {
  return db.client.payment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get user's active subscription
 */
export async function getActiveSubscription(userId: string) {
  return db.client.subscription.findFirst({
    where: { 
      userId,
      status: { in: ["active", "trialing"] },
    },
    orderBy: { createdAt: "desc" },
  });
}
