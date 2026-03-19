"use client"

import { useAuth } from "@/context/auth-context"
import { Navbar } from "@/components/landing/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Radar, Users, MessageSquareText, Activity, ExternalLink, Zap, Clock, ThumbsUp, ChevronRight, RotateCw } from "lucide-react"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { io, Socket } from "socket.io-client"
import React, { memo } from "react"

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
  status: string;
  postedAt: string;
  createdAt: string;
  product: {
    name: string;
  };
  replies?: Array<{
    id: string;
    generatedText: string;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [draftingLeadId, setDraftingLeadId] = useState<string | null>(null)
  const [draftedReplies, setDraftedReplies] = useState<Record<string, string>>({})
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({})
  const [isScanning, setIsScanning] = useState(false)

  const router = useRouter()
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    } else if (user) {
      fetchLeads()

      // Initialize Socket
      const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || ''
      const newSocket = io(socketUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling']
      })

      newSocket.on('connect', () => {
        console.log('Connected to socket server')
        newSocket.emit('join-user-room', user.id)
      })

      newSocket.on('new-lead', (newLead: Lead) => {
        console.log('New lead received via socket:', newLead)
        setLeads(prev => {
          // Prevent duplicates
          if (prev.find(l => l.id === newLead.id)) return prev
          return [newLead, ...prev]
        })
      })

      setSocket(newSocket)

      return () => {
        newSocket.disconnect()
      }
    }
  }, [user, authLoading, router])

  const fetchLeads = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/leads`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch leads')
      const data = await res.json()
      const fetchedLeads = data.leads as Lead[]
      setLeads(fetchedLeads)
      
      // Initialize drafts from existing replies
      const initialDrafts: Record<string, string> = {}
      fetchedLeads.forEach(lead => {
        if (lead.replies && lead.replies.length > 0) {
          initialDrafts[lead.id] = lead.replies[0].generatedText
        }
      })
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/leads/${leadId}/reply`, { method: 'POST', credentials: 'include' })
      if (!res.ok) throw new Error('Failed to generate draft')
      const data = await res.json()
      setDraftedReplies(prev => ({...prev, [leadId]: data.generatedText}))
      setExpandedReplies(prev => ({...prev, [leadId]: true})) // Auto-expand on new generation
    } catch (e: any) {
      console.error(e)
    } finally {
      setDraftingLeadId(null)
    }
  }

  const handleForceScan = async () => {
    setIsScanning(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/leads/scan`, { method: 'POST', credentials: 'include' })
      if (!res.ok) throw new Error('Scan failed')
      
      // Keep "Scanning" UI active for 60s as a ballpark for the background cycle
      setTimeout(() => setIsScanning(false), 60000)
    } catch (e: any) {
      console.error(e)
      setIsScanning(false)
    }
  }

  // Display a full-screen loading spinner while checking permissions
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  const highIntentLeads = leads.filter(l => l.intentScore >= 80).length
  const totalLeads = leads.length
  
  const recentSignals = leads.filter(l => new Date(l.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000).length
  const averageIntent = leads.length > 0 ? Math.round(leads.reduce((a, b) => a + b.intentScore, 0) / leads.length) : 0
  
  // Staggered animation configuration
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  }

  const getIntentColor = (level: string) => {
    switch (level) {
      case 'BUY_NOW': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'COMPARING': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'RESEARCHING': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  }

const LeadRow = memo(({ 
  lead, 
  getIntentColor, 
  handleDraftReply, 
  draftingLeadId, 
  draftedReply,
  isExpanded,
  onToggleExpand
}: { 
  lead: Lead, 
  getIntentColor: (l: string) => string,
  handleDraftReply: (id: string) => void,
  draftingLeadId: string | null,
  draftedReply?: string,
  isExpanded?: boolean,
  onToggleExpand: (id: string) => void
}) => {
  return (
    <div className="group relative">
      <div className="p-6 hover:bg-muted/10 transition-colors duration-200 group flex flex-col md:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded-md">
              {lead.platform}
            </span>
            <span className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full border ${getIntentColor(lead.intentLevel)}`}>
              {lead.intentLevel.replace('_', ' ')}
            </span>
            <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded-md flex items-center">
              ★ {lead.intentScore} Score
            </span>
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2 truncate group-hover:text-primary transition-colors">
            {lead.title || "Found Conversation Thread"}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {lead.content}
          </p>
          
          <div className="mt-4 flex items-center gap-4 text-xs font-medium text-muted-foreground">
            <span className="flex items-center text-foreground/80 font-semibold bg-secondary px-2.5 py-1 rounded-md">
              <Users className="w-3 h-3 mr-1.5" /> 
              {lead.product?.name || 'System Query'}
            </span>
            <span className="flex items-center">
              <Clock className="w-3 h-3 mr-1.5" /> 
              {new Date(lead.postedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
            {lead.authorUsername && (
              <span>u/{lead.authorUsername}</span>
            )}
          </div>
        </div>
        
        <div className="shrink-0 flex md:flex-col gap-2 w-full md:w-auto mt-4 md:mt-0">
          <a 
            href={lead.url} 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full md:w-40 py-2.5 px-4 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25 active:scale-95"
          >
            Engage <ExternalLink className="w-4 h-4" />
          </a>
          
          <div className="flex gap-2">
            <button 
              onClick={() => handleDraftReply(lead.id)}
              disabled={draftingLeadId === lead.id}
              className={`flex items-center justify-center gap-2 flex-1 md:w-40 py-2.5 px-4 ${draftedReply ? 'bg-secondary' : 'bg-secondary'} text-secondary-foreground text-sm font-bold rounded-lg hover:bg-secondary/80 transition-all border border-border group/btn active:scale-95 disabled:opacity-50`}
            >
              {draftingLeadId === lead.id ? (
                <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
              ) : draftedReply ? (
                <>Regenerate <RotateCw className="w-3 h-3 text-muted-foreground group-hover/btn:rotate-180 transition-transform duration-500" /></>
              ) : (
                <>Draft Reply <ChevronRight className="w-4 h-4 text-muted-foreground group-hover/btn:translate-x-1 transition-transform" /></>
              )}
            </button>
            
            {draftedReply && (
              <button 
                onClick={() => onToggleExpand(lead.id)}
                className="p-2.5 bg-secondary text-secondary-foreground rounded-lg border border-border hover:bg-secondary/80 transition-all active:scale-95"
                title={isExpanded ? "Hide Draft" : "Show Draft"}
              >
                <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                   <MessageSquareText className="w-4 h-4" />
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {draftedReply && isExpanded && (
        <div className="bg-card border-t border-border/40 p-4 md:px-6 relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <h4 className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-primary mb-3">
            <Zap className="w-3 h-3" /> AI Generated Pitch
          </h4>
          <textarea 
            readOnly
            className="w-full h-32 text-sm text-foreground bg-muted/5 border border-border rounded-lg p-3 outline-none resize-none hide-scrollbar focus:border-primary/50 transition-colors"
            value={draftedReply}
          />
        </div>
      )}
     </div>
  )
});
LeadRow.displayName = "LeadRow";

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/30">
      {/* Static Gradient Elements for performance */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(var(--primary-rgb),0.05),transparent_70%)] blur-[80px]"></div>
      </div>

      <div className="relative z-10">
        <Navbar />
        
        <main className="flex-1 container mx-auto px-4 py-12 max-w-7xl">
          <div className="mb-10">
            <h1 className="text-4xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Welcome back, {user?.username}
            </h1>
            <p className="text-muted-foreground mt-3 text-lg max-w-2xl leading-relaxed">
              Your radar is active. We are actively scanning hyperspace for buying signals that match your products.
            </p>
          </div>

          {/* Top-Level Metric Cards */}          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Card className="shadow-lg border-border/40 bg-card overflow-hidden group hover:border-primary/50 transition-colors duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Leads</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black">{totalLeads}</div>
                  <p className="text-xs text-primary font-semibold mt-2 flex items-center">
                    <Zap className="w-3 h-3 mr-1" /> Live tracking
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className="bg-primary/5 border-primary/30 shadow-lg relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/30 transition-colors duration-300"></div>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-bold text-primary uppercase tracking-widest">High-Intent Leads</CardTitle>
                  <Radar className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-primary">{highIntentLeads}</div>
                  <p className="text-xs text-primary/80 font-medium mt-2">Score &gt; 80</p>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="shadow-lg shadow-black/5 border-border/40 bg-card group hover:border-primary/50 transition-colors duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Recent Signals</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black">{recentSignals}</div>
                  <p className="text-xs text-muted-foreground mt-2">Discovered last 24h</p>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="shadow-lg shadow-black/5 border-border/40 bg-card group hover:border-primary/50 transition-colors duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Avg. Intent Score</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black">{averageIntent}</div>
                  <p className="text-xs text-primary font-medium mt-2">Global pipeline quality</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Secondary Detailed Data Pane */}
          <div className="mt-10">
            <Card className="border-border/50 shadow-xl bg-card overflow-hidden rounded-2xl">
              <CardHeader className="border-b border-border/40 bg-muted/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl font-bold flex items-center">
                    <Radar className="mr-3 text-primary h-6 w-6" /> Live Detection Stream
                  </CardTitle>
                  <CardDescription className="text-sm font-medium mt-1">
                    Leads actively discovered by your AI engines across the web.
                  </CardDescription>
                </div>
                <button 
                  onClick={handleForceScan}
                  disabled={isScanning}
                  className="flex items-center justify-center gap-2 py-2.5 px-6 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50"
                >
                  {isScanning ? (
                    <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Scanning Deep Web...</>
                  ) : (
                    <><Zap className="w-4 h-4" /> Force Scan Now</>
                  )}
                </button>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="h-64 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-muted-foreground font-medium mt-4 animate-pulse">Scanning the matrix...</p>
                  </div>
                ) : error ? (
                   <div className="p-8 text-center bg-red-500/5">
                     <p className="text-red-500 font-semibold">Error connecting to engines: {error}</p>
                   </div>
                ) : leads.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center bg-muted/5">
                    <Radar className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <p className="text-base text-foreground font-bold">No signals detected yet</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm text-center">
                      Ensure your products have active keywords. The scraper engines run every 10 minutes in the background.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/40">
                    {leads.map((lead) => (
                      <LeadRow 
                        key={lead.id}
                        lead={lead}
                        getIntentColor={getIntentColor}
                        handleDraftReply={handleDraftReply}
                        draftingLeadId={draftingLeadId}
                        draftedReply={draftedReplies[lead.id]}
                        isExpanded={expandedReplies[lead.id]}
                        onToggleExpand={(id) => setExpandedReplies(prev => ({...prev, [id]: !prev[id]}))}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
