"use client";

import { Check, X } from "lucide-react";
import { Fragment } from "react";

const COMPARISON_FEATURES = [
  {
    category: "Monitoring",
    features: [
      { name: "Monitored Topics", free: "1", pro: "5" },
      { name: "Signals per Month", free: "50", pro: "1,000" },
      { name: "Reddit Support", free: true, pro: true },
      { name: "Hacker News Support", free: true, pro: true },
      { name: "Twitter (X) Support", free: false, pro: true },
      { name: "Real-time Alerts", free: false, pro: true },
    ],
  },
  {
    category: "AI Intelligence",
    features: [
      { name: "Basic Intent Detection", free: true, pro: true },
      { name: "Advanced Intent Scoring", free: false, pro: true },
      { name: "Custom AI Personas", free: false, pro: true },
      { name: "Advanced AI Insight Models", free: false, pro: true },
    ],
  },
  {
    category: "Integrations & Support",
    features: [
      { name: "Email Alerts", free: false, pro: true },
      { name: "Slack & Discord", free: false, pro: true },
      { name: "Priority Support", free: false, pro: true },
    ],
  },
];

export function PricingComparison() {
  return (
    <div className="mt-24 w-full max-w-4xl mx-auto hidden md:block">
      <div className="text-center mb-8">
        <h2 className="text-lg font-black uppercase tracking-widest text-muted-foreground/50">Full Feature Breakdown</h2>
      </div>

      <div className="rounded-xl border border-border/40 bg-card/20 backdrop-blur-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/40">
              <th className="p-5 text-sm font-black uppercase tracking-widest text-muted-foreground w-1/2">Feature</th>
              <th className="p-5 text-sm font-black uppercase tracking-widest text-center">Free</th>
              <th className="p-5 text-sm font-black uppercase tracking-widest text-center text-primary">Pro</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_FEATURES.map((section) => (
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
