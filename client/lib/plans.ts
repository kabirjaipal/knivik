import { UserPlan } from "./constants";

export const PLANS = {
  FREE: { 
    name: "Free",
    description: "Get started with basic monitoring",
    features: [
      "Monitor 1 Topic/Product",
      "50 signals per month",
      "Reddit & HackerNews scanning",
      "Basic intent detection",
      "Dashboard access only",
      "No automated alerts",
    ],
    cta: "Get Started Free",
    href: "/register",
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
    description: "Everything you need to scale your market monitoring. Get 2 months free with annual billing!",
    popular: true,
    features: [
      "Monitor up to 5 Topics",
      "1,000 High-Intent signals / mo",
      "Reddit, HN & Twitter (X)",
      "Advanced AI Intent Scoring",
      "Custom AI Insight Models",
      "Email, Slack & Discord alerts",
      "Full context enrichment",
      "24/7 Priority support",
      "2 Months Free (Annual Plan)",
    ],
    limits: {
      products: 5,
      leadsPerMonth: 1000,
    },
    monthly: { 
      priceId: process.env.NEXT_PUBLIC_PADDLE_PRO_MONTHLY_PRICE_ID!,
    },
    yearly: { 
      priceId: process.env.NEXT_PUBLIC_PADDLE_PRO_YEARLY_PRICE_ID!,
    },
    capabilities: {
      canAccessTwitter: true,
      canAccessAlerts: true,
      canAccessEnrichment: true,
      canAccessCustomPersonas: true,
      priorityProcessing: true,
    }
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlanPriceId(plan: string, billingCycle: "monthly" | "yearly"): string | null {
  if (plan === "FREE") return null;
  const planConfig = PLANS[plan as PlanKey];
  if (!planConfig || !("monthly" in planConfig)) return null;
  return (planConfig as any)[billingCycle].priceId;
}

export function getPlanFromPriceId(priceId: string): { plan: string; billingCycle: "monthly" | "yearly" } | null {
  for (const [planKey, planConfig] of Object.entries(PLANS)) {
    if (planKey === "FREE") continue;
    const config = planConfig as any;
    if (config.monthly?.priceId === priceId) {
      return { plan: planKey, billingCycle: "monthly" };
    }
    if (config.yearly?.priceId === priceId) {
      return { plan: planKey, billingCycle: "yearly" };
    }
  }
  return null;
}
