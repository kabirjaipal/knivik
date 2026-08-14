"use client"

import { useAuth } from "@/context/auth-context"
import { Sidebar } from "@/components/dashboard/sidebar"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else if (user.role !== 'admin') {
        router.push("/dashboard")
      }
    }
  }, [user, loading, router])

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-background overflow-hidden text-foreground">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="w-full h-full px-4 py-4 lg:py-8 lg:px-8 overflow-y-auto custom-scrollbar">
           {children}
        </div>
      </main>
    </div>
  )
}
