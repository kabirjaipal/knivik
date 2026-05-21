"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, MessageSquare, ShieldCheck, Zap } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

interface HeroProps {
  user: any
}

export function Hero({ user }: HeroProps) {
  return (
    <section className="relative pt-24 pb-16 lg:pt-36 lg:pb-28 overflow-hidden min-h-[90vh] flex items-center">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-grid opacity-15 -z-10 pointer-events-none select-none transform-gpu" />
      
      {/* Animated Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10 overflow-hidden select-none">
        <motion.div 
          animate={{
            opacity: [0.08, 0.16, 0.08],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-[-10%] left-[10%] w-[80%] h-[40%] rounded-[100%] bg-primary/20 blur-[120px] transform-gpu will-change-transform" 
        />
        <motion.div 
          animate={{
            opacity: [0.04, 0.09, 0.04],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-[10%] right-[10%] w-[60%] h-[40%] rounded-[100%] bg-accent/10 blur-[100px] transform-gpu will-change-transform" 
        />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-widest text-primary mb-8 border border-primary/20"
          >
            <Zap className="h-3.5 w-3.5 mr-2 fill-primary animate-pulse" />
            Best Reddit Lead Generation Tool & Social Finder
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl lg:text-8xl font-black tracking-tighter text-foreground mb-6 leading-[1.05]"
          >
            Find your next customer <br />
            <span className="relative">
              <span className="text-primary italic">before</span>
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary/30 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 25 0 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="4" />
              </svg>
            </span> they find you.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg lg:text-xl text-muted-foreground mb-10 leading-relaxed max-w-3xl font-medium"
          >
            Learn how to find clients on HackerNews, Reddit, and Twitter automatically. Knivik monitors social media for active buying intent, filters the noise, and delivers qualified warm leads directly to your dashboard.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full sm:w-auto mb-12"
          >
            <Link href={user ? "/dashboard" : "/register"} className="w-full sm:w-auto">
              <Button size="lg" className="h-14 px-10 text-base font-black rounded-2xl w-full bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95 group">
                {user ? "Enter Dashboard" : "Get First Leads Free"}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="#sample-leads" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="h-14 px-8 text-base font-black rounded-2xl border-2 hover:bg-secondary/50 transition-all w-full">
                See sample leads
              </Button>
            </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="flex flex-wrap justify-center gap-8 text-[10px] sm:text-xs text-muted-foreground font-black uppercase tracking-widest"
          >
            <div className="flex items-center gap-2 group cursor-default">
              <ShieldCheck className="h-4 w-4 text-success group-hover:scale-110 transition-transform" />
              No credit card required
            </div>
            <div className="flex items-center gap-2 group cursor-default">
              <MessageSquare className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
              Alerts in Slack & Email
            </div>
            <div className="flex items-center gap-2 group cursor-default">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </div>
              Monitoring Live
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

