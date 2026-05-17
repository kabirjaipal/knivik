"use client"

import { useState } from "react"
import { 
  CheckCircle2, Sparkles, ExternalLink, Zap, MessageSquareText, 
  FileText, ChevronDown, Brain, Flame, ThumbsUp, ThumbsDown, Info, Clock 
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type LeadStatus = 'NEW' | 'QUALIFIED' | 'SAVED' | 'CONTACTED' | 'CONVERTED' | 'DISMISSED'
type DetectedBy = 'KEYWORD' | 'SEMANTIC' | 'COMPETITOR'

interface MockLead {
  id: string
  platform: string
  title: string
  content: string
  url: string
  authorUsername: string
  intentLevel: 'BUY_NOW' | 'RESEARCHING' | 'COMPARING' | 'LOW_INTENT'
  intentScore: number
  status: LeadStatus
  detectedBy: DetectedBy
  qualificationReasoning: string
  suggestedAngle: string
  draftedReply: string
}

const initialSampleLeads: MockLead[] = [
  {
    id: "lead-1",
    platform: "Reddit",
    title: "Tool to monitor Reddit keywords in real-time?",
    content: "Honestly frustrated with Google Alerts and Brand24. They are either super delayed or way too expensive. Does anyone know a fast tool that can monitor Reddit keywords in real-time and push alerts straight to Slack? I want to reply to people looking for CRM tools as soon as they post.",
    url: "https://reddit.com/r/SaaS/comments/realtime_monitoring",
    authorUsername: "growth_hacker_dan",
    intentLevel: "BUY_NOW",
    intentScore: 99,
    status: "QUALIFIED",
    detectedBy: "COMPETITOR",
    qualificationReasoning: "Prospect is actively seeking a real-time Reddit keyword monitoring solution that integrates with Slack, and explicitly expresses frustration with Google Alerts/Brand24 pricing and delays.",
    suggestedAngle: "Highlight Knivik's rapid scanning loops, 60-second direct Slack integration, and flexible free tier.",
    draftedReply: "Hey growth_hacker_dan! I totally feel your pain—most traditional social listening tools are built for huge PR agencies and scan only once a day.\n\nWe actually built Knivik precisely for this. It runs continuous, rapid-scanning loops on Reddit and pushes new high-intent threads directly to Slack within minutes. You can set up a keyword like 'CRM tools' in under 60 seconds and try it completely free. Happy to set you up with extra scan credits if you want to stress-test it! Let me know if you want to check it out!"
  }
]

const STATUS_OPTIONS: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'NEW',       label: 'New',         color: 'bg-muted/50 text-muted-foreground border-border' },
  { value: 'QUALIFIED', label: 'Qualified',    color: 'bg-primary/10 text-primary border-primary/20' },
  { value: 'SAVED',     label: 'Saved',        color: 'bg-primary/10 text-primary border-primary/20' },
  { value: 'CONTACTED', label: 'Contacted',    color: 'bg-primary/10 text-primary border-primary/20' },
  { value: 'CONVERTED', label: 'Converted 🎉', color: 'bg-success/10 text-success border-success/20' },
  { value: 'DISMISSED', label: 'Dismissed',    color: 'bg-destructive/10 text-destructive border-destructive/20' },
]

export function ProductPreview() {
  const [leads, setLeads] = useState(
    initialSampleLeads.map(lead => ({
      ...lead,
      feedback: 0 as number,
      showNotes: false,
      notes: "",
      isDraftExpanded: lead.id === "lead-1", // open first one by default for maximum impact
      showStatusDropdown: false
    }))
  )

  const handleStatusChange = (id: string, newStatus: LeadStatus) => {
    setLeads(prev => prev.map(lead => 
      lead.id === id ? { ...lead, status: newStatus, showStatusDropdown: false } : lead
    ))
  }

  const handleFeedbackChange = (id: string, type: 'up' | 'down') => {
    setLeads(prev => prev.map(lead => {
      if (lead.id === id) {
        const currentFeedback = lead.feedback
        let newFeedback = 0
        if (type === 'up') {
          newFeedback = currentFeedback === 1 ? 0 : 1
        } else {
          newFeedback = currentFeedback === -1 ? 0 : -1
        }
        return { ...lead, feedback: newFeedback }
      }
      return lead
    }))
  }

  const toggleNotes = (id: string) => {
    setLeads(prev => prev.map(lead => 
      lead.id === id ? { ...lead, showNotes: !lead.showNotes } : lead
    ))
  }

  const toggleDraft = (id: string) => {
    setLeads(prev => prev.map(lead => 
      lead.id === id ? { ...lead, isDraftExpanded: !lead.isDraftExpanded } : lead
    ))
  }

  const toggleStatusDropdown = (id: string) => {
    setLeads(prev => prev.map(lead => 
      lead.id === id ? { ...lead, showStatusDropdown: !lead.showStatusDropdown } : lead
    ))
  }

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

  return (
    <section id="sample-leads" className="py-16 md:py-24 bg-secondary/20 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none select-none transform-gpu" />
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Left Text Block */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex-1"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-6 border border-primary/20">
              <Sparkles className="h-3 w-3" />
              Smart Intent Detection
            </div>
            <h2 className="text-4xl lg:text-6xl font-black tracking-tighter text-foreground mb-8 leading-[1.05]">
              What a qualified lead <br />
              <span className="text-primary italic">actually</span> looks like.
            </h2>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed max-w-xl font-medium">
              Knivik doesn't just scan for flat keywords. It understands natural context, competitors, and real intent. Experience our premium dashboard Lead Cards below—fully interactive and identical to the real product.
            </p>
            
            <ul className="space-y-5">
              {[
                "Context-aware AI intent scoring",
                "Competitor mention & frustration detection",
                "Real-time monitoring across multiple social hubs",
                "AI-powered personalized outreach angles"
              ].map((item, i) => (
                <motion.li 
                  key={i} 
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-4 font-bold text-foreground group"
                >
                  <div className="h-6 w-6 rounded-full bg-success/10 flex items-center justify-center border border-success/20 group-hover:bg-success group-hover:text-white transition-all">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span className="text-base font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                    {item}
                  </span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Right Lead Card Block */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex-1 w-full space-y-8 relative"
          >
            {/* Ambient Background Glows */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-[80px] -z-10 pointer-events-none select-none transform-gpu" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent/20 rounded-full blur-[80px] -z-10 pointer-events-none select-none transform-gpu" />

            {leads.map((lead, i) => {
              const currentStatus = STATUS_OPTIONS.find(s => s.value === lead.status) ?? STATUS_OPTIONS[0]!
              
              return (
                <motion.div 
                  key={lead.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className={`group relative bg-background rounded-xl border border-border/40 overflow-hidden shadow-xl transition-all hover:shadow-2xl hover:border-border/60 border-l-4 ${getAccentBorder(lead.detectedBy)}`}
                >
                  <div className="p-5 sm:p-6 hover:bg-muted/5 transition-colors">
                    
                    {/* Row 1: Badges + Score + Engage */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-4">
                      {/* Platform */}
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-secondary px-2 py-0.5 rounded border border-border/40">
                        {lead.platform}
                      </span>

                      {/* Intent level */}
                      <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${getIntentColor(lead.intentLevel)}`}>
                        {lead.intentLevel.replace('_', ' ')}
                      </span>

                      {/* Score */}
                      <span className="text-[9px] sm:text-[10px] font-black px-2 py-0.5 bg-primary/10 text-primary rounded border border-primary/20">
                        ★ {lead.intentScore}
                      </span>

                      {/* Detection Badge */}
                      {lead.detectedBy === 'COMPETITOR' && (
                        <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-destructive/15 text-destructive border border-destructive/30">
                          <Flame className="w-3.5 h-3.5 fill-current" /> Competitor
                        </span>
                      )}
                      {lead.detectedBy === 'SEMANTIC' && (
                        <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
                          <Brain className="w-3.5 h-3.5" /> Semantic
                        </span>
                      )}

                      {/* Engage button aligned right */}
                      <a 
                        href={lead.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="ml-auto flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest py-1 px-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all active:scale-95 shrink-0 shadow-md shadow-primary/20"
                      >
                        Engage <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {/* Row 2: Title */}
                    <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors mb-2">
                      {lead.title}
                    </h3>

                    {/* Row 3: Content Preview */}
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4 whitespace-pre-wrap">
                      "{lead.content}"
                    </p>

                    {/* Row 4: AI Reasoning */}
                    {lead.qualificationReasoning && (
                      <div className="flex gap-2 items-start mb-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                        <div className="p-0.5 shrink-0">
                          <Info className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-xs text-primary/80 leading-relaxed italic">
                          <strong>Qualification Reasoning:</strong> {lead.qualificationReasoning}
                        </p>
                      </div>
                    )}

                    {/* Row 5: Action Controls */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 pt-3 border-t border-border/40">
                      
                      {/* Meta Information */}
                      <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/60">
                        <Clock className="w-3.5 h-3.5" /> Just Now
                      </span>

                      <span className="text-[10px] font-bold text-muted-foreground/60">
                        u/{lead.authorUsername}
                      </span>

                      <span className="flex items-center gap-1 text-[10px] font-bold text-foreground/70 bg-secondary px-2 py-0.5 rounded">
                        Product: {lead.platform === "Reddit" ? "SocialMonitor" : "CRM Automator"}
                      </span>

                      {/* Right Hand Actions */}
                      <div className="ml-auto flex items-center gap-2 relative">
                        
                        {/* Status Dropdown */}
                        <div className="relative">
                          <button 
                            onClick={() => toggleStatusDropdown(lead.id)}
                            className={`flex items-center gap-1 text-[10px] font-bold py-1 px-2.5 rounded-lg border transition-all cursor-pointer ${currentStatus.color}`}
                          >
                            {currentStatus.label} <ChevronDown className="w-3 h-3" />
                          </button>
                          
                          <AnimatePresence>
                            {lead.showStatusDropdown && (
                              <motion.div 
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute z-20 bottom-full mb-1 right-0 min-w-32 bg-popover border border-border rounded-xl shadow-xl overflow-hidden"
                              >
                                {STATUS_OPTIONS.map(opt => (
                                  <button 
                                    key={opt.value}
                                    onClick={() => handleStatusChange(lead.id, opt.value)}
                                    className={`w-full text-left px-4 py-2 text-[10px] font-bold hover:bg-muted transition-colors ${opt.value === lead.status ? 'opacity-40 cursor-default' : 'cursor-pointer'}`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* AI Draft Reply Toggle */}
                        <button
                          onClick={() => toggleDraft(lead.id)}
                          title="View AI Outreach Draft"
                          className={`flex items-center gap-1 text-[10px] font-bold py-1 px-2.5 rounded-lg border transition-all cursor-pointer ${lead.isDraftExpanded ? 'bg-primary/10 text-primary border-primary/30 shadow-inner' : 'bg-secondary text-secondary-foreground border-border hover:bg-secondary/85'}`}
                        >
                          <MessageSquareText className="w-3.5 h-3.5" />
                          <span>Draft</span>
                        </button>

                        {/* Notes Toggle */}
                        <button 
                          onClick={() => toggleNotes(lead.id)}
                          title="Write notes"
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${lead.showNotes ? 'bg-primary/10 text-primary border-primary/30' : 'bg-secondary text-secondary-foreground border-border hover:bg-secondary/85'}`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        {/* Thumbs Feedback */}
                        <div className="flex bg-secondary rounded-lg border border-border/80 overflow-hidden">
                          <button
                            onClick={() => handleFeedbackChange(lead.id, 'up')}
                            title="Good Lead"
                            className={`p-1.5 transition-all cursor-pointer ${lead.feedback === 1 ? 'bg-success/20 text-success border-r border-success/40' : 'text-muted-foreground/60 hover:bg-muted border-r border-border'}`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleFeedbackChange(lead.id, 'down')}
                            title="Bad Lead"
                            className={`p-1.5 transition-all cursor-pointer ${lead.feedback === -1 ? 'bg-destructive/20 text-destructive' : 'text-muted-foreground/60 hover:bg-muted'}`}
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                      </div>
                    </div>

                  </div>

                  {/* Expandable Content: AI Draft */}
                  <AnimatePresence>
                    {lead.isDraftExpanded && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-border/40 px-5 py-4 bg-primary/5 relative overflow-hidden"
                      >
                        <div className="absolute left-0 top-0 w-1 h-full bg-primary" />
                        <h4 className="flex items-center gap-1.5 text-xs uppercase tracking-widest font-black text-primary mb-3">
                          <Zap className="w-3.5 h-3.5" /> AI Draft Reply
                        </h4>
                        <textarea 
                          readOnly
                          className="w-full h-28 text-sm text-foreground bg-card border border-border/60 rounded-lg p-3 outline-none resize-none focus:border-primary/40 transition-colors shadow-inner font-medium"
                          value={lead.draftedReply}
                        />
                        <div className="flex items-center justify-between mt-3">
                          <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                            Suggested Angle: <span className="text-primary font-bold">{lead.suggestedAngle}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Expandable Content: Notes */}
                  <AnimatePresence>
                    {lead.showNotes && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-border/40 px-5 py-4 bg-muted/10"
                      >
                        <textarea
                          className="w-full h-20 text-sm text-foreground bg-card border border-border/60 rounded-lg p-3 outline-none resize-none focus:border-primary/40 transition-colors placeholder:text-muted-foreground/40 shadow-inner font-medium"
                          placeholder="Type internal notes about this lead..."
                          value={lead.notes}
                          onChange={e => setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, notes: e.target.value } : l))}
                        />
                        <p className="text-[10px] text-muted-foreground mt-1.5 font-bold uppercase tracking-wider">Interactive Mock Card • Changes persistent for session</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </motion.div>
              )
            })}
          </motion.div>

        </div>
      </div>
    </section>
  )
}
