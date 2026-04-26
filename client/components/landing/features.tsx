import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Search, BrainCircuit, MessageSquareText, Globe, Zap, Target } from "lucide-react"

const features = [
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Global Monitoring",
    description: "Our autonomous system monitors the public web 24/7. We track thousands of real-time conversations across forums and social platforms to keep you informed about what's happening in your niche."
  },
  {
    icon: <Target className="h-6 w-6" />,
    title: "Intent Intelligence",
    description: "Every signal is analyzed for intent and sentiment. We filter out the noise to surface relevant discussions, questions, and trends that matter to your business strategy."
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Real-time Insights",
    description: "Get notified the second a relevant conversation surfaces. Our AI analyzes the context so you can understand market needs and sentiment in real-time."
  }
]

export function Features() {
  return (
    <section id="features" className="py-16 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tighter text-foreground mb-4 leading-tight">
            Know your market. <br /> Master the web.
          </h2>
          <p className="max-w-xl mx-auto text-base text-muted-foreground font-medium">
            Knivik turns the vast public web into actionable market intelligence. We find the signal so you can make informed decisions.
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
