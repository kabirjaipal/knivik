"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ArrowRight, Radar, Zap, Globe, Sparkles } from "lucide-react"
import Link from "next/link"
import { PROJECT_NAME } from "@/lib/constants"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background pt-20 pb-24 lg:pt-32 lg:pb-36">
      {/* Premium Ambient Glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(var(--primary-rgb),0.08),transparent_70%)] blur-[120px]" />
      </div>
      
      <div className="container relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Badge */}
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-primary mb-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Sparkles className="h-3 w-3 mr-2" />
            Autonomous Growth Discovery
          </div>
          
          <h1 className="text-5xl sm:text-7xl lg:text-9xl font-black tracking-tighter text-foreground mb-10 leading-[0.9]">
            Find Your Next <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-linear-to-b from-primary to-primary/60">
              100 Customers.
            </span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg sm:text-2xl text-muted-foreground mb-14 leading-relaxed font-medium">
            We scan the entire internet in real-time to surface high-intent buyers talking about your niche right now. No noise, just demand.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="h-16 px-12 text-sm font-black uppercase tracking-widest shadow-2xl shadow-primary/20 transition-all hover:scale-105 rounded-2xl">
                Get Started Free
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="ghost" className="h-16 px-10 text-sm font-black uppercase tracking-widest transition-all rounded-2xl">
                Live Demo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Floating Metrics Row */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mt-24 grid grid-cols-2 gap-8 sm:grid-cols-3 max-w-4xl mx-auto border-t border-border/40 pt-16"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-2">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-black tracking-tight">Omni-Channel</span>
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Web-scale scanning</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-2">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-black tracking-tight">Real-Time</span>
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Instant Intent Alerts</span>
          </div>
          <div className="flex flex-col items-center gap-2 col-span-2 sm:col-span-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-2">
              <Radar className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-black tracking-tight">98% Accuracy</span>
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">AI Intent Filters</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
