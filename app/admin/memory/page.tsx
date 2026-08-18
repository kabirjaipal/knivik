"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { 
  Cpu, 
  Server, 
  Users, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Activity, 
  RefreshCw, 
  RotateCcw,
  Zap, 
  Loader2,
  HardDrive,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { API_URL } from "@/lib/constants";

interface QueueJob {
  id: string;
  name: string;
  data: {
    productId: string | null;
    productName: string;
    userId: string | null;
    userName: string;
    userEmail: string | null;
  };
  addedAt: number;
  finishedOn: number | null;
  status: 'completed' | 'processing';
}

interface SocketClient {
  id: string;
  userId: string;
  username: string;
  email: string;
  rooms: string[];
}

interface RateLimitStatus {
  requestCount: number;
  rateLimitHits: number;
  lastRequestTime: number;
  platform: string;
}

interface MemoryData {
  systemMemory?: {
    rssMb: number;
    heapTotalMb: number;
    heapUsedMb: number;
    externalMb: number;
    heapUsagePercent: number;
    uptimeSeconds: number;
    nodeVersion: string;
  };
  queue: {
    length: number;
    activeCount: number;
    isProcessing: boolean;
    jobs: QueueJob[];
  };
  sockets: {
    activeConnections: number;
    clients: SocketClient[];
  };
  ipProtection: {
    reddit: RateLimitStatus;
    hackernews: RateLimitStatus;
    twitter: RateLimitStatus;
    overall: {
      totalRequests: number;
      totalRateLimitHits: number;
      needsBackoff: boolean;
    };
  };
}

export default function AdminMemoryPage() {
  const [data, setData] = useState<MemoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  const fetchMemoryStats = useCallback(async (showToast = false) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/memory`, {
        credentials: "include",
      });
      const result = await res.json();
      if (result.success) {
        setData(result.data);
        if (showToast) toast.success("Telemetry updated");
      } else {
        toast.error("Failed to fetch memory data");
      }
    } catch {
      toast.error("Network error fetching telemetry");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleResetCounters = async () => {
    setResetting(true);
    try {
      const res = await fetch(`${API_URL}/admin/memory`, {
        method: "POST",
        credentials: "include",
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Rate limiting and IP protection counters reset!");
        fetchMemoryStats();
      } else {
        toast.error("Failed to reset counters");
      }
    } catch {
      toast.error("Network error resetting counters");
    } finally {
      setResetting(false);
    }
  };

  useEffect(() => {
    fetchMemoryStats();
  }, [fetchMemoryStats]);

  const isSafeToDeploy = Boolean(
    (data?.queue?.length === 0) &&
    (data?.queue?.activeCount === 0) &&
    (!data?.queue?.isProcessing)
  );

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hrs = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (days > 0) return `${days}d ${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    return `${mins}m ${secs}s`;
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const sysMem = data?.systemMemory;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <h2 className="text-xl font-black tracking-tight text-foreground">Memory Monitor</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleResetCounters} 
            disabled={resetting} 
            className="gap-1.5 text-xs border-border/40"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            Reset IP Counters
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchMemoryStats(true)} 
            disabled={loading} 
            className="gap-1.5 text-xs border-border/40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Top Level Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Banner */}
        <div className={`p-4 border rounded-xl flex items-center gap-3 transition-all ${
          isSafeToDeploy 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
            : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
        }`}>
          {isSafeToDeploy ? (
            <ShieldCheck className="h-6 w-6 shrink-0" />
          ) : (
            <ShieldAlert className="h-6 w-6 shrink-0" />
          )}
          <div className="min-w-0">
            <h2 className="text-xs font-bold uppercase tracking-wider">Deployment Status</h2>
            <p className="text-xs font-semibold mt-0.5 truncate text-foreground">
              {isSafeToDeploy ? 'Safe to deploy - Queue idle' : 'Scrapers active - Hold deploy'}
            </p>
          </div>
        </div>

        {/* Node Heap Card */}
        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">V8 Heap Used</CardTitle>
            <Cpu className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">
              {sysMem ? `${sysMem.heapUsedMb} MB` : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {sysMem ? `of ${sysMem.heapTotalMb} MB allocated (${sysMem.heapUsagePercent}%)` : "—"}
            </p>
            {sysMem && (
              <Progress value={sysMem.heapUsagePercent} className="h-1.5 mt-2.5" />
            )}
          </CardContent>
        </Card>

        {/* Scraper Queue Counter */}
        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Scraper Queue</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-foreground">{data?.queue.activeCount || 0}</span>
              <span className="text-xs text-muted-foreground">/ {data?.queue.length || 0} pending</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data?.queue.isProcessing ? "Queue is actively processing" : "Queue is idle"}
            </p>
          </CardContent>
        </Card>

        {/* Server Uptime */}
        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Server Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">
              {sysMem ? formatUptime(sysMem.uptimeSeconds) : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Node {sysMem?.nodeVersion || "v24.x"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Details Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scraper Queue */}
        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Scraper Batch Queue</CardTitle>
              <CardDescription className="text-xs">Background collection jobs and status</CardDescription>
            </div>
            {data?.queue.isProcessing && (
              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20 py-0.5 px-2">
                Processing
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto min-h-[160px]">
              {data?.queue.jobs && data.queue.jobs.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                      <th className="pb-2">Job</th>
                      <th className="pb-2">Product</th>
                      <th className="pb-2">User</th>
                      <th className="pb-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.queue.jobs.map((job) => (
                      <tr key={job.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 font-mono text-[10px]">
                          <span className="font-bold text-foreground truncate block max-w-[90px]" title={job.id}>{job.id}</span>
                          <span className="text-[9px] text-muted-foreground block">{new Date(job.addedAt).toLocaleTimeString()}</span>
                        </td>
                        <td className="py-2.5">
                          <span className="font-semibold text-foreground truncate block max-w-[120px]" title={job.data.productName}>{job.data.productName}</span>
                        </td>
                        <td className="py-2.5">
                          <span className="text-[11px] text-muted-foreground block truncate max-w-[100px]" title={job.data.userName}>{job.data.userName}</span>
                        </td>
                        <td className="py-2.5 text-right">
                          <Badge variant="outline" className={`text-[9px] font-bold px-1.5 py-0 ${
                            job.status === 'processing' 
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                              : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          }`}>
                            {job.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Server className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs font-bold text-muted-foreground">Queue is idle</p>
                  <p className="text-[11px] text-muted-foreground/80 mt-0.5">No scraping batch jobs currently executing.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Live WebSockets */}
        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Connected Dashboard Sockets</CardTitle>
              <CardDescription className="text-xs">Live clients receiving SSE/scan updates</CardDescription>
            </div>
            <Badge variant="secondary" className="text-[10px]">
              {data?.sockets.activeConnections || 0} active
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto min-h-[160px]">
              {data?.sockets.clients && data.sockets.clients.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                      <th className="pb-2">User</th>
                      <th className="pb-2">Client ID</th>
                      <th className="pb-2 text-right">Channels</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sockets.clients.map((client) => (
                      <tr key={client.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                        <td className="py-2.5">
                          <span className="font-bold text-foreground block">{client.username}</span>
                          <span className="text-[10px] text-muted-foreground block truncate max-w-[130px]">{client.email}</span>
                        </td>
                        <td className="py-2.5 font-mono text-[10px] text-muted-foreground">{client.id}</td>
                        <td className="py-2.5 text-right space-y-0.5">
                          {client.rooms.length > 0 ? (
                            client.rooms.map((room) => (
                              <Badge 
                                key={room} 
                                variant="outline" 
                                className="text-[8px] font-semibold bg-primary/5 text-primary border-primary/20 ml-1 inline-flex"
                              >
                                {room.replace('product:', 'P: ').replace('user:', 'U: ')}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">Default</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs font-bold text-muted-foreground">No active sockets</p>
                  <p className="text-[11px] text-muted-foreground/80 mt-0.5">No connected dashboard clients.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engine Ingestion IP Health */}
      <Card className="border-border/40">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Social Scraper IP Health & Rate Limiting</CardTitle>
            <CardDescription className="text-xs">Live request throttle counters and backoff prevention status</CardDescription>
          </div>
          <Badge 
            variant="outline" 
            className={`text-[10px] font-bold px-2 py-0.5 ${
              data?.ipProtection.overall.needsBackoff 
                ? 'bg-destructive/15 text-destructive border-destructive/20 animate-pulse' 
                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            }`}
          >
            {data?.ipProtection.overall.needsBackoff ? 'Back-off Active' : 'Normal Operations'}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                  <th className="pb-2">Platform</th>
                  <th className="pb-2">Total Requests</th>
                  <th className="pb-2">Rate Limit Hits</th>
                  <th className="pb-2">Last Request Time</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {/* Reddit */}
                <tr className="border-b border-border/20 hover:bg-muted/10">
                  <td className="py-3 font-bold text-foreground">Reddit</td>
                  <td className="py-3 font-mono">{data?.ipProtection.reddit.requestCount || 0}</td>
                  <td className="py-3 font-mono">{data?.ipProtection.reddit.rateLimitHits || 0}</td>
                  <td className="py-3 text-muted-foreground">
                    {data?.ipProtection.reddit.lastRequestTime && data.ipProtection.reddit.lastRequestTime > 0 
                      ? new Date(data.ipProtection.reddit.lastRequestTime).toLocaleTimeString() 
                      : 'N/A'}
                  </td>
                  <td className="py-3 text-right">
                    <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 ${
                      data?.ipProtection.reddit.rateLimitHits && data.ipProtection.reddit.rateLimitHits > 0
                        ? 'bg-destructive/10 text-destructive border-destructive/20'
                        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    }`}>
                      {data?.ipProtection.reddit.rateLimitHits && data.ipProtection.reddit.rateLimitHits > 0 ? 'Throttled' : 'Healthy'}
                    </Badge>
                  </td>
                </tr>
                {/* HackerNews */}
                <tr className="border-b border-border/20 hover:bg-muted/10">
                  <td className="py-3 font-bold text-foreground">HackerNews</td>
                  <td className="py-3 font-mono">{data?.ipProtection.hackernews.requestCount || 0}</td>
                  <td className="py-3 font-mono">{data?.ipProtection.hackernews.rateLimitHits || 0}</td>
                  <td className="py-3 text-muted-foreground">
                    {data?.ipProtection.hackernews.lastRequestTime && data.ipProtection.hackernews.lastRequestTime > 0 
                      ? new Date(data.ipProtection.hackernews.lastRequestTime).toLocaleTimeString() 
                      : 'N/A'}
                  </td>
                  <td className="py-3 text-right">
                    <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 ${
                      data?.ipProtection.hackernews.rateLimitHits && data.ipProtection.hackernews.rateLimitHits > 0
                        ? 'bg-destructive/10 text-destructive border-destructive/20'
                        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    }`}>
                      {data?.ipProtection.hackernews.rateLimitHits && data.ipProtection.hackernews.rateLimitHits > 0 ? 'Throttled' : 'Healthy'}
                    </Badge>
                  </td>
                </tr>
                {/* Twitter */}
                <tr className="border-b border-border/20 hover:bg-muted/10">
                  <td className="py-3 font-bold text-foreground">Twitter / X</td>
                  <td className="py-3 font-mono">{data?.ipProtection.twitter?.requestCount || 0}</td>
                  <td className="py-3 font-mono">{data?.ipProtection.twitter?.rateLimitHits || 0}</td>
                  <td className="py-3 text-muted-foreground">
                    {data?.ipProtection.twitter?.lastRequestTime && data.ipProtection.twitter.lastRequestTime > 0 
                      ? new Date(data.ipProtection.twitter.lastRequestTime).toLocaleTimeString() 
                      : 'N/A'}
                  </td>
                  <td className="py-3 text-right">
                    <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 ${
                      data?.ipProtection.twitter?.rateLimitHits && data.ipProtection.twitter.rateLimitHits > 0
                        ? 'bg-destructive/10 text-destructive border-destructive/20'
                        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    }`}>
                      {data?.ipProtection.twitter?.rateLimitHits && data.ipProtection.twitter.rateLimitHits > 0 ? 'Throttled' : 'Healthy'}
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
