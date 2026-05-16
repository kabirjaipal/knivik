"use client"

import { CheckCircle2, MessageSquare, Quote, Reply, Share2, TrendingUp, Sparkles } from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"

const sampleLeads = [
  {
    platform: "Reddit",
    platformColor: "#FF4500",
    icon: "https://www.redditstatic.com/desktop2x/img/favicon/favicon-32x32.png",
    author: "u/tech_founder_92",
    snippet: "We're currently using [Competitor] but their API limits are killing our workflow. Anyone know an alternative that handles high-volume social monitoring?",
    intentScore: 98,
    reason: "Explicitly asking for an alternative to a competitor with specific pain points (API limits).",
    angle: "Highlight Knivik's robust monitoring capabilities and high-volume limits."
  },
  {
    platform: "X / Twitter",
    platformColor: "#000000",
    icon: "https://abs.twimg.com/favicons/twitter.ico",
    author: "@SaaS_Growth_Lead",
    snippet: "Manual lead gen on Twitter is a nightmare. There has to be a way to automate finding people talking about CRM problems in real-time.",
    intentScore: 92,
    reason: "User is expressing a clear pain point and looking for an automation solution.",
    angle: "Show how Knivik automates exactly what they are doing manually in under 60 seconds."
  }
]

export function ProductPreview() {
  return (
    <section id="sample-leads" className="py-24 bg-secondary/20 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-5" />
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-20">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex-1"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-6 border border-primary/20">
              <Sparkles className="h-3 w-3" />
              Smart Intent Detection
            </div>
            <h2 className="text-4xl lg:text-6xl font-black tracking-tighter text-foreground mb-8 leading-[1.05]">
              What a qualified lead <br />
              <span className="text-primary italic">actually</span> looks like.
            </h2>
            <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-xl">
              Knivik doesn't just find keywords. It understands context, frustration, and buying intent. Every lead comes with a clear reason why it was flagged and a suggested outreach angle.
            </p>
            
            <ul className="space-y-5">
              {[
                "Context-aware AI intent scoring",
                "Competitor mention & frustration detection",
                "Real-time monitoring across 4 platforms",
                "AI-powered personalized outreach angles"
              ].map((item, i) => (
                <motion.li 
                  key={i} 
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-4 font-bold text-foreground group"
                >
                  <div className="h-6 w-6 rounded-full bg-success/10 flex items-center justify-center border border-success/20 group-hover:bg-success group-hover:text-white transition-all">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex-1 w-full space-y-8 relative"
          >
            {/* Live Feed Decoration */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-[80px] -z-10" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent/20 rounded-full blur-[80px] -z-10" />

            {sampleLeads.map((lead, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="bg-background rounded-[2.5rem] p-8 border border-border shadow-2xl relative overflow-hidden group hover:border-primary/40 transition-all hover:shadow-primary/5 active:scale-[0.98]"
              >
                {/* Scanning Light Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover:animate-[scan_2s_infinite] pointer-events-none" />

                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center border border-border shadow-inner bg-secondary/30"
                    >
                      <img src={lead.icon} alt={lead.platform} className={`w-6 h-6 object-contain ${lead.platform === 'X / Twitter' ? 'dark:invert' : ''}`} />
                    </div>
                    <div>
                      <div className="text-base font-black">{lead.author}</div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black">{lead.platform}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2 text-success mb-2">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm font-black tracking-tighter">{lead.intentScore}% Intent</span>
                    </div>
                    <div className="h-2 w-32 bg-secondary rounded-full overflow-hidden border border-border/50">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${lead.intentScore}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full bg-success rounded-full" 
                      />
                    </div>
                  </div>
                </div>

                <div className="relative mb-8 p-5 bg-secondary/10 rounded-2xl border border-border/40 italic font-medium leading-relaxed">
                  <Quote className="absolute -left-3 -top-3 h-8 w-8 text-primary/10" />
                  <p className="text-foreground relative z-10">
                    "{lead.snippet}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-6 border-t border-border">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-black mb-3">Why it's flagged</div>
                    <p className="text-xs font-bold text-foreground leading-tight">
                      {lead.reason}
                    </p>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-black mb-3">Suggested Angle</div>
                    <p className="text-xs font-bold text-primary leading-tight">
                      {lead.angle}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

