"use client";

import { Navbar } from "@/components/landing/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { useState, useEffect } from "react";
import { Check, Sparkles, Zap, Shield, Loader2 } from "lucide-react";
import Link from "next/link";
import { CheckoutButton } from "@/components/billing/CheckoutButton";

const PLANS = {
  FREE: {
    name: "Free",
    description: "Perfect for getting started",
    features: [
      "1 product tracking",
      "100 leads per month",
      "Reddit & HackerNews scanning",
      "Basic AI intent detection",
      "Email notifications",
      "Standard support",
    ],
    cta: "Get Started Free",
    href: "/register",
  },
  STARTER: {
    name: "Starter",
    description: "Ideal for indie hackers and solo founders",
    popular: false,
    features: [
      "Track up to 5 products",
      "1,000 leads per month",
      "Reddit, HN & Twitter alerts",
      "AI High-intent filtering",
      "AI Smart response drafting",
      "Email & Slack alerts",
      "Basic lead enrichment",
      "Priority support",
    ],
    monthlyPriceId: process.env.NEXT_PUBLIC_PADDLE_STARTER_MONTHLY_PRICE_ID!,
    yearlyPriceId: process.env.NEXT_PUBLIC_PADDLE_STARTER_YEARLY_PRICE_ID!,
  },
  PRO: {
    name: "Pro",
    description: "Built for agencies and growing teams",
    popular: true,
    features: [
      "Unlimited product tracking",
      "Unlimited leads per month",
      "All platforms (incl. LinkedIn)",
      "Instant real-time monitoring",
      "AI Personalised reply engine",
      "Advanced ROI analytics",
      "Full API & Webhook access",
      "Dedicated account manager",
    ],
    monthlyPriceId: process.env.NEXT_PUBLIC_PADDLE_PRO_MONTHLY_PRICE_ID!,
    yearlyPriceId: process.env.NEXT_PUBLIC_PADDLE_PRO_YEARLY_PRICE_ID!,
  },
};

export default function PricingPage() {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [livePrices, setLivePrices] = useState<any[]>([]);
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/prices`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setLivePrices(d.data);
      })
      .catch(err => console.error("Failed to load live prices", err))
      .finally(() => setIsLoadingPrices(false));
  }, []);

  const getPrice = (planKey: keyof typeof PLANS, cycle: 'monthly' | 'yearly') => {
    if (planKey === "FREE") return 0;

    const plan = PLANS[planKey];
    if (!('monthlyPriceId' in plan)) return 0;

    const priceId = plan[`${cycle}PriceId` as keyof typeof plan];
    const livePrice = livePrices.find(p => p.id === priceId);
    
    // Paddle returns amount in cents, so divide by 100
    if (livePrice) return livePrice.amount / 100;

    // No hardcoded fallbacks
    return "--";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section - Tightened */}
      <section className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-extrabold tracking-tight mb-4">
            Simple, honest pricing.
          </h1>
          <p className="text-lg text-muted-foreground mb-10">
            One tool for all your high-intent lead generation.
          </p>

          {/* Billing Toggle - Minimalist */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <button 
              onClick={() => setBillingCycle("monthly")}
              className={`text-sm font-semibold transition-colors ${billingCycle === "monthly" ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"}`}
            >
              Monthly
            </button>
            <div 
              onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
              className="w-12 h-6 bg-muted border border-border rounded-full relative cursor-pointer group"
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-primary rounded-full transition-all duration-300 ${billingCycle === "yearly" ? "translate-x-6" : ""}`} />
            </div>
            <button 
              onClick={() => setBillingCycle("yearly")}
              className={`text-sm font-semibold flex items-center gap-2 transition-colors ${billingCycle === "yearly" ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"}`}
            >
              Yearly
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">2 Months Free</span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <Card className={`flex flex-col border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/30 ${user?.plan === "FREE" ? "ring-2 ring-primary ring-offset-4 ring-offset-background" : ""}`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold">{PLANS.FREE.name}</CardTitle>
                  {user?.plan === "FREE" && <Badge className="text-[10px] uppercase font-bold tracking-tighter">Current</Badge>}
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-extrabold">$0</span>
                  <span className="text-muted-foreground text-sm ml-1">/forever</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col pt-0">
                <ul className="space-y-2 mb-6 flex-1 border-t border-border/40 pt-4">
                  {PLANS.FREE.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm text-foreground/80">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href={user ? "/dashboard" : "/register"} className="w-full">
                  <Button variant={user?.plan === "FREE" ? "secondary" : "outline"} className="w-full h-10 font-bold" disabled={user?.plan === "FREE"}>
                    {user?.plan === "FREE" ? "Active" : "Start Free"}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Starter Plan */}
            <Card className={`flex flex-col border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/30 ${user?.plan === "STARTER" ? "ring-2 ring-primary ring-offset-4 ring-offset-background" : ""}`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold">{PLANS.STARTER.name}</CardTitle>
                  {user?.plan === "STARTER" && <Badge className="text-[10px] uppercase font-bold tracking-tighter">Current</Badge>}
                </div>
                <div className="mt-2 flex items-center min-h-[44px]">
                  {isLoadingPrices ? (
                     <Loader2 className="h-6 w-6 animate-spin text-muted-foreground opacity-50" />
                  ) : (
                    <>
                      <span className="text-3xl font-extrabold">
                        ${getPrice("STARTER", billingCycle)}
                      </span>
                      <span className="text-muted-foreground text-sm ml-1">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col pt-0">
                <ul className="space-y-2 mb-6 flex-1 border-t border-border/40 pt-4">
                  {PLANS.STARTER.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm text-foreground/80">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <CheckoutButton
                  priceId={
                    billingCycle === "monthly"
                      ? PLANS.STARTER.monthlyPriceId
                      : PLANS.STARTER.yearlyPriceId
                  }
                  email={user?.email || ""}
                  userId={user?.id || ""}
                  planName="Starter"
                  className="w-full h-10 font-bold"
                  disabled={user?.plan === "STARTER"}
                  onSuccess={() => {
                    alert("Subscribed to Starter!");
                  }}
                  onError={(error) => alert(error.message)}
                >
                  {user?.plan === "STARTER" ? "Active" : "Buy Starter"}
                </CheckoutButton>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className={`flex flex-col border-primary/20 bg-primary/5 backdrop-blur-sm transition-all hover:border-primary/40 ${user?.plan === "PRO" ? "ring-2 ring-primary ring-offset-4 ring-offset-background" : ""}`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    {PLANS.PRO.name}
                    <Sparkles className="h-4 w-4 text-primary fill-primary/20" />
                  </CardTitle>
                  {user?.plan === "PRO" ? <Badge className="text-[10px] uppercase font-bold tracking-tighter">Current</Badge> : <Badge variant="secondary" className="text-[10px] uppercase font-bold bg-primary/10 text-primary">Popular</Badge>}
                </div>
                <div className="mt-2 flex items-center min-h-[44px]">
                  {isLoadingPrices ? (
                     <Loader2 className="h-6 w-6 animate-spin text-muted-foreground opacity-50" />
                  ) : (
                    <>
                      <span className="text-3xl font-extrabold text-primary">
                        ${getPrice("PRO", billingCycle)}
                      </span>
                      <span className="text-muted-foreground text-sm ml-1">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col pt-0">
                <ul className="space-y-2 mb-6 flex-1 border-t border-border/40 pt-4">
                  {PLANS.PRO.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm text-foreground/90">
                      <Zap className="h-4 w-4 text-primary shrink-0 opacity-80" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <CheckoutButton
                  priceId={
                    billingCycle === "monthly"
                      ? PLANS.PRO.monthlyPriceId
                      : PLANS.PRO.yearlyPriceId
                  }
                  email={user?.email || ""}
                  userId={user?.id || ""}
                  planName="Pro"
                  className="w-full h-10 font-bold shadow-lg shadow-primary/10"
                  disabled={user?.plan === "PRO"}
                  onSuccess={() => {
                    alert("Subscribed to Pro!");
                  }}
                  onError={(error) => alert(error.message)}
                >
                  {user?.plan === "PRO" 
                    ? "Active" 
                    : (user && user.plan === "STARTER" ? "Upgrade" : "Go Pro")
                  }
                </CheckoutButton>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-4xl text-center">
          <Shield className="h-12 w-12 mx-auto mb-6 text-primary" />
          <h2 className="text-2xl font-bold mb-4">Secure, reliable payments</h2>
          <p className="text-muted-foreground mb-8">
            We use Paddle for secure payment processing. Your payment information is never stored on our servers.
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
            <span>•</span>
            <Link href="/refund-policy" className="hover:underline">Refund Policy</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
