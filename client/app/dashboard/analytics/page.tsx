"use client"

import { useAuth } from "@/context/auth-context"
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
  AlertCircle,
  Brain,
  Lock,
  BadgeDollarSign,
  Percent
} from "lucide-react"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"

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
  isAdvancedAnalyticsEnabled: boolean;
  estimatedPipelineValue: number;
  leadConversionRate: string;
}

interface LlmBreakdown {
  modelId: string;
  action: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  requestCount: number;
  estimatedCost: number;
}

interface LlmUsageData {
  breakdown: LlmBreakdown[];
  totals: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number;
    requestCount: number;
  };
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [llmUsage, setLlmUsage] = useState<LlmUsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      Promise.all([fetchAnalytics(), fetchLlmUsage()])
        .finally(() => setLoading(false))
    }
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
    }
  }

  const fetchLlmUsage = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const res = await fetch(`${apiUrl}/analytics/llm`, { credentials: 'include' })
      if (!res.ok) throw new Error("Failed to fetch AI usage")
      const result = await res.json()
      setLlmUsage(result.data)
    } catch (err: any) {
      console.error(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 h-64">
        <AlertCircle className="w-12 h-12 text-destructive/50" />
        <p className="text-lg font-bold text-foreground">Something went wrong</p>
        <p className="text-muted-foreground">{error || "Could not load analytics data."}</p>
      </div>
    )
  }

  return (
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
            <p className="text-lg font-black text-foreground">{(data.conversationsScanned || 0).toLocaleString()}</p>
          </div>
          <div className="h-10 w-px bg-border/50" />
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Total Leads Found</p>
            <p className="text-lg font-black text-primary">{(data.totalLeads || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        {[
          { label: "Leads (Total)", value: data.totalLeads, icon: Target, color: "text-primary bg-primary/10" },
          { label: "Converted", value: data.statusDistribution.find(s => s.label === 'CONVERTED')?.count || 0, icon: Sparkles, color: "text-primary bg-primary/10" },
          { label: "Scanning Power", value: "24/7", icon: Activity, color: "text-primary bg-primary/10" },
          { label: "Intent Accuracy", value: "94%", icon: PieChart, color: "text-primary bg-primary/10" },
        ].map((stat, i) => (
          <Card key={i} className="border shadow-none bg-card overflow-hidden">
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

      {/* Advanced ROI Analytics Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BadgeDollarSign className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
            Advanced ROI Analytics
            {!data.isAdvancedAnalyticsEnabled && (
              <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-3 h-3" /> Starter / Pro
              </span>
            )}
          </h2>
        </div>
        
        <div className={`grid md:grid-cols-2 gap-6 relative ${!data.isAdvancedAnalyticsEnabled ? 'overflow-hidden' : ''}`}>
          {!data.isAdvancedAnalyticsEnabled && (
            <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-[6px] flex flex-col items-center justify-center rounded-xl border border-border">
              <Lock className="w-8 h-8 text-muted-foreground mb-3" />
              <p className="text-lg font-bold">Unlock Advanced ROI</p>
              <p className="text-sm text-muted-foreground mb-4">Upgrade to see estimated pipeline value and conversion metrics.</p>
              <a href="/dashboard/billing" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm">Upgrade Plan</a>
            </div>
          )}
          
          <Card className="border shadow-none bg-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BadgeDollarSign className="w-4 h-4 text-primary" /> Estimated Pipeline Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-foreground">${(data.estimatedPipelineValue || 0).toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Based on an average estimated value of $250 per CONVERTED lead.</p>
            </CardContent>
          </Card>

          <Card className="border shadow-none bg-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Percent className="w-4 h-4 text-primary" /> Lead Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-foreground">{data.leadConversionRate || 0}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Percentage of all scanned leads that changed to CONVERTED status.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Leads Over Time - Bar Chart Visualization */}
        <Card className="lg:col-span-2 border shadow-none bg-card">
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
                      className="w-full max-w-[40px] rounded-t-lg bg-linear-to-t from-primary/80 to-primary group-hover:from-primary transition-all duration-500 relative"
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
          <Card className="border shadow-none bg-card">
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
          <Card className="border shadow-none bg-card">
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

      {/* AI Usage Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">AI Power &amp; Consumption</h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Cost & Efficiency */}
          <Card className="border shadow-none bg-card overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Token Efficiency
              </CardTitle>
              <CardDescription>Real-time calculation of inference costs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex items-end gap-2">
                <span className="text-5xl font-black text-foreground">${llmUsage?.totals.estimatedCost.toFixed(4) || '0.000'}</span>
                <span className="text-sm font-bold text-muted-foreground mb-1.5 uppercase tracking-widest">Total USD Burned</span>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Input Tokens</p>
                  <p className="text-xl font-black text-foreground">{llmUsage?.totals.inputTokens.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Output Tokens</p>
                  <p className="text-xl font-black text-foreground">{llmUsage?.totals.outputTokens.toLocaleString() || 0}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border/40">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Usage by Task</p>
                <div className="space-y-4">
                  {llmUsage?.breakdown.map((item, i) => {
                    const percentage = (item.totalTokens / (llmUsage.totals.totalTokens || 1)) * 100
                    return (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                          <span className="text-muted-foreground">{item.action.replace('_', ' ')}</span>
                          <span className="text-foreground">{Math.round(percentage)}%</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            className="h-full bg-primary"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Model Breakdown */}
          <Card className="border shadow-none bg-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Active Models
              </CardTitle>
              <CardDescription>Which minds are powering your radar?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {llmUsage?.breakdown.reduce((acc: any[], curr) => {
                  const existing = acc.find(a => a.modelId === curr.modelId)
                  if (existing) {
                    existing.requestCount += curr.requestCount
                    existing.estimatedCost += curr.estimatedCost
                  } else {
                    acc.push({ ...curr })
                  }
                  return acc
                }, []).map((model, i) => (
                  <div key={i} className="p-4 rounded-xl border border-border/40 bg-muted/20 flex items-center justify-between group hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-primary/10 text-primary`}>
                        <Brain className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-foreground tracking-tight">{model.modelId}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{model.requestCount} Requests</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-foreground">${model.estimatedCost.toFixed(4)}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Model Cost</p>
                    </div>
                  </div>
                ))}
                {!llmUsage?.breakdown.length && (
                  <div className="py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground opacity-20" />
                    <p className="text-xs text-muted-foreground mt-2 italic font-medium">No AI activity recorded yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
