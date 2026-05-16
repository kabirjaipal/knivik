"use client"

import { memo, useState, useCallback } from "react"
import {
  ExternalLink, Zap, MessageSquareText, FileText, ChevronRight, ChevronDown,
  RotateCw, Linkedin, Twitter, Github, Brain, Flame, Tags,
  ThumbsUp, ThumbsDown, Info, Clock, Users
} from "lucide-react"

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
  intentLevel: 'BUY_NOW' | 'RESEARCHING' | 'COMPARING' | 'LOW_INTENT'
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
    case 'BUY_NOW':     return 'bg-destructive/10 text-destructive border-destructive/20'
    case 'COMPARING':   return 'bg-primary/10 text-primary border-primary/20'
    case 'RESEARCHING': return 'bg-primary/10 text-primary border-primary/20'
    default:            return 'bg-muted text-muted-foreground border-border'
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
          <Linkedin className="w-3 h-3" />
        </a>
      )}
      {enrichment.twitterUrl && (
        <a href={enrichment.twitterUrl} target="_blank" rel="noreferrer" title="Twitter"
          className="text-sky-400 hover:text-sky-300 transition-colors">
          <Twitter className="w-3 h-3" />
        </a>
      )}
      {enrichment.githubUrl && (
        <a href={enrichment.githubUrl} target="_blank" rel="noreferrer" title="GitHub"
          className="text-foreground/60 hover:text-foreground transition-colors">
          <Github className="w-3 h-3" />
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
  onDraftReply: (id: string) => void
  onToggleExpand: (id: string) => void
  onStatusChange: (id: string, status: LeadStatus) => void
  onNotesChange: (id: string, notes: string) => void
  onFeedbackChange: (id: string, feedback: number) => void
}

// ─── LeadCard ────────────────────────────────────────────────────────────────────

export const LeadCard = memo(({
  lead, draftingLeadId, draftedReply, isExpanded,
  showProductName = true,
  onDraftReply, onToggleExpand, onStatusChange, onNotesChange, onFeedbackChange,
}: LeadCardProps) => {
  const [showNotes, setShowNotes] = useState(false)
  const [localNotes, setLocalNotes] = useState(lead.notes || '')
  const currentStatus = STATUS_OPTIONS.find(s => s.value === lead.status) ?? STATUS_OPTIONS[0]!

  const handleNotesBlur = useCallback(() => {
    if (localNotes !== (lead.notes || '')) onNotesChange(lead.id, localNotes)
  }, [lead.id, lead.notes, localNotes, onNotesChange])

  const isDrafting = draftingLeadId === lead.id

  return (
    <div className={`group relative bg-card rounded-xl border border-border/40 overflow-hidden shadow-sm transition-all hover:shadow-md hover:border-border/60 border-l-4 ${getAccentBorder(lead.detectedBy)}`}>
      <div className="p-5 hover:bg-muted/5 transition-colors">

        {/* ── Row 1: badges + score + engage ──────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {/* Platform */}
          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground bg-muted px-2 py-1 rounded-md">
            {lead.platform}
          </span>

          {/* Intent level */}
          <span className={`text-xs font-black uppercase tracking-widest px-2 py-1 rounded-md border ${getIntentColor(lead.intentLevel)}`}>
            {lead.intentLevel.replace('_', ' ')}
          </span>

          {/* Score */}
          <span className="text-xs font-black px-2 py-1 bg-primary/10 text-primary rounded-md">
            ★ {lead.intentScore}
          </span>

          {/* Detection badge */}
          {lead.detectedBy === 'COMPETITOR' && (
            <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-2 py-1 rounded-md bg-destructive/15 text-destructive border border-destructive/30">
              <Flame className="w-4 h-4 fill-current" /> Competitor
            </span>
          )}
          {lead.detectedBy === 'SEMANTIC' && (
            <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-2 py-1 rounded-md bg-primary/15 text-primary border border-primary/30">
              <Brain className="w-4 h-4" /> Semantic
            </span>
          )}
          {lead.detectedBy === 'KEYWORD' && (
            <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-2 py-1 rounded-md bg-muted text-muted-foreground border border-border">
              <Tags className="w-4 h-4" /> Keyword
            </span>
          )}

          {/* Spacer + Engage button pushed right */}
          <a href={lead.url} target="_blank" rel="noreferrer"
            className="ml-auto flex items-center gap-1.5 text-xs font-black uppercase tracking-widest py-1.5 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all active:scale-95 shrink-0 shadow-sm shadow-primary/20">
            Engage <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* ── Row 2: title ────────────────────────────────────────────── */}
        <h3 className="text-base font-black text-foreground line-clamp-1 group-hover:text-primary transition-colors mb-1.5">
          {lead.title || 'Found Conversation Thread'}
        </h3>

        {/* ── Row 3: content preview ──────────────────────────────────── */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">
          {lead.content}
        </p>

        {/* ── Row 4: AI reasoning (if present) ───────────────────────── */}
        {lead.metadata?.qualificationReasoning && (
          <div className="flex gap-2 items-start mb-3 p-2 bg-primary/5 rounded-lg border border-primary/10">
            <Info className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-primary/80 leading-relaxed italic line-clamp-2">
              {lead.metadata.qualificationReasoning}
            </p>
          </div>
        )}

        {/* ── Row 5: meta + all action controls ──────────────────────── */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 border-t border-border/40">
          {/* Meta info */}
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Clock className="w-3 h-3" />
            {new Date(lead.postedAt || lead.createdAt).toLocaleDateString(undefined, {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </span>

          {lead.authorUsername && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              u/{lead.authorUsername}
              <EnrichmentIcons enrichment={lead.enrichment} />
            </span>
          )}

          {showProductName && lead.product?.name && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-foreground/70 bg-secondary px-2 py-1 rounded-md">
              <Users className="w-3 h-3" />
              {lead.product.name}
            </span>
          )}

          {/* Actions pushed right */}
          <div className="ml-auto flex items-center gap-2">
            {/* Status dropdown */}
            <div className="relative group/status">
              <button className={`flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-lg border transition-all ${currentStatus.color}`}>
                {currentStatus.label} <ChevronDown className="w-3 h-3" />
              </button>
              <div className="absolute z-20 bottom-full mb-1 right-0 min-w-32 bg-card border border-border rounded-xl shadow-xl overflow-hidden hidden group-hover/status:block">
                {STATUS_OPTIONS.map(opt => (
                  <button key={opt.value}
                    onClick={() => onStatusChange(lead.id, opt.value)}
                    className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-muted transition-colors ${opt.value === lead.status ? 'opacity-40 cursor-default' : ''}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Draft reply */}
            <button
              onClick={() => onDraftReply(lead.id)}
              disabled={isDrafting}
              title="Generate AI draft reply"
              className="flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 bg-secondary text-secondary-foreground rounded-lg border border-border hover:bg-secondary/80 transition-all active:scale-95 disabled:opacity-50">
              {isDrafting ? (
                <div className="w-3 h-3 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
              ) : draftedReply ? (
                <><RotateCw className="w-3 h-3" /> Regen</>
              ) : (
                <><ChevronRight className="w-3 h-3" /> Draft</>
              )}
            </button>

            {/* View draft toggle */}
            {draftedReply && (
              <button onClick={() => onToggleExpand(lead.id)} title="View AI Draft"
                className={`p-2 rounded-lg border transition-all active:scale-95 ${isExpanded ? 'bg-primary/10 text-primary border-primary/30' : 'bg-secondary text-secondary-foreground border-border hover:bg-secondary/80'}`}>
                <MessageSquareText className="w-4 h-4" />
              </button>
            )}

            {/* Notes */}
            <button onClick={() => setShowNotes(v => !v)} title="Internal notes"
              className={`p-2 rounded-lg border transition-all active:scale-95 ${showNotes ? 'bg-primary/10 text-primary border-primary/30' : 'bg-secondary text-secondary-foreground border-border hover:bg-secondary/80'}`}>
              <FileText className="w-4 h-4" />
            </button>

            {/* Feedback */}
            <div className="flex bg-secondary rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => onFeedbackChange(lead.id, lead.feedback === 1 ? 0 : 1)}
                title="Good Lead"
                className={`p-2 transition-all active:scale-90 ${lead.feedback === 1 ? 'bg-success/20 text-success border-r border-success/40' : 'text-muted-foreground/50 hover:bg-muted border-r border-border'}`}>
                <ThumbsUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => onFeedbackChange(lead.id, lead.feedback === -1 ? 0 : -1)}
                title="Bad Lead"
                className={`p-2 transition-all active:scale-90 ${lead.feedback === -1 ? 'bg-destructive/20 text-destructive' : 'text-muted-foreground/50 hover:bg-muted'}`}>
                <ThumbsDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Expandable: AI Draft ─────────────────────────────────────────────── */}
      {draftedReply && isExpanded && (
        <div className="border-t border-border/40 px-5 py-4 bg-primary/5 relative animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="absolute left-0 top-0 w-1 h-full bg-primary" />
          <h4 className="flex items-center gap-1.5 text-xs uppercase tracking-widest font-black text-primary mb-3">
            <Zap className="w-3.5 h-3.5" /> AI Draft
          </h4>
          <textarea readOnly
            className="w-full h-28 text-sm text-foreground bg-card border border-border/60 rounded-lg p-3 outline-none resize-none focus:border-primary/40 transition-colors shadow-sm"
            value={draftedReply}
          />
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
    </div>
  )
})
LeadCard.displayName = 'LeadCard'
