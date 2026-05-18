"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface CheckoutButtonProps {
  productId: string;
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

export function CheckoutButton({
  productId,
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
          productId,
          email,
          name,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to create checkout");
      }

      // Validate checkout URL strictly to prevent XSS (javascript:) and open redirect vectors
      const checkoutUrl = data.checkoutUrl;
      if (typeof checkoutUrl !== "string") {
        throw new Error("Invalid checkout URL format");
      }

      const parsedUrl = new URL(checkoutUrl, window.location.origin);
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        throw new Error("Forbidden protocol scheme in checkout URL");
      }

      window.location.href = checkoutUrl;
      
    } catch (error: any) {
      setIsLoading(true);
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
