"use client"

import { Target, Zap, Clock, Users, Search, BarChart3, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

const benefits = [
  {
    icon: <Target className="h-7 w-7" />,
    title: "Find active buyers",
    description: "Catch people exactly when they ask for recommendations or complain about your competitors."
  },
  {
    icon: <Clock className="h-7 w-7" />,
    title: "Be first to every deal",
    description: "Don't wait for leads to find you. Knivik alerts you the second a high-intent conversation starts."
  },
  {
    icon: <Zap className="h-7 w-7" />,
    title: "Stop manual searching",
    description: "Save hours every day. Let our AI do the scrolling across Reddit, X, HN, 24/7."
  },
  {
    icon: <Users className="h-7 w-7" />,
    title: "Route leads instantly",
    description: "Send qualified leads to your sales team via Slack or Email the moment they surface."
  },
  {
    icon: <Search className="h-7 w-7" />,
    title: "Deep context analysis",
    description: "Our AI understands the difference between a casual mention and a genuine business need."
  },
  {
    icon: <BarChart3 className="h-7 w-7" />,
    title: "Scale your pipeline",
    description: "Consistently fill your CRM with qualified social leads without increasing your headcount."
  }
]

export function Benefits() {
  return (
    <section id="benefits" className="py-32 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-5" />
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-20 lg:mb-32">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-6 border border-primary/20"
          >
            <Sparkles className="h-3 w-3" />
            Competitive Edge
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-4xl lg:text-7xl font-black tracking-tighter text-foreground mb-8 leading-tight"
          >
            Built for growth teams <br />
            <span className="text-muted-foreground/30">who move fast.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-muted-foreground max-w-2xl font-medium"
          >
            Practical lead generation that saves you time and increases your revenue without the marketing fluff.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-10 rounded-[2.5rem] border border-border/50 bg-secondary/5 hover:border-primary/40 hover:bg-background hover:shadow-2xl hover:shadow-primary/5 transition-all group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="mb-8 h-16 w-16 items-center justify-center rounded-2xl bg-background text-primary flex group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-xl border border-border group-hover:border-primary/50">
                {benefit.icon}
              </div>
              <h3 className="text-2xl font-black mb-4 tracking-tight group-hover:text-primary transition-colors">{benefit.title}</h3>
              <p className="text-muted-foreground font-medium leading-relaxed text-base">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

