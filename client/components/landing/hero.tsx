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
    <section className="relative overflow-hidden pt-24 pb-16 lg:pt-40 lg:pb-32 bg-grid">
      {/* Premium Atmospheric Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none z-0">
        <div className="absolute -top-[10%] left-[10%] w-[80%] h-[40%] rounded-[100%] bg-primary/15 blur-[120px] opacity-70 animate-pulse" />
        <div className="absolute top-[20%] right-[5%] w-[40%] h-[30%] rounded-[100%] bg-accent/10 blur-[100px] opacity-50" />
      </div>

      <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
          <div className="mt-24 w-full max-w-5xl group px-4 sm:px-0 transition-all duration-1000 delay-500 ease-out">
            <div className="relative p-1 rounded-[2.5rem] bg-linear-to-b from-primary/20 to-transparent shadow-2xl">
              <div className="relative glass p-6 sm:p-10 rounded-[2.25rem] border border-white/10 shadow-inner overflow-hidden bg-background/40 backdrop-blur-3xl">
                <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="relative h-4 w-4">
                      <div className="absolute inset-0 rounded-full bg-accent animate-ping opacity-50" />
                      <div className="relative h-4 w-4 rounded-full bg-accent" />
                    </div>
                    <span className="text-sm font-black uppercase tracking-[0.3em] text-foreground/80">Autonomous Neural Feed</span>
                  </div>
                  <div className="text-[10px] font-black text-accent border border-accent/20 px-4 py-1.5 rounded-full bg-accent/5 uppercase tracking-widest">
                    Real-Time Scan Active
                  </div>
                </div>
                
                <div className="space-y-6 text-left">
                  {[
                    { platform: "Reddit", user: "saas_pro", msg: "We're losing users to competitors. Any tool to track social signals?", time: "Just now", score: 98 },
                    { platform: "X", user: "indie_maker", msg: "How do I find people talking about 'cold email alternatives'?", time: "1m ago", score: 94 },
                  ].map((sig, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl transition-all duration-500 border border-transparent hover:border-primary/10 hover:bg-primary/5 group/item">
                       <div className="flex items-center gap-6 min-w-0">
                         <div className="h-12 w-12 shrink-0 rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-black shadow-lg text-lg group-hover/item:scale-110 transition-transform">
                           {sig.platform[0]}
                         </div>
                         <div className="min-w-0">
                           <div className="flex items-center gap-3 mb-1.5">
                             <span className="text-sm font-black text-foreground">@{sig.user}</span>
                             <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-muted/30 px-2 py-0.5 rounded-md">{sig.time}</span>
                           </div>
                           <div className="text-sm sm:text-base font-medium text-muted-foreground group-hover/item:text-foreground transition-colors leading-relaxed">
                             "{sig.msg}"
                           </div>
                         </div>
                       </div>
                       <div className="flex items-center gap-3 px-4 py-2 bg-accent/5 rounded-2xl border border-accent/10 self-start sm:self-center">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase tracking-tighter text-accent/60">Intent</span>
                            <span className="text-sm font-black text-accent">{sig.score}%</span>
                          </div>
                          <Radar className="h-4 w-4 text-accent animate-pulse" />
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
