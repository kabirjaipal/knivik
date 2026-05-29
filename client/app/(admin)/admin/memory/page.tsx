"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Cpu, Server, Users, Wrench, ShieldCheck, ShieldAlert, Clock, ArrowUpRight, Zap, Loader2 } from "lucide-react";
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

  const fetchMemoryStats = async () => {
    setLoading(true);
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
    }
  };

  useEffect(() => {
    fetchMemoryStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isSafeToDeploy = (data?.queue.length === 0) && (data?.queue.activeCount === 0) && (!data?.queue.isProcessing);

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-black tracking-tight text-foreground border-b border-border/40 pb-4">Memory Monitor</h2>

      {/* Deployment Status & Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Status Banner */}
        <div className={`p-4 border rounded-xl flex items-center gap-3 lg:col-span-2 transition-all ${
          isSafeToDeploy 
            ? 'bg-success/5 border-success/20 text-success' 
            : 'bg-warning/5 border-warning/20 text-warning-foreground'
        }`}>
          {isSafeToDeploy ? (
            <ShieldCheck className="h-5 w-5 text-success shrink-0" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-warning shrink-0" />
          )}
          <div className="min-w-0">
            <h2 className="text-xs font-bold uppercase tracking-wider">Deployment Status</h2>
            <p className="text-xs font-medium mt-0.5 truncate">
              {isSafeToDeploy ? 'Safe to deploy - Queue idle' : 'Scrapers running - Hold deployment'}
            </p>
          </div>
        </div>

        {/* Scraper Queue Counter */}
        <div className="border border-border/60 bg-card rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Scraper Queue</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black">{data?.queue.activeCount || 0}</span>
              <span className="text-[10px] text-muted-foreground">/ {data?.queue.length || 0} pending</span>
            </div>
          </div>
          <Server className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* WebSocket Connections */}
        <div className="border border-border/60 bg-card rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">WebSockets</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black">{data?.sockets.activeConnections || 0}</span>
              <span className="text-[10px] text-muted-foreground">active client{data?.sockets.activeConnections === 1 ? '' : 's'}</span>
            </div>
          </div>
          <Users className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Details Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Jobs */}
        <div className="border border-border/60 bg-card rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-border/30 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Scraper Queue</h3>
            {data?.queue.isProcessing && (
              <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-500 border-amber-500/20 py-0 px-1">
                Processing
              </Badge>
            )}
          </div>
          <div className="overflow-x-auto min-h-[160px]">
            {data?.queue.jobs && data.queue.jobs.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                    <th className="pb-1.5">Job</th>
                    <th className="pb-1.5">Product</th>
                    <th className="pb-1.5">User</th>
                    <th className="pb-1.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.queue.jobs.map((job) => (
                    <tr key={job.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                      <td className="py-2 font-mono text-[10px]">
                        <span className="font-bold text-foreground truncate block max-w-[80px]" title={job.id}>{job.id}</span>
                        <span className="text-[8px] text-muted-foreground block">{new Date(job.addedAt).toLocaleTimeString()}</span>
                      </td>
                      <td className="py-2">
                        <span className="font-semibold text-foreground truncate block max-w-[100px]" title={job.data.productName}>{job.data.productName}</span>
                      </td>
                      <td className="py-2">
                        <span className="text-[10px] text-muted-foreground block truncate max-w-[80px]" title={job.data.userName}>{job.data.userName}</span>
                      </td>
                      <td className="py-2 text-right">
                        <Badge variant="outline" className={`text-[8px] font-bold px-1.5 py-0 ${
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
              <div className="flex flex-col items-center justify-center min-h-[160px] text-center">
                <Server className="h-6 w-6 text-muted-foreground/30 mb-1" />
                <p className="text-xs font-bold text-muted-foreground">Queue is empty</p>
                <p className="text-[10px] text-muted-foreground/80 mt-0.5">No scraping jobs active.</p>
              </div>
            )}
          </div>
        </div>

        {/* Live Socket.IO Clients */}
        <div className="border border-border/60 bg-card rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-border/30 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">WebSocket Clients</h3>
          </div>
          <div className="overflow-x-auto min-h-[160px]">
            {data?.sockets.clients && data.sockets.clients.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                    <th className="pb-1.5">User</th>
                    <th className="pb-1.5">Socket ID</th>
                    <th className="pb-1.5 text-right">Rooms</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sockets.clients.map((client) => (
                    <tr key={client.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                      <td className="py-2">
                        <span className="font-bold text-foreground block">{client.username}</span>
                        <span className="text-[9px] text-muted-foreground block truncate max-w-[120px]">{client.email}</span>
                      </td>
                      <td className="py-2 font-mono text-[10px] text-muted-foreground">{client.id}</td>
                      <td className="py-2 text-right space-y-0.5">
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
                          <span className="text-[10px] text-muted-foreground italic">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[160px] text-center">
                <Users className="h-6 w-6 text-muted-foreground/30 mb-1" />
                <p className="text-xs font-bold text-muted-foreground">No active sockets</p>
                <p className="text-[10px] text-muted-foreground/80 mt-0.5">No connected dashboard clients.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Engine Ingestion Health */}
      <div className="border border-border/60 bg-card rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-border/30 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Scraper IP Health</h3>
          <Badge variant="outline" className={`text-[9px] font-bold px-1.5 py-0 ${
            data?.ipProtection.overall.needsBackoff 
              ? 'bg-destructive/15 text-destructive border-destructive/20 animate-pulse' 
              : 'bg-success/15 text-success border-success/20'
          }`}>
            {data?.ipProtection.overall.needsBackoff ? 'Back-off active' : 'Normal Operations'}
          </Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                <th className="pb-1.5">Platform</th>
                <th className="pb-1.5">Total Requests</th>
                <th className="pb-1.5">Rate Limit Hits</th>
                <th className="pb-1.5">Last Request Time</th>
                <th className="pb-1.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {/* Reddit row */}
              <tr className="border-b border-border/40 hover:bg-muted/10">
                <td className="py-2.5 font-bold">Reddit</td>
                <td className="py-2.5">{data?.ipProtection.reddit.requestCount || 0}</td>
                <td className="py-2.5">{data?.ipProtection.reddit.rateLimitHits || 0}</td>
                <td className="py-2.5 text-muted-foreground">
                  {data?.ipProtection.reddit.lastRequestTime && data.ipProtection.reddit.lastRequestTime > 0 
                    ? new Date(data.ipProtection.reddit.lastRequestTime).toLocaleTimeString() 
                    : 'N/A'}
                </td>
                <td className="py-2.5 text-right">
                  <Badge variant="outline" className={`text-[9px] font-bold px-1.5 py-0 ${
                    data?.ipProtection.reddit.rateLimitHits && data.ipProtection.reddit.rateLimitHits > 0
                      ? 'bg-destructive/10 text-destructive border-destructive/20'
                      : 'bg-success/15 text-success border-success/20'
                  }`}>
                    {data?.ipProtection.reddit.rateLimitHits && data.ipProtection.reddit.rateLimitHits > 0 ? 'Throttled' : 'Healthy'}
                  </Badge>
                </td>
              </tr>
              {/* HN row */}
              <tr className="border-b border-border/40 hover:bg-muted/10">
                <td className="py-2.5 font-bold">HackerNews</td>
                <td className="py-2.5">{data?.ipProtection.hackernews.requestCount || 0}</td>
                <td className="py-2.5">{data?.ipProtection.hackernews.rateLimitHits || 0}</td>
                <td className="py-2.5 text-muted-foreground">
                  {data?.ipProtection.hackernews.lastRequestTime && data.ipProtection.hackernews.lastRequestTime > 0 
                    ? new Date(data.ipProtection.hackernews.lastRequestTime).toLocaleTimeString() 
                    : 'N/A'}
                </td>
                <td className="py-2.5 text-right">
                  <Badge variant="outline" className={`text-[9px] font-bold px-1.5 py-0 ${
                    data?.ipProtection.hackernews.rateLimitHits && data.ipProtection.hackernews.rateLimitHits > 0
                      ? 'bg-destructive/10 text-destructive border-destructive/20'
                      : 'bg-success/15 text-success border-success/20'
                  }`}>
                    {data?.ipProtection.hackernews.rateLimitHits && data.ipProtection.hackernews.rateLimitHits > 0 ? 'Throttled' : 'Healthy'}
                  </Badge>
                </td>
              </tr>
              {/* Twitter row */}
              <tr className="border-b border-border/40 hover:bg-muted/10">
                <td className="py-2.5 font-bold">Twitter</td>
                <td className="py-2.5">{data?.ipProtection.twitter?.requestCount || 0}</td>
                <td className="py-2.5">{data?.ipProtection.twitter?.rateLimitHits || 0}</td>
                <td className="py-2.5 text-muted-foreground">
                  {data?.ipProtection.twitter?.lastRequestTime && data.ipProtection.twitter.lastRequestTime > 0 
                    ? new Date(data.ipProtection.twitter.lastRequestTime).toLocaleTimeString() 
                    : 'N/A'}
                </td>
                <td className="py-2.5 text-right">
                  <Badge variant="outline" className={`text-[9px] font-bold px-1.5 py-0 ${
                    data?.ipProtection.twitter?.rateLimitHits && data.ipProtection.twitter.rateLimitHits > 0
                      ? 'bg-destructive/10 text-destructive border-destructive/20'
                      : 'bg-success/15 text-success border-success/20'
                  }`}>
                    {data?.ipProtection.twitter?.rateLimitHits && data.ipProtection.twitter.rateLimitHits > 0 ? 'Throttled' : 'Healthy'}
                  </Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
