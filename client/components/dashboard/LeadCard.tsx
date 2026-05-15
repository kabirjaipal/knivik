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
    <div className={`group relative border-b border-border/40 last:border-0 border-l-2 ${getAccentBorder(lead.detectedBy)}`}>
      <div className="pl-4 pr-4 pt-3 pb-2 hover:bg-muted/[0.06] transition-colors">

        {/* ── Row 1: badges + score + engage ──────────────────────────── */}
        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
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
              <Flame className="w-2.5 h-2.5 fill-current" /> Competitor
            </span>
          )}
          {lead.detectedBy === 'SEMANTIC' && (
            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
              <Brain className="w-2.5 h-2.5" /> Semantic
            </span>
          )}
          {lead.detectedBy === 'KEYWORD' && (
            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
              <Tags className="w-2.5 h-2.5" /> Keyword
            </span>
          )}

          {/* Spacer + Engage button pushed right */}
          <a href={lead.url} target="_blank" rel="noreferrer"
            className="ml-auto flex items-center gap-1 text-[10px] font-black uppercase tracking-widest py-1 px-3 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-all active:scale-95 shrink-0">
            Engage <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>

        {/* ── Row 2: title ────────────────────────────────────────────── */}
        <h3 className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors mb-1">
          {lead.title || 'Found Conversation Thread'}
        </h3>

        {/* ── Row 3: content preview ──────────────────────────────────── */}
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-1.5">
          {lead.content}
        </p>

        {/* ── Row 4: AI reasoning (if present) ───────────────────────── */}
        {lead.metadata?.qualificationReasoning && (
          <div className="flex gap-1.5 items-start mb-1.5 p-1.5 bg-primary/5 rounded border border-primary/10">
            <Info className="w-2.5 h-2.5 text-primary mt-0.5 shrink-0" />
            <p className="text-[11px] text-primary/70 leading-relaxed italic line-clamp-2">
              {lead.metadata.qualificationReasoning}
            </p>
          </div>
        )}

        {/* ── Row 5: meta + all action controls ──────────────────────── */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1.5 border-t border-border/30">
          {/* Meta info */}
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
            <Clock className="w-2.5 h-2.5" />
            {new Date(lead.postedAt || lead.createdAt).toLocaleDateString(undefined, {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </span>

          {lead.authorUsername && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
              u/{lead.authorUsername}
              <EnrichmentIcons enrichment={lead.enrichment} />
            </span>
          )}

          {showProductName && lead.product?.name && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-foreground/60 bg-secondary px-1.5 py-0.5 rounded">
              <Users className="w-2.5 h-2.5" />
              {lead.product.name}
            </span>
          )}

          {/* Actions pushed right */}
          <div className="ml-auto flex items-center gap-1.5">
            {/* Status dropdown */}
            <div className="relative group/status">
              <button className={`flex items-center gap-1 text-[10px] font-bold py-1 px-2 rounded border transition-all ${currentStatus.color}`}>
                {currentStatus.label} <ChevronDown className="w-2.5 h-2.5" />
              </button>
              <div className="absolute z-20 bottom-full mb-1 right-0 min-w-[110px] bg-card border border-border rounded-md shadow-xl overflow-hidden hidden group-hover/status:block">
                {STATUS_OPTIONS.map(opt => (
                  <button key={opt.value}
                    onClick={() => onStatusChange(lead.id, opt.value)}
                    className={`w-full text-left px-3 py-1.5 text-[11px] font-semibold hover:bg-muted transition-colors ${opt.value === lead.status ? 'opacity-40 cursor-default' : ''}`}>
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
              className="flex items-center gap-1 text-[10px] font-bold py-1 px-2 bg-secondary text-secondary-foreground rounded border border-border hover:bg-secondary/80 transition-all active:scale-95 disabled:opacity-50">
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
                className={`p-1.5 rounded border transition-all active:scale-95 ${isExpanded ? 'bg-primary/10 text-primary border-primary/30' : 'bg-secondary text-secondary-foreground border-border hover:bg-secondary/80'}`}>
                <MessageSquareText className="w-3 h-3" />
              </button>
            )}

            {/* Notes */}
            <button onClick={() => setShowNotes(v => !v)} title="Internal notes"
              className={`p-1.5 rounded border transition-all active:scale-95 ${showNotes ? 'bg-primary/10 text-primary border-primary/30' : 'bg-secondary text-secondary-foreground border-border hover:bg-secondary/80'}`}>
              <FileText className="w-3 h-3" />
            </button>

            {/* Feedback */}
            <button
              onClick={() => onFeedbackChange(lead.id, lead.feedback === 1 ? 0 : 1)}
              title="Good Lead"
              className={`p-1.5 rounded border transition-all active:scale-90 ${lead.feedback === 1 ? 'bg-success/20 text-success border-success/40' : 'text-muted-foreground/50 border-transparent hover:bg-muted'}`}>
              <ThumbsUp className="w-3 h-3" />
            </button>
            <button
              onClick={() => onFeedbackChange(lead.id, lead.feedback === -1 ? 0 : -1)}
              title="Bad Lead"
              className={`p-1.5 rounded border transition-all active:scale-90 ${lead.feedback === -1 ? 'bg-destructive/20 text-destructive border-destructive/40' : 'text-muted-foreground/50 border-transparent hover:bg-muted'}`}>
              <ThumbsDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Expandable: AI Draft ─────────────────────────────────────────────── */}
      {draftedReply && isExpanded && (
        <div className="border-t border-border/40 px-4 py-3 bg-primary/[0.02] relative animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="absolute left-0 top-0 w-0.5 h-full bg-primary" />
          <h4 className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-black text-primary mb-2">
            <Zap className="w-2.5 h-2.5" /> AI Draft
          </h4>
          <textarea readOnly
            className="w-full h-24 text-xs text-foreground bg-muted/5 border border-border rounded p-2.5 outline-none resize-none focus:border-primary/40 transition-colors"
            value={draftedReply}
          />
        </div>
      )}

      {/* ── Expandable: Notes ────────────────────────────────────────────────── */}
      {showNotes && (
        <div className="border-t border-border/40 px-4 py-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <textarea
            className="w-full h-16 text-xs text-foreground bg-muted/5 border border-border rounded p-2.5 outline-none resize-none focus:border-primary/40 transition-colors placeholder:text-muted-foreground/40"
            placeholder="Internal notes about this lead..."
            value={localNotes}
            onChange={e => setLocalNotes(e.target.value)}
            onBlur={handleNotesBlur}
          />
          <p className="text-[10px] text-muted-foreground/40 mt-0.5">Auto-saved on blur</p>
        </div>
      )}
    </div>
  )
})
LeadCard.displayName = 'LeadCard'
