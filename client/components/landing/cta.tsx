"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Zap, ShieldCheck, MessageSquare, Timer } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

interface CTAProps {
  user: any
}

export function FinalCTA({ user }: CTAProps) {
  return (
    <section className="py-20 md:py-32 bg-background relative overflow-hidden border-t border-border/50">
      {/* Background ambient glows that are section-wide, not card-contained */}
      <div className="absolute inset-0 bg-grid opacity-[0.03] -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[20%] left-[10%] w-[80%] h-[60%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[60%] h-[40%] rounded-full bg-accent/5 blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-10 border border-primary/20 backdrop-blur-md"
          >
            <Zap className="h-3.5 w-3.5 mr-2 fill-primary" />
            Start Scaling Today
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl lg:text-7xl font-black tracking-tighter mb-6 md:mb-8 leading-[1.05] text-foreground"
          >
            Ready to find qualified <br />
            <span className="text-primary italic">social leads?</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto font-medium leading-relaxed"
          >
            Automate your Reddit and X outreach. Get qualified leads delivered directly to your dashboard. Join 100+ growth teams already using Knivik.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center gap-12"
          >
            <Link href={user ? "/dashboard" : "/register"} className="w-full sm:w-auto">
              <Button size="lg" className="h-16 px-16 text-lg font-black rounded-2xl w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 group/btn border-t border-white/20">
                {user ? "Enter Dashboard" : "Get My First Lead Free"}
                <ArrowRight className="ml-3 h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </Link>
            
            <div className="flex flex-wrap justify-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              <div className="flex items-center gap-3 group/item cursor-default">
                <Timer className="h-4 w-4 text-primary/40" />
                10m Setup
              </div>
              <div className="flex items-center gap-3 group/item cursor-default">
                <ShieldCheck className="h-4 w-4 text-primary/40" />
                No CC Required
              </div>
              <div className="flex items-center gap-3 group/item cursor-default">
                <MessageSquare className="h-4 w-4 text-primary/40" />
                Cancel Anytime
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}


