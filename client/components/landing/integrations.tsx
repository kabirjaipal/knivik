import { MessageSquare, Mail, FileJson, Database, Slack, Github } from "lucide-react"
import Image from "next/image"

const integrations = [
  { name: "Slack", icon: <Slack className="h-8 w-8 text-[#4A154B]" /> },
  { name: "Discord", icon: <MessageSquare className="h-8 w-8 text-[#5865F2]" /> },
  { name: "Email", icon: <Mail className="h-8 w-8 text-primary" /> },
  { name: "JSON API", icon: <FileJson className="h-8 w-8 text-accent" /> },
  { name: "CRM Export", icon: <Database className="h-8 w-8 text-success" /> },
  { name: "Hacker News", icon: <div className="h-8 w-8 bg-[#FF6600] flex items-center justify-center font-bold text-white text-xs">Y</div> }
]

export function Integrations() {
  return (
    <section id="integrations" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 max-w-xl">
            <h2 className="text-4xl lg:text-5xl font-black tracking-tighter text-foreground mb-6">
              Connect to your <br />
              <span className="text-primary italic">existing workflow.</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Knivik doesn't force you into a new platform. Get your leads where you already work—whether that's Slack, Discord, Email, or your custom CRM via our API.
            </p>
            
            <div className="flex flex-wrap gap-4">
              {["Slack Alerts", "Email Notifications", "Webhook Support", "CSV Export"].map((item) => (
                <span key={item} className="px-4 py-2 bg-background rounded-full border border-border text-sm font-bold shadow-sm">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-6">
            {integrations.map((integration) => (
              <div 
                key={integration.name}
                className="bg-background aspect-square rounded-3xl border border-border/50 flex flex-col items-center justify-center gap-4 hover:border-primary/30 hover:shadow-xl transition-all group"
              >
                <div className="group-hover:scale-110 transition-transform">
                  {integration.icon}
                </div>
                <span className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                  {integration.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
