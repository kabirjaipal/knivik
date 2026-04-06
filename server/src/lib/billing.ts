import { UserPlan, type User } from "@prisma/client";
import { db } from "./db.js";
import logger from "./logger.js";

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
 * Check if user is on Starter plan
 */
export function isStarter(user: User): boolean {
  return user.plan === UserPlan.STARTER;
}

/**
 * Check if user is on Pro plan
 */
export function isPro(user: User): boolean {
  return user.plan === UserPlan.PRO;
}

/**
 * Check if user has an active subscription
 */
export function hasActiveSubscription(user: User): boolean {
  return user.subscriptionStatus === "active" && user.currentPeriodEnd !== null && user.currentPeriodEnd > new Date();
}

/**
 * Check if user can access premium features
 */
export function canAccessPremium(user: User): boolean {
  return user.plan === UserPlan.STARTER || user.plan === UserPlan.PRO;
}

/**
 * Check if user can access Pro-only features
 */
export function canAccessProFeatures(user: User): boolean {
  return user.plan === UserPlan.PRO;
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
  paddleCustomerId?: string
): Promise<void> {
  try {
    await db.client.user.update({
      where: { id: userId },
      data: {
        plan,
        subscriptionStatus,
        billingCycle,
        currentPeriodEnd,
        ...(paddleCustomerId && { paddleCustomerId }),
      },
    });
    
    // Invalidate user cache to ensure /me and /billing show new data immediately
    const cache = (await import("./cache.js")).default;
    await cache.del(`user:${userId}`);
    await cache.del('users:all');
    
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
    await db.client.user.update({
      where: { id: userId },
      data: {
        plan: UserPlan.FREE,
        subscriptionStatus: null,
        billingCycle: null,
        currentPeriodEnd: null,
      },
    });
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
  paddlePaymentId: string,
  amount: number,
  currency: string,
  status: string
): Promise<void> {
  try {
    await db.client.payment.create({
      data: {
        userId,
        paddlePaymentId,
        amount,
        currency,
        status,
      },
    });
    logger.info({ userId, paddlePaymentId, amount, currency }, "Payment recorded");
  } catch (error) {
    logger.error({ error, userId, paddlePaymentId }, "Failed to record payment");
    throw error;
  }
}

/**
 * Upsert subscription record
 */
export async function upsertSubscription(
  userId: string,
  paddleSubscriptionId: string,
  paddleCustomerId: string,
  plan: UserPlan,
  billingCycle: string,
  status: string,
  currentPeriodEnd: Date | null
): Promise<void> {
  try {
    await db.client.subscription.upsert({
      where: { paddleSubscriptionId },
      create: {
        userId,
        paddleSubscriptionId,
        paddleCustomerId,
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
    logger.info({ userId, paddleSubscriptionId, status }, "Subscription upserted");
  } catch (error) {
    logger.error({ error, userId, paddleSubscriptionId }, "Failed to upsert subscription");
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
