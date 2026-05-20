import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
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

  const isProd = process.env.NODE_ENV === "production";
  
  // Enforce strict CSP with nonce on protected paths only in production
  const isStrictCspPath = isProd && (pathname.startsWith("/dashboard") || pathname.startsWith("/admin"));

  if (isStrictCspPath) {
    const nonce = btoa(crypto.randomUUID());
    
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

    const cspHeader = [
      "default-src 'self'",
      `script-src ${scriptSources.join(" ")}`,
      `style-src-elem 'self' 'nonce-${nonce}' https://*.dodopayments.com`,
      "style-src-attr 'self' 'unsafe-inline' https://*.dodopayments.com",
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
  } else {
    // Static/marketing pages fallback CSP (with unsafe-inline)
    const cspHeader = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.dodopayments.com https://va.vercel-scripts.com https://*.posthog.com https://*.i.posthog.com",
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

    const response = NextResponse.next();
    response.headers.set("Content-Security-Policy", cspHeader);
    return response;
  }
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
