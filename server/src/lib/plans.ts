import { UserPlan } from "@prisma/client";

export const PLANS = {
  FREE: { 
    name: "Free",
    description: "Get started with basic lead detection",
    features: [
      "1 product",
      "100 leads per month",
      "Reddit & HackerNews scanning",
      "Basic intent detection",
      "Email alerts",
    ],
    limits: {
      products: 1,
      leadsPerMonth: 100,
    },
  },
  STARTER: {
    name: "Starter",
    description: "For early-stage startups and indie hackers",
    features: [
      "5 products",
      "1,000 leads per month",
      "Reddit, HackerNews & Twitter",
      "AI High-intent lead filtering",
      "Basic AI reply generation",
      "Email & Slack alerts",
      "Lead enrichment",
    ],
    limits: {
      products: 5,
      leadsPerMonth: 1000,
    },
    monthly: { 
      priceId: process.env['PADDLE_STARTER_MONTHLY_PRICE_ID'] || "pri_starter_monthly",
      price: 25,
    },
    yearly: { 
      priceId: process.env['PADDLE_STARTER_YEARLY_PRICE_ID'] || "pri_starter_yearly",
      price: 250, // 2 months free
    },
  },
  PRO: {
    name: "Pro",
    description: "For agencies and growing business teams",
    features: [
      "Unlimited products",
      "Unlimited leads",
      "All platforms (LinkedIn, Slack, etc.)",
      "Priority AI intent processing",
      "Custom AI persona for replies",
      "Advanced analytics & CSV export",
      "Full API access",
      "Priority 24/7 support",
    ],
    limits: {
      products: -1,
      leadsPerMonth: -1,
    },
    monthly: { 
      priceId: process.env['PADDLE_PRO_MONTHLY_PRICE_ID'] || "pri_pro_monthly",
      price: 69,
    },
    yearly: { 
      priceId: process.env['PADDLE_PRO_YEARLY_PRICE_ID'] || "pri_pro_yearly",
      price: 690, // 2 months free
    },
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlanPriceId(plan: UserPlan, billingCycle: "monthly" | "yearly"): string | null {
  if (plan === UserPlan.FREE) return null;
  const planConfig = PLANS[plan as PlanKey];
  if (!planConfig || !(billingCycle in planConfig)) return null;
  return (planConfig as any)[billingCycle].priceId;
}

export function getPlanFromPriceId(priceId: string): { plan: UserPlan; billingCycle: "monthly" | "yearly" } | null {
  for (const [planKey, planConfig] of Object.entries(PLANS)) {
    if (planKey === "FREE") continue;
    const config = planConfig as typeof PLANS.STARTER;
    if (config.monthly?.priceId === priceId) {
      return { plan: UserPlan[planKey as PlanKey], billingCycle: "monthly" };
    }
    if (config.yearly?.priceId === priceId) {
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
  return limits.products === -1 || currentProductCount < limits.products;
}

export function canAddLead(currentLeadCount: number, plan: UserPlan): boolean {
  const limits = getPlanLimits(plan);
  return limits.leadsPerMonth === -1 || currentLeadCount < limits.leadsPerMonth;
}
