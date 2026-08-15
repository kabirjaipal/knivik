"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, DollarSign, Cpu, Clock, Layers, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { API_URL } from "@/lib/constants";

interface ModelStat {
  modelId: string;
  requestCount: number;
  tokens: number;
  cost: number;
}

interface TelemetryLog {
  id: string;
  action: string;
  model: string;
  tokens: number;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  cost: number;
  status: string;
  errorMessage?: string | null;
  user?: { username: string; email: string } | null;
  product?: { name: string } | null;
  createdAt: string;
}

interface UsageStats {
  totalCost: number;
  statsByModel: ModelStat[];
  recentLogs: TelemetryLog[];
  logs: TelemetryLog[];
  totals: {
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    avgLatencyMs: number;
  };
}

export default function AdminUsagePage() {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsage = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/llm-usage?page=${page}&limit=30`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setUsage(data.data);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const totalCost = usage?.totalCost ?? 0;
  const statsByModel = usage?.statsByModel ?? [];
  const logs = usage?.logs ?? usage?.recentLogs ?? [];
  const totals = usage?.totals ?? { totalTokens: 0, inputTokens: 0, outputTokens: 0, avgLatencyMs: 0 };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">LLM Usage & Telemetry</h1>
          <p className="text-sm text-muted-foreground mt-1">Live token consumption, cost monitoring, and AI inference latency.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchUsage()} disabled={loading} className="self-start sm:self-auto gap-2">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">Estimated Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">${totalCost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground mt-1">Aggregated model runtime cost</p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Tokens</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">{totals.totalTokens.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{totals.inputTokens.toLocaleString()} in / {totals.outputTokens.toLocaleString()} out</p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Average Latency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">{totals.avgLatencyMs} ms</div>
            <p className="text-xs text-muted-foreground mt-1">End-to-end inference speed</p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Active Models</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">{statsByModel.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Distinct deployed LLMs</p>
          </CardContent>
        </Card>
      </div>

      {/* Model Distribution */}
      {statsByModel.length > 0 && (
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Model Distribution & Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {statsByModel.map((model) => (
                <div key={model.modelId} className="p-4 rounded-xl border border-border/40 bg-card flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-foreground truncate">{model.modelId}</span>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold">{model.requestCount} calls</Badge>
                  </div>
                  <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-border/20">
                    <span className="text-xs text-muted-foreground font-mono">{model.tokens.toLocaleString()} tokens</span>
                    <span className="text-sm font-black text-primary">${model.cost.toFixed(4)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Telemetry Stream */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle>Inference Telemetry Stream</CardTitle>
          <CardDescription>Granular logs of every AI generation, prompt token count, and latency.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && logs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No LLM telemetry records found yet.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-border/40 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>User / Product</TableHead>
                      <TableHead>Tokens (In/Out)</TableHead>
                      <TableHead>Latency</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge
                            variant={log.status === 'success' ? 'default' : 'destructive'}
                            className="text-[10px] uppercase font-bold"
                          >
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-foreground text-xs">{log.action}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{log.model}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.product?.name || log.user?.username || log.user?.email || "System"}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          {log.inputTokens} / {log.outputTokens}
                          <span className="text-muted-foreground text-[10px] ml-1">({log.tokens})</span>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{log.latencyMs}ms</TableCell>
                        <TableCell className="text-xs font-mono font-bold text-foreground">
                          ${log.cost.toFixed(6)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <AdminPagination
                page={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
