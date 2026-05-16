"use client"

import { MessageSquare, Mail, FileJson, Database, Slack, Sparkles, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

const integrations = [
  { name: "Slack", icon: <Slack className="h-10 w-10 text-[#4A154B]" /> },
  { name: "Discord", icon: <MessageSquare className="h-10 w-10 text-[#5865F2]" /> },
  { name: "Email", icon: <Mail className="h-10 w-10 text-primary" /> },
  { name: "JSON API", icon: <FileJson className="h-10 w-10 text-accent" /> },
  { name: "CRM Export", icon: <Database className="h-10 w-10 text-success" /> },
  { name: "Webhooks", icon: <Sparkles className="h-10 w-10 text-warning" /> }
]

export function Integrations() {
  return (
    <section id="integrations" className="py-32 bg-secondary/20 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-5" />
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-24">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex-1 max-w-xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-6 border border-primary/20">
              <Sparkles className="h-3 w-3" />
              Workflow Native
            </div>
            <h2 className="text-4xl lg:text-7xl font-black tracking-tighter text-foreground mb-8 leading-[1.05]">
              Connect to your <br />
              <span className="text-primary italic">existing workflow.</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-10 leading-relaxed font-medium">
              Knivik doesn't force you into a new platform. Get your leads where you already work—whether that's Slack, Discord, Email, or your custom CRM via our API.
            </p>
            
            <div className="flex flex-wrap gap-4">
              {["Slack Alerts", "Email Notifications", "Webhook Support", "CSV Export"].map((item) => (
                <div key={item} className="px-5 py-2.5 bg-background rounded-2xl border border-border text-sm font-black shadow-sm flex items-center gap-2 hover:border-primary/40 transition-colors cursor-default">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-6 relative">
             {/* Decorative background glow */}
             <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full -z-10" />
             
            {integrations.map((integration, i) => (
              <motion.div 
                key={integration.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-background aspect-square rounded-[2rem] border border-border/50 flex flex-col items-center justify-center gap-5 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 transition-all group hover:-translate-y-1"
              >
                <div className="group-hover:scale-110 transition-transform duration-500 ease-out">
                  {integration.icon}
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                  {integration.name}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

