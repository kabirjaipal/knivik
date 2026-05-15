"use client"

import { useEffect, useState, useCallback } from "react"
import { AlertCircle, MessageSquare, TrendingUp, Radar } from "lucide-react"
import { LeadCard, type LeadCardData, type LeadStatus } from "./LeadCard"
import { ProductStats } from "./ProductStats"

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
          {/* Section header */}
          <div className="flex items-center gap-2 pb-2 border-b border-border/40">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Detected Signals
            </h2>
            <span className="ml-auto text-xs font-bold text-muted-foreground/50 bg-muted px-2 py-0.5 rounded-full">
              {leads.length}
            </span>
          </div>

          {/* Lead cards */}
          <div className="border border-border/40 rounded-md overflow-hidden bg-card shadow-sm">
            {leads.map(lead => (
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

          {leads.length > 5 && (
            <p className="text-center text-xs text-muted-foreground/40 font-medium pt-2">
              <MessageSquare className="inline w-3 h-3 mr-1" />
              Showing all {leads.length} signals for this product
            </p>
          )}
        </div>
      )}
    </div>
  )
}
