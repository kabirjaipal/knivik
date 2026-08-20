"use client"

import { memo, useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ExternalLink, Zap, MessageSquareText, FileText, ChevronRight, RotateCw, ThumbsUp, ThumbsDown, Info, Clock, Users, Lock, Copy, Check, Trash2
} from "lucide-react"
import { FaLinkedin, FaTwitter } from "react-icons/fa"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


// ─── Types ─────────────────────────────────────────────────────────────────────

export type LeadStatus = 'NEW' | 'QUALIFIED' | 'SAVED' | 'CONTACTED' | 'CONVERTED' | 'DISMISSED'
export type DetectedBy = 'KEYWORD' | 'SEMANTIC' | 'COMPETITOR'

export interface LeadEnrichment {
  linkedinUrl?: string
  twitterUrl?: string
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
  const hasAny = enrichment.linkedinUrl || enrichment.twitterUrl
  if (!hasAny) return null
  return (
    <span className="inline-flex items-center gap-1.5 ml-2">
      {enrichment.linkedinUrl && (
        <a href={enrichment.linkedinUrl} target="_blank" rel="noreferrer" title="Inferred LinkedIn Profile (Verify manually)"
          className="text-blue-400 hover:text-blue-300 transition-all hover:scale-110 duration-150 p-0.5">
          <FaLinkedin className="w-3.5 h-3.5" />
        </a>
      )}
      {enrichment.twitterUrl && (
        <a href={enrichment.twitterUrl} target="_blank" rel="noreferrer" title="Inferred Twitter/X Profile (Verify manually)"
          className="text-sky-400 hover:text-sky-300 transition-all hover:scale-110 duration-150 p-0.5">
          <FaTwitter className="w-3.5 h-3.5" />
        </a>
      )}
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
  onDelete?: (id: string) => void
}

// ─── LeadCard ────────────────────────────────────────────────────────────────────

export const LeadCard = memo(({
  lead, draftingLeadId, draftedReply, isExpanded,
  showProductName = true, isFreePlan = false,
  onDraftReply, onToggleExpand, onStatusChange, onNotesChange, onFeedbackChange, onDelete,
}: LeadCardProps) => {
  const [showNotes, setShowNotes] = useState(false)
  const [localNotes, setLocalNotes] = useState(lead.notes || '')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
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
    <div className={`group relative bg-card rounded-xl border border-border/40 overflow-hidden shadow-sm transition-all hover:shadow-lg hover:border-primary/30 border-l-4 ${getAccentBorder(lead.detectedBy)} content-visibility-auto`}>
      <div className="p-4 hover:bg-muted/5 transition-colors">

        {/* ── Row 1: badges + score + engage ──────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap mb-2.5">
          {/* Platform */}
          <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-md border border-border/50">
            {lead.platform}
          </span>

          {/* Score */}
          <span className="text-[11px] font-black px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md shadow-xs flex items-center gap-1 font-mono">
            <Zap className="w-3 h-3 fill-primary" /> {lead.intentScore}% Intent
          </span>

          {/* Spacer + Engage button pushed right */}
          <Button size="xs" variant="default" asChild className="ml-auto uppercase tracking-widest text-[11px] font-black shadow-sm shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
            <a href={lead.url} target="_blank" rel="noreferrer">
              Engage <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </Button>
        </div>

        {/* ── Row 2: title ────────────────────────────────────────────── */}
        <h3 className="text-sm font-black text-foreground group-hover:text-primary transition-colors mb-1">
          {lead.title || 'Found Conversation Thread'}
        </h3>

        {/* ── Row 3: content preview ──────────────────────────────────── */}
        <p className="text-xs text-foreground/85 leading-relaxed mb-2 whitespace-pre-wrap">
          {displayContent}
          {isTruncated && (
            <Button
              variant="link"
              onClick={() => setIsDialogOpen(true)}
              className="h-auto p-0 ml-1.5 text-primary hover:text-primary/80 font-black text-xs cursor-pointer hover:underline"
            >
              Read more
            </Button>
          )}
        </p>

        {/* ── Row 4: AI reasoning (if present) ───────────────────────── */}
        {lead.metadata?.qualificationReasoning && (
          <div className="flex gap-1.5 items-start mb-2 p-1.5 bg-primary/5 rounded-lg border border-primary/10">
            <div className="p-0.5"><Info className="w-3 h-3 text-primary shrink-0" /></div>
            <p className="text-xs text-primary/80 leading-relaxed italic">
              {lead.metadata.qualificationReasoning}
            </p>
          </div>
        )}

        {/* ── Row 5: meta + all action controls ──────────────────────── */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-2 border-t border-border/40">
          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground" suppressHydrationWarning>
            <Clock className="w-2.5 h-2.5" />
            {new Date(lead.postedAt || lead.createdAt).toLocaleDateString("en-US", {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </span>

          {lead.authorUsername && (
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              {lead.platform === 'REDDIT' ? 'u/' : '@'}{lead.authorUsername}
              <EnrichmentIcons enrichment={lead.enrichment} />
            </span>
          )}

          {showProductName && lead.product?.name && (
            <span className="flex items-center gap-1 text-xs font-bold text-foreground/70 bg-secondary px-1.5 py-0.5 rounded">
              <Users className="w-2.5 h-2.5" />
              {lead.product.name}
            </span>
          )}

          {/* Actions pushed right */}
          <div className="ml-auto flex items-center gap-1.5">
            {/* Status dropdown */}
            <Select
              value={lead.status}
              onValueChange={(val) => onStatusChange(lead.id, val as LeadStatus)}
            >
              <SelectTrigger
                size="sm"
                className={`text-xs font-bold h-7 rounded-lg border px-2.5 transition-all outline-none bg-transparent ${currentStatus.color}`}
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent position="popper" align="end" className="font-semibold">
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs font-semibold">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Draft reply */}
            <Button
              variant="outline-primary"
              size="xs"
              onClick={() => onDraftReply(lead.id)}
              disabled={isDrafting}
              title="Generate AI draft reply"
              className="uppercase tracking-widest text-xs font-black"
            >
              {isDrafting ? (
                <div className="w-3 h-3 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
              ) : draftedReply ? (
                <><RotateCw className="w-3 h-3" /> Regen</>
              ) : (
                <><ChevronRight className="w-3 h-3" /> Draft</>
              )}
            </Button>
 
            {/* View draft toggle */}
            {draftedReply && (
              <Button
                variant={isExpanded ? "outline-primary" : "secondary"}
                size="icon-xs"
                onClick={() => onToggleExpand(lead.id)}
                title="View AI Draft"
                className={cn("border border-border/40", isExpanded && "border-primary/40")}
              >
                <MessageSquareText className="w-3.5 h-3.5" />
              </Button>
            )}
 
            {/* Notes */}
            <Button
              variant={showNotes ? "outline-primary" : "secondary"}
              size="icon-xs"
              onClick={() => setShowNotes(v => !v)}
              title="Internal notes"
              className={cn("border border-border/40", showNotes && "border-primary/40")}
            >
              <FileText className="w-3.5 h-3.5" />
            </Button>

            {/* Delete Lead */}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setShowDeleteDialog(true)}
                title="Delete Lead"
                className="border border-border/40 hover:bg-destructive/10 text-muted-foreground/60 hover:text-destructive transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
 
            {/* Feedback */}
            <div className="flex bg-secondary rounded-lg border border-border overflow-hidden h-7 items-center">
              <Button
                variant={lead.feedback === 1 ? "outline-success" : "ghost"}
                size="icon-xs"
                onClick={() => onFeedbackChange(lead.id, lead.feedback === 1 ? 0 : 1)}
                title="Good Lead"
                className={cn(
                  "rounded-none h-full border-r border-border hover:bg-muted active:scale-95",
                  lead.feedback === 1 ? "border-r border-success/40" : "text-muted-foreground/50"
                )}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant={lead.feedback === -1 ? "outline-destructive" : "ghost"}
                size="icon-xs"
                onClick={() => onFeedbackChange(lead.id, lead.feedback === -1 ? 0 : -1)}
                title="Bad Lead"
                className={cn(
                  "rounded-none h-full hover:bg-muted active:scale-95",
                  lead.feedback === -1 ? "" : "text-muted-foreground/50"
                )}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </Button>
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
              <Button
                variant="outline-primary"
                size="xs"
                onClick={handleCopy}
                className="uppercase tracking-widest text-xs font-black"
              >
                {copied ? (
                  <><Check className="w-3 h-3 text-emerald-500 mr-1" /> Copied</>
                ) : (
                  <><Copy className="w-3 h-3 mr-1" /> Copy Draft</>
                )}
              </Button>
            )}
          </div>
          
          {isFreePlan ? (
            <div className="relative rounded-lg overflow-hidden border border-border/60 shadow-sm p-4 bg-card flex flex-col items-center justify-center text-center py-8">
              {/* Blurred dummy text backdrop */}
              <div className="absolute inset-0 filter blur-sm opacity-15 select-none pointer-events-none p-4 text-xs font-bold leading-relaxed text-left">
                Hey growth_hacker_dan! I totally feel your pain—most traditional social listening tools are built for huge PR agencies and scan only once a day. We actually built Knivik precisely for this. It runs continuous, rapid-scanning loops on Reddit and pushes new high-intent threads directly to Slack within minutes. You can set up a keyword like 'CRM tools' in under 60 seconds and try it completely free. Happy to set you up with extra scan credits if you want to stress-test it! Let me know if you want to check it out!
              </div>
              <div className="relative z-10 flex flex-col items-center max-w-sm">
                <div className="p-2.5 bg-primary/10 text-primary rounded-full mb-3 shadow-inner">
                  <Lock className="w-5 h-5" />
                </div>
                <h5 className="text-xs font-black uppercase tracking-wider text-foreground mb-1">AI Outreach Draft Locked</h5>
                <p className="text-xs text-muted-foreground mb-4">
                  Upgrade to Pro to unlock unlimited, instant personalized AI outreach replies matched to your brand persona.
                </p>
                <a href="/dashboard/billing" className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest py-1.5 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20">
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
        <div className="border-t border-border/40 px-5 py-4 bg-muted/10 relative overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="absolute left-0 top-0 w-1 h-full bg-muted-foreground/30" />
          <p className="text-xs text-muted-foreground/75 mb-3 font-medium">
            Private team notes for tracking outreach and follow-ups.
          </p>
          <textarea
            className="w-full h-20 text-sm text-foreground bg-card border border-border/60 rounded-lg p-3 outline-none resize-none focus:border-primary/40 transition-colors placeholder:text-muted-foreground/40 shadow-sm font-medium"
            placeholder="Type notes here (e.g. Scheduled demo for next Tuesday, sent connection request...)"
            value={localNotes}
            onChange={e => setLocalNotes(e.target.value)}
            onBlur={handleNotesBlur}
          />
          <p className="text-xs text-muted-foreground mt-1.5 font-bold uppercase tracking-wider">Auto-saved on blur</p>
        </div>
      )}

      {/* ── Dialog for Delete Confirmation ─────────────────────────────────── */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lead</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this lead from your feed? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (onDelete) {
                  onDelete(lead.id)
                }
                setShowDeleteDialog(false)
              }}
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog for Full Content ───────────────────────────────────────── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {lead.title || 'Conversation Content'}
            </DialogTitle>
          </DialogHeader>

          {/* Scrollable Content Body */}
          <div className="max-h-[60vh] overflow-y-auto px-6 py-5 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed font-medium">
            {lead.content}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Close
            </Button>
            <Button asChild>
              <a href={lead.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5">
                Open Post <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
})
LeadCard.displayName = 'LeadCard'
