"use client"

import { useAuth } from "@/context/auth-context"
import { Navbar } from "@/components/landing/navbar"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { LayoutDashboard, Users, Activity, Settings, ShieldAlert } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push("/dashboard")
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
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-64 border-r border-border/40 bg-muted/5 p-6">
          <div className="flex items-center gap-2 mb-8 px-2">
            <ShieldAlert className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg tracking-tight">Admin Console</h2>
          </div>
          
          <nav className="space-y-1">
            <Link href="/admin" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-primary/10 hover:text-primary transition-colors">
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </Link>
            <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-primary/10 hover:text-primary transition-colors">
              <Users className="w-4 h-4" />
              User Directory
            </Link>
            <Link href="/admin/usage" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-primary/10 hover:text-primary transition-colors">
              <Activity className="w-4 h-4" />
              LLM Usage
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-10">
          {children}
        </main>
      </div>
    </div>
  )
}
