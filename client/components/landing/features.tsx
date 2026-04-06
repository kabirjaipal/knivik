import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Search, BrainCircuit, MessageSquareText, BellRing } from "lucide-react"

const features = [
  {
    icon: <Search className="h-5 w-5 text-primary" />,
    title: "Real-Time Listening",
    description: "Monitor Reddit and HackerNews 24/7 for tailored keywords."
  },
  {
    icon: <BrainCircuit className="h-5 w-5 text-primary" />,
    title: "Intent Scoring",
    description: "AI filters out the noise to find people ready to buy."
  },
  {
    icon: <MessageSquareText className="h-5 w-5 text-primary" />,
    title: "Auto-Drafted Replies",
    description: "Personalized Outreach generated based on your product features."
  }
]

export function Features() {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything You Need to Capture Demand
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            A full end-to-end CRM specifically built around Social Listening.
          </p>
        </div>

        <div className="grid gap-12 sm:grid-cols-3 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 text-primary">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm text-center">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
