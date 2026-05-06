"use client";

import { useAuth } from "@/context/auth-context";
import { useBilling } from "@/context/billing-context";
import { useState } from "react";
import { Check, Sparkles, Zap, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { PLANS } from "@/lib/plans";

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

    const variantId = (plan as any)[cycle].variantId;
    const livePrice = livePrices.find(p => String(p.id) === String(variantId));
    
    if (livePrice) return livePrice.amount / 100;
    return "--";
  };

  return (
    <>
      <section className="pt-24 pb-8 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">
            Simple Pricing.
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
            Choose the plan that fits your growth. No hidden fees.
          </p>

          <div className="flex items-center justify-center gap-5 mb-6">
            <button 
              onClick={() => setBillingCycle("monthly")}
              className={`text-sm font-bold tracking-wide transition-colors ${billingCycle === "monthly" ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"}`}
            >
              Monthly
            </button>
            <div 
              onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
              className="w-12 h-6 bg-muted border border-border rounded-full relative cursor-pointer shadow-inner"
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-primary rounded-full transition-all duration-300 ease-in-out shadow-md ${billingCycle === "yearly" ? "translate-x-6" : ""}`} />
            </div>
            <button 
              onClick={() => setBillingCycle("yearly")}
              className={`text-sm font-bold tracking-wide flex items-center gap-2 transition-colors ${billingCycle === "yearly" ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"}`}
            >
              Yearly
              <Badge className="bg-primary text-primary-foreground border-none text-[10px] font-black py-0.5 px-2">2 MONTHS FREE</Badge>
            </button>
          </div>
        </div>
      </section>

      <section className="pb-16 px-4 flex-1">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
            <Card className={`flex flex-col border-border/40 bg-card/40 backdrop-blur-md transition-all duration-300 hover:border-primary/20 hover:shadow-xl ${currentPlan === "FREE" ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}>
              <CardHeader className="p-7 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold tracking-tight">{PLANS.FREE.name}</CardTitle>
                  {currentPlan === "FREE" && <Badge className="text-xs font-black tracking-widest uppercase">Current</Badge>}
                </div>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-4xl font-black tracking-tighter text-foreground">$0</span>
                  <span className="text-muted-foreground text-sm font-medium">/forever</span>
                </div>
                <CardDescription className="text-xs font-medium mt-1.5 text-muted-foreground">
                  {PLANS.FREE.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col pt-0 px-7 pb-7">
                <ul className="space-y-3 mb-8 flex-1 border-t border-border/40 pt-6">
                  {PLANS.FREE.features.slice(0, 5).map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-foreground/50 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href={user ? "/dashboard" : "/register"} className="w-full">
                  <Button variant={currentPlan === "FREE" ? "secondary" : "outline"} className="w-full h-11 text-sm font-bold tracking-wide" disabled={currentPlan === "FREE"}>
                    {currentPlan === "FREE" ? "Active" : "Start for Free"}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className={`relative flex flex-col border-primary/40 bg-linear-to-b from-primary/10 to-transparent backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] hover:border-primary/60 hover:shadow-[0_0_50px_-10px_rgba(var(--primary),0.4)] ${currentPlan === "PRO" ? "ring-2 ring-primary ring-offset-4 ring-offset-background" : ""}`}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                <Badge className="bg-primary text-primary-foreground border-none px-6 py-1.5 text-xs font-black uppercase tracking-widest shadow-2xl shadow-primary/40">
                  Most Popular
                </Badge>
              </div>

              <CardHeader className="p-7 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-black flex items-center gap-2 tracking-tight text-primary">
                    {PLANS.PRO.name}
                    <div className="relative">
                      <Sparkles className="h-5 w-5 text-primary fill-primary animate-pulse" />
                      <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full animate-ping" />
                    </div>
                  </CardTitle>
                </div>
                <div className="mt-3 flex items-baseline min-h-[44px] gap-1.5">
                  {isLoadingPrices ? (
                     <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
                  ) : (
                    <>
                      <span className="text-4xl font-black text-primary tracking-tighter">
                        ${getPrice("PRO", billingCycle)}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-sm font-bold uppercase leading-none">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                        {billingCycle === "yearly" && (
                          <span className="text-primary text-xs font-black uppercase leading-none mt-1 animate-pulse">Best Value</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <CardDescription className="text-xs font-medium mt-1.5 text-foreground/80">
                  {PLANS.PRO.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col pt-0 px-7 pb-7">
                <ul className="space-y-3 mb-8 flex-1 border-t border-primary/20 pt-6">
                  {PLANS.PRO.features.slice(0, 6).filter(f => !f.includes("2 Months Free")).map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-foreground/90 font-medium">
                      <Zap className="h-4 w-4 text-primary fill-primary shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <CheckoutButton
                  variantId={
                    billingCycle === "monthly"
                      ? PLANS.PRO.monthly.variantId
                      : PLANS.PRO.yearly.variantId
                  }
                  email={user?.email || ""}
                  name={user?.name || user?.username || ""}
                  userId={user?.id || ""}
                  planName="Pro"
                  className="w-full h-11 text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-[1.02] active:scale-[0.98] bg-primary text-primary-foreground border-none"
                  disabled={currentPlan !== "FREE"}
                  onSuccess={() => {
                    console.log("Payment success!");
                  }}
                  onError={(error) => alert(error.message)}
                >
                  {currentPlan === "PRO" ? "Active" : (user?.plan !== "FREE" ? "Manage Plan" : "Get Started Now")}
                </CheckoutButton>
              </CardContent>
            </Card>
          </div>

          <PricingComparison />

          <div className="mt-32 max-w-4xl mx-auto border-t border-border/40 pt-20">
            <h2 className="text-3xl font-black tracking-tight mb-12 text-center">Common Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              <div>
                <h3 className="text-lg font-bold mb-3">Can I cancel my subscription?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Yes, you can cancel your subscription at any time from your account settings. You will continue to have access to your Pro features until the end of your current billing period.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-3">Do you offer refunds?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">We offer a 14-day money-back guarantee for new users, provided that less than 10% of the monthly signal quota has been consumed. This helps us cover the significant costs associated with our AI processing.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-3">What is a "Signal"?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">A signal is a high-intent mention or discussion found by our AI that matches your monitored topics. We filter out the noise so you only see the most relevant leads.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-3">How do alerts work?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Pro users can set up real-time notifications via Email, Slack, or Discord. As soon as we find a relevant signal, you'll be notified instantly.</p>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto mt-16 text-center">
            <p className="text-xs text-muted-foreground/60 font-medium">
              Our order process is conducted by our online reseller & Merchant of Record, LemonSqueezy.com, who also handles all customer service inquiries and returns.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
