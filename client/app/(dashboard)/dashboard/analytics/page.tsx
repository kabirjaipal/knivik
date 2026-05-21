"use client";

import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  Target,
  Activity,
  Search,
  Loader2,
  AlertCircle,
  Brain,
  BadgeDollarSign,
  Percent,
  Flame,
  Award,
  Box,
  Zap,
  BarChart3,
  Globe,
  Clock,
  Cpu,
  Coins,
} from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

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
  leadConversionRate: string;
  llmUsage: LlmUsageData;
  usageStats: any;
}

interface LlmBreakdown {
  modelId: string;
  action: string;
  requestCount: number;
}

interface LlmUsageData {
  breakdown: LlmBreakdown[];
  totals: {
    requestCount: number;
  };
}

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d">("7d");
  const [error, setError] = useState<string | null>(null);
  const hasFetchedAnalytics = useRef(false);
  const lastFetchedUserId = useRef<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/analytics`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const result = await res.json();
      setData(result.data);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;

    // Fetch only once per user session
    const needsFetch =
      !hasFetchedAnalytics.current || lastFetchedUserId.current !== user.id;

    if (!needsFetch) return;

    hasFetchedAnalytics.current = true;
    lastFetchedUserId.current = user.id;

    setLoading(true);
    fetchAnalytics().finally(() => setLoading(false));
  }, [user, authLoading, fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen -mt-20">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-primary/20" />
          <Loader2 className="w-12 h-12 animate-spin text-primary absolute inset-0" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="p-6 rounded-full bg-destructive/5 border border-destructive/10">
          <AlertCircle className="w-12 h-12 text-destructive" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black tracking-tight">
            Analytics unavailable
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            {error ||
              "We couldn't load your data. Please check your connection."}
          </p>
        </div>
      </div>
    );
  }

  // GLOBAL EMPTY STATE: No Products
  if (data.activeProductsCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="max-w-md space-y-3">
          <h1 className="text-2xl font-black tracking-tight">
            Ready to track?
          </h1>
          <p className="text-sm text-muted-foreground">
            Create your first product in the{" "}
            <Link href="/dashboard/products" className="text-primary underline hover:text-primary/80 font-bold">
              products tab
            </Link>{" "}
            to start monitoring social mentions and generating AI-powered leads.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-20"
    >
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-border/40">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px]">
            <Activity className="w-3.5 h-3.5" /> System Intelligence
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-foreground leading-none mt-1">
            Intelligence Pulse<span className="text-primary">.</span>
          </h1>
          <p className="text-muted-foreground text-xs font-medium">
            Monitoring {data.activeProductsCount} products across{" "}
            {Array.isArray(data.platformDistribution)
              ? data.platformDistribution.length
              : 0}{" "}
            channels.
          </p>
        </div>

        {/* Resource Consumption Pulse */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Lead Quota */}
          <div className="min-w-44 p-4 rounded-2xl bg-card border border-border/50 shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                Lead Quota
              </span>
              <Badge
                variant="outline"
                className="text-[10px] font-black h-4 px-1.5 border-primary/30 text-primary uppercase"
              >
                {data.usageStats?.plan?.name || "Free"}
              </Badge>
            </div>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-2xl font-black tracking-tighter">
                {data.usageStats?.leads?.used || 0}
              </span>
              <span className="text-xs font-bold text-muted-foreground">
                / {data.usageStats?.leads?.limit || 100}
              </span>
            </div>
            <Progress
              value={
                ((data.usageStats?.leads?.used || 0) /
                  (data.usageStats?.leads?.limit || 100)) *
                100
              }
              className="h-1 bg-muted"
            />
          </div>

          {/* Manual Hours Saved */}
          <div className="min-w-44 p-4 rounded-2xl bg-card border border-border/50 shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                Manual ROI
              </span>
              <Clock className="w-3.5 h-3.5 text-blue-500 opacity-50" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black tracking-tighter text-blue-500">
                {Math.round(
                  (data.usageStats?.leads?.used || 0) * 0.5 +
                    (data.llmUsage?.totals?.requestCount || 0) * 0.1,
                )}
              </span>
              <span className="text-xs font-bold text-muted-foreground uppercase">
                Hrs Saved
              </span>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground mt-2">
              AI filtered {(data.usageStats?.leads?.used || 0) * 15} noise posts
            </p>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Leads */}
        <div className="p-5 rounded-2xl bg-card border border-border/40 shadow-sm relative overflow-hidden group hover:border-primary/35 transition-all">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              Total Leads
            </span>
            <Flame className="w-4 h-4 text-primary opacity-80" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black tracking-tighter">
              {data.totalLeads}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 font-medium">
            Synced across all active products
          </p>
        </div>

        {/* Card 2: Scrape Coverage */}
        <div className="p-5 rounded-2xl bg-card border border-border/40 shadow-sm relative overflow-hidden group hover:border-blue-500/35 transition-all">
          <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              Conversations Checked
            </span>
            <Globe className="w-4 h-4 text-blue-500 opacity-80" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black tracking-tighter">
              {(data.conversationsScanned || 0).toLocaleString()}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 font-medium">
            Total context analyzed in 30d
          </p>
        </div>

        {/* Card 3: Lead Velocity */}
        <div className="p-5 rounded-2xl bg-card border border-border/40 shadow-sm relative overflow-hidden group hover:border-emerald-500/35 transition-all">
          <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              Lead Growth Velocity
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-500 opacity-80" />
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                "text-3xl font-black tracking-tighter",
                data.leadVelocity >= 0
                  ? "text-emerald-500"
                  : "text-destructive",
              )}
            >
              {data.leadVelocity >= 0 ? "+" : ""}
              {data.leadVelocity}%
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 font-medium">
            Week-over-week growth vector
          </p>
        </div>

        {/* Card 4: Average Intent Rating */}
        <div className="p-5 rounded-2xl bg-card border border-border/40 shadow-sm relative overflow-hidden group hover:border-purple-500/35 transition-all">
          <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              Match Confidence
            </span>
            <Brain className="w-4 h-4 text-purple-500 opacity-80" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black tracking-tighter">
              {data.averageIntentScore}
            </span>
            <span className="text-xs font-bold text-muted-foreground">
              /100
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 font-medium">
            Average lead intent score rating
          </p>
        </div>
      </div>

      {/* Row 1: Flow & Sentiment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lead Flow - Wide */}
        <Card className="lg:col-span-8 border border-border/40 bg-card/60 shadow-xl shadow-black/5 overflow-hidden">
          <CardHeader className="py-3 px-6 border-b border-border/40">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-primary" /> Lead Volume
                Over Time
              </CardTitle>
              <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-md">
                <button
                  onClick={() => setTimeRange("7d")}
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-black rounded-sm transition-all uppercase tracking-widest",
                    timeRange === "7d"
                      ? "bg-background shadow-xs text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  7D
                </button>
                <button
                  onClick={() => setTimeRange("30d")}
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-black rounded-sm transition-all uppercase tracking-widest",
                    timeRange === "30d"
                      ? "bg-background shadow-xs text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  30D
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-2">
            {(() => {
              const filtered = (timeRange === "7d"
                ? data.leadsOverTime.slice(-7)
                : data.leadsOverTime
              ).filter(d => d.count > 0);
              const rows = timeRange === "7d"
                ? data.leadsOverTime.slice(-7)
                : data.leadsOverTime;
              const maxCount = Math.max(...rows.map(d => d.count), 1);
              return (
                <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
                  {rows.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-4 text-center">Awaiting data...</p>
                  ) : (
                    rows.map((d, i) => (
                      <div key={i} className="flex items-center gap-3 py-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 w-14 shrink-0">
                          {new Date(d.date).toLocaleDateString(undefined, timeRange === "7d" ? { weekday: "short", month: "short", day: "numeric" } : { month: "short", day: "numeric" })}
                        </span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(d.count / maxCount) * 100}%` }}
                            className="h-full rounded-full bg-primary"
                          />
                        </div>
                        <span className="text-xs font-black w-6 text-right tabular-nums">
                          {d.count}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Sentiment Mix - Compact */}
        <Card className="lg:col-span-4 border border-border/40 bg-card/60 shadow-xl shadow-black/5">
          <CardHeader className="py-3 px-6 border-b border-border/40">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
              <Brain className="w-3.5 h-3.5 text-primary" /> Sentiment & Intent
              Mix
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {Array.isArray(data.sentimentDistribution) &&
            data.sentimentDistribution.length > 0 ? (
              data.sentimentDistribution.map((item, i) => {
                const total = data.sentimentDistribution.reduce(
                  (acc, curr) => acc + curr.count,
                  0,
                );
                const percentage = total > 0 ? (item.count / total) * 100 : 0;
                const colorMap: Record<string, string> = {
                  "BUY NOW": "bg-emerald-500",
                  RESEARCHING: "bg-primary",
                  COMPARING: "bg-amber-400",
                  "LOW INTENT": "bg-muted-foreground/40",
                  NEUTRAL: "bg-slate-400",
                };
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span>{item.label}</span>
                      <span className="text-muted-foreground">
                        {Math.round(percentage)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className={cn(
                          "h-full rounded-full",
                          colorMap[item.label.toUpperCase()] || "bg-primary",
                        )}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyListPlaceholder />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Activity & Keywords */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Peak Activity - 24h Bar Chart */}
        <Card className="lg:col-span-7 border border-border/40 bg-card/60 shadow-xl shadow-black/5">
          <CardHeader className="py-3 px-6 border-b border-border/40">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Ingestion Activity
              Hour (24h)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {(() => {
              const hours = data.peakActivityHours;
              const totalLeads = hours.reduce((s, h) => s + h.count, 0);
              const blocks = [
                { label: "00–05", desc: "Night", hours: hours.slice(0, 6) },
                { label: "06–11", desc: "Morning", hours: hours.slice(6, 12) },
                { label: "12–17", desc: "Afternoon", hours: hours.slice(12, 18) },
                { label: "18–23", desc: "Evening", hours: hours.slice(18, 24) },
              ];
              if (totalLeads === 0) {
                return <p className="text-xs text-muted-foreground italic py-4 text-center">Awaiting ingestion data...</p>;
              }
              return (
                <div className="space-y-2">
                  {blocks.map((block) => {
                    const blockCount = block.hours.reduce((s, h) => s + h.count, 0);
                    const peakHour = block.hours.reduce((a, b) => b.count > a.count ? b : a, block.hours[0]);
                    return (
                      <div key={block.label} className="flex items-center gap-3">
                        <div className="w-20 shrink-0">
                          <p className="text-[10px] font-black uppercase tracking-widest text-foreground/70">{block.label}</p>
                          <p className="text-[9px] text-muted-foreground font-bold">{block.desc}</p>
                        </div>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(blockCount / totalLeads) * 100}%` }}
                            className="h-full rounded-full bg-amber-500/80"
                          />
                        </div>
                        <span className="text-xs font-black w-6 text-right tabular-nums">{blockCount}</span>
                        {blockCount > 0 && (
                          <span className="text-[9px] text-muted-foreground font-bold w-12 shrink-0">peak {peakHour.hour}h</span>
                        )}
                      </div>
                    );
                  })}
                  <p className="text-[9px] text-muted-foreground/50 font-bold uppercase tracking-widest pt-1">{totalLeads} total ingestion events tracked</p>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Trending Keywords - Chips */}
        <Card className="lg:col-span-5 border border-border/40 bg-card/60 shadow-xl shadow-black/5">
          <CardHeader className="py-3 px-6 border-b border-border/40">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-primary" /> Trending Search
              Keywords
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="flex flex-wrap gap-2">
              {Array.isArray(data.topKeywords) &&
              data.topKeywords.length > 0 ? (
                data.topKeywords.map((k, i) => (
                  <div
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-muted border border-border/40 text-xs font-black flex items-center gap-2 hover:border-primary/40 transition-colors cursor-default"
                  >
                    <span className="text-foreground">{k.label}</span>
                    <span className="text-primary/60">{k.count}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground italic">
                  Detecting patterns...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Lead Sources (Full Width) */}
      <div className="grid grid-cols-1 gap-6">
        {/* Lead Sources */}
        <Card className="border border-border/40 bg-card/60 shadow-xl shadow-black/5">
          <CardHeader className="py-3 px-6 border-b border-border/40 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Lead Distribution & Efficiency
            </CardTitle>
            <Globe className="w-3.5 h-3.5 text-muted-foreground/30" />
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.isArray(data.usageStats?.leads?.bySource) &&
                data.usageStats.leads.bySource.map((source: any, i: number) => {
                  const colors: Record<string, string> = {
                    REDDIT:
                      "text-orange-500 bg-orange-500/10 border-orange-500/20",
                    TWITTER: "text-sky-500 bg-sky-500/10 border-sky-500/20",
                    HACKERNEWS:
                      "text-amber-600 bg-amber-600/10 border-amber-600/20",
                  };
                  const icons: Record<string, any> = {
                    REDDIT: <Activity className="w-3.5 h-3.5" />,
                    TWITTER: <Zap className="w-3.5 h-3.5" />,
                    HACKERNEWS: <TrendingUp className="w-3.5 h-3.5" />,
                  };

                  return (
                    <div
                      key={source.platform}
                      className="flex flex-col gap-3 p-5 rounded-2xl bg-muted/30 border border-border/50 group hover:border-primary/30 transition-all"
                    >
                      <div className="flex justify-between items-center">
                        <div
                          className={cn(
                            "p-2 rounded-lg border",
                            colors[source.platform],
                          )}
                        >
                          {icons[source.platform]}
                        </div>
                        <span className="text-[10px] font-black tracking-widest text-muted-foreground">
                          {source.count} LEADS
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest leading-none">
                          {source.platform}
                        </p>
                        <div className="mt-3 flex items-baseline gap-1">
                          <span className="text-3xl font-black tracking-tighter">
                            {source.percentage}%
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase ml-1">
                            Efficiency
                          </span>
                        </div>
                        <Progress
                          value={source.percentage}
                          className="mt-4 h-1.5 bg-muted"
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Advanced Intelligence & ROI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ROI - Intent Precision */}
        <Card className="border border-border/40 overflow-hidden relative group min-h-[160px] bg-card/60 shadow-xl shadow-black/5 flex flex-col justify-between">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">
                Intent Precision Score
              </p>
              <div className="flex items-baseline gap-1 transition-all">
                <h3 className="text-4xl font-black tracking-tighter">
                  {data.averageIntentScore}%
                </h3>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-bold text-muted-foreground/80 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-emerald-500" />
                AI Match accuracy score rating
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ROI - Conv Rate */}
        <Card className="border border-border/40 overflow-hidden relative group min-h-[160px] bg-card/60 shadow-xl shadow-black/5 flex flex-col justify-between">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">
                Outreach Conversion Rate
              </p>
              <div className="flex items-baseline gap-1 transition-all">
                <h3 className="text-4xl font-black tracking-tighter">
                  {data.leadConversionRate}%
                </h3>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-bold text-muted-foreground/80 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-primary" />
                Conversions from hot reply drafts
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ROI - Marketing Budget Saved */}
        <Card className="border border-border/40 overflow-hidden relative group min-h-[160px] bg-card/60 shadow-xl shadow-black/5 flex flex-col justify-between">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">
                Estimated Marketing Value ROI
              </p>
              <div className="flex items-baseline gap-1 transition-all">
                <h3 className="text-4xl font-black tracking-tighter">
                  $
                  {Math.round(
                    (data.usageStats?.leads?.used || 0) * 15 +
                      (data.llmUsage?.totals?.requestCount || 0) * 0.5,
                  )}
                </h3>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-bold text-muted-foreground/80 flex items-center gap-1">
                <BadgeDollarSign className="w-3.5 h-3.5 text-emerald-500" />
                Estimated USD marketing spend saved
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 5: AI Layer & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-border/40 bg-card/60 shadow-xl shadow-black/5">
          <CardHeader className="py-3 px-6 border-b border-border/40 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
              <Brain className="w-3.5 h-3.5 text-primary" /> Task Distribution
            </CardTitle>
            <div className="text-[10px] font-black text-foreground uppercase tracking-widest">
              {data.llmUsage?.totals?.requestCount || 0} AI Tasks Completed
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {Array.isArray(data.llmUsage?.breakdown) &&
            data.llmUsage.breakdown.length > 0 ? (
              data.llmUsage.breakdown.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center text-xs font-black uppercase tracking-widest"
                >
                  <span className="text-muted-foreground">
                    {item.action.replace("_", " ")}
                  </span>
                  <span>
                    {Math.round(
                      (item.requestCount /
                        (data.llmUsage.totals.requestCount || 1)) *
                        100,
                    )}
                    % Effort
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground italic py-2">
                No completed AI tasks recorded yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-card/60 shadow-xl shadow-black/5">
          <CardHeader className="py-3 px-6 border-b border-border/40">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
              <Award className="w-3.5 h-3.5 text-primary" /> Top Performer
              Product
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {data.topProduct ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-black tracking-tight">
                    {data.topProduct.name}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                    {data.topProduct.count} Leads Found
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-xs italic text-muted-foreground">
                Awaiting data...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

function EmptyChartPlaceholder({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-3 opacity-30">
      <div className="p-4 bg-muted/40 rounded-full">
        <TrendingUp className="w-8 h-8" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest">
        {message}
      </p>
    </div>
  );
}

function EmptyListPlaceholder() {
  return (
    <div className="space-y-4 py-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-1.5 opacity-10">
          <div className="h-1.5 w-24 bg-foreground rounded-full" />
          <div className="h-1 w-full bg-muted rounded-full" />
        </div>
      ))}
    </div>
  );
}

function ProOverlay() {
  return (
    <div className="absolute inset-0 bg-background/95 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-6 text-center">
      <div className="space-y-3">
        <p className="text-xs font-black uppercase tracking-widest text-foreground">
          Available on Pro
        </p>
        <a
          href="/dashboard/billing"
          className="inline-flex h-7 items-center justify-center rounded-lg bg-primary px-3 text-xs font-black text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          Upgrade Plan
        </a>
      </div>
    </div>
  );
}

interface ChartPoint {
  label: string;
  value: number;
  originalDate?: string;
}

function ModernAreaChart({
  points,
  height = 180,
  strokeColor = "hsl(var(--primary))",
  gradientColor = "hsl(var(--primary))",
  gradientId = "chart-grad",
  labelInterval = 5,
}: {
  points: ChartPoint[];
  height?: number;
  strokeColor?: string;
  gradientColor?: string;
  gradientId?: string;
  labelInterval?: number;
}) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  if (!points || points.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full opacity-35 text-xs font-black uppercase tracking-widest py-8">
        Awaiting data...
      </div>
    );
  }

  const width = 800;
  const paddingX = 40;
  const paddingY = 30; // Extra room at top for tooltip, bottom for labels

  const values = points.map((p) => p.value);
  const maxValue = Math.max(...values, 1);

  // Coordinates
  const chartPoints = points.map((p, i) => {
    const x =
      paddingX + (i / (points.length - 1 || 1)) * (width - 2 * paddingX);
    const y =
      height - paddingY - (p.value / maxValue) * (height - 2 * paddingY);
    return { x, y, ...p };
  });

  // SVG Paths
  let linePath = "";
  let areaPath = "";
  if (chartPoints.length > 0) {
    linePath = `M ${chartPoints[0].x} ${chartPoints[0].y}`;
    areaPath = `M ${chartPoints[0].x} ${height - paddingY}`;

    chartPoints.forEach((cp, idx) => {
      if (idx > 0) {
        const prev = chartPoints[idx - 1];
        // Smooth bezier curve control points
        const cpX1 = prev.x + (cp.x - prev.x) / 3;
        const cpY1 = prev.y;
        const cpX2 = prev.x + (2 * (cp.x - prev.x)) / 3;
        const cpY2 = cp.y;
        linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${cp.x} ${cp.y}`;
      }
    });

    areaPath += linePath.replace("M", "L");
    areaPath += ` L ${chartPoints[chartPoints.length - 1].x} ${height - paddingY} Z`;
  }

  // Calculate percentage left for tooltip overlay
  const activePoint = activeIdx !== null ? chartPoints[activeIdx] : null;
  const tooltipLeftPct =
    activeIdx !== null
      ? (paddingX / width) * 100 +
        (activeIdx / (points.length - 1 || 1)) *
          (100 - ((2 * paddingX) / width) * 100)
      : 0;

  return (
    <div className="w-full relative select-none">
      {/* Tooltip Overlay */}
      {activePoint !== null && (
        <div
          className="absolute z-20 bg-background/95 border border-border/40 text-foreground px-3 py-1.5 rounded-lg shadow-xl text-center pointer-events-none animate-in fade-in zoom-in-95 duration-150 flex flex-col items-center justify-center min-w-[90px]"
          style={{
            left: `${tooltipLeftPct}%`,
            top: `-4px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">
            {activePoint.originalDate
              ? new Date(activePoint.originalDate).toLocaleDateString(
                  undefined,
                  { month: "short", day: "numeric" },
                )
              : activePoint.label}
          </p>
          <p className="text-xs font-black text-foreground leading-none">
            {activePoint.value}{" "}
            <span className="text-[10px] text-muted-foreground font-medium">
              leads
            </span>
          </p>
        </div>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradientColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={gradientColor} stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.33, 0.66, 1].map((ratio, i) => {
          const y = paddingY + ratio * (height - 2 * paddingY);
          return (
            <line
              key={ratio}
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              stroke="currentColor"
              className="text-border/30"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Fill */}
        {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}

        {/* Line */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Vertical hover guide line */}
        {activeIdx !== null && activePoint && (
          <line
            x1={activePoint.x}
            y1={paddingY}
            x2={activePoint.x}
            y2={height - paddingY}
            stroke="currentColor"
            className="text-primary/45"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        )}

        {/* Glowing dot on hover */}
        {activeIdx !== null && activePoint && (
          <>
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r="6"
              fill={strokeColor}
              className="opacity-20 animate-ping"
            />
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r="5"
              fill={strokeColor}
            />
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r="2"
              fill="hsl(var(--background))"
            />
          </>
        )}

        {/* X-Axis labels */}
        {chartPoints.map((cp, idx) => {
          const shouldShowLabel =
            idx % labelInterval === 0 || idx === chartPoints.length - 1;
          if (!shouldShowLabel) return null;

          return (
            <text
              key={idx}
              x={cp.x}
              y={height - 5}
              textAnchor="middle"
              className="fill-muted-foreground/50 text-[10px] font-black uppercase tracking-tighter"
            >
              {cp.label}
            </text>
          );
        })}

        {/* Transparent columns for hover detection */}
        {chartPoints.map((cp, idx) => {
          const colWidth = (width - 2 * paddingX) / (points.length - 1 || 1);
          return (
            <rect
              key={idx}
              x={cp.x - colWidth / 2}
              y={0}
              width={colWidth}
              height={height}
              fill="transparent"
              className="cursor-crosshair"
              onMouseEnter={() => setActiveIdx(idx)}
              onMouseLeave={() => setActiveIdx(null)}
            />
          );
        })}
      </svg>
    </div>
  );
}
