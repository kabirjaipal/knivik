"use client";

import { useAuth } from "@/context/auth-context";
import { useBilling } from "@/context/billing-context";
import { useState } from "react";
import { Check, Info, Loader2, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { PLANS } from "@/lib/plans";
import { toast } from "sonner";
import { PricingComparison } from "./pricing-comparison";

export default function PricingClient() {
  const { user } = useAuth();
  const { billingData, isLoading: isLoadingPrices } = useBilling();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const livePrices = billingData?.prices || [];
  const currentPlan = (billingData?.user?.plan || user?.plan || "FREE").toUpperCase();

  const getPrice = (planKey: keyof typeof PLANS, cycle: 'monthly' | 'yearly') => {
    if (planKey === "FREE") return 0;

    const plan = PLANS[planKey];
    if (!("monthly" in plan)) return 0;

    const productId = (plan as any)[cycle].productId;
    const livePrice = livePrices.find(p => String(p.id) === String(productId));
    
    if (livePrice) return livePrice.amount;
    return "--";
  };

  return (
    <div className="flex flex-col min-h-screen">
      <section className="pt-32 pb-20 bg-background relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 bg-grid opacity-20 -z-10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[10%] w-[80%] h-[40%] rounded-[100%] bg-primary/10 blur-[120px]" />
        </div>

        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center text-center mb-16 lg:mb-24">
            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter text-foreground mb-6">
              Simple, predictable pricing.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mb-12">
              Choose the plan that fits your growth stage. No long-term contracts, cancel anytime.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center gap-4 bg-secondary/50 p-1.5 rounded-2xl border border-border/50 backdrop-blur-md">
              <button 
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${
                  billingCycle === "monthly" 
                  ? "bg-background text-foreground shadow-lg" 
                  : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingCycle("yearly")}
                className={`px-6 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${
                  billingCycle === "yearly" 
                  ? "bg-background text-foreground shadow-lg" 
                  : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Yearly
                <Badge className="bg-primary/20 text-primary border-none text-[10px] font-black px-2 py-0">2 MONTHS FREE</Badge>
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto mb-24">
            {/* Free Plan */}
            <div className={`relative flex flex-col p-8 rounded-[2.5rem] border ${currentPlan === "FREE" ? "border-primary/50 bg-primary/5" : "border-border/50 bg-background"} transition-all`}>
              {currentPlan === "FREE" && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                  Current Plan
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-2xl font-black mb-2">{PLANS.FREE.name}</h3>
                <p className="text-sm text-muted-foreground font-medium mb-6 leading-relaxed">
                  {PLANS.FREE.description}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black tracking-tighter">$0</span>
                  <span className="text-muted-foreground font-bold">/forever</span>
                </div>
              </div>

              <div className="space-y-4 mb-10 flex-grow pt-6 border-t border-border/50">
                {PLANS.FREE.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success" />
                    <span className="text-sm font-bold text-foreground/80 leading-tight">{feature}</span>
                  </div>
                ))}
              </div>

              <Link href={user ? "/dashboard" : "/register"} className="w-full">
                <Button 
                  size="lg" 
                  className={`w-full h-14 text-base font-bold rounded-2xl ${
                    currentPlan === "FREE" ? "bg-secondary text-foreground cursor-default" : "bg-primary hover:bg-primary/90"
                  }`}
                  disabled={currentPlan === "FREE"}
                >
                  {currentPlan === "FREE" ? "Active" : "Get Started Free"}
                </Button>
              </Link>
            </div>

            {/* Pro Plan */}
            <div className={`relative flex flex-col p-8 rounded-[2.5rem] border ${
              currentPlan === "PRO" 
              ? "border-primary bg-primary/5 ring-4 ring-primary/5 shadow-2xl shadow-primary/10" 
              : "border-primary/30 bg-background shadow-xl shadow-primary/5"
            } transition-all`}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                <Sparkles className="h-3 w-3 fill-primary-foreground" />
                {currentPlan === "PRO" ? "Your Plan" : "Most Popular"}
              </div>
              
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-black">{PLANS.PRO.name}</h3>
                  <Zap className="h-6 w-6 text-primary fill-primary animate-pulse" />
                </div>
                <p className="text-sm text-muted-foreground font-medium mb-6 leading-relaxed">
                  {PLANS.PRO.description}
                </p>
                <div className="flex items-baseline gap-1.5">
                  {isLoadingPrices ? (
                    <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
                  ) : (
                    <>
                      <span className="text-5xl font-black tracking-tighter text-primary">
                        ${getPrice("PRO", billingCycle)}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground font-bold leading-none text-sm">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                        {billingCycle === "yearly" && (
                          <span className="text-[10px] font-black text-primary uppercase mt-1">Best Value</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4 mb-10 flex-grow pt-6 border-t border-primary/20">
                {PLANS.PRO.features.filter(f => !f.includes("2 months free")).map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-sm font-bold text-foreground/80 leading-tight">{feature}</span>
                  </div>
                ))}
              </div>

              <CheckoutButton
                productId={
                  billingCycle === "monthly"
                    ? PLANS.PRO.monthly.productId
                    : PLANS.PRO.yearly.productId
                }
                email={user?.email || ""}
                name={user?.name || user?.username || ""}
                userId={user?.id || ""}
                planName="Pro"
                className={`w-full h-14 text-base font-bold rounded-2xl transition-all ${
                  currentPlan === "PRO" 
                  ? "bg-secondary text-foreground cursor-default" 
                  : "bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 hover:scale-[1.02]"
                }`}
                disabled={currentPlan === "PRO"}
                onSuccess={() => {
                  toast.success("Payment successful!");
                }}
                onError={(error) => toast.error(error.message)}
              >
                {currentPlan === "PRO" ? "Active" : "Get Started Now"}
              </CheckoutButton>
            </div>
          </div>

          <PricingComparison />

          <div className="mt-32 max-w-4xl mx-auto">
            <h2 className="text-4xl font-black tracking-tighter mb-12 text-center">Common Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {[
                {
                  q: "Can I cancel my subscription?",
                  a: "Yes, you can cancel at any time from your account settings. You will continue to have access to your Pro features until the end of your current billing period."
                },
                {
                  q: "Do you offer refunds?",
                  a: "We offer a 14-day money-back guarantee for new users. If you're not satisfied, we'll refund your last payment no questions asked."
                },
                {
                  q: "What counts as a 'lead'?",
                  a: "A lead is a high-intent conversation found by our AI. We filter out the noise so you only see people who are actively looking to buy or solving a problem."
                },
                {
                  q: "How do alerts work?",
                  a: "Pro users can set up instant notifications via Email, Slack, or Discord. You'll be notified the second a relevant conversation starts."
                }
              ].map((faq) => (
                <div key={faq.q}>
                  <h3 className="text-xl font-black mb-3">{faq.q}</h3>
                  <p className="text-muted-foreground font-medium leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-4xl mx-auto mt-24 flex flex-col items-center gap-6 text-sm text-muted-foreground font-medium">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span>All plans include a 7-day money-back guarantee.</span>
            </div>
            <div className="flex flex-wrap justify-center gap-8">
              <span>No long-term contracts</span>
              <span>Cancel anytime</span>
              <span>Fast onboarding</span>
            </div>
            <p className="text-[10px] text-muted-foreground/40 mt-8 max-w-lg text-center font-bold uppercase tracking-widest">
              Our order process is conducted by our online reseller & Merchant of Record, DodoPayments.com, who also handles all customer service inquiries and returns.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
