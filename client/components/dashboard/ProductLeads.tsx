"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { AlertCircle, MessageSquare, TrendingUp, Radar, Activity, Clock, Flame, Target, CheckCircle2, Sparkles, UserCheck, Bookmark, Send, XCircle, Loader2, Download } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/context/auth-context"
import { LeadCard, type LeadCardData, type LeadStatus } from "./LeadCard"
import { Button } from "@/components/ui/button"
import { exportLeadsToCSV } from "@/lib/utils"

type FilterTab = 'ALL' | 'NEW' | 'QUALIFIED' | 'SAVED' | 'CONTACTED' | 'CONVERTED' | 'DISMISSED'

interface ProductLeadsProps {
  productId: string
  lastManualScanDate?: string | null
  refreshTrigger?: number
  productType?: 'product' | 'service'
}

export function ProductLeads({ productId, lastManualScanDate, refreshTrigger = 0, productType = 'product' }: ProductLeadsProps) {
  const { user } = useAuth()
  const isFreePlan = user?.plan?.toUpperCase() !== 'PRO'

  const [leads, setLeads] = useState<LeadCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draftingLeadId, setDraftingLeadId] = useState<string | null>(null)
  const [draftedReplies, setDraftedReplies] = useState<Record<string, string>>({})
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL')
  const lastFetchRef = useRef<{ id: string | null; trigger: number }>({ id: null, trigger: -1 })

  const fetchLeads = useCallback(async () => {
    if (!productId || (lastFetchRef.current.id === productId && lastFetchRef.current.trigger === refreshTrigger)) return

    lastFetchRef.current = { id: productId, trigger: refreshTrigger }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads?productId=${productId}`, {
        credentials: "include",
      })
      if (!res.ok) throw new Error("Failed to fetch leads")
      const data = await res.json()
      const fetched = (data.leads || []) as LeadCardData[]
      setLeads(fetched)

      // Pre-populate any previously drafted replies
      const initialDrafts: Record<string, string> = {}
      fetched.forEach(l => {
        if (l.replies?.length) initialDrafts[l.id] = l.replies[0]!.generatedText
      })
      setDraftedReplies(initialDrafts)
    } catch (e: any) {
      setError(e.message)
      toast.error('Could not load your leads. Please refresh the page to try again.')
      lastFetchRef.current = { id: null, trigger: -1 } // Reset on error
    } finally {
      setLoading(false)
    }
  }, [productId, refreshTrigger])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // ─── Action Handlers ─────────────────────────────────────────────────────────

  const handleDraftReply = useCallback(async (leadId: string) => {
    setDraftingLeadId(leadId)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${leadId}/reply`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to generate draft')
      const data = await res.json()
      setDraftedReplies(prev => ({ ...prev, [leadId]: data.generatedText }))
      setExpandedReplies(prev => ({ ...prev, [leadId]: true }))
      toast.success('Your AI reply draft is ready!')
    } catch (e: any) {
      toast.error('We could not generate a draft reply right now. Please try again.')
    } finally {
      setDraftingLeadId(null)
    }
  }, [])

  const handleToggleExpand = useCallback((leadId: string) => {
    setExpandedReplies(prev => ({ ...prev, [leadId]: !prev[leadId] }))
  }, [])

  const handleDeleteLead = useCallback(async (leadId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${leadId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to delete lead')
      setLeads(prev => prev.filter(l => l.id !== leadId))
      toast.success('Lead deleted successfully.')
    } catch (e: any) {
      toast.error('We could not delete the lead. Please try again.')
    }
  }, [])

  const handleStatusChange = useCallback(async (leadId: string, status: LeadStatus) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l))
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${leadId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      toast.success(`Lead status has been updated to ${status.toLowerCase()}`)
    } catch (e: any) {
      toast.error('We could not update the lead status. Please check your connection.')
    }
  }, [])

  const handleNotesChange = useCallback(async (leadId: string, notes: string) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, notes } : l))
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${leadId}/notes`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      toast.success('Your notes have been saved successfully.')
    } catch {
      toast.error('We could not save your notes. Please check your connection and try again.')
    }
  }, [])

  const handleFeedbackChange = useCallback(async (leadId: string, feedback: number) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, feedback } : l))
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${leadId}/feedback`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      })
    } catch {
      toast.error('We could not update the feedback right now.')
    }
  }, [])

  const handleExportCSV = useCallback(() => {
    const filename = productType === 'service' ? `leads_service_${productId}.csv` : `leads_product_${productId}.csv`
    const success = exportLeadsToCSV(leads, filename, !isFreePlan)
    if (success) {
      toast.success("Successfully exported leads to CSV")
    } else {
      toast.error("No leads to export.")
    }
  }, [leads, productId, isFreePlan, productType])

  // ─── Render ──────────────────────────────────────────────────────────────────

  const TABS: { key: FilterTab; label: string; count: number; icon: React.ComponentType<any> }[] = [
    { key: 'ALL',        label: 'All Active',     count: leads.filter(l => l.status !== 'DISMISSED').length, icon: Activity },
    { key: 'NEW',        label: 'New',            count: leads.filter(l => l.status === 'NEW').length, icon: Sparkles },
    { key: 'QUALIFIED',  label: 'Qualified',      count: leads.filter(l => l.status === 'QUALIFIED').length, icon: Target },
    { key: 'SAVED',      label: 'Saved',          count: leads.filter(l => l.status === 'SAVED').length, icon: Bookmark },
    { key: 'CONTACTED',  label: 'Contacted',      count: leads.filter(l => l.status === 'CONTACTED').length, icon: Send },
    { key: 'CONVERTED',  label: 'Converted',      count: leads.filter(l => l.status === 'CONVERTED').length, icon: CheckCircle2 },
    { key: 'DISMISSED',  label: 'Dismissed',      count: leads.filter(l => l.status === 'DISMISSED').length, icon: XCircle },
  ]

  const filteredLeads = leads.filter(l => {
    if (activeTab === 'ALL')        return l.status !== 'DISMISSED'
    if (activeTab === 'NEW')        return l.status === 'NEW'
    if (activeTab === 'QUALIFIED')  return l.status === 'QUALIFIED'
    if (activeTab === 'SAVED')      return l.status === 'SAVED'
    if (activeTab === 'CONTACTED')  return l.status === 'CONTACTED'
    if (activeTab === 'CONVERTED')  return l.status === 'CONVERTED'
    if (activeTab === 'DISMISSED')  return l.status === 'DISMISSED'
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-10 text-center">
        <AlertCircle className="w-7 h-7 mx-auto text-destructive/40 mb-2" />
        <p className="text-xs font-bold uppercase tracking-wider text-destructive/60">Stream Connection Error</p>
      </div>
    )
  }

  const total = leads.length
  const highIntent = leads.filter(l => l.intentScore >= 80).length
  const last24h = leads.filter(l => Date.now() - new Date(l.createdAt).getTime() < 86_400_000).length
  const converted = leads.filter(l => l.status === 'CONVERTED').length

  return (
    <div className="flex-1 min-h-0 flex flex-col xl:grid xl:grid-cols-[350px_1fr] gap-6 xl:overflow-hidden mt-4">
      
      {/* ── Left sidebar: Flat Layout (No Cards) ─────────────────────────────── */}
      <aside className="w-full shrink-0 xl:overflow-y-auto xl:max-h-[calc(100vh-180px)] pr-2 custom-scrollbar space-y-10">
        
        {/* Section 1: Live Intelligence Stats */}
        <div className="space-y-5">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Live Intelligence
          </h3>
          <div className="space-y-1">
            {([
              { label: 'Total Leads',   value: total,      icon: Activity,      color: 'text-foreground' },
              { label: 'High Intent',   value: highIntent, icon: TrendingUp,    color: 'text-primary' },
              { label: 'Qualified Leads',value: leads.filter(l => l.status === 'QUALIFIED').length, icon: UserCheck, color: 'text-emerald-500' },
              { label: 'Saved Leads',    value: leads.filter(l => l.status === 'SAVED').length,     icon: Bookmark,  color: 'text-sky-500' },
              { label: 'Converted Leads',value: leads.filter(l => l.status === 'CONVERTED').length, icon: CheckCircle2,color: 'text-emerald-600' },
              { label: 'Recent 24h',    value: last24h,    icon: Clock,         color: 'text-indigo-500' },
            ]).map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center justify-between py-2.5 border-b border-border/10 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${color} opacity-80`} />
                  <span className="text-sm font-semibold text-muted-foreground/90">{label}</span>
                </div>
                <span className={`text-sm font-black tracking-tight tabular-nums ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Status Pipeline */}
        <div className="space-y-5">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <Radar className="w-4 h-4 text-primary" /> Status Pipeline
          </h3>
          <div className="space-y-1">
            {([
              { label: 'New',         value: leads.filter(l => l.status === 'NEW').length,       icon: Sparkles,    color: 'text-muted-foreground' },
              { label: 'Qualified',   value: leads.filter(l => l.status === 'QUALIFIED').length, icon: UserCheck,   color: 'text-primary' },
              { label: 'Saved',       value: leads.filter(l => l.status === 'SAVED').length,     icon: Bookmark,    color: 'text-sky-500' },
              { label: 'Contacted',   value: leads.filter(l => l.status === 'CONTACTED').length, icon: Send,        color: 'text-indigo-500' },
              { label: 'Converted',   value: leads.filter(l => l.status === 'CONVERTED').length, icon: CheckCircle2,color: 'text-emerald-500' },
              { label: 'Dismissed',   value: leads.filter(l => l.status === 'DISMISSED').length, icon: XCircle,     color: 'text-destructive' },
            ]).map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center justify-between py-2.5 border-b border-border/10 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${color} opacity-80`} />
                  <span className="text-sm font-semibold text-muted-foreground/90">{label}</span>
                </div>
                <span className={`text-sm font-black tracking-tight tabular-nums ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Platform Origins */}
        {total > 0 && (
          <div className="space-y-5">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Platform Origins
            </h3>
            <div className="space-y-3">
              {(['REDDIT', 'HACKERNEWS', 'TWITTER'] as const).map(p => {
                const count = leads.filter(l => l.platform === p).length
                const pct = Math.round((count / total) * 100)
                return (
                  <div key={p} className="flex items-center gap-4">
                    <span className="text-xs font-bold text-muted-foreground/60 w-24 truncate">{p === 'HACKERNEWS' ? 'HackerNews' : p.charAt(0) + p.slice(1).toLowerCase()}</span>
                    <div className="flex-1 h-1.5 bg-muted/60 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${
                        p === 'REDDIT' ? 'bg-orange-500' : 
                        p === 'HACKERNEWS' ? 'bg-amber-500' : 
                        'bg-sky-500'
                      }`}
                        style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-bold tabular-nums text-foreground/80 w-12 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </aside>

      {/* ── Right Column: Lead Stream ────────────────────────────────────────── */}
      <main className="min-w-0 flex flex-col xl:overflow-hidden xl:max-h-[calc(100vh-180px)]">
        {leads.length === 0 ? (
          <div className="h-full py-16 text-center bg-muted/5 rounded-2xl border border-dashed border-border/50 flex flex-col items-center justify-center gap-3">
            <Radar className="w-8 h-8 text-muted-foreground/20" />
            <div>
              <p className="text-sm font-bold text-foreground">No Leads Detected</p>
              <p className="text-xs text-muted-foreground mt-1">Trigger a scan or wait for the global 24h sweep.</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col rounded-2xl border border-border/40 bg-card overflow-hidden shadow-xl shadow-black/5">
            {/* Header / Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3 border-b border-border/40 bg-muted/5 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-foreground leading-tight">
                    {productType === 'service' ? 'Service Feed' : 'Product Feed'}
                  </h2>
                  <p className="text-xs text-muted-foreground font-medium">Real-time leads filtered by intent</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="h-auto py-1.5 px-3 font-black text-xs uppercase tracking-widest rounded-lg shadow-sm border-border hover:bg-muted"
              >
                <Download className="w-3.5 h-3.5 mr-1.5 text-primary" />
                Export CSV
              </Button>
            </div>

            <div className="flex gap-2 px-5 py-3 border-b border-border/40 bg-card overflow-x-auto no-scrollbar">
              {TABS.map(tab => {
                const Icon = tab.icon
                return (
                  <button key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all rounded-lg border ${
                      activeTab === tab.key
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'bg-transparent border-border/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}>
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab.key ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted-foreground/20'}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Lead list */}
            <div className="flex-1 overflow-y-auto p-0 sm:p-4 bg-muted/5 min-h-0 custom-scrollbar">
              {filteredLeads.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 min-h-96">
                  <div className="w-20 h-20 bg-card border border-border/50 rounded-full flex items-center justify-center mb-2 shadow-sm">
                    <Radar className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                  <p className="text-xl font-black text-foreground">No leads in this view</p>
                  <p className="text-sm font-medium text-muted-foreground max-w-sm text-center">Adjust filters or wait for the next scan cycle.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredLeads.map(lead => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      showProductName={false}
                      draftingLeadId={draftingLeadId}
                      draftedReply={draftedReplies[lead.id]}
                      isExpanded={expandedReplies[lead.id]}
                      isFreePlan={isFreePlan}
                      onDraftReply={handleDraftReply}
                      onToggleExpand={handleToggleExpand}
                      onStatusChange={handleStatusChange}
                      onNotesChange={handleNotesChange}
                      onFeedbackChange={handleFeedbackChange}
                      onDelete={handleDeleteLead}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
