"use client"

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface User {
  id: string
  username: string
  email: string
  role: string
  plan: string
  metadata?: any
  subscriptionStatus: string | null
  paddleCustomerId: string | null
  isScanning?: boolean
  lastScanStatus?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

/**
 * Routes that do not require an authenticated session.
 * No auth API calls (/me, /logout) will be made when the user is on these paths.
 */
const PUBLIC_ROUTES = new Set([
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/pricing',
  '/contact',
  '/privacy',
  '/terms',
  '/refund-policy',
])

const isPublicRoute = (pathname: string): boolean => {
  if (PUBLIC_ROUTES.has(pathname)) return true
  // Also match dynamic segments like /reset-password/[token]
  return pathname.startsWith('/reset-password/') || pathname.startsWith('/verify-email/')
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const fetchUser = useCallback(async (currentPathname: string) => {
    // Skip auth check entirely on public routes — no /me or /logout calls needed.
    if (isPublicRoute(currentPathname)) {
      setLoading(false)
      return
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const res = await fetch(`${apiUrl}/auth/me`, { credentials: 'include' })
      if (!res.ok) {
        if (res.status === 401) {
          // Clear the server-side session cookie on protected routes.
          await fetch(`${apiUrl}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {})
        }
        throw new Error('Not authenticated')
      }
      const data = await res.json()
      setUser(data.user)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser(pathname)
  }, [fetchUser, pathname])

  const logout = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      await fetch(`${apiUrl}/auth/logout`, { method: 'POST', credentials: 'include' })
      setUser(null)
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }, [router])

  const value = useMemo(() => ({
    user,
    loading,
    logout,
    refresh: () => fetchUser(pathname),
  }), [user, loading, logout, fetchUser, pathname])

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
