"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { 
  Terminal, 
  Search, 
  Loader2, 
  Code, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  Copy,
  Check,
  Globe,
  Clock,
  X,
  Layers,
  FileJson,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/lib/constants";

interface LogUser {
  email: string;
  username: string;
}

interface RequestLog {
  id: string;
  requestId: string;
  method: string;
  url: string;
  ip: string | null;
  userId: string | null;
  user?: LogUser | null;
  statusCode: number | null;
  requestBody: any | null;
  responseBody: any | null;
  headers: any | null;
  query: any | null;
  params: any | null;
  error: string | null;
  createdAt: string;
}

interface LogStats {
  total: number;
  successCount: number;
  clientErrorCount: number;
  serverErrorCount: number;
  errorCount: number;
}

const TIME_RANGES = [
  { value: "all", label: "All Time" },
  { value: "15m", label: "Last 15m" },
  { value: "1h", label: "Last 1h" },
  { value: "24h", label: "Last 24h" },
  { value: "7d", label: "Last 7d" },
  { value: "30d", label: "Last 30d" },
];

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [stats, setStats] = useState<LogStats>({
    total: 0,
    successCount: 0,
    clientErrorCount: 0,
    serverErrorCount: 0,
    errorCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState("25");
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("ALL");
  const [statusGroup, setStatusGroup] = useState("ALL");
  const [timeRange, setTimeRange] = useState("all");
  const [errorsOnly, setErrorsOnly] = useState(false);

  // Sheet detail state
  const [selectedLog, setSelectedLog] = useState<RequestLog | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit,
      });

      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (selectedMethod !== "ALL") params.set("method", selectedMethod);
      if (statusGroup !== "ALL") params.set("statusGroup", statusGroup);
      if (errorsOnly) params.set("hasError", "true");
      if (timeRange !== "all") params.set("timeRange", timeRange);

      const res = await fetch(`${API_URL}/admin/logs?${params.toString()}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
        }
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, selectedMethod, statusGroup, errorsOnly, timeRange]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleCopy = (text: string, key: string, label = "Copied to clipboard") => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(label);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const handleOpenSheet = (log: RequestLog) => {
    setSelectedLog(log);
    setIsSheetOpen(true);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedMethod("ALL");
    setStatusGroup("ALL");
    setTimeRange("all");
    setErrorsOnly(false);
    setPage(1);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (selectedMethod !== "ALL") count++;
    if (statusGroup !== "ALL") count++;
    if (timeRange !== "all") count++;
    if (errorsOnly) count++;
    return count;
  }, [searchQuery, selectedMethod, statusGroup, timeRange, errorsOnly]);

  const getMethodBadge = (method: string) => {
    const m = method.toUpperCase();
    switch (m) {
      case "GET":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-mono text-[10px] font-black">{m}</Badge>;
      case "POST":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-mono text-[10px] font-black">{m}</Badge>;
      case "PUT":
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-mono text-[10px] font-black">{m}</Badge>;
      case "PATCH":
        return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20 font-mono text-[10px] font-black">{m}</Badge>;
      case "DELETE":
        return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 font-mono text-[10px] font-black">{m}</Badge>;
      default:
        return <Badge variant="outline" className="font-mono text-[10px] font-black">{m}</Badge>;
    }
  };

  const getStatusBadge = (status: number | null) => {
    if (!status) return <Badge variant="outline" className="font-mono text-[10px]">Unknown</Badge>;
    if (status >= 200 && status < 300) {
      return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/25 font-mono text-[11px] font-bold">{status}</Badge>;
    }
    if (status >= 300 && status < 400) {
      return <Badge className="bg-sky-500/10 text-sky-500 border-sky-500/25 font-mono text-[11px] font-bold">{status}</Badge>;
    }
    if (status >= 400 && status < 500) {
      return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/25 font-mono text-[11px] font-bold">{status}</Badge>;
    }
    if (status >= 500) {
      return <Badge className="bg-rose-500/15 text-rose-500 border-rose-500/30 font-mono text-[11px] font-bold">{status}</Badge>;
    }
    return <Badge variant="outline" className="font-mono text-[11px] font-bold">{status}</Badge>;
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const diff = (Date.now() - d.getTime()) / 1000;
      if (diff < 60) return "just now";
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header & Filters */}
      <div className="space-y-4 border-b border-border/40 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
              <Terminal className="w-5 h-5 sm:w-6 sm:h-6 text-primary" /> API Logs
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Inspect HTTP calls, response codes, payloads, and error traces.
            </p>
          </div>

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1 self-start sm:self-auto"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filters ({activeFiltersCount})
            </Button>
          )}
        </div>

        {/* Top Select Menus & Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search path, request ID, IP, or error..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-8 h-9 bg-card/60 border-border/50 text-xs sm:text-sm focus-visible:ring-0 focus-visible:border-primary/40 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Method Select */}
          <Select
            value={selectedMethod}
            onValueChange={(val) => {
              setSelectedMethod(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[130px] bg-card/60 border-border/50 text-xs font-medium">
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Methods</SelectItem>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="PATCH">PATCH</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Select */}
          <Select
            value={errorsOnly ? "errors" : statusGroup}
            onValueChange={(val) => {
              if (val === "errors") {
                setErrorsOnly(true);
                setStatusGroup("ALL");
              } else {
                setErrorsOnly(false);
                setStatusGroup(val);
              }
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[150px] bg-card/60 border-border/50 text-xs font-medium">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="2xx">🟢 2xx Success</SelectItem>
              <SelectItem value="3xx">🔵 3xx Redirect</SelectItem>
              <SelectItem value="4xx">🟡 4xx Client Error</SelectItem>
              <SelectItem value="5xx">🔴 5xx Server Error</SelectItem>
              <SelectItem value="errors">🔥 Errors Only</SelectItem>
            </SelectContent>
          </Select>

          {/* Time Range Select */}
          <Select
            value={timeRange}
            onValueChange={(val) => {
              setTimeRange(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[130px] bg-card/60 border-border/50 text-xs font-medium">
              <Clock className="w-3 h-3 mr-1.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Time" />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/40 bg-card/40 backdrop-blur-sm p-3.5">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total</div>
          <div className="mt-1 text-xl font-black text-foreground">{stats.total.toLocaleString()}</div>
        </Card>

        <Card className="border-border/40 bg-card/40 backdrop-blur-sm p-3.5">
          <div className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 2xx Success
          </div>
          <div className="mt-1 text-xl font-black text-emerald-500">{stats.successCount.toLocaleString()}</div>
        </Card>

        <Card className="border-border/40 bg-card/40 backdrop-blur-sm p-3.5">
          <div className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> 4xx Client Errors
          </div>
          <div className="mt-1 text-xl font-black text-amber-500">{stats.clientErrorCount.toLocaleString()}</div>
        </Card>

        <Card className="border-border/40 bg-card/40 backdrop-blur-sm p-3.5">
          <div className="text-[11px] font-semibold text-rose-500 uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> 5xx Server Errors
          </div>
          <div className="mt-1 text-xl font-black text-rose-500">{stats.serverErrorCount.toLocaleString()}</div>
        </Card>
      </div>

      {/* Logs Table */}
      <Card className="border-border/40 overflow-hidden bg-card/60 backdrop-blur-sm">
        <CardContent className="p-0">
          {loading && logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2.5">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Loading request logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-muted/40 flex items-center justify-center mx-auto text-muted-foreground">
                <Terminal className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">No logs found</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No requests matched your filter criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead className="w-[75px] font-bold text-xs">Method</TableHead>
                    <TableHead className="w-[80px] font-bold text-xs">Status</TableHead>
                    <TableHead className="font-bold text-xs">Path</TableHead>
                    <TableHead className="w-[130px] font-bold text-xs">Client IP</TableHead>
                    <TableHead className="w-[140px] font-bold text-xs">User</TableHead>
                    <TableHead className="w-[120px] font-bold text-xs">Request ID</TableHead>
                    <TableHead className="w-[100px] font-bold text-xs text-right">Time</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const isError = (log.statusCode && log.statusCode >= 400) || !!log.error;
                    return (
                      <TableRow
                        key={log.id}
                        onClick={() => handleOpenSheet(log)}
                        className={`cursor-pointer border-border/30 transition-colors group ${
                          isError ? "hover:bg-rose-500/5 bg-rose-500/[0.02]" : "hover:bg-muted/40"
                        }`}
                      >
                        {/* Method */}
                        <TableCell className="py-2.5">
                          {getMethodBadge(log.method)}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-2.5">
                          {getStatusBadge(log.statusCode)}
                        </TableCell>

                        {/* URL Path */}
                        <TableCell className="py-2.5">
                          <div className="flex flex-col min-w-0 max-w-[320px]">
                            <span className="font-mono text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                              {log.url}
                            </span>
                            {log.error && (
                              <span className="text-[11px] text-destructive truncate flex items-center gap-1 mt-0.5">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                {log.error}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* IP */}
                        <TableCell className="py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {log.ip || "—"}
                        </TableCell>

                        {/* User */}
                        <TableCell className="py-2.5">
                          {log.user ? (
                            <span className="text-xs font-semibold text-foreground truncate max-w-[130px] block">
                              {log.user.username}
                            </span>
                          ) : log.userId ? (
                            <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[100px] block">
                              {log.userId.slice(0, 8)}...
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/70">Guest</span>
                          )}
                        </TableCell>

                        {/* Request ID */}
                        <TableCell className="py-2.5 font-mono text-[11px] text-muted-foreground/80">
                          {log.requestId.slice(0, 10)}...
                        </TableCell>

                        {/* Time */}
                        <TableCell className="py-2.5 text-right">
                          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                            {formatRelativeTime(log.createdAt)}
                          </span>
                        </TableCell>

                        {/* Arrow */}
                        <TableCell className="py-2.5 text-right pr-3">
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all inline-block" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Bottom Pagination & Summary Controls */}
          <div className="p-3.5 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/10">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>
                Showing {logs.length > 0 ? (page - 1) * parseInt(limit, 10) + 1 : 0} -{" "}
                {Math.min(page * parseInt(limit, 10), stats.total)} of {stats.total} logs
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px]">Rows:</span>
                <Select
                  value={limit}
                  onValueChange={(val) => {
                    setLimit(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-7 w-[70px] bg-background/50 border-border/50 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <AdminPagination
              page={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Slide-over Detail Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto custom-scrollbar p-0 bg-background/95 backdrop-blur-xl border-l border-border/40">
          {selectedLog && (
            <div className="flex flex-col min-h-full">
              {/* Minimal Sheet Header */}
              <SheetHeader className="p-4 sm:p-5 border-b border-border/40 bg-card/40 sticky top-0 z-10 backdrop-blur-md">
                <div className="flex items-center justify-between gap-3 pr-8">
                  <div className="flex items-center gap-2 min-w-0">
                    {getMethodBadge(selectedLog.method)}
                    {getStatusBadge(selectedLog.statusCode)}
                    <SheetTitle className="text-xs sm:text-sm font-mono font-bold text-foreground truncate">
                      {selectedLog.url}
                    </SheetTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs font-semibold gap-1.5 border-border/50 hover:bg-muted shrink-0"
                    onClick={() => handleCopy(JSON.stringify(selectedLog, null, 2), "raw-json", "JSON log copied")}
                  >
                    {copiedKey === "raw-json" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <FileJson className="w-3.5 h-3.5" />}
                    Copy JSON
                  </Button>
                </div>
              </SheetHeader>

              {/* Sheet Body: Payloads & Errors Only */}
              <div className="p-5 space-y-5 flex-1">
                {/* Error Banner */}
                {selectedLog.error && (
                  <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider">
                      <ShieldAlert className="w-4 h-4 text-destructive shrink-0" />
                      <span>Execution Error</span>
                    </div>
                    <p className="font-mono text-xs bg-background/80 p-2.5 rounded-lg border border-destructive/20 text-destructive-foreground overflow-x-auto whitespace-pre-wrap">
                      {selectedLog.error}
                    </p>
                  </div>
                )}

                {/* Request Payload */}
                {selectedLog.requestBody && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Code className="w-3.5 h-3.5 text-primary" /> Request Body
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] px-2"
                        onClick={() => handleCopy(
                          typeof selectedLog.requestBody === "string" ? selectedLog.requestBody : JSON.stringify(selectedLog.requestBody, null, 2),
                          "req-body",
                          "Request body copied"
                        )}
                      >
                        <Copy className="w-3 h-3 mr-1" /> Copy
                      </Button>
                    </div>
                    <pre className="p-3.5 rounded-xl bg-card/90 border border-border/40 font-mono text-xs text-foreground overflow-x-auto max-h-72 custom-scrollbar">
                      {typeof selectedLog.requestBody === "string"
                        ? selectedLog.requestBody
                        : JSON.stringify(selectedLog.requestBody, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Response Payload */}
                {selectedLog.responseBody && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Code className="w-3.5 h-3.5 text-emerald-500" /> Response Body
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] px-2"
                        onClick={() => handleCopy(
                          typeof selectedLog.responseBody === "string" ? selectedLog.responseBody : JSON.stringify(selectedLog.responseBody, null, 2),
                          "res-body",
                          "Response body copied"
                        )}
                      >
                        <Copy className="w-3 h-3 mr-1" /> Copy
                      </Button>
                    </div>
                    <pre className="p-3.5 rounded-xl bg-card/90 border border-border/40 font-mono text-xs text-foreground overflow-x-auto max-h-80 custom-scrollbar">
                      {typeof selectedLog.responseBody === "string"
                        ? selectedLog.responseBody
                        : JSON.stringify(selectedLog.responseBody, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Query Parameters */}
                {selectedLog.query && Object.keys(selectedLog.query).length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-primary" /> Query Parameters
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] px-2"
                        onClick={() => handleCopy(JSON.stringify(selectedLog.query, null, 2), "query", "Query params copied")}
                      >
                        <Copy className="w-3 h-3 mr-1" /> Copy
                      </Button>
                    </div>
                    <pre className="p-3 rounded-xl bg-muted/40 border border-border/40 font-mono text-xs text-foreground overflow-x-auto custom-scrollbar">
                      {JSON.stringify(selectedLog.query, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Request Headers */}
                {selectedLog.headers && typeof selectedLog.headers === "object" && Object.keys(selectedLog.headers).length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-muted-foreground" /> Headers
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] px-2"
                        onClick={() => handleCopy(JSON.stringify(selectedLog.headers, null, 2), "headers", "Headers copied")}
                      >
                        <Copy className="w-3 h-3 mr-1" /> Copy
                      </Button>
                    </div>
                    <div className="rounded-xl border border-border/40 overflow-hidden bg-card/40">
                      <div className="max-h-48 overflow-y-auto custom-scrollbar p-3 font-mono text-xs space-y-1.5">
                        {Object.entries(selectedLog.headers).map(([key, value]) => (
                          <div key={key} className="flex items-start gap-2 py-0.5 border-b border-border/20 last:border-0">
                            <span className="font-bold text-primary shrink-0 min-w-[130px] select-all">{key}:</span>
                            <span className="text-muted-foreground break-all select-all">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Empty State if No Payloads/Error */}
                {!selectedLog.error && !selectedLog.requestBody && !selectedLog.responseBody && !selectedLog.headers && !selectedLog.query && (
                  <div className="text-center py-12 text-muted-foreground text-xs">
                    No extra payload or error body recorded for this request.
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
