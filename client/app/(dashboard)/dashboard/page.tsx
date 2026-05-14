"use client"

import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Radar, Users, MessageSquareText, Activity, ExternalLink, Zap, Clock, ChevronRight,
  RotateCw, Linkedin, Twitter, Github, FileText, ChevronDown, Brain, Flame, Tags,
  ThumbsUp, ThumbsDown, Info
} from "lucide-react"
import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"

import React, { memo } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

type LeadStatus = 'NEW' | 'QUALIFIED' | 'SAVED' | 'CONTACTED' | 'CONVERTED' | 'DISMISSED'
type DetectedBy = 'KEYWORD' | 'SEMANTIC' | 'COMPETITOR'

interface Enrichment {
  linkedinUrl?: string;
  twitterUrl?: string;
  githubUrl?: string;
}

interface Lead {
  id: string;
  platform: string;
  externalPostId: string;
  title: string | null;
  content: string;
  url: string;
  authorUsername: string | null;
  intentLevel: 'BUY_NOW' | 'RESEARCHING' | 'COMPARING' | 'LOW_INTENT';
  intentScore: number;
  status: LeadStatus;
  detectedBy: DetectedBy;
  enrichment?: Enrichment | null;
  feedback?: number | null;
  notes?: string | null;
  metadata?: { qualificationReasoning?: string } | null;
  postedAt?: string | null;
  createdAt: string;
  product: { name: string };
  replies?: Array<{ id: string; generatedText: string; createdAt: string }>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'NEW',       label: 'New',       color: 'bg-muted/50 text-muted-foreground border-border' },
  { value: 'QUALIFIED', label: 'Qualified', color: 'bg-primary/10 text-primary border-primary/20' },
  { value: 'SAVED',     label: 'Saved',     color: 'bg-primary/10 text-primary border-primary/20' },
  { value: 'CONTACTED', label: 'Contacted', color: 'bg-primary/10 text-primary border-primary/20' },
  { value: 'CONVERTED', label: 'Converted 🎉', color: 'bg-success/10 text-success border-success/20' },
  { value: 'DISMISSED', label: 'Dismissed', color: 'bg-destructive/10 text-destructive border-destructive/20' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

const getIntentColor = (level: string) => {
  switch (level) {
    case 'BUY_NOW':     return 'bg-destructive/10 text-destructive border-destructive/20'
    case 'COMPARING':   return 'bg-primary/10 text-primary border-primary/20'
    case 'RESEARCHING': return 'bg-primary/10 text-primary border-primary/20'
    default:            return 'bg-muted text-muted-foreground border-border'
  }
}

const DetectionBadge = ({ detectedBy }: { detectedBy: DetectedBy }) => {
  if (detectedBy === 'COMPETITOR') return (
    <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-destructive/15 text-destructive border border-destructive/30 shadow-sm">
      <Flame className="w-3 h-3 fill-current" /> Competitor Alert
    </span>
  )
  if (detectedBy === 'SEMANTIC') return (
    <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-primary/15 text-primary border border-primary/30 shadow-sm">
      <Brain className="w-3 h-3" /> Semantic Find
    </span>
  )
  return (
    <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-muted text-muted-foreground border border-border">
      <Tags className="w-3 h-3" /> Keyword Match
    </span>
  )
}

const EnrichmentIcons = ({ enrichment }: { enrichment?: Enrichment | null }) => {
  if (!enrichment) return null
  return (
    <span className="flex items-center gap-1.5 ml-1">
      {enrichment.linkedinUrl && (
        <a href={enrichment.linkedinUrl} target="_blank" rel="noreferrer" title="LinkedIn Profile"
          className="text-blue-400 hover:text-blue-300 transition-colors">
          <Linkedin className="w-3.5 h-3.5" />
        </a>
      )}
      {enrichment.twitterUrl && (
        <a href={enrichment.twitterUrl} target="_blank" rel="noreferrer" title="Twitter/X Profile"
          className="text-sky-400 hover:text-sky-300 transition-colors">
          <Twitter className="w-3.5 h-3.5" />
        </a>
      )}
      {enrichment.githubUrl && (
        <a href={enrichment.githubUrl} target="_blank" rel="noreferrer" title="GitHub Profile"
          className="text-foreground/70 hover:text-foreground transition-colors">
          <Github className="w-3.5 h-3.5" />
        </a>
      )}
    </span>
  )
}

// ─── Lead Row ─────────────────────────────────────────────────────────────────

const LeadRow = memo(({
  lead, draftingLeadId, draftedReply, isExpanded,
  onDraftReply, onToggleExpand, onStatusChange, onNotesChange, onFeedbackChange,
}: {
  lead: Lead
  draftingLeadId: string | null
  draftedReply?: string
  isExpanded?: boolean
  onDraftReply: (id: string) => void
  onToggleExpand: (id: string) => void
  onStatusChange: (id: string, status: LeadStatus) => void
  onNotesChange: (id: string, notes: string) => void
  onFeedbackChange: (id: string, feedback: number) => void
}) => {
  const [showNotes, setShowNotes] = useState(false)
  const [localNotes, setLocalNotes] = useState(lead.notes || '')
  const currentStatus = STATUS_OPTIONS.find(s => s.value === lead.status) || STATUS_OPTIONS[0]

  const handleNotesBlur = useCallback(() => {
    if (localNotes !== (lead.notes || "")) {
      onNotesChange(lead.id, localNotes)
    }
  }, [lead.id, lead.notes, localNotes, onNotesChange])

  return (
    <div className="group relative border-b border-border/40 last:border-0">
      {/* Competitor Alert hot-border */}
      {lead.detectedBy === 'COMPETITOR' && (
        <div className="absolute left-0 top-0 w-0.5 h-full bg-linear-to-b from-destructive to-warning" />
      )}
      {lead.detectedBy === 'SEMANTIC' && (
        <div className="absolute left-0 top-0 w-0.5 h-full bg-primary" />
      )}

      <div className="p-5 pl-6 md:p-6 md:pl-7 hover:bg-muted/10 transition-colors flex flex-col md:flex-row gap-5 items-start">
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
              {lead.platform}
            </span>
            <span className={`text-xs uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border ${getIntentColor(lead.intentLevel)}`}>
              {lead.intentLevel.replace('_', ' ')}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-md">
              ★ {lead.intentScore}
            </span>
            <DetectionBadge detectedBy={lead.detectedBy} />
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-foreground mb-1.5 line-clamp-1 group-hover:text-primary transition-colors">
            {lead.title || "Found Conversation Thread"}
          </h3>

          {/* Content preview */}
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {lead.content}
          </p>

          {/* AI Reasoning */}
          {lead.metadata?.qualificationReasoning && (
            <div className="mt-2 p-2 bg-primary/5 rounded-md border border-primary/10 flex gap-2 items-start">
               <Info className="w-3 h-3 text-primary mt-0.5 shrink-0" />
               <p className="text-xs font-medium text-primary/70 leading-normal italic">
                 {lead.metadata.qualificationReasoning}
               </p>
            </div>
          )}

          {/* Meta row */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-muted-foreground">
            <span className="flex items-center text-foreground/80 font-semibold bg-secondary px-2 py-0.5 rounded-md">
              <Users className="w-3 h-3 mr-1.5" />
              {lead.product?.name || 'System Query'}
            </span>
            <span className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {new Date(lead.postedAt || lead.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
            {lead.authorUsername && (
              <span className="flex items-center">
                u/{lead.authorUsername}
                <EnrichmentIcons enrichment={lead.enrichment} />
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="shrink-0 flex md:flex-col gap-2 w-full md:w-44">
          {/* Engage button */}
          <a href={lead.url} target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-primary text-primary-foreground text-sm font-bold rounded-sm hover:bg-primary/90 transition-all shadow-sm active:scale-95">
            Engage <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Status pill */}
          <div className="relative w-full group/status">
            <button className={`flex items-center justify-between w-full py-2 px-3 text-xs font-bold rounded-sm border transition-all ${currentStatus.color}`}>
              {currentStatus.label}
              <ChevronDown className="w-3 h-3 ml-1" />
            </button>
            <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-card border border-border rounded-md shadow-xl overflow-hidden hidden group-hover/status:block">
              {STATUS_OPTIONS.map(opt => (
                <button key={opt.value}
                  onClick={() => onStatusChange(lead.id, opt.value)}
                  className={`w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-colors ${opt.value === lead.status ? 'opacity-50 cursor-default' : ''}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Draft Reply + Notes row */}
          <div className="flex gap-1.5 w-full">
            <button onClick={() => onDraftReply(lead.id)} disabled={draftingLeadId === lead.id}
              className="flex items-center justify-center gap-1.5 flex-1 py-2 px-3 bg-secondary text-secondary-foreground text-xs font-bold rounded-sm hover:bg-secondary/80 border border-border transition-all active:scale-95 disabled:opacity-50">
              {draftingLeadId === lead.id ? (
                <div className="w-3 h-3 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
              ) : draftedReply ? (
                <><RotateCw className="w-3 h-3" /> Regen</>
              ) : (
                <><ChevronRight className="w-3 h-3" /> Draft</>
              )}
            </button>

            {draftedReply && (
              <button onClick={() => onToggleExpand(lead.id)} title="View Draft"
                className="p-2 bg-secondary text-secondary-foreground rounded-sm border border-border hover:bg-secondary/80 transition-all active:scale-95">
                <MessageSquareText className="w-3.5 h-3.5" />
              </button>
            )}

            <button onClick={() => setShowNotes(v => !v)} title="Notes"
              className={`p-2 rounded-sm border transition-all active:scale-95 ${showNotes ? 'bg-primary/10 text-primary border-primary/30' : 'bg-secondary text-secondary-foreground border-border hover:bg-secondary/80'}`}>
              <FileText className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Feedback section */}
          <div className="flex items-center justify-between md:justify-start gap-2 mt-1 px-1">
             <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 mr-1">Quality:</span>
             <button 
              onClick={() => onFeedbackChange(lead.id, lead.feedback === 1 ? 0 : 1)}
              className={`p-1.5 rounded-sm border transition-all active:scale-90 ${lead.feedback === 1 ? 'bg-success/20 text-success border-success/40' : 'text-muted-foreground border-transparent hover:bg-muted'}`}
              title="Good Lead"
             >
                <ThumbsUp className="w-3 h-3" />
             </button>
             <button 
              onClick={() => onFeedbackChange(lead.id, lead.feedback === -1 ? 0 : -1)}
              className={`p-1.5 rounded-sm border transition-all active:scale-90 ${lead.feedback === -1 ? 'bg-destructive/20 text-destructive border-destructive/40' : 'text-muted-foreground border-transparent hover:bg-muted'}`}
              title="Bad Lead"
             >
                <ThumbsDown className="w-3 h-3" />
             </button>
          </div>
        </div>
      </div>

      {/* AI Draft panel */}
      {draftedReply && isExpanded && (
        <div className="bg-card border-t border-border/40 px-6 py-4 relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <h4 className="flex items-center gap-1.5 text-xs uppercase tracking-widest font-bold text-primary mb-2">
            <Zap className="w-3 h-3" /> AI Draft
          </h4>
          <textarea readOnly
            className="w-full h-28 text-sm text-foreground bg-muted/5 border border-border rounded-sm p-3 outline-none resize-none focus:border-primary/50 transition-colors"
            value={draftedReply}
          />
        </div>
      )}

      {/* Notes panel */}
      {showNotes && (
        <div className="border-t border-border/40 px-6 py-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <textarea
            className="w-full h-20 text-sm text-foreground bg-muted/5 border border-border rounded-sm p-3 outline-none resize-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/50"
            placeholder="Add internal notes about this lead..."
            value={localNotes}
            onChange={e => setLocalNotes(e.target.value)}
            onBlur={handleNotesBlur}
          />
          <p className="text-xs text-muted-foreground mt-1">Auto-saved on blur</p>
        </div>
      )}
    </div>
  )
})
LeadRow.displayName = "LeadRow"

// ─── Main Page ────────────────────────────────────────────────────────────────

type FilterTab = 'ALL' | 'BUY_NOW' | 'COMPETITOR' | 'SEMANTIC' | 'SAVED'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL')
  const [draftingLeadId, setDraftingLeadId] = useState<string | null>(null)
  const [draftedReplies, setDraftedReplies] = useState<Record<string, string>>({})
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({})
  const router = useRouter()

  const [llmUsage, setLlmUsage] = useState<{ totals: { inputTokens: number, outputTokens: number, totalTokens: number, requestCount: number } } | null>(null)
  const hasFetchedDashboard = useRef(false)
  const lastFetchedUserId = useRef<string | null>(null)

  const fetchLlmUsage = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/llm`, { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      if (data.success) setLlmUsage(data.data)
    } catch (e) { console.error('Error fetching LLM usage:', e) }
  }, [])

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch leads')
      const data = await res.json()
      const fetched = data.leads as Lead[]
      setLeads(fetched)
      const initialDrafts: Record<string, string> = {}
      fetched.forEach(l => { if (l.replies?.length) initialDrafts[l.id] = l.replies[0].generatedText })
      setDraftedReplies(initialDrafts)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading || !user) return
    
    // Only fetch if we haven't fetched for this user yet
    if (hasFetchedDashboard.current && lastFetchedUserId.current === user.id) return
    
    hasFetchedDashboard.current = true
    lastFetchedUserId.current = user.id

    fetchLeads()
    fetchLlmUsage()
  }, [user, authLoading, fetchLlmUsage, fetchLeads])

  const handleDraftReply = async (leadId: string) => {
    setDraftingLeadId(leadId)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${leadId}/reply`, { method: 'POST', credentials: 'include' })
      if (!res.ok) throw new Error('Failed to generate draft')
      const data = await res.json()
      setDraftedReplies(prev => ({ ...prev, [leadId]: data.generatedText }))
      setExpandedReplies(prev => ({ ...prev, [leadId]: true }))
    } catch (e) { console.error(e) }
    finally { setDraftingLeadId(null) }
  }

  const handleStatusChange = async (leadId: string, status: LeadStatus) => {
    // Optimistic update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l))
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${leadId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
    } catch { console.error('Failed to update status') }
  }

  const handleNotesChange = async (leadId: string, notes: string) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, notes } : l))
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${leadId}/notes`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
    } catch { console.error('Failed to update notes') }
  }

  const handleFeedbackChange = async (leadId: string, feedback: number) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, feedback } : l))
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${leadId}/feedback`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      })
    } catch { console.error('Failed to update feedback') }
  }

  // ─── Metrics ───────────────────────────────────────────────────────────────
  const totalLeads = leads.length
  const highIntentLeads = leads.filter(l => l.intentScore >= 80).length
  const competitorLeads = leads.filter(l => l.detectedBy === 'COMPETITOR').length
  const recentSignals = leads.filter(l => new Date(l.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000).length

  // ─── Filtered list ─────────────────────────────────────────────────────────
  const TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: 'ALL', label: 'All', count: totalLeads },
    { key: 'BUY_NOW', label: '🔥 Buy Now', count: leads.filter(l => l.intentLevel === 'BUY_NOW').length },
    { key: 'COMPETITOR', label: '⚔️ Competitor', count: competitorLeads },
    { key: 'SEMANTIC', label: '🧠 Semantic', count: leads.filter(l => l.detectedBy === 'SEMANTIC').length },
    { key: 'SAVED', label: '📌 Saved', count: leads.filter(l => l.status === 'SAVED').length },
  ]

  const filteredLeads = leads.filter(l => {
    if (activeTab === 'ALL') return true
    if (activeTab === 'BUY_NOW') return l.intentLevel === 'BUY_NOW'
    if (activeTab === 'COMPETITOR') return l.detectedBy === 'COMPETITOR'
    if (activeTab === 'SEMANTIC') return l.detectedBy === 'SEMANTIC'
    if (activeTab === 'SAVED') return l.status === 'SAVED'
    return true
  })

  return (
    <>
      <div className="relative z-10 w-full">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/70">
              Welcome back, {user?.username}
            </h1>
            <p className="text-muted-foreground mt-2 text-base max-w-2xl">
              Your radar is active across Reddit, Twitter, and HackerNews. Multi-platform intelligence monitored 24/7.
            </p>
          </div>

          {/* Metric cards */}
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5 mb-10">
            {[
              { label: 'Total Leads', value: totalLeads, icon: Activity, sub: 'Live tracking', subColor: 'text-primary' },
              { label: 'High-Intent', value: highIntentLeads, icon: Radar, sub: 'Score ≥ 80', subColor: 'text-primary', highlight: true },
              { label: 'Competitor Alerts', value: competitorLeads, icon: Flame, sub: 'High-poach leads', subColor: 'text-destructive' },
              { label: 'Last 24h', value: recentSignals, icon: Clock, sub: 'New signals', subColor: 'text-muted-foreground' },
              { 
                label: 'Autonomous Tasks', 
                value: llmUsage?.totals.requestCount || 0, 
                icon: Brain, 
                sub: 'AI Inferences Run', 
                subColor: 'text-primary' 
              },
            ].map((m, i) => (
              <Card key={i} className={`shadow-lg border-border/40 overflow-hidden group relative transition-all duration-300 hover:shadow-primary/5 ${m.highlight ? 'bg-primary/5 border-primary/30' : 'bg-card hover:border-primary/40'}`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 bg-linear-to-br from-muted/10 to-transparent">
                  <CardTitle className={`text-xs font-black uppercase tracking-widest ${m.highlight ? 'text-primary' : 'text-muted-foreground'}`}>{m.label}</CardTitle>
                  <m.icon className={`h-4 w-4 ${m.highlight ? 'text-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]' : 'text-muted-foreground'}`} />
                </CardHeader>
                <CardContent className="pt-4">
                  <div className={`text-3xl font-black tracking-tight ${m.highlight ? 'text-primary' : ''}`}>{m.value}</div>
                  <p className={`text-xs font-bold uppercase tracking-widest mt-2 ${m.subColor}`}>{m.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
 
           {/* Lead stream */}
           <Card className="border-border/50 shadow-2xl bg-card overflow-hidden rounded-md">
             <CardHeader className="border-b border-border/50 pb-6">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                   <Radar className="text-primary h-5 w-5" />
                 </div>
                 <div>
                   <CardTitle className="text-2xl font-black tracking-tight flex items-center">
                     Live Detection Stream
                   </CardTitle>
                   <CardDescription className="text-xs font-medium text-muted-foreground/60 mt-0.5 uppercase tracking-wider">
                     Keyword matches, semantic finds, and competitor signals monitored 24/7.
                   </CardDescription>
                 </div>
               </div>
             </CardHeader>

            {/* Tabs */}
            <div className="flex gap-0 border-b border-border/40">
              {TABS.map(tab => (
                <button key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-colors border-b-2 -mb-px ${
                    activeTab === tab.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}>
                  {tab.label} {tab.count > 0 && <span className="ml-1 bg-muted px-1.5 py-0.5 rounded-full text-xs">{tab.count}</span>}
                </button>
              ))}
            </div>

            <CardContent className="p-0">
              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground mt-4 animate-pulse">Scanning the matrix...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <p className="text-red-500 font-semibold">Error: {error}</p>
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center">
                  <Radar className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="font-bold text-foreground">No signals in this view</p>
                  <p className="text-sm text-muted-foreground mt-1">Adjust your filters or check back later.</p>
                </div>
              ) : (
                <div>
                  {filteredLeads.map(lead => (
                    <LeadRow key={lead.id} lead={lead}
                      draftingLeadId={draftingLeadId}
                      draftedReply={draftedReplies[lead.id]}
                      isExpanded={expandedReplies[lead.id]}
                      onDraftReply={handleDraftReply}
                      onToggleExpand={(id) => setExpandedReplies(prev => ({ ...prev, [id]: !prev[id] }))}
                      onStatusChange={handleStatusChange}
                      onNotesChange={handleNotesChange}
                      onFeedbackChange={handleFeedbackChange}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
      </div>

    </>
  )
}
