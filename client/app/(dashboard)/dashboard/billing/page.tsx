"use client";

import { useAuth } from "@/context/auth-context";
import { useBilling } from "@/context/billing-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CreditCard, AlertCircle, Check, Sparkles, ExternalLink, PartyPopper } from "lucide-react";
import { FormatPrice, PlanBadge } from "@/components/billing/PricingUtils";

const PLANS = {
  FREE: {
    name: "Free",
    description: "Ideal for solo builders and tinkerers",
    price: 0,
    features: ["1 product tracking", "100 leads per month", "Reddit & HackerNews", "Basic AI filters", "Email alerts"],
  },
  STARTER: {
    name: "Starter",
    description: "Ideal for indie hackers and solo founders",
    price: 25,
    features: ["Track up to 5 products", "1,000 leads per month", "Reddit, HN & Twitter alerts", "AI High-intent filtering", "AI Smart response drafting", "Email & Slack alerts", "Basic lead enrichment"],
  },
  PRO: {
    name: "Pro",
    description: "Built for agencies and growing teams",
    price: 69,
    features: ["Unlimited product tracking", "Unlimited leads per month", "Reddit, HN & Twitter alerts", "Instant real-time monitoring", "Custom AI persona for replies", "Advanced ROI analytics", "Standard & Premium Webhook support", "Priority support"],
  },
};
export default function BillingPage() {
  const { user } = useAuth();
  const { billingData, isLoading: isLoadingBilling, refreshBilling } = useBilling();
  const router = useRouter();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const searchParams = useSearchParams();
  const showSuccess = searchParams.get("status") === "success";

  const livePrices = billingData?.prices || [];
  const payments = billingData?.payments || [];
  const billingInfo = billingData?.user;

  useEffect(() => {
    const init = async () => {
      if (!user) {
        router.push("/login");
      } else {
        setIsInitializing(false);
        
        // POLLING LOGIC: If we just paid but plan is still FREE, poll for the webhook
        if (showSuccess && billingData?.user?.plan === 'FREE') {
          let attempts = 0;
          const pollInterval = setInterval(async () => {
            attempts++;
            await refreshBilling();
            if (billingData?.user?.plan !== 'FREE' || attempts >= 10) {
              clearInterval(pollInterval);
            }
          }, 2000);
          return () => clearInterval(pollInterval);
        }
      }
    };

    init();
  }, [user, router, showSuccess, billingData?.user?.plan, refreshBilling]);

  const handleOpenCustomerPortal = async () => {
    if (isRedirecting) return;
    
    setIsRedirecting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/portal`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        const url = result.data?.url;
        if (url) {
          window.location.href = url;
        } else {
          alert("Customer portal URL not found in response");
          setIsRedirecting(false);
        }
      } else {
        const error = await response.json();
        alert(`Failed: ${error.error?.message || "Unknown error"}`);
        setIsRedirecting(false);
      }
    } catch (error) {
      alert("Failed to open customer portal");
      setIsRedirecting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string | null) => {
    const normalizedStatus = (status || "").toLowerCase();
    switch (normalizedStatus) {
      case "active":
        return <Badge className="bg-success/10 text-success border-success/20">Active</Badge>;
      case "past_due":
        return <Badge className="bg-warning/10 text-warning border-warning/20">Past Due</Badge>;
      case "canceled":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Canceled</Badge>;
      default:
        return <Badge variant="secondary">{status || "Inactive"}</Badge>;
    }
  };

  const currentPlan = billingInfo?.plan || "FREE";
  const planConfig = PLANS[currentPlan as keyof typeof PLANS] || PLANS.FREE;

  const getDynamicPrice = (tier: "STARTER" | "PRO", cycle: "monthly" | "yearly"): number | null => {
    let priceId = "";
    if (tier === "STARTER") {
      priceId = cycle === "monthly" 
        ? process.env.NEXT_PUBLIC_PADDLE_STARTER_MONTHLY_PRICE_ID!
        : process.env.NEXT_PUBLIC_PADDLE_STARTER_YEARLY_PRICE_ID!;
    } else if (tier === "PRO") {
      priceId = cycle === "monthly" 
        ? process.env.NEXT_PUBLIC_PADDLE_PRO_MONTHLY_PRICE_ID!
        : process.env.NEXT_PUBLIC_PADDLE_PRO_YEARLY_PRICE_ID!;
    }
      
    const found = livePrices.find((p) => p.id === priceId);
    if (found) return found.amount / 100;
    
    return null;
  };

  if (isInitializing || isLoadingBilling) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight">Billing</h1>
        {currentPlan !== "FREE" && (
          <Badge variant="outline" className="px-3 py-1 border-primary/20 bg-primary/5 text-primary">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Premium Access Enabled
          </Badge>
        )}
      </div>

      {showSuccess && (
        <div className="bg-success/10 border border-success/30 rounded-xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center shrink-0">
            {currentPlan === 'FREE' ? (
              <Loader2 className="h-5 w-5 text-success animate-spin" />
            ) : (
              <PartyPopper className="h-5 w-5 text-success" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-success">
              {currentPlan === 'FREE' ? 'Verifying your payment...' : 'Payment Successful!'}
            </h3>
            <p className="text-sm text-success/80">
              {currentPlan === 'FREE' 
                ? "We've received your payment. It usually takes a few seconds to update your account..." 
                : "Your plan has been upgraded and your premium features are now active. Thank you for choosing Knivik!"}
            </p>
          </div>
          {currentPlan !== 'FREE' && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-auto text-success hover:bg-success/10"
              onClick={() => router.replace("/dashboard/billing")}
            >
              Dismiss
            </Button>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {/* Subscription status card */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="h-1 bg-primary w-full" />
            <CardContent className="pt-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                     <PlanBadge plan={currentPlan} className="text-xs px-3 py-1" />
                     {getStatusBadge(billingInfo?.subscriptionStatus ?? null)}
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">{planConfig.name}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{planConfig.description}</p>
                  </div>

                  {billingInfo?.subscriptionStatus === "active" && (
                    <div className="flex items-center gap-6 pt-2 border-t border-border/40">
                       <div className="flex flex-col">
                          <span className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Next Billing</span>
                          <span className="text-sm font-medium">{formatDate(billingInfo?.currentPeriodEnd)}</span>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Price</span>
                          <span className="text-sm font-medium">
                            ${currentPlan !== "FREE" ? getDynamicPrice(currentPlan as "STARTER" | "PRO", billingInfo?.billingCycle as "monthly" | "yearly" || "monthly") : 0}/{billingInfo?.billingCycle === 'yearly' ? 'yr' : 'mo'}
                          </span>
                       </div>
                    </div>
                  )}
                </div>

                {currentPlan !== "FREE" && (billingInfo?.paddleCustomerId || billingData?.subscription?.paddleCustomerId) ? (
                  <Button 
                    variant="outline" 
                    className="h-9 text-xs font-bold gap-2 min-w-[150px]" 
                    onClick={handleOpenCustomerPortal}
                    disabled={isRedirecting}
                  >
                    {isRedirecting ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        Manage Subscription <ExternalLink className="h-3 w-3" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Link href="/pricing" className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-bold transition-all shadow-lg shadow-primary/20">
                    View Plans
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment History - Clean table */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold">Invoices</CardTitle>
              <CardDescription>Records of your subscription payments</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-medium">No payment history found</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3.5 hover:bg-muted/30 rounded-lg transition-colors border-b border-border/40 last:border-0"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center">
                           <CreditCard className="h-5 w-5 text-primary opacity-70" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{formatAmount(payment.amount, payment.currency)}</p>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{formatDate(payment.createdAt)}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-xs uppercase font-bold ${payment.status === "completed" ? "bg-success/5 text-success border-success/20" : ""}`}>
                        {payment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upgrade/Change Plan - Available for everyone to allow seamless scaling */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">
                    {currentPlan === "FREE" ? "Ready to grow?" : "Change your plan"}
                  </CardTitle>
                  <CardDescription>
                    {currentPlan === "FREE" ? "Choose a plan that fits your scale" : "Upgrade to yearly or switch your current tier"}
                  </CardDescription>
                </div>
                {/* Compact Toggle */}
                <div className="flex items-center gap-3 bg-muted/50 p-1 rounded-full border border-border/40">
                  <button
                    onClick={() => setBillingCycle("monthly")}
                    className={`text-xs uppercase font-bold px-3 py-1 rounded-full transition-all ${billingCycle === "monthly" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle("yearly")}
                    className={`text-xs uppercase font-bold px-3 py-1 rounded-full transition-all ${billingCycle === "yearly" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
                  >
                    Yearly
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {/* Starter Option */}
                 <div className={`p-4 rounded-xl border transition-all ${currentPlan === "STARTER" && billingInfo?.billingCycle === billingCycle ? "bg-primary/5 border-primary/30" : "bg-muted/20 border-border/50"}`}>
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Starter</span>
                       {currentPlan === "STARTER" && billingInfo?.billingCycle === billingCycle && (
                         <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">Current</Badge>
                       )}
                    </div>
                    <FormatPrice 
                      amount={getDynamicPrice("STARTER", billingCycle)} 
                      billingCycle={billingCycle} 
                      className="mb-4"
                    />
                    {currentPlan === "STARTER" && billingInfo?.billingCycle === billingCycle ? (
                      <Button disabled className="w-full h-8 text-xs font-bold opacity-50">Active Plan</Button>
                    ) : (
                      <CheckoutButton
                        priceId={billingCycle === "monthly" ? process.env.NEXT_PUBLIC_PADDLE_STARTER_MONTHLY_PRICE_ID! : process.env.NEXT_PUBLIC_PADDLE_STARTER_YEARLY_PRICE_ID!}
                        email={user?.email || ""}
                        userId={user?.id || ""}
                        subscriptionId={billingData?.paddleSubscriptionId}
                        planName="Starter"
                        className="w-full h-8 text-xs font-bold"
                        onSuccess={() => refreshBilling()}
                      >
                        {currentPlan === "PRO" ? "Switch to Starter" : "Buy Starter"}
                      </CheckoutButton>
                    )}
                 </div>

                 {/* Pro Option */}
                 <div className={`p-4 rounded-xl border transition-all ${currentPlan === "PRO" && billingInfo?.billingCycle === billingCycle ? "bg-primary/5 border-primary/30" : "bg-muted/20 border-border/50 ring-1 ring-primary/20"}`}>
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pro</span>
                       {currentPlan === "PRO" && billingInfo?.billingCycle === billingCycle && (
                         <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">Current</Badge>
                       )}
                    </div>
                    <FormatPrice 
                      amount={getDynamicPrice("PRO", billingCycle)} 
                      billingCycle={billingCycle} 
                      className="mb-4"
                    />
                    {currentPlan === "PRO" && billingInfo?.billingCycle === billingCycle ? (
                      <Button disabled className="w-full h-8 text-xs font-bold opacity-50">Active Plan</Button>
                    ) : (
                      <CheckoutButton
                        priceId={billingCycle === "monthly" ? process.env.NEXT_PUBLIC_PADDLE_PRO_MONTHLY_PRICE_ID! : process.env.NEXT_PUBLIC_PADDLE_PRO_YEARLY_PRICE_ID!}
                        email={user?.email || ""}
                        userId={user?.id || ""}
                        subscriptionId={billingData?.paddleSubscriptionId}
                        planName="Pro"
                        variant="default"
                        className="w-full h-8 text-xs font-bold shadow-lg shadow-primary/10"
                        onSuccess={() => refreshBilling()}
                      >
                        {currentPlan === "STARTER" ? "Upgrade to Pro" : "Go Pro"}
                      </CheckoutButton>
                    )}
                 </div>
              </div>
              {currentPlan !== "FREE" && (
                <p className="text-[11px] text-center text-muted-foreground mt-4 bg-muted/30 py-2 rounded-lg border border-dashed border-border/60">
                  ⚡ Note: Plan changes are handled securely via Paddle. Your current plan's unused credit will be automatically applied to the new plan.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          {/* Features list based on plan */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Plan Limits</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-3">
                {planConfig.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <div className="mt-1 bg-primary/10 rounded-full p-0.5">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-foreground/80 leading-relaxed font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Support box */}
          <div className="p-5 rounded-xl bg-primary text-primary-foreground shadow-xl shadow-primary/10 flex flex-col gap-4">
             <div>
               <h3 className="font-bold text-lg">Need help?</h3>
               <p className="text-sm opacity-90 leading-relaxed font-medium">Have issues with billing or need a custom plan?</p>
             </div>
             <Button variant="secondary" className="w-full font-bold h-10" asChild>
               <a href="mailto:support@knivik.com">Contact Support</a>
             </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
