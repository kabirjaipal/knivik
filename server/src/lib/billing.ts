import { UserPlan, type User } from "@prisma/client";
import DodoPayments from "dodopayments";
import { db } from "./db.js";
import logger from "./logger.js";
import { dodo } from "./dodo.js";

let cachedPrices: any = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache

/**
 * Get prices from Dodo Payments
 */
export async function getPrices() {
  const now = Date.now();
  if (cachedPrices && (now - cacheTimestamp < CACHE_TTL_MS)) {
    logger.debug("Returning cached prices from Dodo Payments");
    return cachedPrices;
  }

  try {
    logger.info("Fetching fresh prices from Dodo Payments");
    const products = await dodo.products.list({
      page_size: 10,
    });

    // Map Dodo products to the format expected by the frontend
    const mapped = (products.items || []).map((product: DodoPayments.ProductListResponse) => ({
      id: product.product_id,
      productId: product.product_id,
      name: product.name,
      amount: (product.price ?? 0) / 100, 
      currency: product.currency || "USD",
      interval: product.is_recurring ? "month" : null,
      intervalCount: 1,
    }));

    cachedPrices = mapped;
    cacheTimestamp = now;
    return mapped;
  } catch (error) {
    logger.error({ error }, "Error in getPrices from Dodo");
    // Fallback to stale cached prices if fetch fails, to prevent API errors
    return cachedPrices || [];
  }
}

/**
 * Get user's effective plan
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
 * Get subscription status display
 */
export function getSubscriptionStatusDisplay(user: User): string {
  if (user.plan === UserPlan.FREE) return "Free Plan";
  if (user.subscriptionStatus === "active") {
    return `${user.plan} (Active)`;
  }
  if (user.subscriptionStatus === "trialing") {
    return `${user.plan} (Trialing)`;
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
  dodoSubscriptionId?: string,
  dodoCustomerId?: string
): Promise<void> {
  let targetPlan = plan;
  const isActive = subscriptionStatus === "active" || subscriptionStatus === "trialing";

  if (!isActive) {
    const otherActive = await db.client.subscription.findFirst({
      where: {
        userId,
        status: { in: ['active', 'trialing'] },
        ...(dodoSubscriptionId && {
          NOT: { dodoSubscriptionId }
        })
      }
    });

    if (!otherActive) {
      targetPlan = UserPlan.FREE;
    } else {
      targetPlan = UserPlan.PRO;
    }
  }

  try {
    const user = await db.client.user.findUnique({ where: { id: userId } });
    if (!user) {
      logger.warn({ userId }, 'Cannot update plan: User not found');
      return;
    }

    await db.client.user.update({
      where: { id: userId },
      data: {
        plan: targetPlan,
        subscriptionStatus,
        billingCycle,
        currentPeriodEnd,
        ...(dodoCustomerId && { dodoCustomerId }),
      },
    });

    logger.info({ userId, plan, subscriptionStatus }, "User plan updated");
  } catch (error) {
    logger.error({ error, userId }, "Failed to update user plan");
    throw error;
  }
}

/**
 * Downgrade user to Free plan
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
 * Record a payment
 */
export async function recordPayment(
  userId: string,
  dodoPaymentId: string,
  amount: number,
  currency: string,
  status: string
): Promise<void> {
  try {
    await db.client.payment.upsert({
      where: { dodoPaymentId },
      create: {
        userId,
        dodoPaymentId,
        amount,
        currency,
        status,
      },
      update: {
        status,
      },
    });
    logger.info({ userId, dodoPaymentId, amount }, "Payment recorded");
  } catch (error) {
    logger.error({ error, userId, dodoPaymentId }, "Failed to record payment");
    throw error;
  }
}

/**
 * Upsert subscription record
 */
export async function upsertSubscription(
  userId: string,
  dodoSubscriptionId: string,
  dodoCustomerId: string,
  plan: UserPlan,
  billingCycle: string,
  status: string,
  currentPeriodEnd: Date | null
): Promise<void> {
  try {
    await db.client.subscription.upsert({
      where: { dodoSubscriptionId },
      create: {
        userId,
        dodoSubscriptionId,
        dodoCustomerId,
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
    logger.info({ userId, dodoSubscriptionId, status }, "Subscription upserted");
  } catch (error) {
    logger.error({ error, userId, dodoSubscriptionId }, "Failed to upsert subscription");
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
