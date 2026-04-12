import { XCircle, Clock, TrendingDown } from "lucide-react"

export function Problem() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(var(--primary-rgb),0.02),transparent_70%)] blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl text-center relative z-10">
        <h2 className="text-4xl sm:text-6xl font-black tracking-tighter text-foreground mb-8 leading-tight">
          You are losing customers <br className="hidden sm:block" /> to competitors right now.
        </h2>
        <p className="max-w-3xl mx-auto text-lg sm:text-xl text-muted-foreground mb-20 leading-relaxed font-medium">
          Every day, thousands of people across the internet ask for recommendations, complain about their current tools, or look for exact solutions you provide. If you aren't the first to respond, someone else will be.
        </p>

        <div className="grid sm:grid-cols-3 gap-12 max-w-5xl mx-auto">
          <div className="flex flex-col items-center group">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/5 text-destructive mb-6 shadow-[0_0_20px_rgba(var(--destructive-rgb),0.1)] group-hover:scale-110 transition-transform duration-300">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-black tracking-tight mb-4">Wasting Time</h3>
            <p className="text-muted-foreground text-sm leading-relaxed font-medium">
              Manually searching through online forums and scrolling feeds is exhausting, unscalable, and ultimately futile in the race for attention.
            </p>
          </div>
          <div className="flex flex-col items-center group">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/5 text-destructive mb-6 shadow-[0_0_20px_rgba(var(--destructive-rgb),0.1)] group-hover:scale-110 transition-transform duration-300">
              <TrendingDown className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-black tracking-tight mb-4">Missed Revenue</h3>
            <p className="text-muted-foreground text-sm leading-relaxed font-medium">
              By the time you see a high-intent post organically, a competitor has already replied, solved their problem, and won the deal.
            </p>
          </div>
          <div className="flex flex-col items-center group">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/5 text-destructive mb-6 shadow-[0_0_20px_rgba(var(--destructive-rgb),0.1)] group-hover:scale-110 transition-transform duration-300">
              <XCircle className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-black tracking-tight mb-4">Cold Outreach</h3>
            <p className="text-muted-foreground text-sm leading-relaxed font-medium">
              Traditional cold emails are ignored. Contextual, human-first replies to active problems convert 10x higher than any automated blast.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
