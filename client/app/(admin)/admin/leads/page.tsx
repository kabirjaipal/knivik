"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, MessageSquare, User, Brain, TrendingUp, AlertCircle } from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { AdminPagination } from "@/components/admin/admin-pagination"

interface Lead {
  id: string;
  title: string | null;
  content: string;
  url: string;
  platform: string;
  intentLevel: string;
  intentScore: number;
  reasoning: string | null;
  createdAt: string;
  product: {
    name: string;
    user: {
      username: string;
      email: string;
    }
  }
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  
  // Pagination state
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setLoading(true)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/leads?page=${page}&limit=20`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLeads(data.data)
          setTotalPages(data.pagination.totalPages)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [page])

  const getIntentBadge = (level: string) => {
    switch (level) {
      case 'BUY_NOW': return <Badge className="bg-success hover:bg-success">BUY NOW</Badge>
      case 'RESEARCHING': return <Badge className="bg-primary hover:bg-primary">RESEARCHING</Badge>
      case 'COMPARING': return <Badge variant="secondary">COMPARING</Badge>
      default: return <Badge variant="outline">LOW INTENT</Badge>
    }
  }

  if (loading && leads.length === 0) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Global Lead Oversight</h1>
        <p className="text-sm text-muted-foreground mt-1">Audit lead quality and AI reasoning across all users.</p>
      </div>

      <div className="grid gap-6">
        {leads.map((lead) => (
          <Card key={lead.id} className="border-border/40 overflow-hidden hover:border-primary/20 transition-all">
            <CardHeader className="border-b border-border/40 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-bold uppercase tracking-widest text-sm">{lead.platform}</Badge>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span className="font-bold text-foreground/80">{lead.product.user.username}</span>
                    <span>•</span>
                    <span className="italic font-medium">{lead.product.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className={`w-4 h-4 ${lead.intentScore > 80 ? 'text-success' : 'text-primary'}`} />
                  <span className="text-sm font-black">{lead.intentScore}%</span>
                  {getIntentBadge(lead.intentLevel)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg leading-tight line-clamp-2">{lead.title || "Social Post Match"}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 bg-muted/20 p-3 rounded-lg border border-border/20 italic">
                      "{lead.content}"
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="h-8 text-xs font-bold gap-2" asChild>
                      <a href={lead.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3" /> View Original
                      </a>
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 text-xs font-bold gap-2">
                          <Brain className="w-3 h-3 text-primary" /> Full Reasoning
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Brain className="w-5 h-5 text-primary" />
                            AI Intent Analysis
                          </DialogTitle>
                        </DialogHeader>
                        <div className="mt-4 space-y-6">
                          <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
                            <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-2">Original Post</h4>
                            <p className="text-sm leading-relaxed">{lead.content}</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">AI Reasoning Breakdown</h4>
                            <div className="text-sm leading-relaxed space-y-2 whitespace-pre-wrap">
                              {lead.reasoning || "No reasoning data available for this lead."}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                
                <div className="md:w-64 space-y-4">
                  <div className="bg-muted/30 p-4 rounded-xl space-y-3 border border-border/40">
                    <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Detection Meta</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Found</span>
                        <span className="font-bold">{new Date(lead.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">ID</span>
                        <span className="font-mono text-sm">{lead.id.slice(-8)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {leads.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-2xl border-2 border-dashed border-border/40">
            <AlertCircle className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">No leads found in the system yet.</p>
          </div>
        )}
      </div>

      <AdminPagination 
        page={page} 
        totalPages={totalPages} 
        onPageChange={setPage} 
      />
    </div>
  )
}
