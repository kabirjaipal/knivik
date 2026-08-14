"use client"

import React, { createContext, useContext, useMemo, useEffect, useCallback, useState, ReactNode } from 'react'
import posthog from 'posthog-js'
import { useRouter, usePathname } from 'next/navigation'
import { useSession, signOut } from '@/lib/auth-client'
import { Wrench, Loader2 } from 'lucide-react'

// Keep same User interface for backward compatibility
interface User {
  id: string
  email: string
  name?: string
  username?: string
  image?: string
  role?: string
  plan?: string
  metadata?: Record<string, unknown> | null
  emailVerified?: boolean
  subscriptionStatus?: string | null
  dodoCustomerId?: string | null
  isScanning?: boolean
  lastScanStatus?: string
  allowReferrals?: boolean
}

// Extended user type with custom fields from Better Auth callback
interface ExtendedUser {
  id: string
  email: string
  name?: string
  image?: string | null
  username?: string
  emailVerified?: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  logout: () => Promise<void>
  refresh: () => Promise<void>
  maintenanceMode: boolean
  registrationEnabled: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()

  const [isClientLoaded, setIsClientLoaded] = useState(false);

  // Expose public configs
  const [publicConfig, setPublicConfig] = useState<{ maintenanceMode: boolean; registrationEnabled: boolean }>({
    maintenanceMode: false,
    registrationEnabled: true,
  });

  const [dbUser, setDbUser] = useState<Partial<User> | null>(null);
  const [isInitialAuthSettled, setIsInitialAuthSettled] = useState(false);
  const [referralCheckedUserId, setReferralCheckedUserId] = useState<string | null>(null);

  const { data: session, isPending, refetch } = useSession()

  // Deterministic loading state: only load when client isn't ready, initial auth query hasn't finished, or we have a session but haven't loaded the db profile yet
  const loading = !isClientLoaded || !isInitialAuthSettled || (!!session?.user && !dbUser);

  useEffect(() => {
    setIsClientLoaded(true);
  }, []);

  // Track when the initial session check settles
  useEffect(() => {
    if (!isPending) {
      setIsInitialAuthSettled(true);
    }
  }, [isPending]);

  // Fetch detailed user profile (including allowReferrals) from backend
  useEffect(() => {
    if (isPending) return;

    if (!session?.user?.id) {
      setDbUser(null);
      return;
    }

    // Skip refetching if we already have the database user for this active session
    if (dbUser && dbUser.id === session.user.id) {
      return;
    }

    const controller = new AbortController();
    const fetchMe = async () => {
      try {
        const response = await fetch('/api/users/me', { signal: controller.signal });
        const result = await response.json();
        if (result.success && result.data?.user) {
          setDbUser(result.data.user);
        } else {
          setDbUser({});
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setDbUser({});
        }
      }
    };
    fetchMe();

    return () => {
      controller.abort();
    };
  }, [session?.user?.id, isPending, dbUser?.id, session?.user]);

  // Fetch public configuration on mount
  useEffect(() => {
    const controller = new AbortController();
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config/public', { signal: controller.signal });
        const result = await response.json();
        if (result.success && result.data) {
          setPublicConfig(result.data);
        }
      } catch (err: any) {
        // Silently ignore aborts/errors
      }
    };
    fetchConfig();

    return () => {
      controller.abort();
    };
  }, []);

  const logout = useCallback(async () => {
    await signOut()
    router.push('/login')
    router.refresh()
  }, [router])

  // Map Better Auth session to our existing User interface
  const user: User | null = useMemo(() => {
    if (!session?.user) return null

    // Type assertion needed for custom fields added in session callback
    const extendedUser = session.user as ExtendedUser

    return {
      id: extendedUser.id,
      email: extendedUser.email,
      name: extendedUser.name,
      username: extendedUser.username,
      image: extendedUser.image ?? undefined,
      role: dbUser?.role || 'user',
      plan: dbUser?.plan || 'FREE',
      emailVerified: extendedUser.emailVerified ?? false,
      subscriptionStatus: dbUser?.subscriptionStatus || null,
      dodoCustomerId: dbUser?.dodoCustomerId || null,
      isScanning: dbUser?.isScanning ?? false,
      lastScanStatus: dbUser?.lastScanStatus,
      allowReferrals: dbUser?.allowReferrals ?? false,
    }
  }, [session, dbUser])

  // Link PostHog sessions to our authenticated users (identify on login, reset on logout)
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      if (!user?.id) {
        posthog.reset()
        posthog.stopSessionRecording()
        return
      }

      posthog.identify(user.id, {
        email: user.email,
        name: user.name,
        username: user.username,
        role: user.role,
        plan: user.plan,
      })
      posthog.startSessionRecording()
    } catch (e) {
      // avoid throwing in the app if PostHog isn't available or fails
      // eslint-disable-next-line no-console
      console.warn('PostHog identify/reset failed', e)
    }
  }, [user?.id, user?.email, user?.plan, user?.role, user?.username, user?.name])

  // Process referral code claim if the cookie exists and user has authenticated
  useEffect(() => {
    if (loading || !user?.id || referralCheckedUserId === user.id) return;

    const claimReferral = async () => {
      const match = document.cookie.match(/(^|;)\s*knivik_ref_code\s*=\s*([^;]+)/);
      if (!match) {
        setReferralCheckedUserId(user.id);
        return;
      }

      const referralCode = match[2];
      try {
        const response = await fetch('/api/referrals/claim', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ referralCode }),
        });
        const data = await response.json();
        if (data.success) {
          // Clear cookie upon success
          document.cookie = 'knivik_ref_code=; max-age=0; path=/; SameSite=Lax';
        }
      } catch (err) {
        // Fail silently
      } finally {
        setReferralCheckedUserId(user.id);
      }
    };

    claimReferral();
  }, [user?.id, loading, referralCheckedUserId]);

  const value = useMemo(() => ({
    user,
    loading,
    logout,
    refresh: refetch,
    maintenanceMode: publicConfig.maintenanceMode,
    registrationEnabled: publicConfig.registrationEnabled,
  }), [user, loading, logout, refetch, publicConfig])

  const pathname = usePathname();

  // Render a gorgeous glassmorphism full-screen block overlay if Maintenance Mode is active (except for admins, and allowing login path)
  const showMaintenanceBlocker = publicConfig.maintenanceMode && user?.role !== 'admin' && pathname !== '/login';

  if (showMaintenanceBlocker) {
    return (
      <div className="fixed inset-0 w-full h-full flex flex-col items-center justify-center bg-background text-foreground p-6 select-none z-[99999] font-sans">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="flex justify-center mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            We'll be back shortly.
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            Knivik is currently undergoing scheduled platform upgrades to improve scan throughput. We appreciate your patience and will be online shortly.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <AuthContext.Provider value={value}>
        <div className="fixed inset-0 w-full h-full flex flex-col items-center justify-center bg-background text-foreground z-[99999]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
