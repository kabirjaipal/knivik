"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface CheckoutButtonProps {
  variantId: string;
  email: string;
  name?: string;
  userId: string;
  planName: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: {
      Url: {
        Open: (url: string) => void;
        Close: () => void;
      };
      Setup: (config: { eventHandler: (event: any) => void }) => void;
    };
  }
}

export function CheckoutButton({
  variantId,
  email,
  name,
  userId,
  planName,
  variant = "default",
  className = "",
  disabled = false,
  children,
  onSuccess,
  onError,
}: CheckoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptReady, setIsScriptReady] = useState(false);

  // Initialize Lemon Squeezy once
  const initLS = useCallback(() => {
    if (typeof window === "undefined") return false;

    if (window.createLemonSqueezy) {
      window.createLemonSqueezy();
    }
    
    if (window.LemonSqueezy) {
      window.LemonSqueezy.Setup({
        eventHandler: (event: any) => {
          if (event.event === "Checkout.Success") {
            onSuccess?.();
          }
          if (event.event === "Checkout.Closed") {
            setIsLoading(false);
          }
        },
      });
      setIsScriptReady(true);
      return true;
    }
    return false;
  }, [onSuccess]);

  useEffect(() => {
    // Attempt initialization on mount and check periodically if not ready
    const ready = initLS();
    if (!ready) {
      const interval = setInterval(() => {
        if (initLS()) clearInterval(interval);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [initLS]);

  const handleCheckout = async () => {
    if (!userId || !email) {
      const returnUrl = encodeURIComponent(window.location.pathname);
      router.push(`/login?redirect=${returnUrl}`);
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) throw new Error("API URL not configured");

      const response = await fetch(`${apiUrl}/billing/create-checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          variantId,
          email,
          name,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to create checkout");
      }

      // Ensure LS is initialized before opening
      initLS();

      if (window.LemonSqueezy) {
        window.LemonSqueezy.Url.Open(data.checkoutUrl);
      } else {
        // Fallback to direct redirect if overlay script fails to load completely
        window.location.href = data.checkoutUrl;
      }
    } catch (error: any) {
      setIsLoading(false);
      console.error("Checkout failed:", error);
      onError?.(error instanceof Error ? error : new Error("Payment failed"));
    }
  };

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleCheckout}
      disabled={isLoading || disabled}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        children || `Subscribe to ${planName}`
      )}
    </Button>
  );
}
