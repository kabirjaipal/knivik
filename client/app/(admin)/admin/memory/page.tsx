"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Cpu, RefreshCw, Server, Users, Wrench, ShieldCheck, ShieldAlert, Clock, ArrowUpRight, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMemoryStats = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/memory`, {
        credentials: "include",
      });
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error("Failed to fetch memory data");
      }
    } catch (err) {
      toast.error("Network error fetching telemetry");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMemoryStats();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchMemoryStats();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative flex h-8 w-8 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-primary"></span>
        </div>
      </div>
    );
  }

  const isSafeToDeploy = (data?.queue.length === 0) && (data?.queue.activeCount === 0) && (!data?.queue.isProcessing);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div>
          <h1 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            Memory Telemetry Monitor
          </h1>
          <p className="text-xs text-muted-foreground">
            Real-time diagnostics of in-memory queues, active WebSockets, and scraping workers.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1 text-xs"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Stats
        </Button>
      </div>

      {/* Deployment Deployment Checker Card */}
      <div className={`p-4 border rounded-xl flex items-start gap-4 transition-all duration-300 ${
        isSafeToDeploy 
          ? 'bg-success/5 border-success/30 text-success' 
          : 'bg-warning/5 border-warning/30 text-warning-foreground'
      }`}>
        <div className={`p-2.5 rounded-lg shrink-0 ${
          isSafeToDeploy ? 'bg-success/10' : 'bg-warning/10'
        }`}>
          {isSafeToDeploy ? (
            <ShieldCheck className="h-6 w-6 text-success animate-pulse" />
          ) : (
            <ShieldAlert className="h-6 w-6 text-warning" />
          )}
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-bold leading-none">
            {isSafeToDeploy 
              ? 'Safe for Deployment' 
              : 'Hold Deployment: Active Jobs Detected'
            }
          </h2>
          <p className="text-xs opacity-90 leading-relaxed max-w-2xl">
            {isSafeToDeploy 
              ? 'No in-memory scraper queue items are being processed. It is completely safe to put the site into Maintenance Mode and trigger your production updates/migrations.' 
              : 'There are active scraper jobs currently pending or processing in the queue. Deploying now will drop in-memory state and cause scrapers to lose current progress. Wait until the queue length drops to 0!'
            }
          </p>
        </div>
      </div>

      {/* Primary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Scraper Queue Card */}
        <div className="border border-border/60 bg-card rounded-xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Scraper Job Queue</span>
            <Server className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black tracking-tight">{data?.queue.activeCount || 0}</h3>
              <span className="text-xs text-muted-foreground font-medium">active</span>
            </div>
            <div className="flex items-center justify-between gap-1.5 text-[10px] text-muted-foreground border-t border-border/20 pt-1.5">
              <div className="flex items-center gap-1">
                <span className="font-bold text-foreground">{data?.queue.length || 0}</span> pending in queue
              </div>
              <Badge variant="outline" className={`text-[9px] font-bold px-1 py-0 ${
                data?.queue.isProcessing 
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                  : 'bg-muted text-muted-foreground border-border/50'
              }`}>
                {data?.queue.isProcessing ? 'Processing' : 'Idle'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Live Socket.IO Card */}
        <div className="border border-border/60 bg-card rounded-xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Live WebSocket Channels</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black tracking-tight">{data?.sockets.activeConnections || 0}</h3>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
              real-time dashboard connections
            </div>
          </div>
        </div>

        {/* Crawler API Health Card */}
        <div className="border border-border/60 bg-card rounded-xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Scraping Health (IP Protection)</span>
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black tracking-tight">{data?.ipProtection.overall.totalRequests || 0}</h3>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className={`text-[10px] font-bold px-1.5 py-0.5 ${
                data?.ipProtection.overall.needsBackoff 
                  ? 'bg-destructive/15 text-destructive border-destructive/20 animate-pulse' 
                  : 'bg-success/15 text-success border-success/20'
              }`}>
                {data?.ipProtection.overall.needsBackoff ? 'Back-off Active' : 'Normal Operations'}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {data?.ipProtection.overall.totalRateLimitHits || 0} rate-limit flags
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Details Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scraper Job Queue Details */}
        <div className="border border-border/60 bg-card rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold leading-none">Scraper Queue Queue details</h3>
            <p className="text-[10px] text-muted-foreground mt-1">
              Active and recently processed scraping tasks currently in JS memory.
            </p>
          </div>

          <div className="overflow-x-auto min-h-[200px]">
            {data?.queue.jobs && data.queue.jobs.length > 0 ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                    <th className="pb-2">Job Details</th>
                    <th className="pb-2">Target Product</th>
                    <th className="pb-2">Triggered By</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.queue.jobs.map((job) => (
                    <tr key={job.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 font-mono text-[10px] space-y-0.5">
                        <div className="font-bold text-foreground truncate max-w-[110px]" title={job.id}>
                          {job.id}
                        </div>
                        <div className="text-[9px] text-muted-foreground flex items-center gap-1 capitalize">
                          <span>{job.name}</span>
                          <span className="text-muted-foreground/30">•</span>
                          <span className="flex items-center gap-0.5 text-[8px] font-sans">
                            <Clock className="h-2.5 w-2.5" />
                            {new Date(job.addedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5">
                        <div className="font-semibold text-foreground truncate max-w-[120px]" title={job.data.productName}>
                          {job.data.productName}
                        </div>
                        <div className="text-[9px] text-muted-foreground truncate max-w-[120px]" title={job.data.productId || ''}>
                          ID: {job.data.productId || 'N/A'}
                        </div>
                      </td>
                      <td className="py-2.5">
                        <div className="font-semibold text-foreground truncate max-w-[110px]" title={job.data.userName}>
                          {job.data.userName}
                        </div>
                        <div className="text-[9px] text-muted-foreground truncate max-w-[110px]" title={job.data.userEmail || ''}>
                          {job.data.userEmail || 'System Job'}
                        </div>
                      </td>
                      <td className="py-2.5 text-right">
                        <Badge variant="outline" className={`text-[9px] font-bold px-1.5 py-0 ${
                          job.status === 'processing' 
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                            : 'bg-success/15 text-success border-success/20'
                        }`}>
                          {job.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[200px] text-center space-y-2">
                <Server className="h-8 w-8 text-muted-foreground/40" />
                <div>
                  <h4 className="text-xs font-bold">Scraper Queue is Empty</h4>
                  <p className="text-[10px] text-muted-foreground max-w-xs mx-auto mt-0.5">
                    No leads or products are currently queued or being crawled.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Socket Connection Details */}
        <div className="border border-border/60 bg-card rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold leading-none">WebSocket Active Channels</h3>
            <p className="text-[10px] text-muted-foreground mt-1">
              Active clients currently listening to push events and leads updates.
            </p>
          </div>

          <div className="overflow-x-auto min-h-[200px]">
            {data?.sockets.clients && data.sockets.clients.length > 0 ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                    <th className="pb-2">User details</th>
                    <th className="pb-2">Socket ID</th>
                    <th className="pb-2 text-right">Subscriptions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sockets.clients.map((client) => (
                    <tr key={client.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 space-y-0.5">
                        <div className="font-bold text-foreground">{client.username}</div>
                        <div className="text-[9px] text-muted-foreground">{client.email}</div>
                      </td>
                      <td className="py-2.5 font-mono text-[10px] text-muted-foreground">
                        {client.id}
                      </td>
                      <td className="py-2.5 text-right space-y-1">
                        {client.rooms.length > 0 ? (
                          client.rooms.map((room) => (
                            <Badge 
                              key={room} 
                              variant="outline" 
                              className="text-[9px] font-semibold bg-primary/5 text-primary border-primary/20 ml-1 inline-flex"
                            >
                              {room.replace('product:', 'Product ').replace('user:', 'User ')}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[200px] text-center space-y-2">
                <Users className="h-8 w-8 text-muted-foreground/40" />
                <div>
                  <h4 className="text-xs font-bold">No Active Socket Connections</h4>
                  <p className="text-[10px] text-muted-foreground max-w-xs mx-auto mt-0.5">
                    No admins or users are currently browsing dashboard channels.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Third Party Crawler Telemetry details */}
      <div className="border border-border/60 bg-card rounded-xl p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold leading-none">Crawler Engine IP Health Status</h3>
          <p className="text-[10px] text-muted-foreground mt-1">
            Telemetry metrics of request count windows and 429 Rate Limit Hits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Reddit protection statistics */}
          <div className="border border-border/40 rounded-xl p-4 bg-muted/10 space-y-3">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-xs font-bold">Reddit Scraper</span>
              <Badge variant="outline" className={`text-[9px] font-bold px-1.5 py-0 ${
                data?.ipProtection.reddit.rateLimitHits && data.ipProtection.reddit.rateLimitHits > 0
                  ? 'bg-destructive/15 text-destructive border-destructive/20 animate-pulse'
                  : 'bg-success/15 text-success border-success/20'
              }`}>
                {data?.ipProtection.reddit.rateLimitHits && data.ipProtection.reddit.rateLimitHits > 0 ? 'Throttled' : 'Healthy'}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="space-y-1 border-r border-border/30">
                <div className="text-xs text-muted-foreground">Requests</div>
                <div className="text-base font-bold text-foreground">{data?.ipProtection.reddit.requestCount || 0}</div>
              </div>
              <div className="space-y-1 border-r border-border/30">
                <div className="text-xs text-muted-foreground">Limit Hits</div>
                <div className="text-base font-bold text-foreground">{data?.ipProtection.reddit.rateLimitHits || 0}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Last Request</div>
                <div className="text-[10px] font-bold text-foreground leading-none pt-1">
                  {data?.ipProtection.reddit.lastRequestTime && data.ipProtection.reddit.lastRequestTime > 0 
                    ? new Date(data.ipProtection.reddit.lastRequestTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : 'N/A'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* HackerNews protection statistics */}
          <div className="border border-border/40 rounded-xl p-4 bg-muted/10 space-y-3">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-xs font-bold">HackerNews Scraper</span>
              <Badge variant="outline" className={`text-[9px] font-bold px-1.5 py-0 ${
                data?.ipProtection.hackernews.rateLimitHits && data.ipProtection.hackernews.rateLimitHits > 0
                  ? 'bg-destructive/15 text-destructive border-destructive/20 animate-pulse'
                  : 'bg-success/15 text-success border-success/20'
              }`}>
                {data?.ipProtection.hackernews.rateLimitHits && data.ipProtection.hackernews.rateLimitHits > 0 ? 'Throttled' : 'Healthy'}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="space-y-1 border-r border-border/30">
                <div className="text-xs text-muted-foreground">Requests</div>
                <div className="text-base font-bold text-foreground">{data?.ipProtection.hackernews.requestCount || 0}</div>
              </div>
              <div className="space-y-1 border-r border-border/30">
                <div className="text-xs text-muted-foreground">Limit Hits</div>
                <div className="text-base font-bold text-foreground">{data?.ipProtection.hackernews.rateLimitHits || 0}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Last Request</div>
                <div className="text-[10px] font-bold text-foreground leading-none pt-1">
                  {data?.ipProtection.hackernews.lastRequestTime && data.ipProtection.hackernews.lastRequestTime > 0 
                    ? new Date(data.ipProtection.hackernews.lastRequestTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : 'N/A'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
