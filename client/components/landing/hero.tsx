"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Radar, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"

export function Hero() {
  const { user } = useAuth()
  
  return (
    <section className="relative overflow-hidden pt-16 pb-12 lg:pt-28 lg:pb-24">
      {/* Premium Atmospheric Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[10%] w-[50%] h-[60%] rounded-full bg-primary/10 blur-[140px] opacity-60" />
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[50%] rounded-full bg-accent/5 blur-[120px] opacity-40" />
      </div>

      <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-10 shadow-2xl shadow-primary/10">
              <Sparkles className="h-3 w-3 mr-2 animate-pulse" />
              Autonomous Growth is Here
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-6xl sm:text-8xl lg:text-[10rem] font-black tracking-[-0.05em] text-foreground mb-8 leading-[0.75] lg:max-w-5xl"
          >
            Scale Your <br />
            <span className="text-transparent bg-clip-text bg-linear-to-b from-primary via-primary to-primary/40 drop-shadow-sm">
              Sales Pipeline.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground mb-12 leading-relaxed font-medium"
          >
            Knivik is your 24/7 autonomous sales agent. We scan thousands of real-time threads to find buyers <span className="text-foreground font-bold">before your competitors even wake up.</span>
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-8"
          >
            <Link href={user ? "/dashboard" : "/register"} className="w-full sm:w-auto">
              <Button size="lg" className="h-16 px-12 text-sm font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(var(--primary-rgb),0.3)] transition-all hover:scale-105 active:scale-95 rounded-2xl w-full sm:w-auto">
                {user ? "Go to Dashboard" : "Start For Free"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <div className="flex flex-col items-start gap-1">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" /> 
                No Credit Card Required
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" /> 
                Instant Data Export
              </div>
            </div>
          </motion.div>

          {/* Enhanced Live Signal Feed */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mt-24 w-full max-w-4xl group"
          >
            <div className="relative glass p-6 rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden bg-background/40 backdrop-blur-3xl">
              <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Live Monitoring System</span>
                </div>
                <div className="text-[10px] font-black text-primary px-3 py-1 bg-primary/10 rounded-full">Systems Active</div>
              </div>
              
              <div className="space-y-4">
                {[
                  { platform: "Reddit", user: "growth_hacker", msg: "Anyone know a good lead gen tool for SaaS?", time: "2m ago" },
                  { platform: "X", user: "saas_founder", msg: "Tired of manual outreach. Need something automated.", time: "4m ago" },
                ].map((sig, i) => (
                  <div key={i} className="flex items-center justify-between group/item hover:bg-white/5 p-4 rounded-2xl transition-all duration-300 border border-transparent hover:border-white/5">
                     <div className="flex items-center gap-5">
                       <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black shadow-inner">
                         {sig.platform[0]}
                       </div>
                       <div className="text-left">
                         <div className="flex items-center gap-2 mb-1">
                           <span className="text-[11px] font-black text-foreground">@{sig.user}</span>
                           <span className="text-[9px] font-bold text-muted-foreground uppercase">{sig.time}</span>
                         </div>
                         <div className="text-sm font-medium text-muted-foreground group-hover/item:text-foreground transition-colors truncate max-w-[200px] sm:max-w-md">
                           "{sig.msg}"
                         </div>
                       </div>
                     </div>
                     <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-success/5 rounded-full border border-success/10">
                        <Radar className="h-3 w-3 text-success" />
                        <span className="text-[9px] font-black uppercase text-success">High Intent</span>
                     </div>
                  </div>
                ))}
              </div>
              {/* Glowing decorative element */}
              <div className="absolute -bottom-20 -right-20 h-40 w-40 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
