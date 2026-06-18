import { NextRequest, NextResponse } from "next/server";

export function applyCsp(request: NextRequest, pathname: string): NextResponse {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) throw new Error("BACKEND_URL is not defined");

  const wsUrl = backendUrl.replace(/^http/, "ws");
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || wsUrl;
  const socketWsUrl = socketUrl.replace(/^http/, "ws");

  const connectSources = [
    "'self'",
    "https://*.dodopayments.com",
    "https://va.vercel-scripts.com",
    "https://*.posthog.com",
    "https://*.i.posthog.com",
    "https://*.google-analytics.com",
    "https://*.analytics.google.com",
    backendUrl,
    socketUrl,
    socketWsUrl,
  ];

  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.dodopayments.com https://va.vercel-scripts.com https://*.posthog.com https://*.i.posthog.com https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://*.dodopayments.com",
    "img-src 'self' data: blob: https: http: https://*.posthog.com https://*.dodopayments.com https://www.redditstatic.com https://abs.twimg.com https://news.ycombinator.com https://*.google.com https://*.gstatic.com https://*.google-analytics.com https://avatars.githubusercontent.com",
    "font-src 'self' data:",
    "frame-src 'self' https://*.dodopayments.com",
    `connect-src ${connectSources.join(" ")}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", cspHeader);
  return response;
}
