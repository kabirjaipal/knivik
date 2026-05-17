"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

const faqs = [
  {
    question: "How does the AI find high-quality leads?",
    answer: "Knivik understands the true intent behind social posts. Instead of just matching keywords, it identifies people who are actively looking for solutions, frustrated with competitors, or asking for recommendations, while filtering out irrelevant noise."
  },
  {
    question: "Where does Knivik find these leads?",
    answer: "We monitor major social platforms including Reddit, X (Twitter), and HackerNews. We find high-intent conversations in real-time, giving you the first-mover advantage before your competitors even know they exist."
  },
  {
    question: "How do I reach out without sounding like a salesperson?",
    answer: "Every lead comes with AI-generated 'Reply Angles'—personalized suggestions based on the specific conversation. This helps you join threads naturally, provide genuine value, and build trust without sounding like a bot."
  },
  {
    question: "Can I connect this to my existing workflow?",
    answer: "Absolutely. You can automatically push your leads to Slack, Discord, or connect with 5,000+ other apps via Zapier and Make. This ensures you never miss a lead and can keep your outreach moving."
  },
  {
    question: "Is it easy to get started?",
    answer: "Yes! You can set up your first product in minutes. We offer a free tier so you can see the quality of leads for yourself before committing to a paid plan as your business grows."
  }
]

import { DynamicFaqJsonLd } from "@/components/seo/dynamic-faq-json-ld"

export function FAQ() {
  return (
    <section id="faq" className="py-16 md:py-24 bg-secondary/10 relative overflow-hidden">
      <DynamicFaqJsonLd />
      <div className="absolute inset-0 bg-grid opacity-5" />
      <div className="container mx-auto px-6">
          <div className="text-center mb-12 md:mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-6 border border-primary/20"
            >
              <Sparkles className="h-3 w-3" />
              Quick Answers
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-2xl md:text-3xl lg:text-5xl font-black tracking-tighter text-foreground mb-4 md:mb-6"
            >
              Frequently Asked Questions
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-base md:text-lg text-muted-foreground font-medium"
            >
              Get started with Knivik in minutes.
            </motion.p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <AccordionItem 
                    value={`item-${i}`}
                    className="bg-background px-6 py-1 rounded-2xl border border-border/50 shadow-sm hover:border-primary/20 transition-all overflow-hidden"
                  >
                    <AccordionTrigger className="text-base md:text-lg font-black text-left hover:no-underline hover:text-primary transition-all py-4">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm md:text-base text-muted-foreground leading-relaxed font-medium pb-6">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          </div>
        </div>
    </section>
  )
}


