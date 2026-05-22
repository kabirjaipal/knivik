"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, LayoutDashboard, Radar, Zap, Activity, Star, MessageSquare, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

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
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, healthRes, feedbackRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, { credentials: 'include' }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/health`, { credentials: 'include' }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/feedback`, { credentials: 'include' })
        ])
        
        const statsData = await statsRes.json()
        const healthData = await healthRes.json()
        const feedbackData = await feedbackRes.json()
        
        if (statsData.success) setStats(statsData.data)
        if (healthData.success) setHealth(healthData.data)
        if (feedbackData.success) setFeedbacks(feedbackData.feedbacks)
      } catch (err) {
        toast.error("Could not load the admin dashboard data. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight">System Overview</h1>
        <p className="text-muted-foreground mt-1">Global metrics across all Knivik instances.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Total Users', value: stats?.userCount, icon: Users, color: 'text-primary' },
          { label: 'Total Products', value: stats?.productCount, icon: LayoutDashboard, color: 'text-primary' },
          { label: 'Total Leads', value: stats?.leadCount, icon: Radar, color: 'text-primary' },
          { label: 'Leads Found Today', value: stats?.leadsToday, icon: Zap, color: 'text-primary' },
          { label: 'Active Scans', value: stats?.activeScans, icon: Activity, color: 'text-destructive' },
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
        <CardHeader className="border-b border-border/40 pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Social Monitoring Health (Real-time)
          </CardTitle>
          <div className="text-xs font-bold text-muted-foreground">Gateway Heartbeat Active</div>
        </CardHeader>
        <CardContent className="p-0 bg-transparent">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/40">
            {(health.length > 0 ? health : [
              { name: 'Reddit', status: 'Checking...' },
              { name: 'HackerNews', status: 'Checking...' },
              { name: 'Twitter/X', status: 'Checking...' },
            ]).map((s, i) => (
              <div key={i} className="p-6 flex flex-col items-center justify-center text-center gap-3 hover:bg-muted/20 transition-colors">
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">
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
                {s.latency && <span className="text-xs font-bold text-muted-foreground/50 tracking-wide font-mono">{s.latency}</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Feedback Analytics */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Rating Summary Card */}
        <Card className="border-border/40 bg-card/30">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              Platform Satisfaction
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-4">
            <div className="text-5xl font-black text-foreground">
              {feedbacks.length > 0
                ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1)
                : "0.0"}
            </div>
            <div className="flex items-center gap-0.5 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(
                      feedbacks.length > 0
                        ? feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length
                        : 0
                    )
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted fill-muted/30"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 font-semibold">
              Based on {feedbacks.length} user reviews
            </p>
          </CardContent>
        </Card>

        {/* Category Breakdown Card */}
        <Card className="col-span-2 border-border/40 bg-card/30">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Issues & Praise Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {["UI/UX", "Scraping", "AI Accuracy", "Pricing", "Other"].map((cat) => {
              const count = feedbacks.filter((f) => f.category === cat).length;
              const percentage = feedbacks.length > 0 ? (count / feedbacks.length) * 100 : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>{cat}</span>
                    <span className="text-muted-foreground">{count} ({Math.round(percentage)}%)</span>
                  </div>
                  <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
