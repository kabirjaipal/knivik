import { Search, BrainCircuit, Bell, ArrowRight } from "lucide-react"

const steps = [
  {
    icon: <Search className="h-6 w-6" />,
    title: "1. Monitor Conversations",
    description: "Knivik scans Reddit, X, Hacker News, and Dev.to for keywords and pain points relevant to your business."
  },
  {
    icon: <BrainCircuit className="h-6 w-6" />,
    title: "2. Filter with AI",
    description: "Our AI scores every post to separate casual mentions from real buying intent, so you only see the best leads."
  },
  {
    icon: <Bell className="h-6 w-6" />,
    title: "3. Get Instant Alerts",
    description: "Qualified leads are pushed instantly to your dashboard, Slack, or email for immediate engagement."
  }
]

export function Workflow() {
  return (
    <section id="how-it-works" className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-16 lg:mb-24">
          <h2 className="text-4xl lg:text-6xl font-black tracking-tighter text-foreground mb-6">
            How it works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Stop manually searching for customers. Automate your social lead generation in three simple steps.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 relative">
          {/* Connector line for desktop */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 -z-10" />
          
          {steps.map((step, i) => (
            <div 
              key={i}
              className="bg-background flex flex-col items-center text-center p-8 rounded-3xl border border-border/50 shadow-sm relative z-10 hover:border-primary/30 transition-all group"
            >
              <div className="mb-6 h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 text-primary flex group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                {step.icon}
              </div>
              <h3 className="text-2xl font-black mb-4 tracking-tight">{step.title}</h3>
              <p className="text-muted-foreground font-medium leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
