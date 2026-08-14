"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Search,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Loader2,
  Filter,
} from "lucide-react"
import { toast } from "sonner"
import { API_URL } from "@/lib/constants"

interface RequestLog {
  id: string;
  requestId: string;
  method: string;
  url: string;
  ip: string | null;
  userId: string | null;
  user?: { username: string; email: string } | null;
  statusCode: number | null;
  requestBody: unknown | null;
  responseBody: unknown | null;
  headers: unknown | null;
  query: unknown | null;
  params: unknown | null;
  error: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

const METHOD_STYLES: Record<string, string> = {
  GET: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  POST: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  PUT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  DELETE: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  PATCH: "bg-violet-500/10 text-violet-400 border-violet-500/20",
}

function getMethodStyle(method: string) {
  return METHOD_STYLES[method.toUpperCase()] ?? "bg-muted text-muted-foreground border-border"
}

function getStatusStyle(code: number | null) {
  if (!code) return "bg-muted text-muted-foreground border-border"
  if (code >= 200 && code < 300) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  if (code >= 300 && code < 400) return "bg-sky-500/10 text-sky-400 border-sky-500/20"
  if (code >= 400 && code < 500) return "bg-amber-500/10 text-amber-400 border-amber-500/20"
  return "bg-rose-500/10 text-rose-400 border-rose-500/20"
}

function renderJson(val: unknown): string {
  if (val === null || val === undefined) return "{}"
  if (typeof val === "string") {
    try { return JSON.stringify(JSON.parse(val), null, 2) }
    catch { return val }
  }
  try { return JSON.stringify(val, null, 2) }
  catch { return String(val) }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<RequestLog[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, totalCount: 0, totalPages: 1 })
  const [search, setSearch] = useState("")
  const [activeSearch, setActiveSearch] = useState("")
  const [method, setMethod] = useState("")
  const [statusCode, setStatusCode] = useState("")
  const [onlyErrors, setOnlyErrors] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<RequestLog | null>(null)

  const fetchLogs = useCallback(async (targetPage = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: targetPage.toString(),
        limit: pagination.limit.toString(),
        search: activeSearch,
        method,
        statusCode,
        onlyErrors: onlyErrors.toString(),
      })
      const res = await fetch(`${API_URL}/admin/logs?${params}`, { credentials: "include" })
      const result = await res.json()
      if (result.success) {
        setLogs(result.data)
        setPagination(result.pagination)
      }
    } catch {
      toast.error("Failed to load request logs.")
    } finally {
      setLoading(false)
    }
  }, [activeSearch, method, statusCode, onlyErrors, pagination.limit])

  useEffect(() => { fetchLogs(1) }, [activeSearch, method, statusCode, onlyErrors])

  const handleSearchSubmit = (e: React.FormEvent) => { e.preventDefault(); setActiveSearch(search) }
  const handleReset = () => { setSearch(""); setActiveSearch(""); setMethod(""); setStatusCode(""); setOnlyErrors(false) }

  const hasFilters = activeSearch || method || statusCode || onlyErrors

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black tracking-tight text-foreground border-b border-border/40 pb-4">API Request Logs</h2>

      {/* Filters */}
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search URL, IP, user..."
            className="w-full pl-9 pr-4 py-2 bg-muted/20 border border-border/40 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/50 text-xs transition-all"
          />
        </div>

        {/* Method */}
        <div className="relative">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            style={{ colorScheme: "dark" }}
            className="pl-3 pr-8 py-2 bg-muted/20 border border-border/40 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-primary text-xs appearance-none cursor-pointer"
          >
            <option value="" className="bg-popover">All Methods</option>
            <option value="GET" className="bg-popover">GET</option>
            <option value="POST" className="bg-popover">POST</option>
            <option value="PUT" className="bg-popover">PUT</option>
            <option value="DELETE" className="bg-popover">DELETE</option>
            <option value="PATCH" className="bg-popover">PATCH</option>
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/50 pointer-events-none" />
        </div>

        {/* Status */}
        <div className="relative">
          <select
            value={statusCode}
            onChange={(e) => setStatusCode(e.target.value)}
            style={{ colorScheme: "dark" }}
            className="pl-3 pr-8 py-2 bg-muted/20 border border-border/40 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-primary text-xs appearance-none cursor-pointer"
          >
            <option value="" className="bg-popover">All Status</option>
            <option value="200" className="bg-popover">200 OK</option>
            <option value="201" className="bg-popover">201 Created</option>
            <option value="4xx" className="bg-popover">4xx Errors</option>
            <option value="400" className="bg-popover">400 Bad Request</option>
            <option value="401" className="bg-popover">401 Unauthorized</option>
            <option value="403" className="bg-popover">403 Forbidden</option>
            <option value="404" className="bg-popover">404 Not Found</option>
            <option value="5xx" className="bg-popover">5xx Server Errors</option>
            <option value="500" className="bg-popover">500 Internal Error</option>
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/50 pointer-events-none" />
        </div>

        {/* Errors Only */}
        <label className="flex items-center gap-1.5 cursor-pointer px-3 py-2 bg-muted/20 border border-border/40 rounded-xl">
          <input
            type="checkbox"
            checked={onlyErrors}
            onChange={(e) => setOnlyErrors(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-border/60 text-primary focus:ring-1 focus:ring-primary/40 cursor-pointer"
          />
          <span className="text-[11px] font-semibold text-foreground/80 flex items-center gap-1 whitespace-nowrap">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            Errors Only
          </span>
        </label>

        {/* Actions */}
        {hasFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 text-xs font-semibold border border-border/40 hover:bg-muted/50 rounded-xl transition-all cursor-pointer whitespace-nowrap"
          >
            Reset
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all cursor-pointer"
        >
          Search
        </button>
      </form>

      {/* Table */}
      <Card className="border-border/40 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border/40 bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-5">Method</th>
                  <th className="py-3 px-5">User</th>
                  <th className="py-3 px-5">Endpoint</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">IP</th>
                  <th className="py-3 px-5">Time</th>
                  <th className="py-3 px-5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20 text-xs font-medium text-foreground/80">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-16">
                      <div className="flex justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-muted-foreground text-xs">
                      No logs found for the current filters.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className={`hover:bg-muted/10 transition-colors ${log.statusCode && log.statusCode >= 400 ? "bg-rose-500/[0.02]" : ""}`}
                    >
                      <td className="py-3 px-5">
                        <span className={`px-2 py-0.5 text-[10px] font-black rounded border uppercase tracking-wider ${getMethodStyle(log.method)}`}>
                          {log.method}
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        {log.user ? (
                          <div className="flex flex-col leading-tight">
                            <span className="font-semibold text-foreground">{log.user.username}</span>
                            <span className="text-[10px] text-muted-foreground">{log.user.email}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60 italic">Anonymous</span>
                        )}
                      </td>
                      <td className="py-3 px-5 font-mono text-[11px] truncate max-w-[200px] lg:max-w-[300px]" title={log.url}>
                        {log.url}
                      </td>
                      <td className="py-3 px-5">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getStatusStyle(log.statusCode)}`}>
                          {log.statusCode ?? "—"}
                        </span>
                      </td>
                      <td className="py-3 px-5 font-mono text-muted-foreground text-[11px]">
                        {log.ip || "—"}
                      </td>
                      <td className="py-3 px-5 font-mono text-muted-foreground text-[11px] whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="py-3 px-5 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 bg-muted hover:bg-primary hover:text-primary-foreground border border-border/40 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border/40 bg-muted/10">
              <span className="text-xs text-muted-foreground">
                {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchLogs(pagination.page - 1)}
                  disabled={pagination.page <= 1 || loading}
                  className="p-1.5 border border-border/40 hover:bg-muted rounded-lg disabled:opacity-40 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-semibold px-2">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchLogs(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages || loading}
                  className="p-1.5 border border-border/40 hover:bg-muted rounded-lg disabled:opacity-40 cursor-pointer transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Detail Drawer */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div onClick={() => setSelectedLog(null)} className="absolute inset-0 bg-background/80" />
          <div className="relative w-full max-w-xl bg-card border-l border-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <div>
                <h3 className="font-black text-base">Request Details</h3>
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{selectedLog.requestId}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-1.5 hover:bg-muted rounded-lg transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Overview */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-muted/20 rounded-xl border border-border/30">
                <div>
                  <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Method</p>
                  <span className={`px-2 py-0.5 text-[10px] font-black rounded border uppercase ${getMethodStyle(selectedLog.method)}`}>
                    {selectedLog.method}
                  </span>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Status</p>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getStatusStyle(selectedLog.statusCode)}`}>
                    {selectedLog.statusCode ?? "—"}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground mb-1">URL</p>
                  <span className="font-mono text-[11px] break-all">{selectedLog.url}</span>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground mb-1">IP</p>
                  <span className="font-mono text-[11px]">{selectedLog.ip || "—"}</span>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Time</p>
                  <span className="font-mono text-[11px]">{formatDate(selectedLog.createdAt)}</span>
                </div>
                {selectedLog.user && (
                  <div className="col-span-2">
                    <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground mb-1 flex items-center gap-1">
                      <User className="w-3 h-3" /> User
                    </p>
                    <div className="bg-black/20 p-2.5 rounded-lg border border-border/30">
                      <p className="font-bold text-sm">{selectedLog.user.username}</p>
                      <p className="text-xs text-muted-foreground">{selectedLog.user.email}</p>
                      <p className="text-[9px] font-mono text-muted-foreground/60 mt-1">{selectedLog.userId}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Error */}
              {selectedLog.error && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl">
                  <p className="text-[9px] uppercase tracking-wider font-black text-rose-400 mb-2">Error</p>
                  <pre className="font-mono text-xs text-rose-300 whitespace-pre-wrap break-all bg-black/30 p-3 rounded-lg leading-relaxed">
                    {selectedLog.error}
                  </pre>
                </div>
              )}

              {/* JSON Sections */}
              {[
                { label: "Headers", value: selectedLog.headers },
                { label: "Query Params", value: selectedLog.query && Object.keys(selectedLog.query as object).length > 0 ? selectedLog.query : null },
                { label: "Request Body", value: selectedLog.requestBody && Object.keys(selectedLog.requestBody as object).length > 0 ? selectedLog.requestBody : null },
                { label: "Response Body", value: selectedLog.responseBody },
              ].map(({ label, value }) =>
                value ? (
                  <div key={label} className="space-y-1.5">
                    <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">{label}</p>
                    <pre className="p-3 bg-muted/40 rounded-xl font-mono text-[10px] overflow-x-auto max-h-[160px] border border-border/30 whitespace-pre-wrap leading-relaxed">
                      {renderJson(value)}
                    </pre>
                  </div>
                ) : null
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
