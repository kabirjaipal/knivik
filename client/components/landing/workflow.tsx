"use client"

import { Search, BrainCircuit, Bell, ArrowRight, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

const steps = [
  {
    icon: <Search className="h-8 w-8" />,
    title: "1. Monitor Conversations",
    description: "Knivik scans Reddit, X, Hacker News for keywords and pain points relevant to your business."
  },
  {
    icon: <BrainCircuit className="h-8 w-8" />,
    title: "2. Filter with AI",
    description: "Our AI scores every post to separate casual mentions from real buying intent, so you only see the best leads."
  },
  {
    icon: <Bell className="h-8 w-8" />,
    title: "3. Get Instant Alerts",
    description: "Qualified leads are pushed instantly to your dashboard, Slack, or email for immediate engagement."
  }
]

export function Workflow() {
  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-5" />
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-12 md:mb-20 lg:mb-32">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-6 border border-primary/20"
          >
            <Sparkles className="h-3 w-3" />
            Seamless Automation
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-5xl lg:text-7xl font-black tracking-tighter text-foreground mb-6 md:mb-8"
          >
            How it works
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl font-medium"
          >
            Stop manually searching for customers. Automate your social lead generation in three simple steps.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-10 relative">
          {/* Connector line for desktop */}
          <div className="hidden lg:block absolute top-[2.5rem] left-[15%] w-[70%] h-[2px] bg-gradient-to-r from-transparent via-border to-transparent -z-10" />
          
          {steps.map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.2 }}
              className="bg-background flex flex-col items-center text-center p-10 rounded-[3rem] border border-border/50 shadow-xl relative z-10 hover:border-primary/30 transition-all group hover:-translate-y-2"
            >
              <div className="mb-8 h-20 w-20 items-center justify-center rounded-3xl bg-secondary/50 text-primary flex group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-inner border border-border group-hover:border-primary/50 group-hover:shadow-primary/20 group-hover:shadow-2xl">
                {step.icon}
              </div>
              <h3 className="text-2xl font-black mb-5 tracking-tight group-hover:text-primary transition-colors">{step.title}</h3>
              <p className="text-muted-foreground font-medium leading-relaxed text-base">
                {step.description}
              </p>
              
              {/* Step Number Badge */}
              <div className="absolute -top-4 -right-4 h-12 w-12 rounded-full bg-background border border-border shadow-lg flex items-center justify-center text-xs font-black text-muted-foreground group-hover:border-primary group-hover:text-primary transition-all">
                0{i+1}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

