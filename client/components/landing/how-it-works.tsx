import { Badge } from "@/components/ui/badge"

const steps = [
  {
    num: "01",
    title: "Define Target Keywords",
    desc: "Tell the AI what problem your startup solves and what competitors you want to track."
  },
  {
    num: "02",
    title: "AI Detects Buying Intent",
    desc: "We analyze millions of posts daily to find people asking for exactly what you build."
  },
  {
    num: "03",
    title: "Close the Deal",
    desc: "You get an alert with an AI-generated draft response. Jump in, provide value, and win a customer."
  }
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          
          <div className="flex-1 space-y-6">
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 px-3 py-1">Workflow</Badge>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Turn social chatter into actual revenue.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Don't wait for inbound marketing to eventually work. IntentRadar actively finds people who are actively looking to spend money but haven't found you yet.
            </p>
          </div>

          <div className="flex-1 w-full max-w-md">
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-border before:to-transparent">
              {steps.map((step, idx) => (
                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 text-primary font-bold">
                    {step.num}
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] ml-4 md:ml-0 p-4 rounded-xl border border-border/50 bg-card shadow-sm group-hover:border-primary/40 transition-colors">
                    <h3 className="font-semibold text-lg text-foreground mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
