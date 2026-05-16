import { Button } from "@/components/ui/button"
import { Radar, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { getSession } from "@/lib/auth-client"
import { headers } from "next/headers"

export async function Hero() {
  const { data: session } = await getSession({
    fetchOptions: {
      headers: await headers()
    }
  })
  const user = session?.user
  
  return (
    <section className="relative overflow-hidden pt-32 lg:pt-48 bg-grid">
      {/* Premium Atmospheric Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none z-0">
        <div className="absolute -top-[10%] left-[10%] w-[80%] h-[40%] rounded-[100%] bg-primary/15 blur-[120px] opacity-70 animate-pulse" />
        <div className="absolute top-[20%] right-[5%] w-[40%] h-[30%] rounded-[100%] bg-accent/10 blur-[100px] opacity-50" />
      </div>

      <div className="relative z-10 w-full">
        <div className="flex flex-col items-center text-center">
          <div className="group cursor-default">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-primary mb-12 shadow-2xl shadow-primary/10 backdrop-blur-md transition-all hover:border-primary/40 hover:bg-primary/10">
              <Sparkles className="h-3 w-3 mr-2 text-accent" />
              Autonomous Growth 2026
            </div>
          </div>
          
          <h1 className="text-6xl sm:text-8xl lg:text-[10rem] font-black tracking-tighter text-foreground mb-8 leading-[0.85] lg:max-w-6xl transition-all duration-1000 ease-out">
            Find Leads <br />
            <span className="text-transparent bg-clip-text bg-linear-to-b from-primary via-primary to-primary/20 text-glow">
              On Autopilot.
            </span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg sm:text-2xl text-muted-foreground mb-14 leading-relaxed font-medium px-4 transition-all duration-1000 delay-100 ease-out">
            Knivik is the razor-sharp AI agent that monitors social conversations 24/7. Find high-intent customers <span className="text-foreground font-bold underline decoration-primary/30 decoration-4 underline-offset-4">autonomously</span> while you sleep.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto px-4 transition-all duration-1000 delay-200 ease-out">
            <Link href={user ? "/dashboard" : "/register"} className="w-full sm:w-auto">
              <Button size="lg" className="h-16 px-12 text-sm font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(var(--primary-rgb),0.3)] transition-all hover:scale-105 active:scale-95 rounded-2xl w-full bg-primary hover:bg-primary/90 border-t border-white/20">
                {user ? "Enter Dashboard" : "Deploy Knivik Free"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <div className="flex flex-col items-start gap-2 text-left">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80">
                <CheckCircle2 className="h-3.5 w-3.5 text-accent" /> 
                Next-Gen Accuracy
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80">
                <CheckCircle2 className="h-3.5 w-3.5 text-accent" /> 
                Zero Setup Cost
              </div>
            </div>
          </div>

          {/* Elite Signal Feed Visualization */}
          {/* Elite Signal Feed Visualization - Compact Canonical Style */}
          <div className="mt-20 w-full group transition-all duration-1000 delay-500 ease-out">
            <div className="relative p-1 rounded-[2rem] bg-linear-to-b from-primary/20 to-transparent shadow-xl">
              <div className="relative glass p-3 sm:p-6 rounded-[1.75rem] border border-white/10 shadow-inner overflow-hidden bg-background/40 backdrop-blur-3xl">
                <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-4 px-2">
                  <div className="flex items-center gap-3">
                    <div className="relative h-3 w-3">
                      <div className="absolute inset-0 rounded-full bg-accent animate-ping opacity-50" />
                      <div className="relative h-3 w-3 rounded-full bg-accent" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/80">Neural Feed</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-[9px] font-black text-accent border border-accent/20 px-3 py-1 rounded-full bg-accent/5 uppercase tracking-widest">
                    <Radar className="h-2.5 w-2.5 animate-pulse" />
                    Live Scan
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-2.5 text-left">
                  {[
                    { platform: "REDDIT", user: "saas_founder", msg: "We're losing users to competitors. Looking for an AI tool to track social signals autonomously...", time: "JUST NOW", score: 98, intent: "BUY NOW" },
                    { platform: "X", user: "growth_lead", msg: "Anyone know a better alternative to manual cold outreach? Need something that finds intent-based leads.", time: "1M AGO", score: 94, intent: "RESEARCHING" },
                  ].map((sig, i) => (
                    <div key={i} className="group/card relative bg-card/40 backdrop-blur-xl rounded-xl border border-white/5 overflow-hidden shadow-sm transition-all hover:shadow-2xl hover:border-white/10 border-l-4 border-l-primary flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5">
                       <div className="flex items-center gap-4 min-w-0">
                         {/* Compact Avatar */}
                         <div className="h-10 w-10 shrink-0 rounded-lg bg-linear-to-br from-primary/20 to-primary/5 border border-white/10 flex items-center justify-center text-primary font-black shadow-lg text-base group-hover/card:scale-105 transition-transform">
                           {sig.platform[0]}
                         </div>
                         
                         <div className="min-w-0">
                           {/* Compact Badges */}
                           <div className="flex items-center gap-1.5 mb-1.5">
                             <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground bg-muted/20 px-1.5 py-0.5 rounded">
                               {sig.platform}
                             </span>
                             <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border border-accent/20 bg-accent/10 text-accent">
                               {sig.intent}
                             </span>
                             <span className="text-[8px] font-black px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                               ★ {sig.score}
                             </span>
                           </div>
                           
                           {/* Row 2: User + Content Inline */}
                           <div className="flex items-center gap-2 min-w-0">
                             <span className="text-xs font-black text-foreground shrink-0">@{sig.user}</span>
                             <div className="text-xs font-medium text-muted-foreground/80 group-hover/card:text-foreground transition-colors leading-relaxed truncate italic">
                               "{sig.msg}"
                             </div>
                           </div>
                         </div>
                       </div>
                       
                       {/* Compact Action */}
                       <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                          <div className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all cursor-default">
                             Engage <ArrowRight className="h-2.5 w-2.5" />
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

  )
}
