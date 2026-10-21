import React from "react";
import Script from "next/script";

/**
 * A highly optimized Google Analytics (GA4) component.
 * It is rendered conditionally: only active in production when the measurement ID environment variable is defined.
 * It functions in both Server and Client contexts.
 */
export function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  // Only render in production when a measurement ID is configured
  if (!gaId) return null;

  return (
    <>
      <Script
        id="GoogleAnalytics"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  );
}
