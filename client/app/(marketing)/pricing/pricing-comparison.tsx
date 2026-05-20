"use client";

import { Check, X } from "lucide-react";
import { Fragment } from "react";
import { PLANS, INTERVAL_TEXT } from "@/lib/plans";

const getComparisonFeatures = () => [
  {
    category: "Monitoring",
    features: [
      { 
        name: "Monitored Topics", 
        free: String(PLANS.FREE.limits.products), 
        pro: String(PLANS.PRO.limits.products) 
      },
      { 
        name: "Leads per Month", 
        free: PLANS.FREE.limits.leadsPerMonth.toLocaleString(), 
        pro: PLANS.PRO.limits.leadsPerMonth.toLocaleString() 
      },
      { 
        name: "Global Auto Search", 
        free: "Every 24h", 
        pro: `${INTERVAL_TEXT} (24/7)` 
      },
      { 
        name: "Manual Force Scans", 
        free: `${PLANS.FREE.limits.manualScansPerDay} / day`, 
        pro: `${PLANS.PRO.limits.manualScansPerDay} / day / product` 
      },
      { name: "Reddit Support", free: true, pro: true },
      { name: "Hacker News Support", free: true, pro: true },
      { 
        name: "Twitter (X) Support", 
        free: PLANS.FREE.capabilities.canAccessTwitter, 
        pro: PLANS.PRO.capabilities.canAccessTwitter 
      },
      { 
        name: "Real-time Alerts", 
        free: PLANS.FREE.capabilities.canAccessAlerts, 
        pro: PLANS.PRO.capabilities.canAccessAlerts 
      },
    ],
  },
  {
    category: "AI Intelligence",
    features: [
      { name: "Basic Intent Detection", free: true, pro: true },
      { 
        name: "Analytics Dashboard", 
        free: "Standard",
        pro: "Advanced ROI & Intent"
      },
      { 
        name: "Advanced Intent Scoring", 
        free: PLANS.FREE.capabilities.canAccessAdvancedAI, 
        pro: PLANS.PRO.capabilities.canAccessAdvancedAI 
      },
      { 
        name: "Custom AI Personas", 
        free: PLANS.FREE.capabilities.canAccessCustomPersonas, 
        pro: PLANS.PRO.capabilities.canAccessCustomPersonas 
      },
    ],
  },
  {
    category: "Integrations & Support",
    features: [
      { 
        name: "Email Alerts", 
        free: PLANS.FREE.capabilities.canAccessAlerts, 
        pro: PLANS.PRO.capabilities.canAccessAlerts 
      },
      { 
        name: "Slack & Discord", 
        free: PLANS.FREE.capabilities.canAccessAlerts, 
        pro: PLANS.PRO.capabilities.canAccessAlerts 
      },
      { 
        name: "Priority Support", 
        free: "Community",
        pro: "Priority" 
      },
    ],
  },
];

export function PricingComparison() {
  const comparisonFeatures = getComparisonFeatures();
  return (
    <div className="mt-24 w-full max-w-4xl mx-auto hidden md:block">
      <div className="text-center mb-8">
        <h2 className="text-lg font-black uppercase tracking-widest text-muted-foreground/50">Full Feature Breakdown</h2>
      </div>

      <div className="rounded-xl border border-border/40 bg-card/70 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/40">
              <th className="p-5 text-sm font-black uppercase tracking-widest text-muted-foreground w-1/2">Feature</th>
              <th className="p-5 text-sm font-black uppercase tracking-widest text-center">Free</th>
              <th className="p-5 text-sm font-black uppercase tracking-widest text-center text-primary">Pro</th>
            </tr>
          </thead>
          <tbody>
            {comparisonFeatures.map((section) => (
              <Fragment key={section.category}>
                <tr className="bg-muted/30">
                  <td colSpan={3} className="p-4 text-xs font-black uppercase tracking-wider text-foreground/70">
                    {section.category}
                  </td>
                </tr>
                {section.features.map((feature) => (
                  <tr key={feature.name} className="border-b border-border/20 last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="p-5 text-sm font-medium text-foreground/80">{feature.name}</td>
                    <td className="p-5 text-sm text-center">
                      {typeof feature.free === "boolean" ? (
                        feature.free ? <Check className="h-4 w-4 mx-auto text-foreground/50" /> : <X className="h-4 w-4 mx-auto text-muted-foreground/30" />
                      ) : (
                        <span className="text-muted-foreground/70 font-bold">{feature.free}</span>
                      )}
                    </td>
                    <td className="p-5 text-sm text-center">
                      {typeof feature.pro === "boolean" ? (
                        feature.pro ? <Check className="h-4 w-4 mx-auto text-primary" /> : <X className="h-4 w-4 mx-auto text-muted-foreground/30" />
                      ) : (
                        <span className="text-primary font-black">{feature.pro}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
