"use client";

import { useAuth } from "@/context/auth-context";
import { useBilling } from "@/context/billing-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2, CreditCard, AlertCircle, Check,
  Sparkles, ExternalLink, PartyPopper, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { PlanBadge } from "@/components/billing/PricingUtils";
import { PLANS } from "@/lib/plans";
import { SUPPORT_EMAIL } from "@/lib/constants";

export default function BillingPage() {
  const { user } = useAuth();
  const { billingData, isLoading: isLoadingBilling, refreshBilling } = useBilling();
  const router = useRouter();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const [showSuccess, setShowSuccess] = useState(false);

  const payments = billingData?.payments || [];
  const billingInfo = billingData?.user;
  const currentPlan = (billingInfo?.plan || "FREE").toUpperCase();
  const planConfig = PLANS[currentPlan as keyof typeof PLANS] || PLANS.FREE;
  const isProPlan = currentPlan === "PRO";
  const subscriptionStatus = billingInfo?.subscriptionStatus || (isProPlan ? "active" : "inactive");
  const isActiveOrTrial = subscriptionStatus === "active" || subscriptionStatus === "trialing";
  const isNewTrialPeriod = isProPlan && subscriptionStatus === "active" && billingInfo?.currentPeriodEnd && payments.length === 0;
  const showTrialPeriod = subscriptionStatus === "trialing" || isNewTrialPeriod;
  const billingDateLabel = showTrialPeriod ? "Trial Ends" : "Next Billing";

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else {
      setIsInitializing(false);
      if (showSuccess && billingData?.user?.plan === "FREE") {
        let attempts = 0;
        const maxAttempts = 30; // 1 minute (2s * 30)
        
        const pollInterval = setInterval(async () => {
          attempts++;
          await refreshBilling();
          
          // Stop if upgraded OR reached max attempts
          if (billingData?.user?.plan !== "FREE" || attempts >= maxAttempts) {
            clearInterval(pollInterval);
          }
        }, 2000);
        return () => clearInterval(pollInterval);
      }
    }
  }, [user, router, showSuccess, billingData?.user?.plan, refreshBilling]);

  useEffect(() => {
    if (statusParam === "success" || statusParam === "active") {
      setShowSuccess(true);
      router.replace("/dashboard/billing");
    }
  }, [statusParam, router]);

  const handleOpenCustomerPortal = async () => {
    if (isRedirecting) return;
    setIsRedirecting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/portal`, {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const result = await response.json();
        const url = result.data?.url;
        if (url) {
          window.location.href = url;
        } else {
          toast.error("Customer portal URL not found");
          setIsRedirecting(false);
        }
      } else {
        const error = await response.json();
        toast.error(`Failed: ${error.error?.message || "Unknown error"}`);
        setIsRedirecting(false);
      }
    } catch {
      toast.error("Failed to open customer portal");
      setIsRedirecting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  const formatAmount = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount / 100);

  if (isInitializing || isLoadingBilling) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your plan and payment history.</p>
      </div>

      {/* Success Banner */}
      {showSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
            {currentPlan === "FREE"
              ? <Loader2 className="h-4 w-4 text-emerald-500 animate-spin" />
              : <PartyPopper className="h-4 w-4 text-emerald-500" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {currentPlan === "FREE" ? "Verifying payment…" : "Payment successful!"}
            </p>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
              {currentPlan === "FREE"
                ? "Hang tight, your account is being upgraded."
                : "Your Pro features are now active. Thanks for choosing Knivik!"}
            </p>
          </div>
          {currentPlan !== "FREE" && (
            <Button variant="ghost" size="sm" className="text-emerald-600 hover:bg-emerald-500/10 text-xs"
              onClick={() => router.replace("/dashboard/billing")}>
              Dismiss
            </Button>
          )}
        </div>
      )}

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT — main column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Current Plan Card */}
          <Card className="border-border/50 bg-card overflow-hidden">
            <div className="h-0.5 bg-primary w-full" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Current Plan</CardTitle>
                <div className="flex items-center gap-2">
                  <PlanBadge plan={currentPlan} className="text-xs" />
                  {subscriptionStatus === "active" && !showTrialPeriod && (
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">Active</Badge>
                  )}
                  {showTrialPeriod && (
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs capitalize">Trialing</Badge>
                  )}
                  {subscriptionStatus !== "active" && subscriptionStatus !== "trialing" && (
                    <Badge variant="secondary" className="text-xs capitalize">{subscriptionStatus ?? "Inactive"}</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between gap-4">
                <p className="text-4xl font-black tracking-tighter">{planConfig.name}</p>
                {isProPlan ? (
                  <Button variant="outline" className="font-bold gap-2 shrink-0"
                    onClick={handleOpenCustomerPortal} disabled={isRedirecting}>
                    {isRedirecting
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Redirecting…</>
                      : <><ExternalLink className="h-4 w-4" /> Manage Billing</>
                    }
                  </Button>
                ) : (
                  <Button asChild className="font-bold shadow-lg shadow-primary/20 shrink-0">
                    <Link href="/pricing">Upgrade to Pro</Link>
                  </Button>
                )}
              </div>

              {/* Billing details row — only for active or trialing subscriptions */}
              {isActiveOrTrial && (
                <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-border/40">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div>
                      <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">{billingDateLabel}</p>
                      <p className="text-sm font-bold mt-0.5">{formatDate(billingInfo?.currentPeriodEnd!)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Cycle</p>
                      <p className="text-sm font-bold mt-0.5 capitalize">{billingInfo?.billingCycle ?? "—"}</p>
                    </div>
                  </div>

                  {isNewTrialPeriod && (
                    <p className="text-sm text-muted-foreground">You are still in your free trial period. Your first paid cycle starts when this trial ends.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoices Card */}
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-bold">Invoices</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <AlertCircle className="h-7 w-7 mb-2 opacity-20" />
                  <p className="text-sm font-medium">No payment history yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                          <CreditCard className="h-4 w-4 text-primary/70" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{formatAmount(payment.amount, payment.currency)}</p>
                          <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">{formatDate(payment.createdAt)}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-sm uppercase font-black ${payment.status === "completed" ? "bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : ""}`}>
                        {payment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT — sidebar */}
        <div className="space-y-6">

          {/* Plan Features */}
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                {isProPlan ? "Your Pro Features" : "Free Plan Includes"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-3">
                {planConfig.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <div className={`mt-0.5 rounded-full p-0.5 shrink-0 ${isProPlan ? "bg-primary/10" : "bg-muted/60"}`}>
                      {isProPlan
                        ? <Zap className="h-3 w-3 text-primary fill-primary" />
                        : <Check className="h-3 w-3 text-foreground/60" />
                      }
                    </div>
                    <span className="text-sm font-medium text-foreground/80 leading-tight">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Upgrade CTA — only for Free users */}
          {!isProPlan && (
            <div className="relative overflow-hidden p-6 rounded-2xl border border-primary/20 bg-primary/5 transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(91,61,245,0.05)] space-y-4 group">
              {/* Glowing decorative background effect */}
              <div className="absolute -right-10 -top-10 w-28 h-28 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/15 transition-all duration-500 pointer-events-none" />
              
              <div className="flex items-center gap-2.5 relative z-10">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5 fill-primary/20 animate-pulse" />
                </div>
                <p className="font-black text-base tracking-tight text-foreground">Upgrade to Pro</p>
              </div>
              
              <p className="text-xs text-muted-foreground leading-relaxed relative z-10">
                Unlock 5 products, 1,000 leads/month, instant alerts, and advanced AI intent scoring.
              </p>
              
              <Button className="w-full font-black text-xs h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-md shadow-primary/10 transition-all hover:scale-[1.02] active:scale-95 relative z-10" asChild>
                <Link href="/pricing">See Pricing Plans</Link>
              </Button>
            </div>
          )}

          {/* Support */}
          <Card className="border-border/40 bg-muted/10">
            <CardContent className="p-5">
              <p className="text-sm font-bold">Need help?</p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-4">Billing issues or questions? We're here.</p>
              <Button variant="outline" size="sm" className="w-full font-bold text-xs" asChild>
                <a href={'mailto:'+ SUPPORT_EMAIL}>Contact Support</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
