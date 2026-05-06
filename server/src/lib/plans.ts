import { UserPlan } from "@prisma/client";
import config from "./config.js";
import { db } from "./db.js";

export const PLANS = {
  FREE: { 
    name: "Free",
    description: "Get started with basic monitoring",
    features: [
      "1 Monitoring Topic",
      "50 signals per month",
      "Reddit & HackerNews scanning",
      "Basic intent detection",
      "Dashboard access only",
      "No automated alerts",
    ],
    limits: {
      products: 1,
      leadsPerMonth: 50,
    },
    capabilities: {
      canAccessTwitter: false,
      canAccessAlerts: false,
      canAccessEnrichment: false,
      canAccessCustomPersonas: false,
      priorityProcessing: false,
    }
  },
  PRO: {
    name: "Pro",
    description: "Everything you need to scale your market monitoring",
    features: [
      "Monitor up to 5 Topics",
      "1,000 High-Intent signals / mo",
      "Reddit, HN & Twitter (X)",
      "Advanced AI Intent Scoring",
      "Advanced AI Insight Models",
      "Email, Slack & Discord alerts",
      "Full context enrichment",
      "24/7 Priority support",
    ],
    limits: {
      products: 5,
      leadsPerMonth: 1000,
    },
    monthly: { 
      variantId: config.LEMON_SQUEEZY_PRO_MONTHLY_VARIANT_ID || "var_pro_monthly",
    },
    yearly: { 
      variantId: config.LEMON_SQUEEZY_PRO_YEARLY_VARIANT_ID || "var_pro_yearly",
    },
    capabilities: {
      canAccessTwitter: true,
      canAccessAlerts: true,
      canAccessEnrichment: true,
      canAccessCustomPersonas: true,
      priorityProcessing: false,
    }
  },
} as const;

export type PlanKey = keyof typeof PLANS;
export type CapabilityKey = keyof typeof PLANS.FREE.capabilities;

export function hasCapability(plan: UserPlan, capability: CapabilityKey): boolean {
  const planConfig = PLANS[plan as PlanKey];
  if (!planConfig) return false;
  return !!(planConfig as any).capabilities?.[capability];
}

/**
 * Checks if a user can add more leads this month based on their plan limits.
 */
export async function checkLeadQuota(userId: string, plan: UserPlan): Promise<boolean> {
  const planConfig = PLANS[plan as PlanKey];
  if (!planConfig) return false;
  
  const limit = planConfig.limits.leadsPerMonth;
  // If limit is 0 or less, consider it as blocked (or we can add -1 support back if needed)
  if (limit <= 0) return false; 

  const now = new Date();
  const usage = await db.client.usageRecord.findUnique({
    where: {
      userId_type_month_year: {
        userId,
        type: 'leads',
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
    },
  });

  return (usage?.count || 0) < limit;
}

/**
 * Increments the monthly lead usage for a user.
 */
export async function incrementLeadUsage(userId: string): Promise<void> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  await db.client.usageRecord.upsert({
    where: {
      userId_type_month_year: {
        userId,
        type: 'leads',
        month,
        year,
      },
    },
    create: {
      userId,
      type: 'leads',
      month,
      year,
      count: 1,
    },
    update: {
      count: { increment: 1 },
    },
  });
}

export function getPlanVariantId(plan: UserPlan, billingCycle: "monthly" | "yearly"): string | null {
  if (plan === UserPlan.FREE) return null;
  const planConfig = PLANS[plan as PlanKey];
  if (!planConfig || !(billingCycle in planConfig)) return null;
  return (planConfig as any)[billingCycle].variantId;
}

export function getPlanFromVariantId(variantId: string): { plan: UserPlan; billingCycle: "monthly" | "yearly" } | null {
  for (const [planKey, planConfig] of Object.entries(PLANS)) {
    if (planKey === "FREE") continue;
    const config = planConfig as any;
    if (config.monthly?.variantId === variantId) {
      return { plan: UserPlan[planKey as PlanKey], billingCycle: "monthly" };
    }
    if (config.yearly?.variantId === variantId) {
      return { plan: UserPlan[planKey as PlanKey], billingCycle: "yearly" };
    }
  }
  return null;
}

export function getPlanLimits(plan: UserPlan): { products: number; leadsPerMonth: number } {
  const planConfig = PLANS[plan as PlanKey];
  if (!planConfig) return { products: 1, leadsPerMonth: 100 };
  return planConfig.limits;
}

export function canAddProduct(currentProductCount: number, plan: UserPlan): boolean {
  const limits = getPlanLimits(plan);
  return currentProductCount < limits.products;
}

