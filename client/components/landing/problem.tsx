"use client"

import { motion } from "framer-motion"
import { XCircle, Clock, TrendingDown, AlertTriangle } from "lucide-react"

export function Problem() {
  return (
    <section className="py-16 lg:py-32 relative overflow-hidden bg-secondary/20">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '40px 40px' }} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="text-center mb-16 sm:mb-24">
          <div className="inline-flex items-center rounded-full bg-destructive/10 px-3 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-destructive mb-6">
            <AlertTriangle className="h-3 w-3 mr-2" />
            The Growth Gap
          </div>
          <h2 className="text-4xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-foreground mb-6 leading-[0.9] sm:leading-[0.85]">
            You are losing customers <br className="hidden lg:block" /> 
            <span className="text-destructive">to competitors right now.</span>
          </h2>
          <p className="max-w-3xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed font-medium px-2">
            Every day, thousands of high-intent buyers ask for recommendations or express pain points on social media. If you aren't the first to respond, you've already lost the deal.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {[
            {
              icon: <Clock className="h-6 w-6" />,
              title: "The Speed Trap",
              description: "By the time you see a high-intent post organically, a competitor has already replied, solved the problem, and won the deal. In the social web, speed is the only currency."
            },
            {
              icon: <TrendingDown className="h-6 w-6" />,
              title: "Manual Burnout",
              description: "Scrolling through endless feeds and searching through subreddits is a recipe for burnout. It's unscalable, exhausting, and leads to missing 95% of opportunities."
            },
            {
              icon: <XCircle className="h-6 w-6" />,
              title: "Cold Response",
              description: "Generic cold outreach is dead. Without the context of a real-time problem, your messages are just noise. You need intent to break through the static."
            }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass p-8 sm:p-10 rounded-3xl border border-destructive/10 hover:border-destructive/30 transition-all duration-500 group"
            >
              <div className="mb-6 sm:mb-8 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-destructive/5 text-destructive shadow-[0_0_30px_rgba(var(--destructive-rgb),0.05)] group-hover:scale-110 group-hover:shadow-[0_0_40px_rgba(var(--destructive-rgb),0.15)] transition-all">
                {item.icon}
              </div>
              <h3 className="text-xl sm:text-2xl font-black mb-4 tracking-tight">{item.title}</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-medium">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Closing Statement */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 sm:mt-24 flex flex-col items-center px-4"
        >
          <div className="h-px w-24 bg-destructive/20 mb-8" />
          <p className="text-lg sm:text-xl font-bold italic text-foreground tracking-tight text-center">
            "The first response gets 70% of the conversions. Knivik makes you first, every time."
          </p>
        </motion.div>
      </div>
    </section>
  )
}
