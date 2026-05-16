import { XCircle, Clock, TrendingDown, AlertTriangle } from "lucide-react"

export function Problem() {
  return (
    <section className="relative overflow-hidden bg-secondary/20 rounded-[2.5rem] border border-white/5 py-16 sm:py-24">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '40px 40px' }} />

      <div className="w-full relative z-10">
        <div className="text-center mb-16 sm:mb-24">
          <div className="inline-flex items-center rounded-full bg-destructive/10 px-3 py-1 text-xs sm:text-sm font-black uppercase tracking-widest text-destructive mb-6">
            <AlertTriangle className="h-3 w-3 mr-2" />
            The Growth Gap
          </div>
          <h2 className="text-4xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-foreground mb-6 leading-none sm:leading-none">
            You are losing customers <br className="hidden lg:block" /> 
            <span className="text-destructive">to competitors right now.</span>
          </h2>
          <p className="max-w-3xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed font-medium px-2">
            Every day, thousands of high-intent buyers ask for recommendations or express pain points on social media. If you aren't the first to respond, you've already lost the deal.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 px-3">
          {[
            {
              icon: <Clock className="h-6 w-6" />,
              title: "The Speed Trap",
              description: "By the time you see a high-intent post organically, a competitor has already replied, solved the problem, and won the deal. In the social web, speed is the only currency."
            },
            {
              icon: <TrendingDown className="h-6 w-6" />,
              title: "Manual Burnout",
              description: "Scrolling through endless feeds and searching through subreddits is a recipe for burnout. It's unscalable, exhausting, and leads to missing 95% of opportunities."
            },
            {
              icon: <XCircle className="h-6 w-6" />,
              title: "Cold Response",
              description: "Generic cold outreach is dead. Without the context of a real-time problem, your messages are just noise. You need intent to break through the static."
            }
          ].map((item, index) => (
            <div
              key={index}
              className="glass p-5 sm:p-7 rounded-3xl border border-destructive/10 hover:border-destructive/30 transition-all duration-500 group hover:-translate-y-2"
            >
              <div className="mb-4 sm:mb-5 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-destructive/5 text-destructive shadow-xl shadow-destructive/5 group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-destructive/15 transition-all">
                {item.icon}
              </div>
              <h3 className="text-xl sm:text-2xl font-black mb-2 tracking-tight">{item.title}</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-medium">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Closing Statement */}
        <div className="mt-16 sm:mt-24 flex flex-col items-center px-4">
          <div className="h-px w-24 bg-destructive/20 mb-8" />
          <p className="text-lg sm:text-xl font-bold italic text-foreground tracking-tight text-center">
            "The first response gets 70% of the conversions. Knivik makes you first, every time."
          </p>
        </div>
      </div>
    </section>
  )
}
