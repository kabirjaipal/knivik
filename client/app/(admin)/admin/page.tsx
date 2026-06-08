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
  const [users, setUsers] = useState<any[]>([])
  const [revenueStats, setRevenueStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, healthRes, feedbackRes, usersRes, revenueRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, { credentials: 'include' }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/health`, { credentials: 'include' }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/feedback`, { credentials: 'include' }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users?limit=5`, { credentials: 'include' }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/revenue`, { credentials: 'include' })
        ])
        
        const statsData = await statsRes.json()
        const healthData = await healthRes.json()
        const feedbackData = await feedbackRes.json()
        const usersData = await usersRes.json()
        const revenueData = await revenueRes.json()
        
        if (statsData.success) setStats(statsData.data)
        if (healthData.success) setHealth(healthData.data)
        if (feedbackData.success) setFeedbacks(feedbackData.feedbacks)
        if (usersData.success) setUsers(usersData.data)
        if (revenueData.success) setRevenueStats(revenueData.data)
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-foreground">System Overview</h2>
        </div>
        
        {/* Real-time Inline Health Status */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs bg-muted/30 border border-border/30 px-3 py-2 rounded-xl">
          <span className="font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5 pr-1 border-r border-border/40">
            <Activity className="w-3.5 h-3.5 text-primary" />
            Monitoring
          </span>
          {(health.length > 0 ? health : [
            { name: 'Reddit', status: 'Checking...' },
            { name: 'HackerNews', status: 'Checking...' },
            { name: 'Twitter/X', status: 'Checking...' },
            { name: 'GitHub', status: 'Checking...' },
            { name: 'Bluesky', status: 'Checking...' },
          ]).map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="font-bold text-muted-foreground">{s.name}</span>
              <div className={`w-1.5 h-1.5 rounded-full ${
                s.status.includes('Checking') ? 'bg-muted-foreground/40 animate-pulse' : 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)] animate-pulse'
              }`} />
              <span className={`font-semibold ${
                s.status.includes('Checking') ? 'text-muted-foreground' : 'text-foreground'
              }`}>
                {s.status}
              </span>
              {s.latency && (
                <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-1 py-0.2 rounded">
                  {s.latency}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
        {[
          { label: 'Total Users', value: stats?.userCount, icon: Users, color: 'text-primary' },
          { label: 'Total Products', value: stats?.productCount, icon: LayoutDashboard, color: 'text-primary' },
          { label: 'Total Leads', value: stats?.leadCount, icon: Radar, color: 'text-primary' },
          { label: 'Leads Found Today', value: stats?.leadsToday, icon: Zap, color: 'text-primary' },
          { label: 'Active Scans', value: stats?.activeScans, icon: Activity, color: 'text-destructive' },
        ].map((m, i) => (
          <div key={i} className="flex flex-col gap-1 p-2 rounded-xl hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <m.icon className={`h-3.5 w-3.5 ${m.color}`} />
              <span className="truncate">{m.label}</span>
            </div>
            <div className="text-2xl font-black tracking-tight text-foreground mt-1">
              {m.value ?? 0}
            </div>
          </div>
        ))}
      </div>

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

      {/* Latest Activity: Signups & Alert Deliveries */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Latest Users */}
        <Card className="border-border/40 bg-card/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-primary" />
              Latest Signups
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {users.length > 0 ? (
              <div className="divide-y divide-border/20">
                {users.slice(0, 5).map((u) => (
                  <div key={u.id} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold truncate text-foreground">
                        {u.username || 'No Username'}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {u.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        u.plan === 'PRO' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-muted text-muted-foreground'
                      }`}>
                        {u.plan}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No recent signups.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="border-border/40 bg-card/30">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-primary" />
              Recent Transactions
            </CardTitle>
            {revenueStats?.mrr !== undefined && (
              <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                MRR: ${Number(revenueStats.mrr).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary Row */}
            <div className="grid grid-cols-2 gap-2 text-center bg-muted/20 border border-border/20 rounded-xl p-2.5">
              <div>
                <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Total Revenue</div>
                <div className="text-lg font-black text-foreground mt-0.5">
                  ${Number(revenueStats?.totalRevenue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Active Subs</div>
                <div className="text-lg font-black text-foreground mt-0.5">{revenueStats?.activeSubscribers ?? 0}</div>
              </div>
            </div>

            {/* Payments List */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Latest Payments</div>
              {revenueStats?.recentPayments?.length > 0 ? (
                <div className="divide-y divide-border/20 max-h-[140px] overflow-y-auto pr-1">
                  {revenueStats.recentPayments.slice(0, 4).map((pay: any) => (
                    <div key={pay.id} className="py-2 flex items-center justify-between first:pt-0 last:pb-0">
                      <div className="flex flex-col min-w-0 max-w-[70%]">
                        <span className="text-xs font-semibold truncate text-foreground">
                          {pay.user?.username || pay.user?.email || 'Anonymous User'}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {pay.user?.email || 'No Email'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          ${Number(pay.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          pay.status === 'paid' || pay.status === 'succeeded' ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-amber-500'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">No recent payments recorded.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
