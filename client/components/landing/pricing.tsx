import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Check } from "lucide-react"

const tiers = [
  {
    name: "Developer",
    price: "$0",
    desc: "Perfect for testing the waters.",
    features: ["1 Product tracked", "Up to 3 Keywords", "50 Leads/month", "Standard AI scoring"],
    buttonLabel: "Get Started Free",
    action: "/register"
  },
  {
    name: "Startup",
    price: "$29",
    desc: "For serious founders generating leads.",
    features: ["3 Products tracked", "Up to 15 Keywords", "500 Leads/month", "Advanced Intent AI", "Slack Alerts"],
    buttonLabel: "Start Free Trial",
    action: "/register",
    popular: true
  },
  {
    name: "Growth",
    price: "$79",
    desc: "For agencies and large scale teams.",
    features: ["Unlimited Products", "Unlimited Keywords", "5000 Leads/month", "Custom AI Personas", "API Access"],
    buttonLabel: "Contact Sales",
    action: "/contact"
  }
]

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            No contracts. No surprise fees. Upgrade or cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {tiers.map((tier, idx) => (
            <Card key={idx} className={`relative flex flex-col ${tier.popular ? 'border-primary shadow-lg scale-105 z-10' : 'border-border/50'}`}>
              {tier.popular && (
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-0 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full shadow-sm">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <div className="flex items-baseline text-4xl font-extrabold pb-2">
                  {tier.price} <span className="text-lg text-muted-foreground font-medium ml-1">/mo</span>
                </div>
                <CardDescription className="text-sm">{tier.desc}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {tier.features.map((feat, i) => (
                    <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                      <Check className="h-5 w-5 text-success shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant={tier.popular ? "default" : "outline"} size="lg">
                  {tier.buttonLabel}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
