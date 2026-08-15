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
import { PlanBadge } from "@/components/billing/pricing-badges";
import { PLANS } from "@/lib/plans";
import { API_URL } from "@/lib/constants";

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
      const response = await fetch(`${API_URL}/users/portal`, {
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
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/60" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <h2 className="text-xl font-black tracking-tight text-foreground border-b border-border/40 pb-4">
        Billing
      </h2>

      {/* Success Banner */}
      {showSuccess && (
        <div className="bg-success/5 border border-success/20 rounded-xl p-4 flex items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
              {currentPlan === "FREE" ? (
                <Loader2 className="h-4 w-4 text-success animate-spin" />
              ) : (
                <PartyPopper className="h-4 w-4 text-success" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-success">
                {currentPlan === "FREE" ? "Verifying your upgrade..." : "Subscription activated successfully!"}
              </p>
              <p className="text-xs text-muted-foreground">
                {currentPlan === "FREE"
                  ? "We are processing your payment. Your features will unlock momentarily."
                  : "Thank you for upgrading! Your Pro features are now fully enabled."}
              </p>
            </div>
          </div>
          {currentPlan !== "FREE" && (
            <Button variant="ghost" size="sm" className="text-success hover:bg-success/10 text-xs"
              onClick={() => router.replace("/dashboard/billing")}>
              Dismiss
            </Button>
          )}
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Subscription Info & Actions */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-none">
            <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-bold">Subscription Details</CardTitle>
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold capitalize">
                {currentPlan === "PRO" ? "Pro Plan" : "Free Plan"}
              </Badge>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-extrabold tracking-tight text-foreground">{planConfig.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isProPlan ? "You have unlimited access to all Pro features." : "Upgrade to unlock advanced intent discovery and alerts."}
                  </p>
                </div>
                
                {isProPlan ? (
                  <Button variant="outline" size="sm" className="font-semibold gap-2 border-border/50 hover:bg-muted"
                    onClick={handleOpenCustomerPortal} disabled={isRedirecting}>
                    {isRedirecting ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Redirecting...</>
                    ) : (
                      <><ExternalLink className="h-3.5 w-3.5" /> Portal</>
                    )}
                  </Button>
                ) : (
                  <Button asChild size="sm" className="font-semibold bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm">
                    <Link href="/pricing">Upgrade Plan</Link>
                  </Button>
                )}
              </div>

              {isActiveOrTrial && (
                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border/40">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{billingDateLabel}</span>
                    <p className="text-sm font-semibold text-foreground mt-0.5">{formatDate(billingInfo?.currentPeriodEnd!)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Billing Cycle</span>
                    <p className="text-sm font-semibold text-foreground mt-0.5 capitalize">{billingInfo?.billingCycle ?? "—"}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoices Card */}
          <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-none">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-bold">Invoices & Receipts</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <AlertCircle className="h-6 w-6 mb-2 opacity-30" />
                  <p className="text-xs">No payment transactions found</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                          <CreditCard className="h-4 w-4 text-primary/80" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">{formatAmount(payment.amount, payment.currency)}</p>
                          <p className="text-[10px] text-muted-foreground font-semibold">{formatDate(payment.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(payment as any).invoiceUrl && (
                          <Button asChild variant="ghost" size="sm" className="h-7 text-[10px] font-semibold text-primary border border-primary/10 hover:bg-primary/5 px-2">
                            <a href={(payment as any).invoiceUrl} target="_blank" rel="noopener noreferrer">
                              Invoice <ExternalLink className="h-2.5 w-2.5 ml-1" />
                            </a>
                          </Button>
                        )}
                        <Badge variant="outline" className={`text-[10px] font-semibold uppercase px-2 py-0.5 ${
                          payment.status === "completed" || payment.status === "succeeded" || payment.status === "success" 
                            ? "bg-success/5 text-success border-success/20" 
                            : "bg-muted/10 text-muted-foreground border-border/50"
                        }`}>
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info & Support */}
        <div className="space-y-6">
          {/* Plan Features */}
          <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-none">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {isProPlan ? "Pro Plan Features" : "Free Plan Features"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-2.5">
                {planConfig.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-xs">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground font-medium leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Support Info */}
          <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-none">
            <CardContent className="p-4 space-y-3">
              <div>
                <p className="text-xs font-bold text-foreground">Need Assistance?</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">For billing issues or questions, contact support.</p>
              </div>
              <Button variant="outline" size="sm" className="w-full font-semibold text-xs border-border/50 hover:bg-muted" asChild>
                <a href="/contact">Contact Support</a>
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
