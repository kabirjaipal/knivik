import { CheckCircle2, MessageSquare, Quote, Reply, Share2, TrendingUp } from "lucide-react"
import Image from "next/image"

const sampleLeads = [
  {
    platform: "Reddit",
    platformColor: "#FF4500",
    icon: "https://www.redditstatic.com/desktop2x/img/favicon/favicon-32x32.png",
    author: "u/tech_founder_92",
    snippet: "We're currently using [Competitor] but their API limits are killing our workflow. Anyone know an alternative that handles high-volume social monitoring?",
    intentScore: 98,
    reason: "Explicitly asking for an alternative to a competitor with specific pain points (API limits).",
    angle: "Highlight Knivik's robust API and unlimited monitoring capabilities in the starter plan."
  },
  {
    platform: "X / Twitter",
    platformColor: "#000000",
    icon: "https://abs.twimg.com/favicons/twitter.ico",
    author: "@SaaS_Growth_Lead",
    snippet: "Manual lead gen on Twitter is a nightmare. There has to be a way to automate finding people talking about CRM problems.",
    intentScore: 92,
    reason: "User is expressing a clear pain point (manual nightmare) and looking for an automation solution.",
    angle: "Show how Knivik automates exactly what they are doing manually in under 60 seconds."
  }
]

export function ProductPreview() {
  return (
    <section id="sample-leads" className="py-24 bg-secondary/30 relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1">
            <h2 className="text-4xl lg:text-5xl font-black tracking-tighter text-foreground mb-6">
              What a qualified lead <br />
              <span className="text-primary italic">actually</span> looks like.
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Knivik doesn't just find keywords. It understands context, frustration, and buying intent. Every lead comes with a clear reason why it was flagged and a suggested outreach angle.
            </p>
            
            <ul className="space-y-4">
              {[
                "Intent scoring from 0-100",
                "Context-aware analysis",
                "Competitor mention detection",
                "Automated outreach suggestions"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 font-bold text-foreground">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex-1 w-full space-y-6">
            {sampleLeads.map((lead, i) => (
              <div 
                key={i}
                className="bg-background rounded-3xl p-6 border border-border/50 shadow-xl relative overflow-hidden group hover:border-primary/30 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center border border-border"
                      style={{ backgroundColor: lead.platformColor + '10' }}
                    >
                      <Image src={lead.icon} alt={lead.platform} width={20} height={20} className={lead.platform === 'X / Twitter' ? 'dark:invert' : ''} />
                    </div>
                    <div>
                      <div className="text-sm font-black">{lead.author}</div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{lead.platform}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 text-success mb-1">
                      <TrendingUp className="h-3 w-3" />
                      <span className="text-xs font-black">{lead.intentScore}% Intent</span>
                    </div>
                    <div className="h-1.5 w-24 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-success rounded-full" style={{ width: `${lead.intentScore}%` }} />
                    </div>
                  </div>
                </div>

                <div className="relative mb-6">
                  <Quote className="absolute -left-2 -top-2 h-8 w-8 text-primary/5 -z-10" />
                  <p className="text-sm text-foreground font-medium italic leading-relaxed pl-4 border-l-2 border-primary/20">
                    "{lead.snippet}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-black mb-2">Why it's flagged</div>
                    <p className="text-[11px] font-bold text-foreground leading-tight">
                      {lead.reason}
                    </p>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-black mb-2">Suggested Angle</div>
                    <p className="text-[11px] font-bold text-primary leading-tight">
                      {lead.angle}
                    </p>
                  </div>
                </div>

                {/* Interaction buttons (aesthetic) */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button className="p-2 bg-secondary rounded-full hover:bg-primary hover:text-white transition-colors"><Reply className="h-4 w-4" /></button>
                   <button className="p-2 bg-secondary rounded-full hover:bg-primary hover:text-white transition-colors"><Share2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
