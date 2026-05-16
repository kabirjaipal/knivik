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
    <div className="space-y-8 pb-12">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-black tracking-tighter">
            {getGreeting()}, <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary/60">{user?.username}</span> 👋
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            <span className="text-foreground">{products.filter(p => p.isActive).length}</span> product{products.filter(p => p.isActive).length !== 1 ? 's' : ''} live · Radar monitoring Reddit, HackerNews & Twitter.
          </p>
        </div>

        {/* Scanning badge */}
        {user?.isScanning && (
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl animate-pulse shadow-lg shadow-primary/10">
            <Radar className="w-4 h-4" /> System Active
          </div>
        )}
      </div>

      {/* ── Stat strip ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {([
          { label: 'Total',      value: total,      icon: Activity,      color: 'text-foreground',    bg: 'bg-card' },
          { label: 'High Intent',value: highIntent, icon: TrendingUp,    color: 'text-primary',       bg: 'bg-primary/5 border-primary/20', hi: true },
          { label: 'Buy Now',    value: buyNow,     icon: Flame,         color: 'text-destructive',   bg: 'bg-card' },
          { label: 'Competitor', value: competitor, icon: Target,        color: 'text-destructive',   bg: 'bg-card' },
          { label: 'Last 24h',   value: last24h,    icon: Clock,         color: 'text-primary',       bg: 'bg-card' },
          { label: 'Avg Score',  value: avgScore,   icon: BarChart2,     color: 'text-primary',       bg: 'bg-card' },
          { label: 'Converted',  value: converted,  icon: CheckCircle2,  color: 'text-success',       bg: 'bg-card' },
          { label: 'AI Tasks',   value: llmUsage?.totals.requestCount ?? 0, icon: Brain, color: 'text-primary', bg: 'bg-card' },
        ]).map(({ label, value, icon: Icon, color, bg, hi }) => (
          <div key={label}
            className={`rounded-2xl border p-4 flex flex-col gap-2 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 ${bg} ${!hi ? 'border-border/40 hover:border-border/60' : ''}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{label}</span>
              <Icon className={`w-4 h-4 ${color} opacity-80`} />
            </div>
            <span className={`text-3xl font-black tracking-tighter ${color}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* ── Two column: sidebar + lead stream ─────────────────────────────── */}
      <div className="grid xl:grid-cols-[320px_1fr] gap-8">

        {/* ── Left sidebar ──────────────────────────────────────────────── */}
        <aside className="space-y-6">

          {/* Products panel */}
          <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-card">
              <span className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" /> Active Products
              </span>
              <button onClick={() => router.push('/dashboard/products')}
                className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                Manage <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {products.length === 0 ? (
              <div className="p-8 text-center bg-card">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">No products yet</p>
                <button onClick={() => router.push('/dashboard/products/new')}
                  className="mt-4 text-sm font-black text-primary bg-primary/10 px-4 py-2 rounded-lg hover:bg-primary/20 transition-colors w-full">
                  Create Product
                </button>
              </div>
            ) : (
              <div className="divide-y divide-border/20 bg-card">
                {products.slice(0, 6).map(p => (
                  <button key={p.id} onClick={() => router.push(`/dashboard/products/${p.id}`)}
                    className="w-full text-left px-5 py-4 hover:bg-muted/30 transition-colors group flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-foreground group-hover:text-primary transition-colors truncate">{p.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${p.isActive ? 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-muted-foreground'}`} />
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          {p.isActive ? 'Live' : 'Standby'}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
                      <span className="text-sm font-black text-foreground tabular-nums">
                        {leadsByProduct[p.name] ?? 0}
                      </span>
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">leads</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Platform breakdown */}
          {total > 0 && (
            <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                 <Activity className="w-4 h-4 text-primary" /> Platform Split
              </p>
              <div className="space-y-3">
                {(['REDDIT', 'HACKERNEWS', 'TWITTER'] as const).map(p => {
                  const count = leads.filter(l => l.platform === p).length
                  const pct = Math.round((count / total) * 100)
                  return (
                    <div key={p} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-muted-foreground">{p === 'HACKERNEWS' ? 'HackerNews' : p.charAt(0) + p.slice(1).toLowerCase()}</span>
                        <span className="text-foreground tabular-nums">{count} <span className="text-muted-foreground text-xs">({pct}%)</span></span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${p === 'REDDIT' ? 'bg-orange-500' : p === 'HACKERNEWS' ? 'bg-amber-500' : 'bg-sky-500'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Intent breakdown */}
          {total > 0 && (
            <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                 <Flame className="w-4 h-4 text-destructive" /> Intent Mix
              </p>
              <div className="space-y-3">
                {([
                  ['BUY_NOW', 'Buy Now', 'bg-destructive'],
                  ['COMPARING', 'Comparing', 'bg-primary'],
                  ['RESEARCHING', 'Researching', 'bg-primary/60'],
                  ['LOW_INTENT', 'Low Intent', 'bg-muted-foreground/40'],
                ] as const).map(([key, label, bar]) => {
                  const count = leads.filter(l => l.intentLevel === key).length
                  const pct = Math.round((count / total) * 100)
                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="text-foreground tabular-nums">{count} <span className="text-muted-foreground text-xs">({pct}%)</span></span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${bar}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          
          {/* AI usage */}
          {llmUsage && (
            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-5 space-y-2 shadow-sm">
              <p className="text-xs font-black uppercase tracking-widest text-primary/80 flex items-center gap-2">
                <Zap className="w-4 h-4" /> AI Engine
              </p>
              <div className="flex justify-between items-end">
                <span className="text-xs font-medium text-muted-foreground">Inferences Completed</span>
                <span className="text-2xl font-black tracking-tighter text-primary">{llmUsage.totals.requestCount}</span>
              </div>
            </div>
          )}
        </aside>

        {/* ── Lead stream ───────────────────────────────────────────────── */}
        <main className="min-w-0">
          <div className="rounded-2xl border border-border/40 bg-card overflow-hidden shadow-xl shadow-black/5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-border/40 bg-muted/10 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                  <Radar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-foreground">Live Detection Stream</h2>
                  <p className="text-sm text-muted-foreground font-medium mt-0.5">Real-time keyword, semantic, and competitor signals</p>
                </div>
              </div>
              {last24h > 0 && (
                <span className="text-xs font-black text-primary bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                  +{last24h} Today
                </span>
              )}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 px-6 py-4 border-b border-border/40 bg-card overflow-x-auto no-scrollbar">
              {TABS.map(tab => (
                <button key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all rounded-xl border ${
                    activeTab === tab.key
                      ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20'
                      : 'bg-transparent border-border/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}>
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.key ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted-foreground/20'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Lead list */}
            <div className="p-0 sm:p-4 bg-muted/5 min-h-96">
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
