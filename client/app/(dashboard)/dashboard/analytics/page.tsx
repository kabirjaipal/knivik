
"use client"

import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  TrendingUp, 
  Target, 
  Activity, 
  Search,
  Loader2,
  AlertCircle,
  Brain,
  Lock,
  BadgeDollarSign,
  Percent,
  Flame,
  Award,
  Box,
  Zap,
  BarChart3
} from "lucide-react"
import { useEffect, useState, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface MetricData {
  label: string;
  count: number;
}

interface AnalyticsData {
  leadsOverTime: { date: string; count: number }[];
  intentDistribution: MetricData[];
  platformDistribution: MetricData[];
  statusDistribution: MetricData[];
  sentimentDistribution: MetricData[];
  peakActivityHours: { hour: number; count: number }[];
  topKeywords: MetricData[];
  leadVelocity: number;
  totalLeads: number;
  conversationsScanned: number;
  averageIntentScore: number;
  topProduct: { name: string; count: number } | null;
  activeProductsCount: number;
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
  const { user, loading: authLoading } = useAuth()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [llmUsage, setLlmUsage] = useState<LlmUsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasFetchedAnalytics = useRef(false)
  const lastFetchedUserId = useRef<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const res = await fetch(`${apiUrl}/analytics`, { credentials: 'include' })
      if (!res.ok) throw new Error("Failed to fetch analytics")
      const result = await res.json()
      setData(result.data)
    } catch (err: any) {
      setError(err.message)
    }
  }, [])

  const fetchLlmUsage = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const res = await fetch(`${apiUrl}/analytics/llm`, { credentials: 'include' })
      if (!res.ok) throw new Error("Failed to fetch AI usage")
      const result = await res.json()
      setLlmUsage(result.data)
    } catch (err: any) {
      console.error(err.message)
    }
  }, [])

  useEffect(() => {
    if (authLoading || !user) return
    
    if (hasFetchedAnalytics.current && lastFetchedUserId.current === user.id) return
    
    hasFetchedAnalytics.current = true
    lastFetchedUserId.current = user.id

    setLoading(true)
    Promise.all([fetchAnalytics(), fetchLlmUsage()])
      .finally(() => setLoading(false))
  }, [user, authLoading, fetchAnalytics, fetchLlmUsage])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen -mt-20">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-primary/20" />
          <Loader2 className="w-12 h-12 animate-spin text-primary absolute inset-0 [animation-delay:-0.15s]" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 h-[60vh]">
        <div className="p-6 rounded-full bg-destructive/5 border border-destructive/10">
          <AlertCircle className="w-12 h-12 text-destructive" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black tracking-tight">Analytics unavailable</h2>
          <p className="text-sm text-muted-foreground max-w-sm">{error || "We couldn't load your data. Please check your connection."}</p>
        </div>
      </div>
    )
  }

  // GLOBAL EMPTY STATE: No Products
  if (data.activeProductsCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 animate-in fade-in duration-700">
        <div className="relative">
           <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full animate-pulse" />
           <div className="relative w-24 h-24 bg-card border border-border/50 rounded-3xl flex items-center justify-center shadow-2xl">
              <BarChart3 className="w-10 h-10 text-primary" />
           </div>
        </div>
        <div className="text-center space-y-3 max-w-md">
          <h1 className="text-3xl font-black tracking-tighter">Ready to track?</h1>
          <p className="text-muted-foreground font-medium">Create your first product to start monitoring social mentions and generating AI-powered leads.</p>
        </div>
        <a href="/dashboard/products" className="h-11 px-8 rounded-xl bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex items-center gap-2">
           <Box className="w-4 h-4" /> Create First Product
        </a>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="space-y-6 pb-20"
    >
      {/* Premium Header - More Compact */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-[9px]">
            <Activity className="w-3 h-3" /> Intel Pulse
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-foreground leading-none">
            Analytics<span className="text-primary">.</span>
          </h1>
          <p className="text-muted-foreground text-xs font-medium">Monitoring {data.activeProductsCount} products across {data.platformDistribution.length || 0} channels.</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-8">
          <SummaryStat label="Status" value="Live" icon={Zap} color="text-amber-500" />
          <SummaryStat label="Velocity" value={`${data.leadVelocity > 0 ? '+' : ''}${data.leadVelocity}%`} icon={TrendingUp} color={data.leadVelocity >= 0 ? "text-emerald-500" : "text-destructive"} />
          <SummaryStat label="Scanning" value={data.conversationsScanned.toLocaleString()} icon={Search} />
          <SummaryStat label="Total Leads" value={data.totalLeads.toLocaleString()} icon={Target} color="text-primary" />
        </div>
      </div>

      {/* Row 1: Flow & Sentiment */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Lead Flow - Wide */}
        <Card className="lg:col-span-8 border-none bg-linear-to-br from-card to-card/50 shadow-xl shadow-black/5 overflow-hidden">
          <CardHeader className="py-3 px-6 border-b border-border/40">
             <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" /> Lead Volume
                </CardTitle>
                <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-md">
                   <button className="px-2 py-0.5 text-[9px] font-black bg-background shadow-xs rounded-sm">7D</button>
                   <button className="px-2 py-0.5 text-[9px] font-bold text-muted-foreground">30D</button>
                </div>
             </div>
          </CardHeader>
          <CardContent className="h-[240px] px-8 pb-8 pt-4 flex items-center justify-center">
            {data.totalLeads > 0 ? (
              <div className="flex items-end gap-3 w-full h-full">
                {data.leadsOverTime.map((day, i) => {
                  const maxCount = Math.max(...data.leadsOverTime.map(d => d.count), 1)
                  const height = `${(day.count / maxCount) * 100}%`
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center group gap-2 h-full justify-end">
                      <div className="relative w-full flex items-end justify-center h-full">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height }}
                          transition={{ duration: 1, delay: i * 0.05 }}
                          className="w-full max-w-[32px] rounded-t-md bg-linear-to-t from-primary/60 to-primary group-hover:brightness-110 transition-all relative"
                        />
                      </div>
                      <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-tighter">
                        {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : <EmptyChartPlaceholder message="Awaiting data..." />}
          </CardContent>
        </Card>

        {/* Sentiment Mix - Compact */}
        <Card className="lg:col-span-4 border-none bg-card shadow-xl shadow-black/5">
           <CardHeader className="py-3 px-6 border-b border-border/40">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-primary" /> Sentiment Mix
              </CardTitle>
           </CardHeader>
           <CardContent className="p-6 space-y-4">
              {data.sentimentDistribution.length > 0 ? (
                data.sentimentDistribution.map((item, i) => {
                  const total = data.sentimentDistribution.reduce((acc, curr) => acc + curr.count, 0)
                  const percentage = (item.count / total) * 100
                  const colorMap: Record<string, string> = {
                    "BUY NOW": "bg-emerald-500",
                    "RESEARCHING": "bg-primary",
                    "COMPARING": "bg-amber-400",
                    "LOW INTENT": "bg-muted-foreground/40",
                    "NEUTRAL": "bg-slate-400"
                  }
                  const displayLabel = item.label.toUpperCase()
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                        <span>{item.label}</span>
                        <span className="text-muted-foreground">{Math.round(percentage)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} animate={{ width: `${percentage}%` }}
                          className={cn("h-full", colorMap[item.label.toUpperCase()] || "bg-primary")}
                        />
                      </div>
                    </div>
                  )
                })
              ) : <EmptyListPlaceholder />}
           </CardContent>
        </Card>
      </div>

      {/* Row 2: Activity & Keywords */}
      <div className="grid lg:grid-cols-12 gap-6">
         {/* Peak Activity - 24h Bar Chart */}
         <Card className="lg:col-span-7 border-none bg-card shadow-xl shadow-black/5">
            <CardHeader className="py-3 px-6 border-b border-border/40">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-500" /> Peak Activity (24h)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[180px] p-6 flex items-end gap-1">
               {data.peakActivityHours.map((h, i) => {
                  const max = Math.max(...data.peakActivityHours.map(d => d.count), 1)
                  const height = `${(h.count / max) * 100}%`
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center group h-full justify-end">
                       <div className="relative w-full flex items-end justify-center h-full">
                          <motion.div 
                            initial={{ height: 0 }} animate={{ height }}
                            className="w-full rounded-t-sm bg-primary/20 group-hover:bg-primary transition-colors"
                          />
                       </div>
                       {i % 4 === 0 && <span className="text-[7px] font-black text-muted-foreground mt-1">{h.hour}h</span>}
                    </div>
                  )
               })}
            </CardContent>
         </Card>

         {/* Trending Topics - Chips */}
         <Card className="lg:col-span-5 border-none bg-card shadow-xl shadow-black/5">
            <CardHeader className="py-3 px-6 border-b border-border/40">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-primary" /> Trending Topics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
               <div className="flex flex-wrap gap-2">
                  {data.topKeywords.length > 0 ? (
                    data.topKeywords.map((k, i) => (
                      <div key={i} className="px-2.5 py-1 rounded-lg bg-muted border border-border/40 text-[10px] font-black flex items-center gap-2 hover:border-primary/40 transition-colors cursor-default">
                         <span className="text-foreground">{k.label}</span>
                         <span className="text-primary/60">{k.count}</span>
                      </div>
                    ))
                  ) : <div className="text-xs text-muted-foreground italic">Detecting patterns...</div>}
               </div>
            </CardContent>
         </Card>
      </div>

      {/* Row 3: Channels & ROI */}
      <div className="grid lg:grid-cols-3 gap-6">
         {/* Channels */}
         <Card className="border-none bg-card shadow-xl shadow-black/5">
            <CardHeader className="py-3 px-6 border-b border-border/40">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Channels</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
               {data.platformDistribution.map((item, i) => (
                 <div key={i} className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</span>
                    <span className="text-xs font-black">{item.count} Leads</span>
                 </div>
               ))}
            </CardContent>
         </Card>

         {/* ROI - Pipe Value */}
         <Card className={cn(
            "border-none overflow-hidden relative group",
            data.isAdvancedAnalyticsEnabled ? "bg-emerald-500/5" : "bg-muted/30"
         )}>
            <CardContent className="p-6">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">Est. Pipeline Value</p>
              <h3 className="text-4xl font-black tracking-tighter">
                {data.isAdvancedAnalyticsEnabled ? `$${data.estimatedPipelineValue.toLocaleString()}` : "$ —"}
              </h3>
              {!data.isAdvancedAnalyticsEnabled && <ProOverlay />}
            </CardContent>
         </Card>

         {/* ROI - Conv Rate */}
         <Card className={cn(
            "border-none overflow-hidden relative group",
            data.isAdvancedAnalyticsEnabled ? "bg-primary/5" : "bg-muted/30"
         )}>
            <CardContent className="p-6">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">Conversion Rate</p>
              <h3 className="text-4xl font-black tracking-tighter">
                {data.isAdvancedAnalyticsEnabled ? `${data.leadConversionRate}%` : "— %"}
              </h3>
              {!data.isAdvancedAnalyticsEnabled && <ProOverlay />}
            </CardContent>
         </Card>
      </div>

      {/* AI Layer - Bottom */}
      <div className="grid lg:grid-cols-2 gap-6 pt-4">
          <Card className="border-none bg-card shadow-xl shadow-black/5">
            <CardHeader className="py-3 px-6 border-b border-border/40 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Brain className="w-3.5 h-3.5" /> Task Efficiency
              </CardTitle>
              <div className="text-[10px] font-black text-foreground">${llmUsage?.totals.estimatedCost.toFixed(4)}</div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
               {llmUsage?.breakdown.map((item, i) => (
                 <div key={i} className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                    <span className="text-muted-foreground">{item.action.replace('_', ' ')}</span>
                    <span>{Math.round((item.totalTokens / (llmUsage.totals.totalTokens || 1)) * 100)}%</span>
                 </div>
               ))}
            </CardContent>
          </Card>

          <Card className="border-none bg-card shadow-xl shadow-black/5">
            <CardHeader className="py-3 px-6 border-b border-border/40">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Award className="w-3.5 h-3.5" /> Top Performer
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
               {data.topProduct ? (
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                       <Box className="w-5 h-5" />
                    </div>
                    <div>
                       <p className="text-sm font-black tracking-tight">{data.topProduct.name}</p>
                       <p className="text-[9px] font-black uppercase tracking-widest text-primary">{data.topProduct.count} Leads Found</p>
                    </div>
                 </div>
               ) : <div className="text-xs italic text-muted-foreground">Awaiting data...</div>}
            </CardContent>
          </Card>
      </div>
    </motion.div>
  )
}

function SummaryStat({ label, value, icon: Icon, color }: { label: string, value: string, icon: any, color?: string }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-0.5">
         <Icon className={cn("w-2.5 h-2.5 opacity-50", color)} />
         <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground leading-none">{label}</span>
      </div>
      <p className="text-xl font-black tracking-tight text-foreground leading-tight">{value}</p>
    </div>
  )
}

function EmptyChartPlaceholder({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-3 opacity-30">
       <div className="p-4 bg-muted/40 rounded-full">
         <TrendingUp className="w-8 h-8" />
       </div>
       <p className="text-[10px] font-black uppercase tracking-widest">{message}</p>
    </div>
  )
}

function EmptyListPlaceholder() {
  return (
    <div className="space-y-4 py-2">
       {[1, 2, 3].map(i => (
         <div key={i} className="space-y-1.5 opacity-10">
           <div className="h-1.5 w-24 bg-foreground rounded-full" />
           <div className="h-1 w-full bg-muted rounded-full" />
         </div>
       ))}
    </div>
  )
}

function ProLock() {
  return (
    <div className="px-1.5 py-0.5 bg-primary text-primary-foreground rounded-md text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-primary/20">
      <Lock className="w-2 h-2" /> Locked
    </div>
  )
}

function ProOverlay() {
  return (
    <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-6 text-center">
       <div className="space-y-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-foreground">Available on Pro</p>
          <a href="/dashboard/billing" className="inline-flex h-7 items-center justify-center rounded-lg bg-primary px-3 text-[9px] font-black text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
             Upgrade
          </a>
       </div>
    </div>
  )
}
