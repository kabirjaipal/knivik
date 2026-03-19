"use client"

import { useAuth } from "@/context/auth-context"
import { Navbar } from "@/components/landing/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Radar, Users, MessageSquareText, Activity, ExternalLink, Zap, Clock, ThumbsUp, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

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
  }
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [draftingLeadId, setDraftingLeadId] = useState<string | null>(null)
  const [draftedReplies, setDraftedReplies] = useState<Record<string, string>>({})

  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    } else if (user) {
      fetchLeads()
    }
  }, [user, authLoading, router])

  const fetchLeads = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/leads`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch leads')
      const data = await res.json()
      setLeads(data.leads)
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
    } catch (e: any) {
      console.error(e)
    } finally {
      setDraftingLeadId(null)
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

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/30">
      {/* Dynamic Background Elements for "WOW" factor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-b from-primary/5 to-transparent rounded-full blur-[120px] opacity-70"></div>
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-gradient-to-l from-blue-500/5 to-transparent rounded-full blur-[100px] opacity-50"></div>
      </div>

      <div className="relative z-10">
        <Navbar />
        
        <main className="flex-1 container mx-auto px-4 py-12 max-w-7xl">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <h1 className="text-4xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Welcome back, {user?.username}
            </h1>
            <p className="text-muted-foreground mt-3 text-lg max-w-2xl leading-relaxed">
              Your radar is active. We are actively scanning hyperspace for buying signals that match your products.
            </p>
          </motion.div>

          {/* Top-Level Metric Cards */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            <motion.div variants={itemVariants}>
              <Card className="shadow-xl shadow-black/5 border-border/40 bg-card/50 backdrop-blur-xl relative overflow-hidden group hover:border-primary/50 transition-colors duration-300">
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
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="shadow-xl shadow-primary/5 border-primary/30 bg-primary/5 backdrop-blur-xl relative overflow-hidden group">
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
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="shadow-xl shadow-black/5 border-border/40 bg-card/50 backdrop-blur-xl group hover:border-primary/50 transition-colors duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Recent Signals</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black">{recentSignals}</div>
                  <p className="text-xs text-muted-foreground mt-2">Discovered last 24h</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="shadow-xl shadow-black/5 border-border/40 bg-card/50 backdrop-blur-xl group hover:border-primary/50 transition-colors duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Avg. Intent Score</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black">{averageIntent}</div>
                  <p className="text-xs text-primary font-medium mt-2">Global pipeline quality</p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Secondary Detailed Data Pane */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10"
          >
            <Card className="border-border/50 shadow-2xl bg-card/60 backdrop-blur-xl overflow-hidden rounded-2xl">
              <CardHeader className="border-b border-border/40 bg-muted/20 pb-6">
                <CardTitle className="text-2xl font-bold flex items-center">
                  <Radar className="mr-3 text-primary h-6 w-6" /> Live Detection Stream
                </CardTitle>
                <CardDescription className="text-sm font-medium">
                  Leads actively discovered by your AI engines across the web.
                </CardDescription>
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
                    <AnimatePresence>
                      {leads.map((lead, idx) => (
                        <div key={lead.id} className="group relative">
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-6 hover:bg-muted/20 transition-all duration-300 group flex flex-col md:flex-row gap-6 items-start"
                        >
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
                                {lead.product.name}
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
                          
                          <div className="flex-shrink-0 flex md:flex-col gap-2 w-full md:w-auto mt-4 md:mt-0">
                            <a 
                              href={lead.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center justify-center gap-2 w-full md:w-40 py-2.5 px-4 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25 active:scale-95"
                            >
                              Engage <ExternalLink className="w-4 h-4" />
                            </a>
                            <button 
                              onClick={() => handleDraftReply(lead.id)}
                              disabled={draftingLeadId === lead.id}
                              className="flex items-center justify-center gap-2 w-full md:w-40 py-2.5 px-4 bg-secondary text-secondary-foreground text-sm font-bold rounded-lg hover:bg-secondary/80 transition-all border border-border group/btn active:scale-95 disabled:opacity-50"
                            >
                              {draftingLeadId === lead.id ? (
                                 <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                              ) : (
                                 <>Draft Reply <ChevronRight className="w-4 h-4 text-muted-foreground group-hover/btn:translate-x-1 transition-transform" /></>
                              )}
                            </button>
                          </div>
                        </motion.div>
                        
                        {/* Auto-Expanding Draft Section */}
                        <AnimatePresence>
                          {draftedReplies[lead.id] && (
                            <motion.div 
                               initial={{ opacity: 0, height: 0 }}
                               animate={{ opacity: 1, height: 'auto' }}
                               exit={{ opacity: 0, height: 0 }}
                               className="bg-card border-t border-border/40 p-4 md:px-6 relative overflow-hidden"
                            >
                              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                              <h4 className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-primary mb-3">
                                <Zap className="w-3 h-3" /> AI Generated Pitch
                              </h4>
                              <textarea 
                                readOnly
                                className="w-full h-32 text-sm text-foreground bg-muted/30 border border-border rounded-lg p-3 outline-none resize-none hide-scrollbar focus:border-primary/50 transition-colors"
                                value={draftedReplies[lead.id]}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                       </div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
