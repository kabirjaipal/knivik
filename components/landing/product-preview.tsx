"use client"

import { useState } from "react"
import { CheckCircle2, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import { LeadCard, LeadCardData, LeadStatus } from "@/components/dashboard/lead-card"

const initialSampleLeads: LeadCardData[] = [
  {
    id: "lead-1",
    platform: "Reddit",
    externalPostId: "reddit-asana-alt",
    title: "Asana is getting too slow and cluttered. Alternatives?",
    content: "Our startup is growing and Asana has become a nightmare. The pricing is getting crazy for our size, and the UI is incredibly slow. We need a lightweight project manager that has Kanban boards, fits a 15-person team, and doesn't lag. Any good SaaS recommendations?",
    url: "https://reddit.com/r/SaaS/comments/asana_alternatives",
    authorUsername: "tech_founder_jack",
    intentLevel: "BUY_NOW",
    intentScore: 98,
    status: "NEW",
    detectedBy: "COMPETITOR",
    enrichment: {
      linkedinUrl: "https://linkedin.com/in/jack-techfounder",
      twitterUrl: "https://x.com/jack_builds"
    },
    feedback: 0,
    notes: "Sent a custom message pointing to our Slack integration. Jack replied and registered for a trial!",
    metadata: {
      qualificationReasoning: "Prospect is actively looking to buy a new project management tool, citing frustration with Asana's pricing and slow performance."
    },
    postedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 minutes ago
    createdAt: new Date().toISOString(),
    product: {
      name: "Linear Alternative"
    },
    replies: [
      {
        id: "reply-1",
        generatedText: "Hey jack_builds! If you want something lightweight and lightning-fast, check out Linear or our lightweight board tool. It's built specifically for growing tech teams, loads in milliseconds, and has a very generous startup tier compared to Asana. Let me know if you want a quick demo!",
        createdAt: new Date().toISOString()
      }
    ]
  },
  {
    id: "lead-2",
    platform: "HackerNews",
    externalPostId: "hn-pdf-parser",
    title: "Ask HN: Layout-agnostic PDF parser for invoice data?",
    content: "I am trying to extract structured JSON data from 5,000+ scanned PDF invoices monthly. I looked at AWS Textract but it's very hard to write parser logic for different layouts. Does anyone know of a tool that handles layout-agnostic PDF invoice data extraction out of the box?",
    url: "https://news.ycombinator.com/item?id=4920194",
    authorUsername: "hackernews_dev",
    intentLevel: "COMPARING",
    intentScore: 94,
    status: "QUALIFIED",
    detectedBy: "SEMANTIC",
    enrichment: {
      twitterUrl: "https://x.com/hackernews_dev"
    },
    feedback: 0,
    notes: "Found on HN. Emailed technical details of our layout-agnostic parser to their engineering lead.",
    metadata: {
      qualificationReasoning: "Semantic detection: User is researching automated parsing tools for extraction, specifically looking for structured JSON output and complaining about AWS Textract complexity."
    },
    postedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutes ago
    createdAt: new Date().toISOString(),
    product: {
      name: "DocuParse AI"
    },
    replies: [] // Empty by default to let users click "Draft" and see it generate!
  },
  {
    id: "lead-3",
    platform: "Twitter",
    externalPostId: "twitter-video-editor",
    title: "Looking to hire a video editor / agency",
    content: "We are scaling our YouTube channel and need to hire a freelance video editor or a video editing agency for 2 long-form videos a week. Looking for someone with strong storytelling, motion graphics, and color grading experience. Please drop your portfolio or recommendations below!",
    url: "https://x.com/tweets/video_editor_needed",
    authorUsername: "content_creator_tom",
    intentLevel: "BUY_NOW",
    intentScore: 95,
    status: "NEW",
    detectedBy: "KEYWORD",
    enrichment: {
      twitterUrl: "https://x.com/content_creator_tom"
    },
    feedback: 0,
    notes: "Sent DM with our portfolio link. Booking a call.",
    metadata: {
      qualificationReasoning: "Matches keywords: 'hire a video editor'. The user is actively seeking freelance or agency video editing services."
    },
    postedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    createdAt: new Date().toISOString(),
    product: {
      name: "VividCut Agency"
    },
    replies: [] // Empty by default to let users click "Draft"
  }
]

export function ProductPreview() {
  const [leads, setLeads] = useState<LeadCardData[]>(initialSampleLeads)
  const [draftingLeadId, setDraftingLeadId] = useState<string | null>(null)
  const [expandedLeadIds, setExpandedLeadIds] = useState<Record<string, boolean>>({ "lead-1": true })

  const handleDraftReply = (id: string) => {
    setDraftingLeadId(id)
    setTimeout(() => {
      setDraftingLeadId(null)
      setLeads(prev => prev.map(l => {
        if (l.id === id && (!l.replies || l.replies.length === 0)) {
          let customReply = "Hey there! We built this SaaS tool precisely to solve this problem. Feel free to check out our free plan!"
          if (id === "lead-1") {
            customReply = "Hey jack_builds! If you want something lightweight and lightning-fast, check out Linear or our lightweight board tool. It's built specifically for growing tech teams, loads in milliseconds, and has a very generous startup tier compared to Asana. Let me know if you want a quick demo!"
          } else if (id === "lead-2") {
            customReply = "Hey! If you are tired of AWS Textract layout rules, you should try DocuParse AI. It uses LLMs under the hood to automatically identify fields like total, tax, and line items, returning clean JSON without any template configuration. It takes under 5 lines of Python code to integrate."
          } else if (id === "lead-3") {
            customReply = "Hey content_creator_tom! I run VividCut Agency. We specialize in high-retention YouTube video editing, motion graphics, and color grading. We've helped several creators scale their channels. Check out our portfolio at vividcut.com/portfolio. Let me know if you'd like to do a quick test edit!"
          }
          return {
            ...l,
            replies: [{
              id: "reply-gen",
              generatedText: customReply,
              createdAt: new Date().toISOString()
            }]
          }
        }
        return l
      }))
      setExpandedLeadIds(prev => ({ ...prev, [id]: true }))
    }, 1000)
  }

  const handleToggleExpand = (id: string) => {
    setExpandedLeadIds(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleStatusChange = (id: string, newStatus: LeadStatus) => {
    setLeads(prev => prev.map(lead => 
      lead.id === id ? { ...lead, status: newStatus } : lead
    ))
  }

  const handleNotesChange = (id: string, newNotes: string) => {
    setLeads(prev => prev.map(lead => 
      lead.id === id ? { ...lead, notes: newNotes } : lead
    ))
  }

  const handleFeedbackChange = (id: string, newFeedback: number) => {
    setLeads(prev => prev.map(lead => 
      lead.id === id ? { ...lead, feedback: newFeedback } : lead
    ))
  }

  return (
    <section id="sample-leads" className="py-16 md:py-24 bg-secondary/20 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none select-none transform-gpu" />
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-start gap-12 lg:gap-20">
          
          {/* Left Text Block */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex-1 lg:sticky lg:top-28"
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

            {leads.map((lead) => (
              <motion.div 
                key={lead.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <LeadCard
                  lead={lead}
                  draftingLeadId={draftingLeadId}
                  draftedReply={lead.replies?.[0]?.generatedText}
                  isExpanded={expandedLeadIds[lead.id]}
                  showProductName={true}
                  onDraftReply={handleDraftReply}
                  onToggleExpand={handleToggleExpand}
                  onStatusChange={handleStatusChange}
                  onNotesChange={handleNotesChange}
                  onFeedbackChange={handleFeedbackChange}
                />
              </motion.div>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  )
}
