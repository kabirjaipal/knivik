import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    question: "Is it legal to monitor public data from Reddit and X?",
    answer: "Yes, Knivik only monitors publicly available data. We do not access private profiles, messages, or restricted content. Our platform complies with the Terms of Service of each social network we monitor."
  },
  {
    question: "How quickly do new leads appear in my dashboard?",
    answer: "Knivik scans for new posts in real-time. Depending on the platform and your plan, leads typically appear within 60 seconds to 5 minutes of being posted."
  },
  {
    question: "What counts as a 'high-intent' lead?",
    answer: "Our AI analysis looks for specific linguistic markers: questions about recommendations, comparisons with competitors, expressions of frustration with current tools, and clear buying signals (e.g., 'What is the best alternative to...')."
  },
  {
    question: "Can I export my leads to my existing CRM?",
    answer: "Yes, Pro and Growth users can export leads via CSV or JSON. We also offer Webhook support and a direct API for seamless integration with tools like HubSpot, Salesforce, or Pipedrive."
  },
  {
    question: "Who is Knivik best for?",
    answer: "Knivik is built for B2B SaaS founders, sales teams, and marketing agencies who want to scale their pipeline by engaging with potential customers at the exact moment they show intent."
  }
]

export function FAQ() {
  return (
    <section id="faq" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 lg:mb-24">
            <h2 className="text-4xl lg:text-6xl font-black tracking-tighter text-foreground mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about Knivik and how it works.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, i) => (
              <AccordionItem 
                key={i} 
                value={`item-${i}`}
                className="bg-background px-8 py-2 rounded-3xl border border-border/50 shadow-sm"
              >
                <AccordionTrigger className="text-xl font-black text-left hover:no-underline hover:text-primary transition-colors">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-lg text-muted-foreground leading-relaxed font-medium pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
