import { XCircle, Clock, TrendingDown } from "lucide-react"

export function Problem() {
  return (
    <section className="py-16 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl text-center relative z-10">
        <h2 className="text-3xl sm:text-5xl font-black tracking-tighter text-foreground mb-4 leading-tight">
          The web is too loud <br className="hidden sm:block" /> for manual monitoring.
        </h2>
        <p className="max-w-3xl mx-auto text-base sm:text-lg text-muted-foreground mb-12 leading-relaxed font-medium">
          Every day, millions of conversations happen across the internet. For a business, finding relevant market insights, sentiment, and intent in this noise is impossible without autonomous intelligence.
        </p>

        <div className="grid sm:grid-cols-3 gap-12 max-w-5xl mx-auto">
          <div className="flex flex-col items-center group">
            <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-destructive/5 text-destructive mb-4 shadow-[0_0_20px_rgba(var(--destructive-rgb),0.1)] group-hover:scale-110 transition-transform duration-300">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-black tracking-tight mb-4">Information Overload</h3>
            <p className="text-muted-foreground text-sm leading-relaxed font-medium">
              Scrolling through thousands of posts is exhausting and unscalable. You end up missing the most important signals buried in the noise.
            </p>
          </div>
          <div className="flex flex-col items-center group">
            <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-destructive/5 text-destructive mb-4 shadow-[0_0_20px_rgba(var(--destructive-rgb),0.1)] group-hover:scale-110 transition-transform duration-300">
              <TrendingDown className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-black tracking-tight mb-4">Market Blindness</h3>
            <p className="text-muted-foreground text-sm leading-relaxed font-medium">
              Without real-time monitoring, you are blind to emerging trends, customer frustrations, and market shifts happening in public forums.
            </p>
          </div>
          <div className="flex flex-col items-center group">
            <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-destructive/5 text-destructive mb-6 shadow-[0_0_20px_rgba(var(--destructive-rgb),0.1)] group-hover:scale-110 transition-transform duration-300">
              <XCircle className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-black tracking-tight mb-4">Delayed Awareness</h3>
            <p className="text-muted-foreground text-sm leading-relaxed font-medium">
              By the time you see a relevant discussion manually, the moment has passed and the conversation has moved on.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
