import { XCircle, Clock, TrendingDown } from "lucide-react"

export function Problem() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-6">
          You are losing customers to competitors right now.
        </h2>
        <p className="max-w-3xl mx-auto text-lg text-muted-foreground mb-16 leading-relaxed">
          Every day, thousands of people on Reddit and HackerNews ask for recommendations, complain about their current tools, or look for exact solutions you provide. If you aren't the first to reply, someone else will be.
        </p>

        <div className="grid sm:grid-cols-3 gap-8">
          <div className="flex flex-col items-center p-6 space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <Clock className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold">Wasting Time</h3>
            <p className="text-muted-foreground text-sm">
              Manually searching through subreddits and scrolling feeds is exhausting and unscalable.
            </p>
          </div>
          <div className="flex flex-col items-center p-6 space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <TrendingDown className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold">Missed Opportunities</h3>
            <p className="text-muted-foreground text-sm">
              By the time you see a post organically, a competitor has already replied and won the deal.
            </p>
          </div>
          <div className="flex flex-col items-center p-6 space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold">Spammy Outreach</h3>
            <p className="text-muted-foreground text-sm">
              Cold emailing is dying. Warm, contextual replies to active problems convert 10x higher.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
