"use client"

import { useAuth } from "@/context/auth-context"
import { Navbar } from "@/components/landing/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Activity, 
  PieChart, 
  Calendar,
  Layers,
  Sparkles,
  Search,
  Loader2,
  AlertCircle
} from "lucide-react"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { PROJECT_NAME } from "@/lib/constants"

interface MetricData {
  label: string;
  count: number;
}

interface AnalyticsData {
  leadsOverTime: { date: string; count: number }[];
  intentDistribution: MetricData[];
  platformDistribution: MetricData[];
  statusDistribution: MetricData[];
  totalLeads: number;
  conversationsScanned: number;
}

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) fetchAnalytics()
  }, [user])

  const fetchAnalytics = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const res = await fetch(`${apiUrl}/analytics`, { credentials: 'include' })
      if (!res.ok) throw new Error("Failed to fetch analytics")
      const result = await res.json()
      setData(result.data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive/50" />
          <p className="text-lg font-bold text-foreground">Something went wrong</p>
          <p className="text-muted-foreground">{error || "Could not load analytics data."}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/30">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-7xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
                Analytics <BarChart3 className="w-8 h-8 text-primary" />
              </h1>
              <p className="text-muted-foreground text-lg">Detailed insights into your lead generation pipeline.</p>
            </div>
            
            <div className="flex items-center gap-4 bg-muted/40 p-4 rounded-2xl border border-border/50">
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Scanned Context</p>
                <p className="text-lg font-black text-foreground">{data.conversationsScanned.toLocaleString()}</p>
              </div>
              <div className="h-10 w-[1px] bg-border/50" />
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Total Leads Found</p>
                <p className="text-lg font-black text-primary">{data.totalLeads.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { label: "Leads (Total)", value: data.totalLeads, icon: Target, color: "text-primary bg-primary/10" },
              { label: "Converted", value: data.statusDistribution.find(s => s.label === 'CONVERTED')?.count || 0, icon: Sparkles, color: "text-success bg-success/10" },
              { label: "Scanning Power", value: "24/7", icon: Activity, color: "text-amber-500 bg-amber-500/10" },
              { label: "Intent Accuracy", value: "94%", icon: PieChart, color: "text-violet-500 bg-violet-500/10" },
            ].map((stat, i) => (
              <Card key={i} className="border-border/50 shadow-sm overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">{stat.label}</p>
                      <h3 className="text-2xl font-black text-foreground">{stat.value}</h3>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Leads Over Time - Bar Chart Visualization */}
            <Card className="lg:col-span-2 border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" /> Lead Volume
                  </CardTitle>
                  <CardDescription>Generated leads over the last 7 days.</CardDescription>
                </div>
                <Calendar className="w-5 h-5 text-muted-foreground opacity-30" />
              </CardHeader>
              <CardContent className="h-[300px] flex items-end gap-2 px-6 pb-8 pt-4">
                {data.leadsOverTime.map((day, i) => {
                  const maxCount = Math.max(...data.leadsOverTime.map(d => d.count), 1)
                  const height = `${(day.count / maxCount) * 100}%`
                  const dateLabel = new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })
                  
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center group gap-3">
                      <div className="relative w-full flex items-end justify-center min-h-[40px]">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height }}
                          className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-primary/80 to-primary group-hover:from-primary transition-all duration-500 relative"
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-border">
                            {day.count}
                          </div>
                        </motion.div>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground/60 group-hover:text-foreground transition-colors uppercase tracking-wider">
                        {dateLabel}
                      </span>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Distribution Charts */}
            <div className="space-y-8">
              {/* Intent Level */}
              <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" /> Intent Mix
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.intentDistribution.map((item, i) => {
                    const total = data.intentDistribution.reduce((acc, curr) => acc + curr.count, 0)
                    const percentage = total > 0 ? (item.count / total) * 100 : 0
                    
                    return (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="text-foreground">{item.count}</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            className="h-full bg-primary"
                          />
                        </div>
                      </div>
                    )
                  })}
                  {data.intentDistribution.length === 0 && (
                    <p className="text-xs text-center text-muted-foreground py-4 italic">No intent data available yet.</p>
                  )}
                </CardContent>
              </Card>

              {/* Platform Dist */}
              <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Search className="w-4 h-4 text-primary" /> Source Channels
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.platformDistribution.map((item, i) => {
                    const total = data.platformDistribution.reduce((acc, curr) => acc + curr.count, 0)
                    const percentage = total > 0 ? (item.count / total) * 100 : 0
                    
                    return (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="text-foreground">{item.count}</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            className="h-full bg-foreground"
                          />
                        </div>
                      </div>
                    )
                  })}
                  {data.platformDistribution.length === 0 && (
                    <p className="text-xs text-center text-muted-foreground py-4 italic">No platform data available yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
