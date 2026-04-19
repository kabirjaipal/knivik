import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Search, BrainCircuit, MessageSquareText, Globe, Zap, Target } from "lucide-react"

const features = [
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Omni-Channel Scanning",
    description: "Our autonomous system scans the entire internet 24/7. We monitor thousands of real-time conversations across forums, social webs, and communities to find people talking about exactly what you solve."
  },
  {
    icon: <Target className="h-6 w-6" />,
    title: "High-Intent Discovery",
    description: "Every signal is passed through our intent-engine. It filters out the noise and casual chat, only delivering people who show clear buying signals and are ready to be engaged."
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Instant Growth Alerts",
    description: "Get notified the second a potential customer surfaces. We provide auto-drafted outreach messages based on your product features, so you can lock in leads before anyone else does."
  }
]

export function Features() {
  return (
    <section id="features" className="py-16 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tighter text-foreground mb-4 leading-tight">
            Stop Searching. <br /> Start Finding.
          </h2>
          <p className="max-w-xl mx-auto text-base text-muted-foreground font-medium">
            Knivik turns the entire web into your personal growth funnel. We find the buyers so you can do the building.
          </p>
        </div>

        <div className="grid gap-12 sm:grid-cols-3 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center group">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-sm bg-primary/5 text-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)] group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-black mb-4 tracking-tight">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-base text-center font-medium">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
