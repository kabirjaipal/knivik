"use client"

import { memo, useState, useCallback } from "react"
import {
  ExternalLink, Zap, MessageSquareText, FileText, ChevronRight, ChevronDown,
  RotateCw, Brain, Flame, Tags,
  ThumbsUp, ThumbsDown, Info, Clock, Users, Lock,
  Copy, Check
} from "lucide-react"
import { FaLinkedin, FaTwitter, FaGithub } from "react-icons/fa"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"


// ─── Types ─────────────────────────────────────────────────────────────────────

export type LeadStatus = 'NEW' | 'QUALIFIED' | 'SAVED' | 'CONTACTED' | 'CONVERTED' | 'DISMISSED'
export type DetectedBy = 'KEYWORD' | 'SEMANTIC' | 'COMPETITOR'

export interface LeadEnrichment {
  linkedinUrl?: string
  twitterUrl?: string
  githubUrl?: string
}

export interface LeadCardData {
  id: string
  platform: string
  externalPostId: string
  title: string | null
  content: string
  url: string
  authorUsername: string | null
  intentLevel: 'BUY_NOW' | 'COMPARING'
  intentScore: number
  status: LeadStatus
  detectedBy: DetectedBy
  enrichment?: LeadEnrichment | null
  feedback?: number | null
  notes?: string | null
  metadata?: { qualificationReasoning?: string } | null
  postedAt?: string | null
  createdAt: string
  product?: { name: string }
  replies?: Array<{ id: string; generatedText: string; createdAt: string }>
}

// ─── Constants ──────────────────────────────────────────────────────────────────

export const STATUS_OPTIONS: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'NEW',       label: 'New',         color: 'bg-muted/50 text-muted-foreground border-border' },
  { value: 'QUALIFIED', label: 'Qualified',    color: 'bg-primary/10 text-primary border-primary/20' },
  { value: 'SAVED',     label: 'Saved',        color: 'bg-primary/10 text-primary border-primary/20' },
  { value: 'CONTACTED', label: 'Contacted',    color: 'bg-primary/10 text-primary border-primary/20' },
  { value: 'CONVERTED', label: 'Converted 🎉', color: 'bg-success/10 text-success border-success/20' },
  { value: 'DISMISSED', label: 'Dismissed',    color: 'bg-destructive/10 text-destructive border-destructive/20' },
]

// ─── Helpers ────────────────────────────────────────────────────────────────────

const getIntentColor = (level: string) => {
  switch (level) {
    case 'BUY_NOW':   return 'bg-destructive/10 text-destructive border-destructive/20'
    case 'COMPARING': return 'bg-primary/10 text-primary border-primary/20'
    default:          return 'bg-muted text-muted-foreground border-border'
  }
}

const getAccentBorder = (detectedBy: DetectedBy) => {
  if (detectedBy === 'COMPETITOR') return 'border-l-destructive'
  if (detectedBy === 'SEMANTIC')   return 'border-l-primary'
  return 'border-l-border/40'
}

// ─── Enrichment icons ────────────────────────────────────────────────────────────

const EnrichmentIcons = ({ enrichment }: { enrichment?: LeadEnrichment | null }) => {
  if (!enrichment) return null
  return (
    <span className="flex items-center gap-1">
      {enrichment.linkedinUrl && (
        <a href={enrichment.linkedinUrl} target="_blank" rel="noreferrer" title="LinkedIn"
          className="text-blue-400 hover:text-blue-300 transition-colors">
          <FaLinkedin className="w-3 h-3" />
        </a>
      )}
      {enrichment.twitterUrl && (
        <a href={enrichment.twitterUrl} target="_blank" rel="noreferrer" title="Twitter"
          className="text-sky-400 hover:text-sky-300 transition-colors">
          <FaTwitter className="w-3 h-3" />
        </a>
      )}
      {enrichment.githubUrl && (
        <a href={enrichment.githubUrl} target="_blank" rel="noreferrer" title="GitHub"
          className="text-foreground/60 hover:text-foreground transition-colors">
          <FaGithub className="w-3 h-3" />
        </a>
      )}
    </span>
  )
}

// ─── LeadCard Props ──────────────────────────────────────────────────────────────

export interface LeadCardProps {
  lead: LeadCardData
  draftingLeadId?: string | null
  draftedReply?: string
  isExpanded?: boolean
  showProductName?: boolean
  isFreePlan?: boolean
  onDraftReply: (id: string) => void
  onToggleExpand: (id: string) => void
  onStatusChange: (id: string, status: LeadStatus) => void
  onNotesChange: (id: string, notes: string) => void
  onFeedbackChange: (id: string, feedback: number) => void
}

// ─── LeadCard ────────────────────────────────────────────────────────────────────

export const LeadCard = memo(({
  lead, draftingLeadId, draftedReply, isExpanded,
  showProductName = true, isFreePlan = false,
  onDraftReply, onToggleExpand, onStatusChange, onNotesChange, onFeedbackChange,
}: LeadCardProps) => {
  const [showNotes, setShowNotes] = useState(false)
  const [localNotes, setLocalNotes] = useState(lead.notes || '')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    if (!draftedReply) return
    navigator.clipboard.writeText(draftedReply)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [draftedReply])
  const currentStatus = STATUS_OPTIONS.find(s => s.value === lead.status) ?? STATUS_OPTIONS[0]!

  const isTruncated = lead.content.length > 260
  const displayContent = isTruncated ? `${lead.content.slice(0, 260)}...` : lead.content

  const handleNotesBlur = useCallback(() => {
    if (localNotes !== (lead.notes || '')) onNotesChange(lead.id, localNotes)
  }, [lead.id, lead.notes, localNotes, onNotesChange])

  const isDrafting = draftingLeadId === lead.id

  return (
    <div className={`group relative bg-card rounded-xl border border-border/40 overflow-hidden shadow-sm transition-all hover:shadow-md hover:border-border/60 border-l-4 ${getAccentBorder(lead.detectedBy)}`}>
      <div className="p-4 hover:bg-muted/5 transition-colors">

        {/* ── Row 1: badges + score + engage ──────────────────────────── */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          {/* Platform */}
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {lead.platform}
          </span>

          {/* Intent level */}
          <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${getIntentColor(lead.intentLevel)}`}>
            {lead.intentLevel.replace('_', ' ')}
          </span>

          {/* Score */}
          <span className="text-[10px] font-black px-1.5 py-0.5 bg-primary/10 text-primary rounded">
            ★ {lead.intentScore}
          </span>

          {/* Detection badge */}
          {lead.detectedBy === 'COMPETITOR' && (
            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-destructive/15 text-destructive border border-destructive/30">
              <Flame className="w-3 h-3 fill-current" /> Competitor
            </span>
          )}
          {lead.detectedBy === 'SEMANTIC' && (
            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
              <Brain className="w-3 h-3" /> Semantic
            </span>
          )}
          {lead.detectedBy === 'KEYWORD' && (
            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
              <Tags className="w-3 h-3" /> Keyword
            </span>
          )}

          {/* Spacer + Engage button pushed right */}
          <a href={lead.url} target="_blank" rel="noreferrer"
            className="ml-auto flex items-center gap-1 text-[10px] font-black uppercase tracking-widest py-1 px-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all active:scale-95 shrink-0 shadow-sm shadow-primary/20">
            Engage <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>

        {/* ── Row 2: title ────────────────────────────────────────────── */}
        <h3 className="text-sm font-black text-foreground group-hover:text-primary transition-colors mb-1">
          {lead.title || 'Found Conversation Thread'}
        </h3>

        {/* ── Row 3: content preview ──────────────────────────────────── */}
        <p className="text-xs text-muted-foreground leading-relaxed mb-2 whitespace-pre-wrap">
          {displayContent}
          {isTruncated && (
            <button
              onClick={() => setIsDialogOpen(true)}
              className="ml-1.5 text-primary hover:text-primary/80 font-black cursor-pointer hover:underline focus:outline-none"
            >
              Read more
            </button>
          )}
        </p>

        {/* ── Row 4: AI reasoning (if present) ───────────────────────── */}
        {lead.metadata?.qualificationReasoning && (
          <div className="flex gap-1.5 items-start mb-2 p-1.5 bg-primary/5 rounded-lg border border-primary/10">
            <div className="p-0.5"><Info className="w-3 h-3 text-primary shrink-0" /></div>
            <p className="text-[11px] text-primary/80 leading-relaxed italic">
              {lead.metadata.qualificationReasoning}
            </p>
          </div>
        )}

        {/* ── Row 5: meta + all action controls ──────────────────────── */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-2 border-t border-border/40">
          {/* Meta info */}
          <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
            <Clock className="w-2.5 h-2.5" />
            {new Date(lead.postedAt || lead.createdAt).toLocaleDateString(undefined, {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </span>

          {lead.authorUsername && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
              u/{lead.authorUsername}
              <EnrichmentIcons enrichment={lead.enrichment} />
            </span>
          )}

          {showProductName && lead.product?.name && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-foreground/70 bg-secondary px-1.5 py-0.5 rounded">
              <Users className="w-2.5 h-2.5" />
              {lead.product.name}
            </span>
          )}

          {/* Actions pushed right */}
          <div className="ml-auto flex items-center gap-1.5">
            {/* Status dropdown */}
            <select
              value={lead.status}
              onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
              className={`text-[10px] font-bold py-1 px-2.5 rounded-lg border transition-all cursor-pointer outline-none bg-transparent ${currentStatus.color}`}
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-popover text-foreground font-semibold">
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Draft reply */}
            <button
              onClick={() => onDraftReply(lead.id)}
              disabled={isDrafting}
              title="Generate AI draft reply"
              className="flex items-center gap-1 text-[10px] font-bold py-1 px-2 bg-secondary text-secondary-foreground rounded-lg border border-border hover:bg-secondary/80 transition-all active:scale-95 disabled:opacity-50">
              {isDrafting ? (
                <div className="w-2.5 h-2.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
              ) : draftedReply ? (
                <><RotateCw className="w-2.5 h-2.5" /> Regen</>
              ) : (
                <><ChevronRight className="w-2.5 h-2.5" /> Draft</>
              )}
            </button>

            {/* View draft toggle */}
            {draftedReply && (
              <button onClick={() => onToggleExpand(lead.id)} title="View AI Draft"
                className={`p-1.5 rounded-lg border transition-all active:scale-95 ${isExpanded ? 'bg-primary/10 text-primary border-primary/30' : 'bg-secondary text-secondary-foreground border-border hover:bg-secondary/80'}`}>
                <MessageSquareText className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Notes */}
            <button onClick={() => setShowNotes(v => !v)} title="Internal notes"
              className={`p-1.5 rounded-lg border transition-all active:scale-95 ${showNotes ? 'bg-primary/10 text-primary border-primary/30' : 'bg-secondary text-secondary-foreground border-border hover:bg-secondary/80'}`}>
              <FileText className="w-3.5 h-3.5" />
            </button>

            {/* Feedback */}
            <div className="flex bg-secondary rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => onFeedbackChange(lead.id, lead.feedback === 1 ? 0 : 1)}
                title="Good Lead"
                className={`p-1.5 transition-all active:scale-90 ${lead.feedback === 1 ? 'bg-success/20 text-success border-r border-success/40' : 'text-muted-foreground/50 hover:bg-muted border-r border-border'}`}>
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onFeedbackChange(lead.id, lead.feedback === -1 ? 0 : -1)}
                title="Bad Lead"
                className={`p-1.5 transition-all active:scale-90 ${lead.feedback === -1 ? 'bg-destructive/20 text-destructive' : 'text-muted-foreground/50 hover:bg-muted'}`}>
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Expandable: AI Draft ─────────────────────────────────────────────── */}
      {draftedReply && isExpanded && (
        <div className="border-t border-border/40 px-5 py-4 bg-primary/5 relative animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="absolute left-0 top-0 w-1 h-full bg-primary" />
          
          <div className="flex items-center justify-between mb-3">
            <h4 className="flex items-center gap-1.5 text-xs uppercase tracking-widest font-black text-primary">
              <Zap className="w-3.5 h-3.5" /> AI Draft
            </h4>
            {!isFreePlan && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest py-1 px-2.5 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-all active:scale-95 shadow-sm"
              >
                {copied ? (
                  <><Check className="w-3 h-3 text-emerald-500 mr-1" /> Copied</>
                ) : (
                  <><Copy className="w-3 h-3 mr-1" /> Copy Draft</>
                )}
              </button>
            )}
          </div>
          
          {isFreePlan ? (
            <div className="relative rounded-lg overflow-hidden border border-border/60 shadow-sm p-4 bg-card flex flex-col items-center justify-center text-center py-8">
              {/* Blurred dummy text backdrop */}
              <div className="absolute inset-0 filter blur-[5px] opacity-[0.15] select-none pointer-events-none p-4 text-xs font-bold leading-relaxed text-left">
                Hey growth_hacker_dan! I totally feel your pain—most traditional social listening tools are built for huge PR agencies and scan only once a day. We actually built Knivik precisely for this. It runs continuous, rapid-scanning loops on Reddit and pushes new high-intent threads directly to Slack within minutes. You can set up a keyword like 'CRM tools' in under 60 seconds and try it completely free. Happy to set you up with extra scan credits if you want to stress-test it! Let me know if you want to check it out!
              </div>
              <div className="relative z-10 flex flex-col items-center max-w-sm">
                <div className="p-2.5 bg-primary/10 text-primary rounded-full mb-3 shadow-inner">
                  <Lock className="w-5 h-5" />
                </div>
                <h5 className="text-xs font-black uppercase tracking-wider text-foreground mb-1">AI Outreach Draft Locked</h5>
                <p className="text-[11px] text-muted-foreground mb-4">
                  Upgrade to Pro to unlock unlimited, instant personalized AI outreach replies matched to your brand persona.
                </p>
                <a href="/dashboard/billing" className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest py-1.5 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20">
                  Go Pro <ChevronRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : (
            <textarea readOnly
              className="w-full h-28 text-sm text-foreground bg-card border border-border/60 rounded-lg p-3 outline-none resize-none focus:border-primary/40 transition-colors shadow-sm"
              value={draftedReply}
            />
          )}
        </div>
      )}

      {/* ── Expandable: Notes ────────────────────────────────────────────────── */}
      {showNotes && (
        <div className="border-t border-border/40 px-5 py-4 bg-muted/10 animate-in fade-in slide-in-from-top-1 duration-200">
          <textarea
            className="w-full h-20 text-sm text-foreground bg-card border border-border/60 rounded-lg p-3 outline-none resize-none focus:border-primary/40 transition-colors placeholder:text-muted-foreground/40 shadow-sm"
            placeholder="Internal notes about this lead..."
            value={localNotes}
            onChange={e => setLocalNotes(e.target.value)}
            onBlur={handleNotesBlur}
          />
          <p className="text-xs text-muted-foreground mt-1.5 font-medium">Auto-saved on blur</p>
        </div>
      )}

      {/* ── Dialog for Full Content ───────────────────────────────────────── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[80vh] flex flex-col p-6 rounded-2xl border border-border bg-card shadow-2xl">
          <DialogHeader className="pb-3 border-b border-border/40">
            <DialogTitle className="text-base font-bold text-foreground">
              {lead.title || 'Conversation Content'}
            </DialogTitle>
          </DialogHeader>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto py-4 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed font-medium">
            {lead.content}
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-border/40 flex justify-end gap-3 shrink-0">
            <button
              onClick={() => setIsDialogOpen(false)}
              className="text-xs font-bold py-2 px-4 border border-border hover:bg-muted rounded-xl transition-all cursor-pointer"
            >
              Close
            </button>
            <a
              href={lead.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs font-bold py-2 px-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all cursor-pointer"
            >
              Open Post <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
})
LeadCard.displayName = 'LeadCard'
