import { UserPlan } from "./constants";

export const PLANS = {
  FREE: { 
    name: "Free",
    description: "Get started with basic lead detection",
    features: [
      "Track 1 Product",
      "50 leads per month",
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
    description: "Everything you need to scale your lead generation. Get 2 months free with annual billing!",
    popular: true,
    features: [
      "Track up to 5 Products",
      "1,000 High-Intent leads / mo",
      "Reddit, HN & Twitter (X)",
      "Advanced AI Intent Scoring",
      "Custom AI Personas for replies",
      "Email, Slack & Discord alerts",
      "Full lead enrichment",
      "24/7 Priority support",
      "2 Months Free (Annual Plan)",
    ],
    limits: {
      products: 5,
      leadsPerMonth: 1000,
    },
    monthly: { 
      productId: process.env.NEXT_PUBLIC_DODO_PAYMENTS_PRO_MONTHLY_PRODUCT_ID!,
    },
    yearly: { 
      productId: process.env.NEXT_PUBLIC_DODO_PAYMENTS_PRO_YEARLY_PRODUCT_ID!,
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

export function getPlanProductId(plan: string, billingCycle: "monthly" | "yearly"): string | null {
  if (plan === "FREE") return null;
  const planConfig = PLANS[plan as PlanKey];
  if (!planConfig || !("monthly" in planConfig)) return null;
  return (planConfig as any)[billingCycle].productId;
}

export function getPlanFromProductId(productId: string): { plan: string; billingCycle: "monthly" | "yearly" } | null {
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
