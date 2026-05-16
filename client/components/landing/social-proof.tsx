import { Cpu, Globe, MessageSquare, Twitter } from "lucide-react"
import Image from "next/image"

export function PlatformSupport() {
  const platforms = [
    { name: "Reddit", icon: "https://www.redditstatic.com/desktop2x/img/favicon/favicon-32x32.png" },
    { name: "Twitter (X)", icon: "https://abs.twimg.com/favicons/twitter.2.ico" },
    { name: "Hacker News", icon: "https://news.ycombinator.com/favicon.ico" },
  ]

  return (
    <section className="py-12 border-y border-border/50 bg-secondary/10">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center gap-10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
            Monitoring High-Intent Signals Across
          </p>
          
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24">
            {platforms.map((platform) => (
              <div key={platform.name} className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-all duration-300 group">
                <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center p-1.5 border border-border group-hover:border-primary/30 group-hover:shadow-lg group-hover:shadow-primary/5 transition-all">
                  <img 
                    src={platform.icon} 
                    alt={platform.name} 
                    className={`w-full h-full object-contain ${platform.name === 'Twitter (X)' ? 'invert dark:invert-0' : ''}`}
                  />
                </div>
                <span className="text-sm font-black tracking-tight text-foreground/70 group-hover:text-foreground transition-colors">
                  {platform.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
