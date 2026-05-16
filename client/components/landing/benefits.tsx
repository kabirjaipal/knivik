import { Target, Zap, Clock, Users, Search, BarChart3 } from "lucide-react"

const benefits = [
  {
    icon: <Target className="h-6 w-6" />,
    title: "Find active buyers",
    description: "Catch people exactly when they ask for recommendations or complain about your competitors."
  },
  {
    icon: <Clock className="h-6 w-6" />,
    title: "Be first to every deal",
    description: "Don't wait for leads to find you. Knivik alerts you the second a high-intent conversation starts."
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Stop manual searching",
    description: "Save hours every day. Let our AI do the scrolling across Reddit, X, HN, and Dev.to 24/7."
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Route leads instantly",
    description: "Send qualified leads to your sales team via Slack or Email the moment they surface."
  },
  {
    icon: <Search className="h-6 w-6" />,
    title: "Deep context analysis",
    description: "Our AI understands the difference between a casual mention and a genuine business need."
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "Scale your pipeline",
    description: "Consistently fill your CRM with qualified social leads without increasing your headcount."
  }
]

export function Benefits() {
  return (
    <section id="benefits" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-16 lg:mb-24">
          <h2 className="text-4xl lg:text-6xl font-black tracking-tighter text-foreground mb-6">
            Built for growth teams <br />
            <span className="text-muted-foreground/40">who move fast.</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Practical lead generation that saves you time and increases your revenue without the marketing fluff.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, i) => (
            <div 
              key={i}
              className="p-8 rounded-4xl border border-border/50 hover:border-primary/30 hover:bg-secondary/20 transition-all group"
            >
              <div className="mb-6 h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary flex group-hover:scale-110 transition-transform">
                {benefit.icon}
              </div>
              <h3 className="text-2xl font-black mb-3 tracking-tight">{benefit.title}</h3>
              <p className="text-muted-foreground font-medium leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
