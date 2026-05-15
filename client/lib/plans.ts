import { UserPlan } from "./constants";

const getIntervalText = () => {
  const ms = Number(process.env.NEXT_PUBLIC_SCRAPER_INTERVAL_MS) || 3600000;
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
      "Track 1 Product",
      "50 leads per month",
      "Reddit & HackerNews scanning",
      `${INTERVAL_TEXT} Auto-Search (Global)`,
      "Basic intent detection",
      "Standard dashboard analytics",
      "No automated alerts (Dashboard only)",
    ],
    cta: "Get Started Free",
    href: "/register",
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
    description: "Everything you need to scale your lead generation. Get 2 months free with annual billing!",
    popular: true,
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
      canAccessAdvancedAI: true,
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
