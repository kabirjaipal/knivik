"use client"

import React, { createContext, useContext, useMemo } from 'react'
import posthog from 'posthog-js'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from '@/lib/auth-client'
import { disconnectSocket } from '@/lib/socket'

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const [isClientLoaded, setIsClientLoaded] = React.useState(false);
  const [hasInitialFetch, setHasInitialFetch] = React.useState(false);

  const { data: session, isPending, error, refetch } = useSession()

  React.useEffect(() => {
    setIsClientLoaded(true);
    // After a short delay, we assume the initial fetch state is settled
    const timer = setTimeout(() => setHasInitialFetch(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // It's loading if we haven't loaded the client, it's pending, or we haven't passed the initial fetch window
  const loading = !isClientLoaded || isPending || (!hasInitialFetch && !session && !error);

  const logout = async () => {
    disconnectSocket()
    await signOut()
    router.push('/login')
    router.refresh()
  }

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
  }), [user, loading, logout, refetch])

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
