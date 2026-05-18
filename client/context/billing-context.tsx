"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "./auth-context";

interface BillingUser {
  id: string;
  email: string;
  username: string;
  plan: string;
  subscriptionStatus: string;
  billingCycle: string | null;
  currentPeriodEnd: string | null;
  dodoCustomerId: string | null;
}

interface BillingHubData {
  user: BillingUser;
  subscription: any;
  dodoSubscriptionId?: string | null;
  payments: any[];
  prices: any[];
}

interface BillingContextType {
  billingData: BillingHubData | null;
  isLoading: boolean;
  refreshBilling: () => Promise<void>;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [billingData, setBillingData] = useState<BillingHubData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasFetched = useRef(false);
  const lastUserId = useRef<string | null | undefined>(undefined);

  const fetchBillingHub = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/billing-hub`, {
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        setBillingData(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch billing hub:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // WAIT for auth to finish its initial session check
    if (loading) return;

    const currentUserId = user?.id || null;
    
    // Only fetch if identity actually changed or we've never fetched
    if (!hasFetched.current || lastUserId.current !== currentUserId) {
      hasFetched.current = true;
      lastUserId.current = currentUserId;
      fetchBillingHub();
    }
  }, [user, loading, fetchBillingHub]);

  const value = React.useMemo(() => ({
    billingData,
    isLoading,
    refreshBilling: fetchBillingHub
  }), [billingData, isLoading, fetchBillingHub]);

  return (
    <BillingContext.Provider value={value}>
      {children}
    </BillingContext.Provider>
  );
}

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (context === undefined) {
    throw new Error("useBilling must be used within a BillingProvider");
  }
  return context;
};
