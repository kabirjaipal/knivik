import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie, getCookieCache } from "better-auth/cookies";
import { applyCsp } from "@/lib/csp";

async function getRoleFromBackend(request: NextRequest): Promise<string | null> {
  try {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) return null;

    const res = await fetch(`${backendUrl}/api/auth/get-session`, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
    });

    if (!res.ok) return null;
    const data = await res.json();
    return (data?.user?.role as string | undefined) ?? null;
  } catch {
    return null;
  }
}

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
      // fall through to backend fetch
    }

    if (!role) {
      role = await getRoleFromBackend(request);
    }

    if (role !== "admin" && pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return applyCsp(request, pathname);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|favicon\\.svg|robots\\.txt|sitemap\\.xml|manifest\\.json|.*\\..*).*)",
  ],
};
