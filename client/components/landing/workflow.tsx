"use client"

import { motion } from "framer-motion"
import { Search, BrainCircuit, MessageSquareCode, ArrowRight } from "lucide-react"

const steps = [
  {
    icon: <Search className="h-6 w-6" />,
    title: "1. Monitor Keywords",
    description: "Tell Knivik what you do. We'll start monitoring Reddit, X, and HackerNews for relevant discussions instantly."
  },
  {
    icon: <BrainCircuit className="h-6 w-6" />,
    title: "2. AI Intent Filtering",
    description: "Our LLMs analyze every post to distinguish casual chatter from high-intent buyers looking for a solution."
  },
  {
    icon: <MessageSquareCode className="h-6 w-6" />,
    title: "3. Instant Outreach",
    description: "Get notified immediately with auto-drafted replies tailored to the user's specific problem."
  }
]

export function Workflow() {
  return (
    <section className="py-12 lg:py-20 relative bg-background">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid lg:grid-cols-3 gap-12">
          {steps.map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative group"
            >
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 -right-6 text-border/40">
                  <ArrowRight className="h-8 w-8" />
                </div>
              )}
              
              <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary border border-border/50 text-primary group-hover:scale-110 transition-transform duration-500 shadow-inner">
                {step.icon}
              </div>
              <h3 className="text-2xl font-black mb-4 tracking-tight">{step.title}</h3>
              <p className="text-muted-foreground font-medium leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
