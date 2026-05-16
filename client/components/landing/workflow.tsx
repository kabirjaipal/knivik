import { Search, BrainCircuit, MessageSquareCode, ArrowRight } from "lucide-react"

const steps = [
  {
    icon: <Search className="h-6 w-6" />,
    title: "Monitor Keywords",
    description: "Tell Knivik what you do. We'll start monitoring Reddit, X, and HackerNews for relevant discussions instantly."
  },
  {
    icon: <BrainCircuit className="h-6 w-6" />,
    title: "AI Intent Filtering",
    description: "Our LLMs analyze every post to distinguish casual chatter from high-intent buyers looking for a solution."
  },
  {
    icon: <MessageSquareCode className="h-6 w-6" />,
    title: "Instant Outreach",
    description: "Get notified immediately with auto-drafted replies tailored to the user's specific problem."
  }
]

export function Workflow() {
  return (
    <section id="workflow" className="py-20 lg:py-32 relative bg-background overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-linear-to-r from-transparent via-border to-transparent opacity-50" />
      
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12 sm:gap-16">
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
              
              <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/50 border border-border/50 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-inner group-hover:shadow-2xl group-hover:shadow-primary/20">
                {step.icon}
              </div>
              <h3 className="text-2xl font-black mb-4 tracking-tight text-foreground">{step.title}</h3>
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
