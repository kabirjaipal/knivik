import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Search, BrainCircuit, MessageSquareText, BellRing } from "lucide-react"

const features = [
  {
    icon: <Search className="h-6 w-6 text-primary" />,
    title: "Real-Time Keyword Scraping",
    description: "Monitors Reddit, HackerNews, and Discord servers 24/7 for anyone mentioning a problem your product solves."
  },
  {
    icon: <BrainCircuit className="h-6 w-6 text-primary" />,
    title: "AI Intent Scoring",
    description: "Proprietary AI filters out noise and scores every post from 0-100 indicating exact buying intent."
  },
  {
    icon: <MessageSquareText className="h-6 w-6 text-primary" />,
    title: "Auto-Drafted Replies",
    description: "We use your product's USPs to craft the perfect, non-spammy reply so you just have to click 'Send'."
  },
  {
    icon: <BellRing className="h-6 w-6 text-primary" />,
    title: "Instant Live Alerts",
    description: "Get pinged via Slack or Email the millisecond a highly-qualified score match is detected."
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

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card key={index} className="border-border/50 bg-background/50 hover:bg-background/80 transition-colors shadow-sm">
              <CardHeader className="pb-4">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
