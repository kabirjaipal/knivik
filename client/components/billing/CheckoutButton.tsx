"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface CheckoutButtonProps {
  priceId: string;
  email: string;
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
    Paddle?: {
      Checkout: {
        open: (config: {
          items: Array<{ priceId: string }>;
          customer?: { email: string };
          customData?: Record<string, string>;
          successCallback?: (data: any) => void;
          closeCallback?: () => void;
        }) => void;
        close: () => void;
      };
      Initialize: (config: {
        token: string;
        environment?: string;
        eventCallback?: (event: any) => void;
      }) => void;
      Environment: {
        set: (env: "production" | "sandbox") => void;
      };
      Setup: (config: { token: string }) => void;
    };
  }
}

export function CheckoutButton({
  priceId,
  email,
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
  const [isPaddleReady, setIsPaddleReady] = useState(false);

  useEffect(() => {
    // Load Paddle.js if not already loaded
    if (!window.Paddle) {
      const script = document.createElement("script");
      script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
      script.async = true;
      script.onload = () => {
        initializePaddle();
      };
      script.onerror = () => {
        console.error("Failed to load Paddle.js");
        onError?.(new Error("Failed to load Paddle.js"));
      };
      document.body.appendChild(script);
    } else {
      initializePaddle();
    }

    function initializePaddle() {
      if (window.Paddle) {
        const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
        const environment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || "sandbox";

        if (!clientToken) {
          console.error("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is not set");
          return;
        }

        if (window.Paddle.Initialize) {
          window.Paddle.Initialize({
            token: clientToken,
            environment: environment as "production" | "sandbox",
            eventCallback: (event: any) => {
              if (event.name === "checkout.completed" || event.name === "checkout.closed") {
                 setIsLoading(false);
              }
            }
          });
        } else {
          window.Paddle.Environment.set(environment as "production" | "sandbox");
          window.Paddle.Setup({ token: clientToken });
        }
        setIsPaddleReady(true);
      }
    }

    return () => {
      // Cleanup not needed for Paddle.js
    };
  }, [onError]);

  const handleCheckout = () => {
    if (!userId || !email) {
      const returnUrl = encodeURIComponent(window.location.pathname);
      router.push(`/login?redirect=${returnUrl}`);
      return;
    }

    if (!window.Paddle) {
      onError?.(new Error("Paddle is not initialized"));
      return;
    }

    setIsLoading(true);

    try {
      window.Paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: { email },
        customData: { userId },
        settings: {
          displayMode: "overlay",
          theme: "light",
          successUrl: `${window.location.origin}/dashboard/billing?status=success`
        }
      });
    } catch (error) {
      setIsLoading(false);
      onError?.(error instanceof Error ? error : new Error("Checkout failed"));
    }
  };

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleCheckout}
      disabled={isLoading || !isPaddleReady || disabled}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        children || `Subscribe to ${planName}`
      )}
    </Button>
  );
}
