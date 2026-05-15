import { UserPlan } from "@prisma/client";
import config from "./config.js";
import { db } from "./db.js";

const getIntervalText = () => {
  const ms = config.SCRAPER_INTERVAL_MS;
  if (ms <= 0) return "Manual Only";
  if (ms === 3600000) return "Hourly";
  if (ms === 86400000) return "Daily";
  if (ms % 3600000 === 0) return `Every ${ms / 3600000}h`;
  return `Every ${Math.round(ms / 60000)}m`;
};

const INTERVAL_TEXT = getIntervalText();

export const PLANS = {
  FREE: { 
    name: "Free",
    description: "Get started with basic lead detection",
    features: [
      "1 Product Tracking",
      "50 leads per month",
      "Reddit & HackerNews scanning",
      `${INTERVAL_TEXT} Auto-Search (Global)`,
      "Basic intent detection",
      "Standard dashboard analytics",
      "No automated alerts (Dashboard only)",
    ],
    limits: {
      products: 1,
      leadsPerMonth: 50,
      manualScansPerDay: 0,
    },
    capabilities: {
      canAccessTwitter: false,
      canAccessAlerts: false,
      canAccessEnrichment: false,
      canAccessCustomPersonas: false,
      canAccessAdvancedAI: false,
      priorityProcessing: false,
    }
  },
  PRO: {
    name: "Pro",
    description: "Everything you need to scale your lead generation",
    features: [
      "Track up to 5 Products",
      "1,000 High-Intent leads / mo",
      "Reddit, HN & Twitter (X)",
      `${INTERVAL_TEXT} Auto-Search (Global)`,
      "3 Manual Force Scans / day per product",
      "Semantic AI Discovery (No keywords)",
      "Advanced ROI & Intent Analytics",
      "Zapier, Make & Custom Webhooks",
      "Advanced AI Intent Scoring",
      "Custom AI Personas for replies",
      "Email, Slack & Discord alerts",
      "Full lead enrichment",
    ],
    limits: {
      products: 5,
      leadsPerMonth: 1000,
      manualScansPerDay: 3,
    },
    monthly: { 
      productId: config.DODO_PAYMENTS_PRO_MONTHLY_PRODUCT_ID || "prod_monthly",
    },
    yearly: { 
      productId: config.DODO_PAYMENTS_PRO_YEARLY_PRODUCT_ID || "prod_yearly",
    },
    capabilities: {
      canAccessTwitter: true,
      canAccessAlerts: true,
      canAccessEnrichment: true,
      canAccessCustomPersonas: true,
      canAccessAdvancedAI: true,
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

export function getPlanProductId(plan: UserPlan, billingCycle: "monthly" | "yearly"): string | null {
  if (plan === UserPlan.FREE) return null;
  const planConfig = PLANS[plan as PlanKey];
  if (!planConfig || !(billingCycle in planConfig)) return null;
  return (planConfig as any)[billingCycle].productId;
}

export function getPlanFromProductId(productId: string): { plan: UserPlan; billingCycle: "monthly" | "yearly" } | null {
  for (const [planKey, planConfig] of Object.entries(PLANS)) {
    if (planKey === "FREE") continue;
    const config = planConfig as any;
    if (config.monthly?.productId === productId) {
      return { plan: UserPlan[planKey as PlanKey], billingCycle: "monthly" };
    }
    if (config.yearly?.productId === productId) {
      return { plan: UserPlan[planKey as PlanKey], billingCycle: "yearly" };
    }
  }
  return null;
}

export function getPlanLimits(plan: UserPlan): { products: number; leadsPerMonth: number; manualScansPerDay: number } {
  const planConfig = PLANS[plan as PlanKey];
  if (!planConfig) return { products: 1, leadsPerMonth: 100, manualScansPerDay: 0 };
  return planConfig.limits;
}

export function canAddProduct(currentProductCount: number, plan: UserPlan): boolean {
  const limits = getPlanLimits(plan);
  return currentProductCount < limits.products;
}

