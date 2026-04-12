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

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const fetchUser = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/auth/me`, { credentials: 'include' })
      if (!res.ok) {
        if (res.status === 401) {
           // Skip clearing if we are already on auth pages
           const isAuthPage = pathname === '/login' || pathname === '/register';
           if (!isAuthPage) {
             await fetch(`${apiUrl}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
           }
        }
        throw new Error('Not logged in')
      }
      const data = await res.json()
      setUser(data.user)
    } catch (e) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, []);

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const logout = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      await fetch(`${apiUrl}/auth/logout`, { method: 'POST', credentials: 'include' })
      setUser(null)
      router.push('/login')
      router.refresh()
    } catch (e) {
      console.error(e)
    }
  }, [router]);

  const value = useMemo(() => ({
    user,
    loading,
    logout,
    refresh: fetchUser
  }), [user, loading, logout, fetchUser]);

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
