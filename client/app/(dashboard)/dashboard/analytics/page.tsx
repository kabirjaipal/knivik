"use client";

import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import Link from "next/link";
import {
  Card,
  CardContent,
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
  Globe,
  Clock,
} from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
      <h2 className="text-xl font-black tracking-tight text-foreground border-b border-border/40 pb-4">
        Analytics
      </h2>

      {/* Resource Consumption Pulse */}
      <div className="grid grid-cols-2 lg:flex lg:flex-row lg:items-center lg:gap-3 gap-3">
        {/* Lead Quota */}
        <div className="w-full lg:w-36 min-w-0 p-3 rounded-xl bg-card border border-border/40 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center gap-1.5">
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Quota
            </span>
            <span className="text-xs font-black text-primary uppercase px-1.5 bg-primary/10 rounded">
              {data.usageStats?.plan?.name || "Free"}
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-0.5">
            <span className="text-xl font-black tracking-tight leading-none">
              {data.usageStats?.leads?.used || 0}
            </span>
            <span className="text-xs font-bold text-muted-foreground leading-none">
              /{data.usageStats?.leads?.limit || 100}
            </span>
          </div>
        </div>

        {/* Manual Hours Saved */}
        <div className="w-full lg:w-36 min-w-0 p-3 rounded-xl bg-card border border-border/40 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center gap-1.5">
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Manual ROI
            </span>
            <Clock className="w-3 h-3 text-blue-500 opacity-60" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-0.5">
            <span className="text-xl font-black tracking-tight text-blue-500 leading-none">
              {Math.round(
                (data.usageStats?.leads?.used || 0) * 0.5 +
                  (data.llmUsage?.totals?.requestCount || 0) * 0.1,
              )}
            </span>
            <span className="text-xs font-bold text-muted-foreground uppercase leading-none truncate">
              Hrs Saved
            </span>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Leads */}
        <div className="p-4 rounded-xl bg-card border border-border/40 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Total Leads
            </span>
            <Flame className="w-3.5 h-3.5 text-primary opacity-80" />
          </div>
          <span className="text-2xl font-black tracking-tighter leading-none">
            {data.totalLeads}
          </span>
        </div>

        {/* Card 2: Scrape Coverage */}
        <div className="p-4 rounded-xl bg-card border border-border/40 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Conversations Checked
            </span>
            <Globe className="w-3.5 h-3.5 text-blue-500 opacity-80" />
          </div>
          <span className="text-2xl font-black tracking-tighter leading-none">
            {(data.conversationsScanned || 0).toLocaleString()}
          </span>
        </div>

        {/* Card 3: Lead Velocity */}
        <div className="p-4 rounded-xl bg-card border border-border/40 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Lead Growth Velocity
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500 opacity-80" />
          </div>
          <span
            className={cn(
              "text-2xl font-black tracking-tighter leading-none",
              data.leadVelocity >= 0
                ? "text-emerald-500"
                : "text-destructive",
            )}
          >
            {data.leadVelocity >= 0 ? "+" : ""}
            {data.leadVelocity}%
          </span>
        </div>

        {/* Card 4: Average Intent Rating */}
        <div className="p-4 rounded-xl bg-card border border-border/40 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Match Confidence
            </span>
            <Brain className="w-3.5 h-3.5 text-purple-500 opacity-80" />
          </div>
          <div className="flex items-baseline gap-0.5 leading-none">
            <span className="text-2xl font-black tracking-tighter">
              {data.averageIntentScore}
            </span>
            <span className="text-xs font-bold text-muted-foreground">
              /100
            </span>
          </div>
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
          <CardContent className="px-4 pb-4 pt-4">
            {(() => {
              const rows = timeRange === "7d"
                ? data.leadsOverTime.slice(-7)
                : data.leadsOverTime;
              return (
                <div className="h-44">
                  <LeadVolumeChart data={rows} />
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
                  COMPARING: "bg-amber-400",
                  NEUTRAL: "bg-slate-400",
                };
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest">
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
              if (totalLeads === 0) {
                return <p className="text-xs text-muted-foreground italic py-4 text-center">Awaiting Ingestion data...</p>;
              }
              return (
                <div className="h-44">
                  <IngestionActivityChart data={hours} />
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

                  return (
                    <div
                      key={source.platform}
                      className="flex flex-col p-3 rounded-xl bg-muted/30 border border-border/40 justify-between"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div
                          className={cn(
                            "px-1.5 py-0.5 rounded text-xs font-black tracking-widest border",
                            colors[source.platform],
                          )}
                        >
                          {source.platform}
                        </div>
                        <span className="text-xs font-black tracking-widest text-muted-foreground">
                          {source.count} Leads
                        </span>
                      </div>
                      
                      <div className="mt-2.5 flex items-baseline gap-1">
                        <span className="text-xl font-black tracking-tighter leading-none">
                          {source.percentage}%
                        </span>
                        <span className="text-xs font-bold text-muted-foreground uppercase leading-none">
                          Efficiency
                        </span>
                      </div>
                      
                      <Progress
                        value={source.percentage}
                        className="mt-3 h-1 bg-muted"
                      />
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
        <div className="p-4 rounded-xl bg-card border border-border/40 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Intent Precision Score
            </span>
            <Percent className="w-3.5 h-3.5 text-emerald-500 opacity-85" />
          </div>
          <span className="text-2xl font-black tracking-tighter leading-none">
            {data.averageIntentScore}%
          </span>
        </div>

        {/* ROI - Conv Rate */}
        <div className="p-4 rounded-xl bg-card border border-border/40 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Outreach Conversion Rate
            </span>
            <Target className="w-3.5 h-3.5 text-primary opacity-85" />
          </div>
          <span className="text-2xl font-black tracking-tighter leading-none">
            {data.leadConversionRate}%
          </span>
        </div>

        {/* ROI - Marketing Budget Saved */}
        <div className="p-4 rounded-xl bg-card border border-border/40 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Estimated Marketing Value ROI
            </span>
            <BadgeDollarSign className="w-3.5 h-3.5 text-emerald-500 opacity-85" />
          </div>
          <span className="text-2xl font-black tracking-tighter leading-none">
            $
            {Math.round(
              (data.usageStats?.leads?.used || 0) * 15 +
                (data.llmUsage?.totals?.requestCount || 0) * 0.5,
            )}
          </span>
        </div>
      </div>

      {/* Row 5: Top Product Spotlight */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="border border-border/40 bg-card/60 shadow-xl shadow-black/5">
          <CardHeader className="py-3 px-6 border-b border-border/40">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
              <Award className="w-3.5 h-3.5 text-primary" /> Top Performer Product
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
                  <p className="text-xs font-black uppercase tracking-widest text-primary">
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

const leadVolumeChartConfig = {
  count: {
    label: "Leads",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function LeadVolumeChart({ data }: { data: { date: string; count: number }[] }) {
  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    count: d.count,
  }));

  return (
    <ChartContainer config={leadVolumeChartConfig} className="h-full w-full">
      <AreaChart
        data={chartData}
        margin={{
          left: 0,
          right: 0,
          top: 10,
          bottom: 0,
        }}
      >
        <CartesianGrid vertical={false} className="stroke-border/40" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          className="text-[10px] font-black uppercase tracking-widest fill-muted-foreground/75"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          className="text-[10px] font-black fill-muted-foreground/75"
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <defs>
          <linearGradient id="fillVolume" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          dataKey="count"
          type="natural"
          fill="url(#fillVolume)"
          stroke="var(--color-count)"
          strokeWidth={1.5}
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  );
}

const ingestionChartConfig = {
  count: {
    label: "Mentions",
    color: "hsl(37.9, 92.1%, 50.2%)",
  },
} satisfies ChartConfig;

export function IngestionActivityChart({ data }: { data: { hour: number; count: number }[] }) {
  const chartData = data.map((d) => ({
    hour: d.hour,
    count: d.count,
  }));

  return (
    <ChartContainer config={ingestionChartConfig} className="h-full w-full">
      <BarChart
        data={chartData}
        margin={{
          left: 0,
          right: 0,
          top: 10,
          bottom: 0,
        }}
      >
        <CartesianGrid vertical={false} className="stroke-border/40" />
        <XAxis
          dataKey="hour"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          className="text-[10px] font-black uppercase tracking-widest fill-muted-foreground/75"
          tickFormatter={(value) => {
            const h = parseInt(value);
            if (h === 0) return "12 AM";
            if (h === 6) return "6 AM";
            if (h === 12) return "12 PM";
            if (h === 18) return "6 PM";
            if (h === 23) return "11 PM";
            return "";
          }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          className="text-[10px] font-black fill-muted-foreground/75"
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar
          dataKey="count"
          fill="var(--color-count)"
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
