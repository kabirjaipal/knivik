"use client"

import { useEffect, useState } from "react"
import { 
  ExternalLink, 
  User, 
  Calendar, 
  TrendingUp,
  AlertCircle,
  MessageSquare
} from "lucide-react"

interface Lead {
  id: string
  title: string | null
  content: string
  platform: string
  externalPostId: string
  url: string
  authorUsername: string | null
  intentScore: number
  intentLevel: "BUY_NOW" | "RESEARCHING" | "COMPARING" | "LOW_INTENT"
  status: "NEW" | "QUALIFIED" | "SAVED" | "CONTACTED" | "CONVERTED" | "DISMISSED"
  detectedBy: "KEYWORD" | "SEMANTIC" | "COMPETITOR"
  createdAt: string
  reasoning?: string
}

interface ProductLeadsProps {
  productId: string
}

export function ProductLeads({ productId }: ProductLeadsProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLeads()
  }, [productId])

  const fetchLeads = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const res = await fetch(`${apiUrl}/leads?productId=${productId}`, {
        credentials: "include",
      })
      if (!res.ok) throw new Error("Failed to fetch leads")
      const data = await res.json()
      setLeads(data.leads || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
        <p className="mt-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/40">Syncing Stream...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <AlertCircle className="w-6 h-6 mx-auto text-destructive/40 mb-2" />
        <p className="text-xs font-bold uppercase tracking-wider text-destructive/60">Stream Connection Error</p>
      </div>
    )
  }

  if (leads.length === 0) {
    return (
      <div className="py-12 text-center bg-muted/5 rounded-xl border border-dashed border-border/50">
        <MessageSquare className="w-6 h-6 mx-auto text-muted-foreground/20 mb-2" />
        <p className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">No Signals Detected</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 flex items-center gap-1.5">
        <TrendingUp className="w-3 h-3" /> Detected Leads ({leads.length})
      </h2>

      <div className="space-y-10">
        {leads.map((lead) => (
          <div key={lead.id} className="group relative">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    lead.intentLevel === 'BUY_NOW' ? 'bg-success/10 text-success' : 
                    lead.intentLevel === 'RESEARCHING' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {lead.intentLevel.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                    Score: {lead.intentScore}
                  </span>
                </div>
                <a 
                  href={lead.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-muted-foreground/40 hover:text-primary transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <h3 className="text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors leading-tight">
                {lead.title || "Untitled Conversation Signal"}
              </h3>

              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {lead.content}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/40">
                <span className="flex items-center gap-1"><User className="w-2.5 h-2.5" /> {lead.authorUsername || "Anonymous"}</span>
                <span className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5" /> {new Date(lead.createdAt).toLocaleDateString()}</span>
                <span className="bg-muted px-1.5 py-0.5 rounded text-xs uppercase">{lead.platform}</span>
              </div>

              {lead.reasoning && (
                <div className="bg-muted/30 dark:bg-muted/10 p-2.5 rounded-lg border-l-2 border-primary/20">
                   <p className="text-xs font-medium text-muted-foreground/80 leading-snug italic">
                     "{lead.reasoning}"
                   </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
