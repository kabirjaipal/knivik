"use client"

import { useEffect, useState, useCallback } from "react"
import { AlertCircle, MessageSquare, TrendingUp, Radar } from "lucide-react"
import { LeadCard, type LeadCardData, type LeadStatus } from "./LeadCard"
import { ProductStats } from "./ProductStats"

type FilterTab = 'ALL' | 'BUY_NOW' | 'COMPETITOR' | 'SEMANTIC' | 'SAVED'

interface ProductLeadsProps {
  productId: string
  lastManualScanDate?: string | null
}

export function ProductLeads({ productId, lastManualScanDate }: ProductLeadsProps) {
  const [leads, setLeads] = useState<LeadCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draftingLeadId, setDraftingLeadId] = useState<string | null>(null)
  const [draftedReplies, setDraftedReplies] = useState<Record<string, string>>({})
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL')

  const fetchLeads = useCallback(async () => {
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
    } finally {
      setLoading(false)
    }
  }, [productId])

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
    } catch (e) {
      console.error('Draft reply failed:', e)
    } finally {
      setDraftingLeadId(null)
    }
  }, [])

  const handleToggleExpand = useCallback((leadId: string) => {
    setExpandedReplies(prev => ({ ...prev, [leadId]: !prev[leadId] }))
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
    } catch {
      console.error('Failed to update status')
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
    } catch {
      console.error('Failed to update notes')
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
      console.error('Failed to update feedback')
    }
  }, [])

  // ─── Render ──────────────────────────────────────────────────────────────────

  const buyNow = leads.filter(l => l.intentLevel === 'BUY_NOW').length
  const competitor = leads.filter(l => l.detectedBy === 'COMPETITOR').length
  const semantic = leads.filter(l => l.detectedBy === 'SEMANTIC').length
  const saved = leads.filter(l => l.status === 'SAVED').length

  const TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: 'ALL',        label: 'All Signals',    count: leads.length },
    { key: 'BUY_NOW',    label: '🔥 Buy Now',     count: buyNow },
    { key: 'COMPETITOR', label: '⚔️ Competitor',  count: competitor },
    { key: 'SEMANTIC',   label: '🧠 Semantic',    count: semantic },
    { key: 'SAVED',      label: '📌 Saved',       count: saved },
  ]

  const filteredLeads = leads.filter(l => {
    if (activeTab === 'BUY_NOW')    return l.intentLevel === 'BUY_NOW'
    if (activeTab === 'COMPETITOR') return l.detectedBy === 'COMPETITOR'
    if (activeTab === 'SEMANTIC')   return l.detectedBy === 'SEMANTIC'
    if (activeTab === 'SAVED')      return l.status === 'SAVED'
    return true
  })

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3">
        <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40">Syncing Signal Stream...</p>
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

  return (
    <div className="space-y-0">
      {/* Stats above the lead stream — always shown even with 0 leads */}
      <ProductStats leads={leads} />

      {leads.length === 0 ? (
        <div className="py-16 text-center bg-muted/5 rounded-xl border border-dashed border-border/50 flex flex-col items-center justify-center gap-3">
          <Radar className="w-8 h-8 text-muted-foreground/20" />
          <div>
            <p className="text-sm font-bold text-foreground">No Signals Detected</p>
            <p className="text-xs text-muted-foreground mt-1">Trigger a scan or wait for the global 24h sweep.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
            {/* Header / Tabs */}
            <div className="flex flex-col border-b border-border/30">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/10">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Product Feed
                </h2>
              </div>
              <div className="flex gap-0 overflow-x-auto">
                {TABS.map(tab => (
                  <button key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 -mb-px ${
                      activeTab === tab.key
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground/40 hover:text-foreground'
                    }`}>
                    {tab.label}
                    {tab.count > 0 && (
                      <span className="ml-1.5 bg-muted px-1.5 py-0.5 rounded-full font-bold">{tab.count}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Lead list */}
            {filteredLeads.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center gap-2">
                <Radar className="h-8 w-8 text-muted-foreground/20" />
                <p className="text-sm font-bold text-foreground">No signals in this view</p>
                <p className="text-xs text-muted-foreground">Adjust filters or wait for the next scan cycle.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {filteredLeads.map(lead => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    showProductName={false}
                    draftingLeadId={draftingLeadId}
                    draftedReply={draftedReplies[lead.id]}
                    isExpanded={expandedReplies[lead.id]}
                    onDraftReply={handleDraftReply}
                    onToggleExpand={handleToggleExpand}
                    onStatusChange={handleStatusChange}
                    onNotesChange={handleNotesChange}
                    onFeedbackChange={handleFeedbackChange}
                  />
                ))}
              </div>
            )}
          </div>

          {filteredLeads.length > 5 && (
            <p className="text-center text-xs text-muted-foreground/40 font-medium pt-2">
              <MessageSquare className="inline w-3 h-3 mr-1" />
              Showing all {filteredLeads.length} signals for this view
            </p>
          )}
        </div>
      )}
    </div>
  )
}
