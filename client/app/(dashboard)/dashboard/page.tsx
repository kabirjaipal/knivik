"use client"

import { useAuth } from "@/context/auth-context"
import {
  Radar, Activity, Clock, Brain, Flame, TrendingUp, CheckCircle2,
  BarChart2, ArrowRight, Zap, Target, Package, ChevronRight
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
    <div className="space-y-5">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black tracking-tight">
            {getGreeting()}, <span className="text-primary">{user?.username}</span> 👋
          </h1>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            {products.filter(p => p.isActive).length} product{products.filter(p => p.isActive).length !== 1 ? 's' : ''} live · Reddit, HackerNews & Twitter monitored 24/7
          </p>
        </div>

        {/* Scanning badge */}
        {user?.isScanning && (
          <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full animate-pulse">
            <Radar className="w-3 h-3" /> Scanning Web...
          </span>
        )}
      </div>

      {/* ── Stat strip ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {([
          { label: 'Total',      value: total,      icon: Activity,      color: 'text-foreground' },
          { label: 'High Intent',value: highIntent, icon: TrendingUp,    color: 'text-primary',    hi: true },
          { label: 'Buy Now',    value: buyNow,     icon: Flame,         color: 'text-destructive' },
          { label: 'Competitor', value: competitor, icon: Target,        color: 'text-destructive' },
          { label: 'Last 24h',   value: last24h,    icon: Clock,         color: 'text-primary' },
          { label: 'Avg Score',  value: avgScore,   icon: BarChart2,     color: 'text-primary' },
          { label: 'Converted',  value: converted,  icon: CheckCircle2,  color: 'text-success' },
          { label: 'AI Tasks',   value: llmUsage?.totals.requestCount ?? 0, icon: Brain, color: 'text-primary' },
        ]).map(({ label, value, icon: Icon, color, hi }) => (
          <div key={label}
            className={`rounded-xl border px-3 py-2.5 flex flex-col gap-1 transition-all ${hi ? 'bg-primary/5 border-primary/20' : 'bg-card border-border/40 hover:border-border/60'}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">{label}</span>
              <Icon className={`w-3 h-3 ${color} opacity-60`} />
            </div>
            <span className={`text-xl font-black ${color}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* ── Two column: sidebar + lead stream ─────────────────────────────── */}
      <div className="grid lg:grid-cols-[220px_1fr] gap-4">

        {/* ── Left sidebar ──────────────────────────────────────────────── */}
        <aside className="space-y-3">

          {/* Products panel */}
          <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 flex items-center gap-1">
                <Package className="w-3 h-3" /> Products
              </span>
              <button onClick={() => router.push('/dashboard/products')}
                className="text-[10px] font-bold text-primary/60 hover:text-primary transition-colors flex items-center gap-0.5">
                All <ChevronRight className="w-2.5 h-2.5" />
              </button>
            </div>
            {products.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">No products yet</p>
                <button onClick={() => router.push('/dashboard/products/new')}
                  className="mt-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors">
                  + Add Product
                </button>
              </div>
            ) : (
              <div className="divide-y divide-border/20">
                {products.slice(0, 6).map(p => (
                  <button key={p.id} onClick={() => router.push(`/dashboard/products/${p.id}`)}
                    className="w-full text-left px-3 py-2 hover:bg-muted/20 transition-colors group flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground/80 group-hover:text-primary transition-colors truncate">{p.name}</p>
                      <span className={`text-[10px] font-bold ${p.isActive ? 'text-success' : 'text-muted-foreground/40'}`}>
                        {p.isActive ? '● Live' : '○ Standby'}
                      </span>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-xs font-black text-muted-foreground/50 tabular-nums">
                        {leadsByProduct[p.name] ?? 0}
                      </span>
                      <p className="text-[9px] text-muted-foreground/30">leads</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Platform breakdown */}
          {total > 0 && (
            <div className="rounded-xl border border-border/40 bg-card p-3 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Platform Split</p>
              {(['REDDIT', 'HACKERNEWS', 'TWITTER'] as const).map(p => {
                const count = leads.filter(l => l.platform === p).length
                const pct = Math.round((count / total) * 100)
                return (
                  <div key={p} className="space-y-0.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-muted-foreground/60 font-medium">{p === 'HACKERNEWS' ? 'HN' : p.charAt(0) + p.slice(1).toLowerCase()}</span>
                      <span className="text-muted-foreground/50 font-bold tabular-nums">{count}</span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${p === 'REDDIT' ? 'bg-orange-500/70' : p === 'HACKERNEWS' ? 'bg-amber-500/70' : 'bg-sky-500/70'}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Intent breakdown */}
          {total > 0 && (
            <div className="rounded-xl border border-border/40 bg-card p-3 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Intent Mix</p>
              {([
                ['BUY_NOW', 'Buy Now', 'bg-destructive/70'],
                ['COMPARING', 'Comparing', 'bg-primary/70'],
                ['RESEARCHING', 'Researching', 'bg-primary/40'],
                ['LOW_INTENT', 'Low', 'bg-muted-foreground/30'],
              ] as const).map(([key, label, bar]) => {
                const count = leads.filter(l => l.intentLevel === key).length
                const pct = Math.round((count / total) * 100)
                return (
                  <div key={key} className="space-y-0.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-muted-foreground/60 font-medium">{label}</span>
                      <span className="text-muted-foreground/50 font-bold tabular-nums">{count}</span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${bar}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* AI usage */}
          {llmUsage && (
            <div className="rounded-xl border border-primary/15 bg-primary/3 p-3 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" /> AI Engine
              </p>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground/50">Inferences</span>
                <span className="font-black text-primary">{llmUsage.totals.requestCount}</span>
              </div>
            </div>
          )}
        </aside>

        {/* ── Lead stream ───────────────────────────────────────────────── */}
        <main className="min-w-0">
          <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                  <Radar className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-black tracking-tight">Live Detection Stream</h2>
                  <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Keyword · Semantic · Competitor signals</p>
                </div>
              </div>
              {last24h > 0 && (
                <span className="text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-full">
                  +{last24h} today
                </span>
              )}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-0 border-b border-border/30 overflow-x-auto">
              {TABS.map(tab => (
                <button key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 -mb-px ${
                    activeTab === tab.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground/50 hover:text-foreground'
                  }`}>
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-1.5 bg-muted px-1.5 py-0.5 rounded-full font-bold">{tab.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Lead list */}
            {loading ? (
              <div className="h-48 flex flex-col items-center justify-center gap-3">
                <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-muted-foreground/40 font-bold uppercase tracking-widest">Scanning the matrix...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-xs text-destructive font-semibold">Error: {error}</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center gap-2">
                <Radar className="h-8 w-8 text-muted-foreground/20" />
                <p className="text-sm font-bold text-foreground">No signals in this view</p>
                <p className="text-xs text-muted-foreground">Adjust filters or wait for the next scan cycle.</p>
              </div>
            ) : (
              <div>
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
        </main>
      </div>
    </div>
  )
}
