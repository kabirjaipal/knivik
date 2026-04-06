"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  MessageSquare, 
  ExternalLink, 
  User, 
  Calendar, 
  TrendingUp,
  AlertCircle,
  CheckCircle2
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

  const getIntentBadge = (intentLevel: string, score: number) => {
    const colors = {
      BUY_NOW: "bg-green-500 text-white",
      RESEARCHING: "bg-blue-500 text-white",
      COMPARING: "bg-yellow-500 text-white",
      LOW_INTENT: "bg-gray-400 text-white",
    }

    return (
      <Badge className={`${colors[intentLevel as keyof typeof colors]} font-medium`}>
        {intentLevel.replace("_", " ")} ({score})
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      NEW: "bg-blue-100 text-blue-700",
      QUALIFIED: "bg-purple-100 text-purple-700",
      SAVED: "bg-yellow-100 text-yellow-700",
      CONTACTED: "bg-orange-100 text-orange-700",
      CONVERTED: "bg-green-100 text-green-700",
      DISMISSED: "bg-gray-100 text-gray-700",
    }

    return (
      <Badge variant="outline" className={colors[status as keyof typeof colors]}>
        {status}
      </Badge>
    )
  }

  const getDetectionBadge = (detectedBy: string) => {
    const labels = {
      KEYWORD: "Keyword Match",
      SEMANTIC: "AI Detected",
      COMPETITOR: "Competitor Mention",
    }
    return (
      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
        {labels[detectedBy as keyof typeof labels]}
      </span>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="mt-2 text-muted-foreground">Loading leads...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
          <p className="text-muted-foreground">Failed to load leads</p>
        </CardContent>
      </Card>
    )
  }

  if (leads.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No leads yet</h3>
          <p className="text-muted-foreground text-sm">
            Leads will appear here once the scanner finds potential customers
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Leads ({leads.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {getIntentBadge(lead.intentLevel, lead.intentScore)}
                {getStatusBadge(lead.status)}
              </div>
              <a
                href={lead.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <h4 className="font-medium text-foreground mb-2">
              {lead.title || "No title"}
            </h4>

            <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
              {lead.content}
            </p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {lead.authorUsername || "Unknown"}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(lead.createdAt).toLocaleDateString()}
              </span>
              <span className="uppercase">{lead.platform}</span>
              {getDetectionBadge(lead.detectedBy)}
            </div>

            {lead.reasoning && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground flex items-start gap-1">
                  <CheckCircle2 className="w-3 h-3 mt-0.5 text-green-500 shrink-0" />
                  {lead.reasoning}
                </p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
