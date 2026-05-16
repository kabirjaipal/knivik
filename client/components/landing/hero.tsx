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
    <section className="relative overflow-hidden pt-20 pb-12 lg:pt-32 lg:pb-24">
      {/* Premium Atmospheric Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-screen pointer-events-none z-0">
        <div className="absolute -top-20 left-10 w-2/3 sm:w-1/2 h-2/3 rounded-full bg-primary/10 blur-3xl sm:blur-4xl opacity-60 animate-pulse" />
        <div className="absolute top-24 right-10 w-2/3 sm:w-2/5 h-1/2 rounded-full bg-accent/5 blur-3xl sm:blur-4xl opacity-40 animate-pulse" />
      </div>

      <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <div className="transition-all duration-1000 ease-out">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm font-black uppercase tracking-wide sm:tracking-widest text-primary mb-8 sm:mb-10 shadow-2xl shadow-primary/10 backdrop-blur-sm">
              <Sparkles className="h-3 w-3 mr-2 animate-pulse" />
              Autonomous Growth is Here
            </div>
          </div>
          
          <h1 className="text-5xl sm:text-8xl lg:text-8xl font-black tracking-tight text-foreground mb-6 sm:mb-8 leading-tight sm:leading-none lg:max-w-5xl transition-all duration-1000 ease-out">
            Scale Your <br />
            <span className="text-transparent bg-clip-text bg-linear-to-b from-primary via-primary to-primary/40 drop-shadow-sm">
              Sales Pipeline.
            </span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-base sm:text-xl text-muted-foreground mb-10 sm:mb-12 leading-relaxed font-medium px-2 transition-all duration-1000 delay-100 ease-out">
            Knivik is your 24/7 autonomous sales agent. We scan thousands of real-time threads to find buyers <span className="text-foreground font-bold">before your competitors even wake up.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 w-full sm:w-auto px-4 transition-all duration-1000 delay-200 ease-out">
            <Link href={user ? "/dashboard" : "/register"} className="w-full sm:w-auto">
              <Button size="lg" className="h-14 sm:h-16 px-8 sm:px-12 text-xs sm:text-sm font-black uppercase tracking-widest shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95 rounded-2xl w-full">
                {user ? "Go to Dashboard" : "Start For Free"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
              <div className="flex flex-col items-center sm:items-start gap-2">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-[0.1em] text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" /> 
                No Credit Card Required
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-[0.1em] text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" /> 
                Instant Data Export
              </div>
            </div>
          </div>

          {/* Enhanced Live Signal Feed */}
          <div className="mt-16 sm:mt-24 w-full max-w-4xl group px-2 sm:px-0 transition-all duration-1000 delay-500 ease-out">
            <div className="relative glass p-4 sm:p-6 rounded-3xl sm:rounded-4xl border border-white/10 shadow-2xl overflow-hidden bg-background/40 backdrop-blur-3xl transition-transform duration-500 hover:scale-105">
              <div className="flex items-center justify-between mb-4 sm:mb-6 border-b border-white/5 pb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-muted-foreground">Live Monitoring System</span>
                </div>
                <div className="text-xs sm:text-sm font-black text-primary px-2 sm:px-3 py-1 bg-primary/10 rounded-full">Systems Active</div>
              </div>
              
              <div className="space-y-3 sm:space-y-4 text-left">
                {[
                  { platform: "Reddit", user: "growth_hacker", msg: "Anyone know a good lead gen tool for SaaS?", time: "2m ago" },
                  { platform: "X", user: "saas_founder", msg: "Tired of manual outreach. Need something automated.", time: "4m ago" },
                ].map((sig, i) => (
                  <div key={i} className="flex items-center justify-between group/item hover:bg-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 border border-transparent hover:border-white/5">
                     <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                       <div className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black shadow-inner text-xs sm:text-sm group-hover/item:scale-110 transition-transform">
                         {sig.platform[0]}
                       </div>
                       <div className="min-w-0">
                         <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                           <span className="text-xs sm:text-sm font-black text-foreground truncate max-w-20 sm:max-w-none">@{sig.user}</span>
                           <span className="text-xs sm:text-sm font-bold text-muted-foreground uppercase shrink-0">{sig.time}</span>
                         </div>
                         <div className="text-xs sm:text-sm font-medium text-muted-foreground group-hover/item:text-foreground transition-colors truncate max-w-xs sm:max-w-md">
                           "{sig.msg}"
                         </div>
                       </div>
                     </div>
                     <div className="hidden xs:flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 bg-success/5 rounded-full border border-success/10 shrink-0">
                        <Radar className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-success" />
                        <span className="text-xs sm:text-sm font-black uppercase text-success">High Intent</span>
                     </div>
                  </div>
                ))}
              </div>
              {/* Glowing decorative element */}
              <div className="absolute -bottom-20 -right-20 h-40 w-40 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
