"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, LayoutDashboard, Radar, Zap, Activity } from "lucide-react"
import { useEffect, useState } from "react"

interface AdminStats {
  userCount: number;
  productCount: number;
  leadCount: number;
  leadsToday: number;
  activeScans: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setStats(data.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading statistics...</div>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight">System Overview</h1>
        <p className="text-muted-foreground mt-1">Global metrics across all Knivik instances.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Total Users', value: stats?.userCount, icon: Users, color: 'text-blue-500' },
          { label: 'Total Products', value: stats?.productCount, icon: LayoutDashboard, color: 'text-violet-500' },
          { label: 'Total Leads', value: stats?.leadCount, icon: Radar, color: 'text-emerald-500' },
          { label: 'Leads Found Today', value: stats?.leadsToday, icon: Zap, color: 'text-amber-500' },
          { label: 'Active Scans', value: stats?.activeScans, icon: Activity, color: 'text-red-500' },
        ].map((m, i) => (
          <Card key={i} className="bg-card/50 border-border/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{m.label}</CardTitle>
              <m.icon className={`h-4 w-4 ${m.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{m.value ?? 0}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Placeholder for recent signups or anomalies */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-green-500 font-medium">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            All scrapers operational
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
