"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Terminal, 
  Search, 
  Filter, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  Database,
  RefreshCw,
  Clock,
  X,
  User,
  Activity,
  Layers
} from "lucide-react"

interface RequestLog {
  id: string;
  requestId: string;
  method: string;
  url: string;
  userAgent: string | null;
  ip: string | null;
  userId: string | null;
  user?: {
    username: string;
    email: string;
  } | null;
  statusCode: number | null;
  responseTime: number | null;
  requestBody: any | null;
  responseBody: any | null;
  headers: any | null;
  query: any | null;
  params: any | null;
  error: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<RequestLog[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 1
  })
  
  // Filters State
  const [search, setSearch] = useState("")
  const [activeSearch, setActiveSearch] = useState("")
  const [method, setMethod] = useState("")
  const [statusCode, setStatusCode] = useState("")
  const [onlyErrors, setOnlyErrors] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<RequestLog | null>(null)

  // Fetch function
  const fetchLogs = useCallback(async (targetPage = 1) => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page: targetPage.toString(),
        limit: pagination.limit.toString(),
        search: activeSearch,
        method,
        statusCode,
        onlyErrors: onlyErrors.toString()
      })
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/logs?${queryParams}`, {
        credentials: 'include'
      })
      
      const result = await res.json()
      if (result.success) {
        setLogs(result.data)
        setPagination(result.pagination)
      }
    } catch (err) {
      console.error('Failed to fetch request logs:', err)
    } finally {
      setLoading(false)
    }
  }, [activeSearch, method, statusCode, onlyErrors, pagination.limit])

  useEffect(() => {
    fetchLogs(1)
  }, [activeSearch, method, statusCode, onlyErrors])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setActiveSearch(search)
  }

  const handleResetFilters = () => {
    setSearch("")
    setActiveSearch("")
    setMethod("")
    setStatusCode("")
    setOnlyErrors(false)
  }

  // Method color helper
  const getMethodStyles = (methodStr: string) => {
    const norm = methodStr.toUpperCase()
    if (norm === 'GET') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    if (norm === 'POST') return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    if (norm === 'PUT') return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    if (norm === 'DELETE') return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    return 'bg-muted text-muted-foreground border-border'
  }

  // Status Code helper
  const getStatusStyles = (code: number | null) => {
    if (!code) return 'bg-muted text-muted-foreground border-border'
    if (code >= 200 && code < 300) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    if (code >= 300 && code < 400) return 'bg-sky-500/10 text-sky-400 border-sky-500/20'
    if (code >= 400 && code < 500) return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    return 'bg-rose-500/10 text-rose-400 border-rose-500/20 font-black'
  }

  // Safe JSON formatting helper
  const renderJson = (val: any) => {
    if (val === null || val === undefined) return "{}";
    
    // If it's a double-stringified JSON, parse it first
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return val;
      }
    }
    
    try {
      return JSON.stringify(val, null, 2);
    } catch {
      return String(val);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2.5">
            <Terminal className="w-8 h-8 text-primary" />
            API Request Logs
          </h1>
          <p className="text-muted-foreground mt-1">Real-time inspection of API invocations, response delays, and server failures.</p>
        </div>
        <button
          onClick={() => fetchLogs(pagination.page)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-border/40 hover:bg-muted/50 rounded-xl transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stream
        </button>
      </div>

      {/* Filters Card */}
      <Card className="border-border/40 bg-card">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Search input */}
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search URL, IP, user name, user email or errors..."
                  className="w-full pl-9 pr-4 py-2 bg-muted/20 border border-border/40 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/50 text-xs transition-all"
                />
              </div>

              {/* Method select */}
              <div className="relative">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                  className="w-full pl-3 pr-8 py-2 bg-muted/20 border border-border/40 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary text-xs appearance-none cursor-pointer"
                >
                  <option value="" className="bg-[#0a0a0c] text-foreground">All HTTP Methods</option>
                  <option value="GET" className="bg-[#0a0a0c] text-foreground">GET</option>
                  <option value="POST" className="bg-[#0a0a0c] text-foreground">POST</option>
                  <option value="PUT" className="bg-[#0a0a0c] text-foreground">PUT</option>
                  <option value="DELETE" className="bg-[#0a0a0c] text-foreground">DELETE</option>
                  <option value="PATCH" className="bg-[#0a0a0c] text-foreground">PATCH</option>
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
              </div>

              {/* Status Code select */}
              <div className="relative">
                <select
                  value={statusCode}
                  onChange={(e) => setStatusCode(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                  className="w-full pl-3 pr-8 py-2 bg-muted/20 border border-border/40 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary text-xs appearance-none cursor-pointer"
                >
                  <option value="" className="bg-[#0a0a0c] text-foreground">All Status Codes</option>
                  <option value="200" className="bg-[#0a0a0c] text-foreground">200 OK</option>
                  <option value="201" className="bg-[#0a0a0c] text-foreground">201 Created</option>
                  <option value="4xx" className="bg-[#0a0a0c] text-foreground">4xx Client Errors</option>
                  <option value="400" className="bg-[#0a0a0c] text-foreground">400 Bad Request</option>
                  <option value="401" className="bg-[#0a0a0c] text-foreground">401 Unauthorized</option>
                  <option value="403" className="bg-[#0a0a0c] text-foreground">403 Forbidden</option>
                  <option value="404" className="bg-[#0a0a0c] text-foreground">404 Not Found</option>
                  <option value="5xx" className="bg-[#0a0a0c] text-foreground">5xx Server Errors</option>
                  <option value="500" className="bg-[#0a0a0c] text-foreground">500 Internal Server Error</option>
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
              </div>
            </div>

            {/* Bottom Row Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2.5 border-t border-border/20">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={onlyErrors}
                  onChange={(e) => setOnlyErrors(e.target.checked)}
                  className="w-4 h-4 rounded-sm border-border/60 bg-muted/20 text-primary focus:ring-1 focus:ring-primary/40 cursor-pointer"
                />
                <span className="text-[11px] font-semibold text-foreground/90 group-hover:text-foreground transition-colors flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  Show Failures / Errors Only
                </span>
              </label>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-bold border border-border/40 hover:bg-muted/50 rounded-xl transition-all cursor-pointer text-center"
                >
                  Reset Parameters
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-4.5 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-xl hover:bg-primary/95 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-center"
                >
                  Apply Query
                </button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Logs Table Container */}
      <Card className="border-border/40 overflow-hidden bg-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border/40 bg-muted/40 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  <th className="py-4 px-6">Method</th>
                  <th className="py-4 px-6">User (Account)</th>
                  <th className="py-4 px-6">API Endpoint</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Response Latency</th>
                  <th className="py-4 px-6">IP Origin</th>
                  <th className="py-4 px-6">Recorded At</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20 text-xs font-medium text-foreground/80">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground animate-pulse">
                      Streaming database request metrics logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      No matching log files located in request history.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr 
                      key={log.id} 
                      className={`hover:bg-muted/10 transition-colors ${
                        log.statusCode && log.statusCode >= 400 ? 'bg-rose-500/[0.02]' : ''
                      }`}
                    >
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 text-[10px] font-black rounded-md border uppercase tracking-wider ${getMethodStyles(log.method)}`}>
                          {log.method}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {log.user ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground">{log.user.username}</span>
                            <span className="text-[10px] text-muted-foreground">{log.user.email}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60 italic font-semibold">Anonymous / Guest</span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-mono text-[11px] truncate max-w-[200px] lg:max-w-[320px]" title={log.url}>
                        {log.url}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${getStatusStyles(log.statusCode)}`}>
                          {log.statusCode || 'PENDING'}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono text-muted-foreground">
                        {log.responseTime ? `${log.responseTime}ms` : '—'}
                      </td>
                      <td className="py-4 px-6 font-mono text-muted-foreground">
                        {log.ip || '—'}
                      </td>
                      <td className="py-4 px-6 font-mono text-muted-foreground">
                        {new Date(log.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-3 py-1 bg-muted hover:bg-primary hover:text-primary-foreground text-foreground border border-border/40 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          View Payload
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Toolbar */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/40 bg-muted/10">
              <span className="text-xs text-muted-foreground font-semibold">
                Showing logs {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} entries
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchLogs(pagination.page - 1)}
                  disabled={pagination.page <= 1 || loading}
                  className="p-1.5 border border-border/40 hover:bg-muted rounded-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold px-3">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchLogs(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages || loading}
                  className="p-1.5 border border-border/40 hover:bg-muted rounded-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Payload Overlay Drawer */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop overlay */}
          <div 
            onClick={() => setSelectedLog(null)}
            className="absolute inset-0 bg-background/90 transition-opacity"
          />
          
          {/* Drawer slide-in panel */}
          <div className="relative w-full max-w-2xl bg-card border-l border-border h-full flex flex-col shadow-2xl p-6 overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/40 mb-6">
              <div>
                <h3 className="font-black text-lg flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  Log Diagnostic Details
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">ID: {selectedLog.requestId}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 hover:bg-muted rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable details panel */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
              
              {/* Request Overview Grid */}
              <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-border/30">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block mb-1">HTTP Method</span>
                  <span className={`px-2 py-0.5 text-[10px] font-black rounded-md border uppercase tracking-wider ${getMethodStyles(selectedLog.method)}`}>
                    {selectedLog.method}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block mb-1">Status Code</span>
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${getStatusStyles(selectedLog.statusCode)}`}>
                    {selectedLog.statusCode || 'PENDING'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block mb-1">Target Path URL</span>
                  <span className="font-mono text-[11px] text-foreground font-semibold break-all">{selectedLog.url}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block mb-1">Client IP</span>
                  <span className="font-mono text-[11px]">{selectedLog.ip || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block mb-1">Response Delay</span>
                  <span className="font-mono text-[11px] text-foreground font-semibold">{selectedLog.responseTime ? `${selectedLog.responseTime} ms` : '—'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    Caller User Account
                  </span>
                  {selectedLog.user ? (
                    <div className="flex flex-col bg-black/20 p-2.5 rounded-lg border border-border/30">
                      <span className="font-bold text-sm text-foreground">{selectedLog.user.username}</span>
                      <span className="text-xs text-muted-foreground">{selectedLog.user.email}</span>
                      <span className="text-[9px] font-mono text-muted-foreground/60 mt-1">ID: {selectedLog.userId}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic font-semibold">Anonymous / Guest</span>
                  )}
                </div>
                {selectedLog.userAgent && (
                  <div className="col-span-2">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block mb-1 flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5" />
                      Client User-Agent
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">{selectedLog.userAgent}</span>
                  </div>
                )}
              </div>

              {/* Server Exception block */}
              {selectedLog.error && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-black text-rose-400 block">Server Stack Trace / Exception Error</span>
                  <p className="font-mono text-xs text-rose-300 whitespace-pre-wrap break-all leading-relaxed bg-black/30 p-3 rounded-lg">{selectedLog.error}</p>
                </div>
              )}

              {/* Headers Payload JSON */}
              {selectedLog.headers && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-wider font-black text-muted-foreground flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    Security & Client Headers Payload
                  </span>
                  <pre className="p-4 bg-muted/40 rounded-xl font-mono text-[10px] text-foreground overflow-x-auto max-h-[150px] border border-border/30 whitespace-pre-wrap">
                    {renderJson(selectedLog.headers)}
                  </pre>
                </div>
              )}

              {/* Query Params Payload JSON */}
              {selectedLog.query && Object.keys(selectedLog.query).length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-wider font-black text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    HTTP URI Query Parameters
                  </span>
                  <pre className="p-4 bg-muted/40 rounded-xl font-mono text-[10px] text-foreground overflow-x-auto max-h-[150px] border border-border/30 whitespace-pre-wrap">
                    {renderJson(selectedLog.query)}
                  </pre>
                </div>
              )}

              {/* Request Body JSON */}
              {selectedLog.requestBody && Object.keys(selectedLog.requestBody).length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-wider font-black text-muted-foreground block">HTTP POST Request Body Payload</span>
                  <pre className="p-4 bg-muted/40 rounded-xl font-mono text-[10px] text-foreground overflow-x-auto max-h-[200px] border border-border/30 whitespace-pre-wrap">
                    {renderJson(selectedLog.requestBody)}
                  </pre>
                </div>
              )}

              {/* Response Body JSON */}
              {selectedLog.responseBody && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-wider font-black text-muted-foreground block">HTTP Response Data Body Payload</span>
                  <pre className="p-4 bg-muted/40 rounded-xl font-mono text-[10px] text-foreground overflow-x-auto max-h-[250px] border border-border/30 whitespace-pre-wrap">
                    {renderJson(selectedLog.responseBody)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
