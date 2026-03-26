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
  const [health, setHealth] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, healthRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, { credentials: 'include' }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/health`, { credentials: 'include' })
        ])
        
        const statsData = await statsRes.json()
        const healthData = await healthRes.json()
        
        if (statsData.success) setStats(statsData.data)
        if (healthData.success) setHealth(healthData.data)
      } catch (err) {
        console.error('Failed to fetch admin data:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  if (loading) return <div>Loading diagnostics...</div>

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
      
      {/* System Health Breakdown */}
      <Card className="border-border/40 overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/40 pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Social Engine Health (Real-time)
          </CardTitle>
          <div className="text-[10px] font-bold text-muted-foreground">Gateway Heartbeat Active</div>
        </CardHeader>
        <CardContent className="p-0 bg-transparent">
          <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-border/40">
            {(health.length > 0 ? health : [
              { name: 'Reddit', status: 'Checking...' },
              { name: 'HackerNews', status: 'Checking...' },
              { name: 'Twitter/X', status: 'Checking...' },
              { name: 'LinkedIn', status: 'Checking...' },
              { name: 'ProductHunt', status: 'Checking...' },
            ]).map((s, i) => (
              <div key={i} className="p-6 flex flex-col items-center justify-center text-center gap-3 hover:bg-muted/20 transition-colors">
                <span className="text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground/80">
                  {s.name}
                </span>
                <div className={`flex items-center gap-2.5 text-sm font-bold ${
                  s.status.includes('Checking') ? 'text-muted-foreground animate-pulse' : 'text-primary'
                }`}>
                  <div className={`w-2 h-2 rounded-full shadow-lg ${
                    s.status.includes('Checking') ? 'bg-muted-foreground/30 animate-pulse' : 'bg-primary shadow-primary/40 animate-pulse'
                  }`} />
                  {s.status}
                </div>
                {s.latency && <span className="text-[11px] font-bold text-muted-foreground/50 tracking-wide font-mono">{s.latency}</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
