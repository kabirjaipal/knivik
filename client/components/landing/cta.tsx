import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Check, ArrowRight } from "lucide-react"

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden">
      <div className="container mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-24">
          {/* Left: Text Content */}
          <div className="max-w-2xl text-center lg:text-left transition-all duration-700 ease-out">
            <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs sm:text-sm font-black uppercase tracking-widest text-primary mb-6">
              Immediate Results
            </div>
            <h2 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter mb-8 leading-none sm:leading-none text-foreground">
              Stop Hunting. <br />
              <span className="text-primary">Start Scaling.</span>
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground font-medium mb-10 sm:mb-12 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Knivik is currently scanning thousands of threads. Your next 10 customers are already talking. <span className="text-foreground font-bold">Are you listening?</span>
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 sm:gap-8">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="h-14 sm:h-16 px-10 sm:px-12 text-xs sm:text-sm font-black uppercase tracking-widest shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95 rounded-2xl w-full">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-widest text-muted-foreground">
                <Check className="h-4 w-4 text-success" />
                No credit card required
              </div>
            </div>
          </div>

          {/* Right: Lead Success Feed (Visible on large screens) */}
          <div className="relative w-full max-w-md hidden lg:block transition-all duration-1000 delay-300 ease-out">
            <div className="space-y-4">
              {[
                { platform: "Reddit", user: "growth_hacker", msg: "Need a lead gen tool...", status: "QUALIFIED" },
                { platform: "X", user: "founder_xyz", msg: "Best way to find customers?", status: "HIGH INTENT" },
              ].map((lead, i) => (
                <div 
                  key={i}
                  className="flex items-center justify-between p-5 border-l-2 border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all duration-300 rounded-r-xl hover:translate-x-1"
                >
                  <div>
                    <div className="text-sm font-black text-muted-foreground mb-1">@{lead.user}</div>
                    <div className="text-sm font-bold text-foreground italic">"{lead.msg}"</div>
                  </div>
                  <div className="text-xs font-black bg-primary/10 text-primary px-2 py-1 uppercase tracking-widest rounded-md">
                    {lead.status}
                  </div>
                </div>
              ))}
            </div>
            {/* Decorative Blur */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 blur-3xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  )
}
