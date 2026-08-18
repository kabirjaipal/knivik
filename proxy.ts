import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie, getCookieCache } from "better-auth/cookies";
import { applyCsp } from "@/lib/csp";
import { isMaliciousProbe, getClientIp, checkEdgeRateLimit } from "@/lib/security";
import logger from "@/lib/logger";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);

  // 1. Security Shield: Block malicious probes, path traversals, & vulnerability scanners immediately
  const probeCheck = isMaliciousProbe(request);
  if (probeCheck.isMalicious) {
    logger.warn(
      { ip, pathname, reason: probeCheck.reason },
      "[Security] Blocked malicious vulnerability probe"
    );
    return new NextResponse(
      JSON.stringify({ error: "Not Found" }),
      {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }

  // 2. IP Rate Limiting Shield: Protect against brute-force, fuzzing, and DDoS bursts
  const rateLimit = checkEdgeRateLimit(ip);
  if (!rateLimit.allowed) {
    logger.warn({ ip, pathname }, "[Security] Rate limit exceeded for IP");
    return new NextResponse(
      JSON.stringify({ error: "Too Many Requests" }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "60",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  }

  // 3. Protected Route Guards: Authentication & Role Enforcement
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  if (isProtected) {
    const sessionCookie = getSessionCookie(request);
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    let role: string | null = null;

    try {
      const session = await getCookieCache(request);
      role = (session?.user as { role?: string } | undefined)?.role ?? null;
    } catch {
      // fall through
    }

    if (!role) {
      try {
        const sessionUrl = new URL("/api/auth/get-session", request.url);
        const res = await fetch(sessionUrl, {
          headers: { cookie: request.headers.get("cookie") ?? "" },
        });
        if (res.ok) {
          const data = await res.json();
          role = (data?.user?.role as string | undefined) ?? null;
        }
      } catch {
        // ignore
      }
    }

    if (role !== "admin" && pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (role === "admin" && pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // 4. Apply CSP & Security Headers
  return applyCsp(request, pathname);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, favicon.svg
     * - robots.txt, sitemap.xml, manifest.json
     */
    "/((?!_next/static|_next/image|favicon\\.ico|favicon\\.svg|robots\\.txt|sitemap\\.xml|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
