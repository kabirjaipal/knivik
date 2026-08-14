import { auth } from './auth';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export interface AuthSession {
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    createdAt: Date;
    updatedAt: Date;
    userAgent?: string | null;
    ipAddress?: string | null;
  };
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    username: string;
    displayUsername?: string | null;
    role: string;
    plan: string;
    image?: string | null;
    createdAt: Date;
    updatedAt: Date;
    subscriptionStatus?: string | null;
    billingCycle?: string | null;
    currentPeriodEnd?: Date | null;
    dodoCustomerId?: string | null;
  };
}

/**
 * Retrieves the current session from Next.js request headers.
 */
export async function getSession(): Promise<AuthSession | null> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });
    return session as unknown as AuthSession | null;
  } catch (error) {
    return null;
  }
}

/**
 * Requires an active user session. Returns the user or throws/returns a 401 response.
 */
export async function requireAuth(): Promise<{ session: AuthSession; errorResponse?: undefined } | { session?: undefined; errorResponse: NextResponse }> {
  const session = await getSession();
  if (!session || !session.user) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Please log in.' } },
        { status: 401 }
      ),
    };
  }
  return { session };
}

/**
 * Requires admin role.
 */
export async function requireAdmin(): Promise<{ session: AuthSession; errorResponse?: undefined } | { session?: undefined; errorResponse: NextResponse }> {
  const { session, errorResponse } = await requireAuth();
  if (errorResponse) return { errorResponse };

  if (session.user.role !== 'admin') {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: { message: 'Forbidden. Admin access required.' } },
        { status: 403 }
      ),
    };
  }

  return { session };
}
