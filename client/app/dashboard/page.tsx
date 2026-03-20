"use client"

import { useAuth } from "@/context/auth-context"
import { Navbar } from "@/components/landing/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Radar, Users, MessageSquareText, Activity, ExternalLink, Zap, Clock, ChevronRight,
  RotateCw, Linkedin, Twitter, Github, FileText, ChevronDown, Brain, Flame
} from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { io, Socket } from "socket.io-client"
import React, { memo } from "react"
import { OnboardingModal } from "@/components/dashboard/OnboardingModal"

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
  notes?: string | null;
  postedAt: string;
  createdAt: string;
  product: { name: string };
  replies?: Array<{ id: string; generatedText: string; createdAt: string }>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'NEW',       label: 'New',       color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  { value: 'QUALIFIED', label: 'Qualified', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { value: 'SAVED',     label: 'Saved',     color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  { value: 'CONTACTED', label: 'Contacted', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { value: 'CONVERTED', label: 'Converted 🎉', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  { value: 'DISMISSED', label: 'Dismissed', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

const getIntentColor = (level: string) => {
  switch (level) {
    case 'BUY_NOW':     return 'bg-red-500/10 text-red-500 border-red-500/20'
    case 'COMPARING':   return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    case 'RESEARCHING': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    default:            return 'bg-slate-500/10 text-slate-500 border-slate-500/20'
  }
}

const DetectionBadge = ({ detectedBy }: { detectedBy: DetectedBy }) => {
  if (detectedBy === 'COMPETITOR') return (
    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
      <Flame className="w-2.5 h-2.5" /> Competitor Alert
    </span>
  )
  if (detectedBy === 'SEMANTIC') return (
    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30">
      <Brain className="w-2.5 h-2.5" /> Semantic Find
    </span>
  )
  return null
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
  onDraftReply, onToggleExpand, onStatusChange, onNotesChange,
}: {
  lead: Lead
  draftingLeadId: string | null
  draftedReply?: string
  isExpanded?: boolean
  onDraftReply: (id: string) => void
  onToggleExpand: (id: string) => void
  onStatusChange: (id: string, status: LeadStatus) => void
  onNotesChange: (id: string, notes: string) => void
}) => {
  const [showNotes, setShowNotes] = useState(false)
  const [localNotes, setLocalNotes] = useState(lead.notes || '')
  const currentStatus = STATUS_OPTIONS.find(s => s.value === lead.status) || STATUS_OPTIONS[0]

  const handleNotesBlur = useCallback(() => {
    if (localNotes !== lead.notes) {
      onNotesChange(lead.id, localNotes)
    }
  }, [lead.id, lead.notes, localNotes, onNotesChange])

  return (
    <div className="group relative border-b border-border/40 last:border-0">
      {/* Competitor Alert hot-border */}
      {lead.detectedBy === 'COMPETITOR' && (
        <div className="absolute left-0 top-0 w-0.5 h-full bg-gradient-to-b from-red-500 to-orange-500" />
      )}
      {lead.detectedBy === 'SEMANTIC' && (
        <div className="absolute left-0 top-0 w-0.5 h-full bg-gradient-to-b from-violet-500 to-purple-500" />
      )}

      <div className="p-5 pl-6 md:p-6 md:pl-7 hover:bg-muted/10 transition-colors flex flex-col md:flex-row gap-5 items-start">
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
              {lead.platform}
            </span>
            <span className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full border ${getIntentColor(lead.intentLevel)}`}>
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

          {/* Meta row */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-muted-foreground">
            <span className="flex items-center text-foreground/80 font-semibold bg-secondary px-2 py-0.5 rounded-md">
              <Users className="w-3 h-3 mr-1.5" />
              {lead.product?.name || 'System Query'}
            </span>
            <span className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {new Date(lead.postedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
            className="flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:bg-primary/90 transition-all shadow-sm active:scale-95">
            Engage <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Status pill */}
          <div className="relative w-full group/status">
            <button className={`flex items-center justify-between w-full py-2 px-3 text-xs font-bold rounded-lg border transition-all ${currentStatus.color}`}>
              {currentStatus.label}
              <ChevronDown className="w-3 h-3 ml-1" />
            </button>
            <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-card border border-border rounded-lg shadow-xl overflow-hidden hidden group-hover/status:block">
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
              className="flex items-center justify-center gap-1.5 flex-1 py-2 px-3 bg-secondary text-secondary-foreground text-xs font-bold rounded-lg hover:bg-secondary/80 border border-border transition-all active:scale-95 disabled:opacity-50">
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
                className="p-2 bg-secondary text-secondary-foreground rounded-lg border border-border hover:bg-secondary/80 transition-all active:scale-95">
                <MessageSquareText className="w-3.5 h-3.5" />
              </button>
            )}

            <button onClick={() => setShowNotes(v => !v)} title="Notes"
              className={`p-2 rounded-lg border transition-all active:scale-95 ${showNotes ? 'bg-primary/10 text-primary border-primary/30' : 'bg-secondary text-secondary-foreground border-border hover:bg-secondary/80'}`}>
              <FileText className="w-3.5 h-3.5" />
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
            className="w-full h-28 text-sm text-foreground bg-muted/5 border border-border rounded-lg p-3 outline-none resize-none focus:border-primary/50 transition-colors"
            value={draftedReply}
          />
        </div>
      )}

      {/* Notes panel */}
      {showNotes && (
        <div className="border-t border-border/40 px-6 py-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <textarea
            className="w-full h-20 text-sm text-foreground bg-muted/5 border border-border rounded-lg p-3 outline-none resize-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/50"
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
  const [isScanning, setIsScanning] = useState(false)
  const router = useRouter()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [hasFetchedProducts, setHasFetchedProducts] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login"); return }
    if (!user) return

    fetchLeads()
    fetchProducts()

    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || ''
    const newSocket = io(socketUrl, { withCredentials: true, transports: ['websocket', 'polling'] })

    newSocket.on('connect', () => newSocket.emit('join-user-room', user.id))
    newSocket.on('new-lead', (newLead: Lead) => {
      setLeads(prev => prev.find(l => l.id === newLead.id) ? prev : [newLead, ...prev])
    })

    setSocket(newSocket)
    return () => { newSocket.disconnect() }
  }, [user, authLoading, router])

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch products')
      const data = await res.json()
      if (data.products && data.products.length === 0) {
        setShowOnboarding(true)
      }
      setHasFetchedProducts(true)
    } catch (e) {
      console.error('Error fetching products:', e)
    }
  }

  const fetchLeads = async () => {
    try {
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
  }

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

  const handleForceScan = async () => {
    setIsScanning(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/scan`, { method: 'POST', credentials: 'include' })
      if (!res.ok) throw new Error('Scan failed')
      setTimeout(() => setIsScanning(false), 60000)
    } catch { setIsScanning(false) }
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

  if (authLoading) return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )

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
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(var(--primary-rgb),0.05),transparent_70%)] blur-[80px]" />
      </div>

      <div className="relative z-10">
        <Navbar />

        <main className="flex-1 container mx-auto px-4 py-12 max-w-7xl">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Welcome back, {user?.username}
            </h1>
            <p className="text-muted-foreground mt-2 text-base max-w-2xl">
              Your radar is active across Reddit &amp; HackerNews. Keyword, semantic, and competitor signals monitored 24/7.
            </p>
          </div>

          {/* Metric cards */}
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 mb-10">
            {[
              { label: 'Total Leads', value: totalLeads, icon: Activity, sub: 'Live tracking', subColor: 'text-primary' },
              { label: 'High-Intent', value: highIntentLeads, icon: Radar, sub: 'Score ≥ 80', subColor: 'text-primary', highlight: true },
              { label: 'Competitor Alerts', value: competitorLeads, icon: Flame, sub: 'High-poach leads', subColor: 'text-red-400' },
              { label: 'Last 24h', value: recentSignals, icon: Clock, sub: 'New signals', subColor: 'text-muted-foreground' },
            ].map((m, i) => (
              <Card key={i} className={`shadow-lg border-border/40 overflow-hidden group relative ${m.highlight ? 'bg-primary/5 border-primary/30' : 'bg-card hover:border-primary/40 transition-colors'}`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className={`text-xs font-bold uppercase tracking-widest ${m.highlight ? 'text-primary' : 'text-muted-foreground'}`}>{m.label}</CardTitle>
                  <m.icon className={`h-4 w-4 ${m.highlight ? 'text-primary' : 'text-muted-foreground'}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-4xl font-black ${m.highlight ? 'text-primary' : ''}`}>{m.value}</div>
                  <p className={`text-xs font-medium mt-1.5 ${m.subColor}`}>{m.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Lead stream */}
          <Card className="border-border/50 shadow-xl bg-card overflow-hidden rounded-2xl">
            <CardHeader className="border-b border-border/40 bg-muted/10 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold flex items-center">
                  <Radar className="mr-2.5 text-primary h-5 w-5" /> Live Detection Stream
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  Keyword matches, semantic finds, and competitor signals — all in one place.
                </CardDescription>
              </div>
              <button onClick={handleForceScan} disabled={isScanning}
                className="flex items-center gap-2 py-2 px-5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground font-bold rounded-lg text-sm transition-all active:scale-95 disabled:opacity-50">
                {isScanning ? (
                  <><div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> Scanning...</>
                ) : (
                  <><Zap className="w-3.5 h-3.5" /> Force Scan</>
                )}
              </button>
            </CardHeader>

            {/* Tabs */}
            <div className="flex gap-0 border-b border-border/40 overflow-x-auto">
              {TABS.map(tab => (
                <button key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-colors border-b-2 -mb-px ${
                    activeTab === tab.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}>
                  {tab.label} {tab.count > 0 && <span className="ml-1 bg-muted px-1.5 py-0.5 rounded-full text-[10px]">{tab.count}</span>}
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
                  <p className="text-sm text-muted-foreground mt-1">Run a scan or adjust your filters.</p>
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
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <OnboardingModal 
        isOpen={showOnboarding} 
        onComplete={() => {
          setShowOnboarding(false)
          fetchLeads()
        }} 
      />
    </div>
  )
}
