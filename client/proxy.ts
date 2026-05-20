import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
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
    backendUrl,
    socketUrl,
    socketWsUrl
  ];

  // Generate a unique nonce for every request
  const nonce = btoa(crypto.randomUUID());

  // In development mode, React requires 'unsafe-eval' for debugging & callstack mapping.
  const isProd = process.env.NODE_ENV === "production";
  const scriptSources = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    "'sha256-UnthrFpGFotkvMOTp/ghVMSXoZZj9Y6epaMsaBAbUtg='",
    "'sha256-J9cZHZf5nVZbsm7Pqxc8RsURv1AIXkMgbhfrZvoOs/A='",
    "https://*.dodopayments.com",
    "https://va.vercel-scripts.com",
    "https://*.posthog.com",
    "https://*.i.posthog.com"
  ];
  if (!isProd) {
    scriptSources.push("'unsafe-eval'");
  }

  const cspHeader = [
    "default-src 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline' https://*.dodopayments.com",
    "img-src 'self' data: blob: https://*.posthog.com https://*.dodopayments.com https://www.redditstatic.com https://abs.twimg.com https://news.ycombinator.com https://*.google.com https://*.gstatic.com https://avatars.githubusercontent.com",
    "font-src 'self' data:",
    "frame-src 'self' https://*.dodopayments.com",
    `connect-src ${connectSources.join(" ")}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join("; ");

  // Set request headers so Next.js runtime extracts the nonce
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
     * - favicon.ico, favicon.svg (favicon files)
     * - robots.txt, sitemap.xml, manifest.json
     * - other static file extensions (e.g. .png, .jpg, .css, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon\\.ico|favicon\\.svg|robots\\.txt|sitemap\\.xml|manifest\\.json|.*\\..*).*)',
  ],
};
