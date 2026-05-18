import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // Generate a cryptographically secure random base64 nonce
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isProd = process.env.NODE_ENV === "production";
  
  const backendUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!backendUrl) throw new Error("NEXT_PUBLIC_API_URL is not defined");
  const wsUrl = backendUrl.replace(/^http/, "ws");

  // Content Security Policy with Nonce protection to block inline JS/eval vulnerabilities
  const cspHeader = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' ${isProd ? "" : "'unsafe-eval'"} https://*.dodopayments.com https://va.vercel-scripts.com https://*.posthog.com https://*.i.posthog.com`,
    `style-src 'self' 'unsafe-inline' https://*.dodopayments.com`, // Allowed 'unsafe-inline' for Tailwind/dynamic styling
    `img-src 'self' data: blob: https://*.posthog.com https://*.dodopayments.com https://www.redditstatic.com https://abs.twimg.com https://news.ycombinator.com https://www.google.com https://avatars.githubusercontent.com`,
    "font-src 'self' data:",
    "frame-src 'self' https://*.dodopayments.com",
    `connect-src 'self' ${backendUrl} ${wsUrl} https://*.dodopayments.com https://va.vercel-scripts.com https://*.posthog.com https://*.i.posthog.com`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  
  response.headers.set("Content-Security-Policy", cspHeader);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - favicon.svg
     */
    "/((?!api|_next/static|_next/image|favicon.ico|favicon.svg).*)",
  ],
};
