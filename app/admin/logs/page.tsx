"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { 
  Terminal, 
  Search, 
  RefreshCw, 
  Loader2, 
  ChevronRight, 
  ChevronDown,
  Code,
  ShieldAlert,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { API_URL } from "@/lib/constants";

interface RequestLog {
  id: string;
  requestId: string;
  method: string;
  url: string;
  ip: string | null;
  userId: string | null;
  statusCode: number | null;
  requestBody: any | null;
  responseBody: any | null;
  headers: any | null;
  error: string | null;
  createdAt: string;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("ALL");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
      });
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedMethod !== 'ALL') params.set('method', selectedMethod);

      const res = await fetch(`${API_URL}/admin/logs?${params.toString()}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, selectedMethod]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const toggleExpand = (id: string) => {
    setExpandedLogId(prev => prev === id ? null : id);
  };

  const getMethodBadgeVariant = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'secondary';
      case 'POST': return 'default';
      case 'PUT':
      case 'PATCH': return 'outline';
      case 'DELETE': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusBadge = (status: number | null) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    if (status >= 200 && status < 300) {
      return <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-mono text-[10px]">{status}</Badge>;
    }
    if (status >= 400 && status < 500) {
      return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-mono text-[10px]">{status}</Badge>;
    }
    if (status >= 500) {
      return <Badge variant="destructive" className="font-mono text-[10px]">{status}</Badge>;
    }
    return <Badge variant="outline" className="font-mono text-[10px]">{status}</Badge>;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <Terminal className="w-6 h-6 text-primary" /> API Request Logs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Audit incoming API queries, route traffic, response statuses, and payloads.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchLogs()} disabled={loading} className="self-start sm:self-auto gap-2">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border/40">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by URL path, Request ID, or IP..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9 bg-background/50"
              />
            </div>
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {['ALL', 'GET', 'POST', 'PUT', 'DELETE'].map((method) => (
                <Button
                  key={method}
                  variant={selectedMethod === method ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedMethod(method);
                    setPage(1);
                  }}
                  className="text-xs h-9 px-3"
                >
                  {method}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle>Network Traffic Stream</CardTitle>
          <CardDescription>Real-time audit log of HTTP calls made to the Knivik platform.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && logs.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              No API request logs found matching the selected criteria.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-border/40 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>URL Path</TableHead>
                      <TableHead>Client IP</TableHead>
                      <TableHead>Request ID</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => {
                      const isExpanded = expandedLogId === log.id;
                      return (
                        <Fragment key={log.id}>
                          <TableRow 
                            className="cursor-pointer hover:bg-muted/40 transition-colors"
                            onClick={() => toggleExpand(log.id)}
                          >
                            <TableCell>
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getMethodBadgeVariant(log.method)} className="text-[10px] font-mono font-black uppercase">
                                {log.method}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(log.statusCode)}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-foreground max-w-[280px] truncate">
                              {log.url}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {log.ip || "—"}
                            </TableCell>
                            <TableCell className="font-mono text-[10px] text-muted-foreground/80 max-w-[140px] truncate">
                              {log.requestId}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </TableCell>
                          </TableRow>

                          {isExpanded && (
                            <TableRow key={`${log.id}-details`} className="bg-muted/20 hover:bg-muted/20">
                              <TableCell colSpan={7} className="p-4">
                                <div className="space-y-4 text-xs">
                                  {log.error && (
                                    <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-center gap-2">
                                      <AlertCircle className="w-4 h-4 shrink-0" />
                                      <span>{log.error}</span>
                                    </div>
                                  )}

                                  <div className="grid gap-4 md:grid-cols-2">
                                    {log.requestBody && (
                                      <div className="space-y-1.5">
                                        <span className="font-bold text-muted-foreground flex items-center gap-1.5">
                                          <Code className="w-3.5 h-3.5" /> Request Body:
                                        </span>
                                        <pre className="p-3 rounded-lg bg-background/80 border border-border/40 font-mono text-[11px] overflow-x-auto max-h-48 custom-scrollbar">
                                          {typeof log.requestBody === 'string' 
                                            ? log.requestBody 
                                            : JSON.stringify(log.requestBody, null, 2)}
                                        </pre>
                                      </div>
                                    )}

                                    {log.responseBody && (
                                      <div className="space-y-1.5">
                                        <span className="font-bold text-muted-foreground flex items-center gap-1.5">
                                          <Code className="w-3.5 h-3.5" /> Response Body:
                                        </span>
                                        <pre className="p-3 rounded-lg bg-background/80 border border-border/40 font-mono text-[11px] overflow-x-auto max-h-48 custom-scrollbar">
                                          {typeof log.responseBody === 'string'
                                            ? log.responseBody 
                                            : JSON.stringify(log.responseBody, null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                  </div>

                                  {log.headers && (
                                    <div className="space-y-1.5">
                                      <span className="font-bold text-muted-foreground">Headers:</span>
                                      <pre className="p-3 rounded-lg bg-background/80 border border-border/40 font-mono text-[11px] overflow-x-auto max-h-32 custom-scrollbar">
                                        {JSON.stringify(log.headers, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })}
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
