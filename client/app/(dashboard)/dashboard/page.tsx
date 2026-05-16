"use client"

import { useAuth } from "@/context/auth-context"
import {
  Radar, Activity, Clock, Brain, Flame, TrendingUp, CheckCircle2,
  BarChart2, Zap, Target, Package, ChevronRight, AlertCircle
} from "lucide-react"
import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { LeadCard, type LeadCardData, type LeadStatus } from "@/components/dashboard/LeadCard"

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterTab = 'ALL' | 'BUY_NOW' | 'COMPETITOR' | 'SEMANTIC' | 'SAVED'

interface ProductSummary {
  id: string
  name: string
  isActive: boolean
  _count?: { leads: number }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [leads, setLeads] = useState<LeadCardData[]>([])
  const [products, setProducts] = useState<ProductSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL')
  const [draftingLeadId, setDraftingLeadId] = useState<string | null>(null)
  const [draftedReplies, setDraftedReplies] = useState<Record<string, string>>({})
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({})
  const [llmUsage, setLlmUsage] = useState<{ totals: { requestCount: number } } | null>(null)

  const hasFetched = useRef(false)
  const lastUserId = useRef<string | null>(null)

  // ─── Data fetching ────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const api = process.env.NEXT_PUBLIC_API_URL
      const [leadsRes, productsRes, llmRes] = await Promise.all([
        fetch(`${api}/leads`, { credentials: 'include' }),
        fetch(`${api}/products`, { credentials: 'include' }),
        fetch(`${api}/analytics/llm`, { credentials: 'include' }),
      ])

      if (leadsRes.ok) {
        const data = await leadsRes.json()
        const fetched = (data.leads ?? []) as LeadCardData[]
        setLeads(fetched)
        const drafts: Record<string, string> = {}
        fetched.forEach(l => { if (l.replies?.length) drafts[l.id] = l.replies[0]!.generatedText })
        setDraftedReplies(drafts)
      }

      if (productsRes.ok) {
        const data = await productsRes.json()
        setProducts(data.products ?? [])
      }

      if (llmRes.ok) {
        const data = await llmRes.json()
        if (data.success) setLlmUsage(data.data)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading || !user) return
    if (hasFetched.current && lastUserId.current === user.id) return
    hasFetched.current = true
    lastUserId.current = user.id
    fetchAll()
  }, [user, authLoading, fetchAll])

  // ─── Lead actions ─────────────────────────────────────────────────────────

  const handleDraftReply = async (leadId: string) => {
    setDraftingLeadId(leadId)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${leadId}/reply`, { method: 'POST', credentials: 'include' })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setDraftedReplies(prev => ({ ...prev, [leadId]: data.generatedText }))
      setExpandedReplies(prev => ({ ...prev, [leadId]: true }))
    } catch (e) { console.error(e) }
    finally { setDraftingLeadId(null) }
  }

  const handleStatusChange = async (leadId: string, status: LeadStatus) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l))
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${leadId}/status`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(() => {})
  }

  const handleNotesChange = async (leadId: string, notes: string) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, notes } : l))
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${leadId}/notes`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    }).catch(() => {})
  }

  const handleFeedbackChange = async (leadId: string, feedback: number) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, feedback } : l))
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${leadId}/feedback`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback }),
    }).catch(() => {})
  }

  // ─── Derived metrics ──────────────────────────────────────────────────────

  const total = leads.length
  const highIntent = leads.filter(l => l.intentScore >= 80).length
  const buyNow = leads.filter(l => l.intentLevel === 'BUY_NOW').length
  const competitor = leads.filter(l => l.detectedBy === 'COMPETITOR').length
  const last24h = leads.filter(l => Date.now() - new Date(l.createdAt).getTime() < 86_400_000).length
  const converted = leads.filter(l => l.status === 'CONVERTED').length
  const avgScore = total > 0 ? Math.round(leads.reduce((s, l) => s + l.intentScore, 0) / total) : 0
  const saved = leads.filter(l => l.status === 'SAVED').length

  // Per-product lead counts computed from local leads
  const leadsByProduct = leads.reduce<Record<string, number>>((acc, l) => {
    const name = l.product?.name ?? 'Unknown'
    acc[name] = (acc[name] ?? 0) + 1
    return acc
  }, {})

  // ─── Tabs & filtering ─────────────────────────────────────────────────────

  const TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: 'ALL',        label: 'All Signals',    count: total },
    { key: 'BUY_NOW',    label: '🔥 Buy Now',     count: buyNow },
    { key: 'COMPETITOR', label: '⚔️ Competitor',  count: competitor },
    { key: 'SEMANTIC',   label: '🧠 Semantic',    count: leads.filter(l => l.detectedBy === 'SEMANTIC').length },
    { key: 'SAVED',      label: '📌 Saved',       count: saved },
  ]

  const filteredLeads = leads.filter(l => {
    if (activeTab === 'BUY_NOW')    return l.intentLevel === 'BUY_NOW'
    if (activeTab === 'COMPETITOR') return l.detectedBy === 'COMPETITOR'
    if (activeTab === 'SEMANTIC')   return l.detectedBy === 'SEMANTIC'
    if (activeTab === 'SAVED')      return l.status === 'SAVED'
    return true
  })

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col space-y-4 overflow-hidden">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6 shrink-0">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-black tracking-tighter">
            {getGreeting()}, <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary/60">{user?.username}</span> 👋
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            <span className="text-foreground">{products.filter(p => p.isActive).length}</span> product{products.filter(p => p.isActive).length !== 1 ? 's' : ''} live · Radar monitoring Reddit, HackerNews & Twitter.
          </p>
        </div>
        {user?.isScanning && (
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl animate-pulse shadow-lg shadow-primary/10">
            <Radar className="w-4 h-4" /> System Active
          </div>
        )}
      </div>

      {/* ── Stat strip moved to sidebar ────────────────────────────────── */}

      {/* ── Two column: sidebar + lead stream ─────────────────────────────── */}
      <div className="flex-1 min-h-0 grid xl:grid-cols-[360px_1fr] gap-8 overflow-hidden">

        {/* ── Left sidebar ──────────────────────────────────────────────── */}
        <aside className="space-y-6 overflow-y-auto pr-2 shrink-0 custom-scrollbar">

          {/* Premium Quick Stats Card */}
          <div className="glass rounded-3xl border border-primary/10 overflow-hidden shadow-2xl shadow-primary/5">
            <div className="px-6 py-5 border-b border-primary/5 bg-linear-to-br from-primary/5 via-transparent to-transparent">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Live Intelligence
              </span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-y divide-primary/5">
              {([
                { label: 'Total Signals', value: total,      icon: Activity,      color: 'text-foreground' },
                { label: 'High Intent',   value: highIntent, icon: TrendingUp,    color: 'text-primary' },
                { label: 'Hot Leads',     value: buyNow,     icon: Flame,         color: 'text-destructive' },
                { label: 'Competitor',    value: competitor, icon: Target,        color: 'text-destructive' },
                { label: 'Recent 24h',    value: last24h,    icon: Clock,         color: 'text-primary' },
                { label: 'Conversions',   value: converted,  icon: CheckCircle2,  color: 'text-success' },
              ]).map(({ label, value, icon: Icon, color }, i) => (
                <div key={label} className="p-5 flex flex-col gap-1 transition-colors hover:bg-primary/2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{label}</span>
                    <Icon className={`w-3.5 h-3.5 ${color} opacity-40`} />
                  </div>
                  <span className={`text-2xl font-black tracking-tighter tabular-nums ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Premium Products panel */}
          <div className="glass rounded-3xl border border-border/40 overflow-hidden shadow-xl shadow-black/5">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border/40 bg-muted/5">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-2.5">
                <Package className="w-4 h-4 text-primary" /> Active Radar
              </span>
              <button onClick={() => router.push('/dashboard/products')}
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all">
                Manage <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-border/10 max-h-64 overflow-y-auto no-scrollbar">
              {products.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">No Active Radar</p>
                </div>
              ) : (
                products.slice(0, 5).map(p => (
                  <button key={p.id} onClick={() => router.push(`/dashboard/products/${p.id}`)}
                    className="w-full text-left px-6 py-4 hover:bg-primary/3 transition-all group flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-black text-foreground group-hover:text-primary transition-colors truncate">{p.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${p.isActive ? 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-muted-foreground/30'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                          {p.isActive ? 'Live Scan' : 'Standby'}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-black text-primary tabular-nums bg-primary/5 px-3 py-1 rounded-xl border border-primary/10 group-hover:border-primary/30 transition-all">
                      {leadsByProduct[p.name] ?? 0}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Premium Origins Panel */}
          {total > 0 && (
            <div className="glass rounded-3xl border border-border/40 shadow-xl shadow-black/5 overflow-hidden p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2.5 mb-6">
                <Activity className="w-4 h-4 text-primary" /> Platform Origins
              </p>
              <div className="space-y-4">
                {(['REDDIT', 'HACKERNEWS', 'TWITTER'] as const).map(p => {
                  const count = leads.filter(l => l.platform === p).length
                  const pct = Math.round((count / total) * 100)
                  return (
                    <div key={p} className="flex items-center gap-4">
                      <span className="text-[10px] font-black text-muted-foreground/70 w-20">{p === 'HACKERNEWS' ? 'HackerNews' : p.charAt(0) + p.slice(1).toLowerCase()}</span>
                      <div className="flex-1 h-1.5 bg-primary/5 rounded-full overflow-hidden border border-primary/5">
                        <div className={`h-full rounded-full transition-all duration-1000 ${p === 'REDDIT' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]' : p === 'HACKERNEWS' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.4)]'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] font-black tabular-nums text-foreground w-12 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </aside>

        {/* ── Lead stream ───────────────────────────────────────────────── */}
        <main className="min-w-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 flex flex-col rounded-2xl border border-border/40 bg-card overflow-hidden shadow-xl shadow-black/5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3 border-b border-border/40 bg-muted/5 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Radar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-foreground leading-tight">Live Detection Stream</h2>
                  <p className="text-xs text-muted-foreground font-medium">Real-time keyword and competitor signals</p>
                </div>
              </div>
              {last24h > 0 && (
                <span className="text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  +{last24h} Today
                </span>
              )}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 px-5 py-3 border-b border-border/40 bg-card overflow-x-auto no-scrollbar">
              {TABS.map(tab => (
                <button key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all rounded-lg border ${
                    activeTab === tab.key
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-transparent border-border/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}>
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[9px] ${activeTab === tab.key ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted-foreground/20'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Lead list */}
            <div className="flex-1 overflow-y-auto p-0 sm:p-4 bg-muted/5 min-h-0 custom-scrollbar">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 min-h-96">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  </div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Scanning the matrix...</p>
                </div>
              ) : error ? (
                <div className="p-12 text-center min-h-96 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <p className="text-sm text-destructive font-black tracking-widest uppercase">System Error</p>
                  <p className="text-muted-foreground mt-2">{error}</p>
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 min-h-96">
                  <div className="w-20 h-20 bg-card border border-border/50 rounded-full flex items-center justify-center mb-2 shadow-sm">
                    <Radar className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                  <p className="text-xl font-black text-foreground">No signals detected</p>
                  <p className="text-sm font-medium text-muted-foreground max-w-sm text-center">Adjust your filters or wait for the next AI scan cycle.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredLeads.map(lead => (
                    <LeadCard key={lead.id} lead={lead}
                      draftingLeadId={draftingLeadId}
                      draftedReply={draftedReplies[lead.id]}
                      isExpanded={expandedReplies[lead.id]}
                      onDraftReply={handleDraftReply}
                      onToggleExpand={id => setExpandedReplies(prev => ({ ...prev, [id]: !prev[id] }))}
                      onStatusChange={handleStatusChange}
                      onNotesChange={handleNotesChange}
                      onFeedbackChange={handleFeedbackChange}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
