import { Radar, BrainCircuit, Zap, ArrowRight } from "lucide-react"

const steps = [
  {
    icon: <Radar className="h-6 w-6" />,
    title: "Neural Scan",
    description: "Knivik generates high-intent search queries and deploys them 24/7 across Reddit, X, and HackerNews to find hidden conversations."
  },
  {
    icon: <BrainCircuit className="h-6 w-6" />,
    title: "AI Intent Engine",
    description: "Our batch processing engine uses LLMs to score every post from 0-100, isolating the 1% of users who are ready to buy right now."
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Smart Alerts",
    description: "Once qualified, leads are enriched with author data and pushed instantly to your dashboard and Slack for immediate engagement."
  }
]

export function Workflow() {
  return (
    <section id="workflow" className="relative bg-background overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-linear-to-r from-transparent via-border to-transparent opacity-50" />
      
      <div className="w-full relative z-10">
        <div className="flex flex-col items-center text-center mb-16 sm:mb-24">
          <div className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs sm:text-sm font-black uppercase tracking-widest text-accent mb-4 sm:mb-6">
            <BrainCircuit className="h-3 w-3 mr-2" />
            The System
          </div>
          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-foreground leading-none sm:leading-none max-w-3xl">
            How Knivik <span className="text-muted-foreground/40">finds your customers.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12 sm:gap-16 pt-5">
          {steps.map((step, i) => (
            <div 
              key={i}
              className="relative group flex flex-col items-center text-center lg:items-start lg:text-left transition-all duration-700 ease-out"
            >
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 -right-8 text-border/30 group-hover:text-primary/30 transition-colors duration-500">
                  <ArrowRight className="h-8 w-8" />
                </div>
              )}
              
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/50 border border-border/50 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-inner group-hover:shadow-2xl group-hover:shadow-primary/20">
                {step.icon}
              </div>
              <h3 className="text-2xl font-black mb-2 tracking-tight text-foreground">{step.title}</h3>
              <p className="text-muted-foreground font-medium leading-relaxed max-w-xs sm:max-w-none">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
