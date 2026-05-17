"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const isDev = process.env.NODE_ENV === "development";

// Initialize PostHog client-side securely in production only
if (typeof window !== "undefined" && !isDev) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (key && host) {
    posthog.init(key, {
      // In production, we proxy through our own domain (/ingest) to bypass ad-blockers.
      api_host: "/ingest",
      ui_host: host.replace("i.posthog", "posthog"),
      person_profiles: "identified_only",
      capture_pageview: false, // Set to false to track manually via our hook below
    });
  }
}

// Track pageviews dynamically on route changes (only active in production)
function PostHogPageView(): null {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && typeof window !== "undefined" && !isDev) {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthog.capture("$pageview", {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  // If in development or keys are not defined, we gracefully render standard children without tracking
  if (isDev || !process.env.NEXT_PUBLIC_POSTHOG_KEY || !process.env.NEXT_PUBLIC_POSTHOG_HOST) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  );
}
