"use client"

import React, { createContext, useContext, useMemo } from 'react'
import posthog from 'posthog-js'
import { useRouter, usePathname } from 'next/navigation'
import { useSession, signOut } from '@/lib/auth-client'
import { disconnectSocket } from '@/lib/socket'
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
  metadata?: any
  emailVerified?: boolean
  subscriptionStatus?: string | null
  dodoCustomerId?: string | null
  isScanning?: boolean
  lastScanStatus?: string
}

// Extended user type with custom fields from Better Auth callback
interface ExtendedUser {
  id: string
  email: string
  name?: string
  image?: string | null
  username?: string
  role?: string
  plan?: string
  emailVerified?: boolean
  subscriptionStatus?: string | null
  dodoCustomerId?: string | null
  isScanning?: boolean
  lastScanStatus?: string
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const [isClientLoaded, setIsClientLoaded] = React.useState(false);
  const [hasInitialFetch, setHasInitialFetch] = React.useState(false);

  // Expose public configs
  const [publicConfig, setPublicConfig] = React.useState<{ maintenanceMode: boolean; registrationEnabled: boolean }>({
    maintenanceMode: false,
    registrationEnabled: true,
  });

  const { data: session, isPending, error, refetch } = useSession()

  React.useEffect(() => {
    setIsClientLoaded(true);
    // After a short delay, we assume the initial fetch state is settled
    const timer = setTimeout(() => setHasInitialFetch(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Fetch public configuration on mount
  React.useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config/public');
        const result = await response.json();
        if (result.success && result.data) {
          setPublicConfig(result.data);
        }
      } catch (err) {
        // Silently log/ignore config fetch errors in console
      }
    };
    fetchConfig();
  }, []);

  // It's loading if we haven't loaded the client, it's pending, or we haven't passed the initial fetch window
  const loading = !isClientLoaded || isPending || (!hasInitialFetch && !session && !error);

  const logout = React.useCallback(async () => {
    disconnectSocket()
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
      role: extendedUser.role || 'user',
      plan: extendedUser.plan || 'FREE',
      emailVerified: extendedUser.emailVerified ?? false,
      subscriptionStatus: extendedUser.subscriptionStatus || null,
      dodoCustomerId: extendedUser.dodoCustomerId || null,
      isScanning: extendedUser.isScanning,
      lastScanStatus: extendedUser.lastScanStatus,
    }
  }, [session])

  // Link PostHog sessions to our authenticated users (identify on login, reset on logout)
  React.useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      if (!user) {
        posthog.reset()
        return
      }

      posthog.identify(user.id, {
        email: user.email,
        name: user.name,
        username: user.username,
        role: user.role,
        plan: user.plan,
      })
    } catch (e) {
      // avoid throwing in the app if PostHog isn't available or fails
      // eslint-disable-next-line no-console
      console.warn('PostHog identify/reset failed', e)
    }
  }, [user])

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
