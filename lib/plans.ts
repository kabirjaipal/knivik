import type { UserPlan } from "@prisma/client";

const getIntervalText = () => {
  const ms = Number(process.env.NEXT_PUBLIC_SCRAPER_INTERVAL_MS) || 3600000;
  if (ms <= 0) return "Manual Only";
  if (ms === 3600000) return "Hourly";
  if (ms === 86400000) return "Daily";
  if (ms % 3600000 === 0) return `Every ${ms / 3600000}h`;
  return `Every ${Math.round(ms / 60000)}m`;
};

export const INTERVAL_TEXT = getIntervalText();

export const PLANS = {
  FREE: { 
    name: "Free",
    description: "Get started with basic lead detection",
    features: [
      "Track 1 Product or Service",
      "50 leads per month",
      "Reddit & HackerNews",
      "Automated scans every 24 hours",
      "1 manual force scan per day",
      "Instant Email Lead Alerts",
      "Basic intent detection",
      "Standard dashboard analytics",
      "Standard CSV Lead Export",
    ],
    cta: "Get Started Free",
    href: "/register",
    limits: {
      products: 1,
      leadsPerMonth: 50,
      manualScansPerDay: 1,
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
    description: "Everything you need to scale your lead generation. Get 2 months free with annual billing!",
    popular: true,
    features: [
      "Track up to 5 Products or Services",
      "1,000 High-Intent leads / mo",
      "Reddit, HackerNews & Twitter (X)",
      "Automated scans every 2 hours (24/7 background)",
      "10 Manual Force Scans / day per offering",
      "Advanced ROI & Intent Analytics",
      "Advanced AI Intent Scoring",
      "Custom AI Personas for replies",
      "Email, Slack & Discord alerts",
      "Full lead enrichment",
      "Unlimited CSV Lead Export (with AI replies)",
    ],
    limits: {
      products: 5,
      leadsPerMonth: 1000,
      manualScansPerDay: 10,
    },
    monthly: { 
      productId: process.env.NEXT_PUBLIC_DODO_PAYMENTS_PRO_MONTHLY_PRODUCT_ID || process.env.DODO_PAYMENTS_PRO_MONTHLY_PRODUCT_ID || "prod_monthly",
    },
    yearly: { 
      productId: process.env.NEXT_PUBLIC_DODO_PAYMENTS_PRO_YEARLY_PRODUCT_ID || process.env.DODO_PAYMENTS_PRO_YEARLY_PRODUCT_ID || "prod_yearly",
    },
    capabilities: {
      canAccessTwitter: true,
      canAccessAlerts: true,
      canAccessEnrichment: true,
      canAccessCustomPersonas: true,
      canAccessAdvancedAI: true,
      priorityProcessing: true,
    }
  },
} as const;

export type PlanKey = keyof typeof PLANS;
export type CapabilityKey = keyof typeof PLANS.FREE.capabilities;

export function hasCapability(plan: UserPlan | string, capability: CapabilityKey): boolean {
  const planKey = plan as PlanKey;
  const planConfig = PLANS[planKey];
  if (!planConfig) return false;
  return !!(planConfig as any).capabilities?.[capability];
}

export function getPlanProductId(plan: UserPlan | string, billingCycle: "monthly" | "yearly"): string | null {
  if (plan === "FREE") return null;
  const planConfig = PLANS[plan as PlanKey];
  if (!planConfig || !(billingCycle in planConfig)) return null;
  return (planConfig as any)[billingCycle].productId;
}

export function getPlanFromProductId(productId: string): { plan: UserPlan | string; billingCycle: "monthly" | "yearly" } | null {
  for (const [planKey, planConfig] of Object.entries(PLANS)) {
    if (planKey === "FREE") continue;
    const config = planConfig as any;
    if (config.monthly?.productId === productId) {
      return { plan: planKey, billingCycle: "monthly" };
    }
    if (config.yearly?.productId === productId) {
      return { plan: planKey, billingCycle: "yearly" };
    }
  }
  return null;
}

export function getPlanLimits(plan: UserPlan | string): { products: number; leadsPerMonth: number; manualScansPerDay: number } {
  const planConfig = PLANS[plan as PlanKey];
  if (!planConfig) return { products: 1, leadsPerMonth: 50, manualScansPerDay: 1 };
  return planConfig.limits;
}

export function canAddProduct(currentProductCount: number, plan: UserPlan | string): boolean {
  const limits = getPlanLimits(plan);
  return currentProductCount < limits.products;
}
