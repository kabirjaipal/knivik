"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ArrowRight, Target, MessagesSquare, Zap } from "lucide-react"
import Link from "next/link"
import { PROJECT_NAME } from "@/lib/constants"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background pt-24 pb-32 lg:pt-36 lg:pb-40">
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
      
      <div className="container relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-8">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
            AI-Driven Social Listening
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-foreground mb-6">
            Find High-Intent Buyers <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-blue-400">
              on Auto-Pilot.
            </span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed">
            Stop manually parsing Reddit and HackerNews. We scan recent social posts in real-time, scoring buying intent and delivering hot leads straight to your dashboard.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="h-14 px-8 text-base font-semibold shadow-lg shadow-primary/20">
                Start Tracking for Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button size="lg" variant="outline" className="h-14 px-8 text-base font-semibold">
                See How It Works
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Feature Highlights Row */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-3xl mx-auto text-sm text-muted-foreground"
        >
          <div className="flex items-center justify-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <span>AI Intent Scoring 0-100</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <MessagesSquare className="h-5 w-5 text-primary" />
            <span>Auto-Drafted AI Replies</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span>Instant Slack/Email Alerts</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
