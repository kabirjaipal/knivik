import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie, getCookieCache } from "better-auth/cookies";
import { applyCsp } from "@/lib/csp";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  return applyCsp(request, pathname);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|favicon\\.svg|robots\\.txt|sitemap\\.xml|manifest\\.json|.*\\..*).*)",
  ],
};
