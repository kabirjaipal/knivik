import { Button } from "@/components/ui/button"
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react"
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
    <section className="relative overflow-hidden min-h-screen flex items-center justify-center pt-20 bg-grid">
      {/* Premium Atmospheric Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[10%] w-[80%] h-[40%] rounded-[100%] bg-primary/15 blur-[120px] opacity-70 animate-pulse" />
        <div className="absolute top-[20%] right-[5%] w-[40%] h-[30%] rounded-[100%] bg-accent/10 blur-[100px] opacity-50" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center text-center">
          <div className="group cursor-default">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-8 shadow-2xl shadow-primary/10 backdrop-blur-md transition-all hover:border-primary/40 hover:bg-primary/10">
              <Sparkles className="h-3 w-3 mr-2 text-accent" />
              The Unfair Growth Advantage
            </div>
          </div>
          
          <h1 className="text-6xl sm:text-8xl lg:text-9xl font-black tracking-tighter text-foreground mb-8 leading-[0.9] lg:max-w-6xl transition-all duration-1000 ease-out">
            Your Next Sale <br />
            <span className="text-transparent bg-clip-text bg-linear-to-b from-primary via-primary to-primary/20 text-glow">
              Is Happening Now.
            </span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg sm:text-2xl text-muted-foreground mb-12 leading-relaxed font-medium px-4 transition-all duration-1000 delay-100 ease-out">
            While you scroll, your competitors are closing the leads you missed. Knivik monitors Reddit, X, and HackerNews 24/7 to find the 1% of conversations that <span className="text-foreground font-bold underline decoration-primary/30 decoration-4 underline-offset-4">actually mean revenue</span>. 
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 w-full sm:w-auto px-4 transition-all duration-1000 delay-200 ease-out">
            <Link href={user ? "/dashboard" : "/register"} className="w-full sm:w-auto">
              <Button size="lg" className="h-16 px-12 text-sm font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(var(--primary-rgb),0.3)] transition-all hover:scale-105 active:scale-95 rounded-2xl w-full bg-primary hover:bg-primary/90 border-t border-white/20">
                {user ? "Enter Dashboard" : "Get My First Lead Free"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <div className="flex flex-col items-start gap-2 text-left">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80">
                <CheckCircle2 className="h-3.5 w-3.5 text-accent" /> 
                Be First to Every Deal
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80">
                <CheckCircle2 className="h-3.5 w-3.5 text-accent" /> 
                Zero Effort Setup
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

  )
}
