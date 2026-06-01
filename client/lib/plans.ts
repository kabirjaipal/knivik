import { UserPlan } from "./constants";

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
      "Reddit & HackerNews scanning",
      "Automated scans every 24 hours",
      "1 manual force scan per day",
      "Basic intent detection",
      "Standard dashboard analytics",
      "No automated alerts (Dashboard only)",
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
      "Reddit, HN & Twitter (X)",
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
      priorityProcessing: true,
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
