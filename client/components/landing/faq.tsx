import { Plus, HelpCircle } from "lucide-react"

const faqs = [
  {
    q: "Is Knivik's social listening legal?",
    a: "Absolutely. Knivik only monitors public conversations on Reddit, X, and HackerNews. We do not access private data or violate any platform terms of service."
  },
  {
    q: "How fast will I find my first lead?",
    a: "Instantly. Once you set up your 'Radar' with your niche keywords, our system scans historical and real-time data. You'll likely see your first qualified signal in under 60 seconds."
  },
  {
    q: "What is an 'AI-Filtered Signal'?",
    a: "Unlike simple keyword alerts, our AI analyzes the 'intent' behind a post. It distinguishes between someone just talking about a topic and someone actually looking for a solution to buy."
  },
  {
    q: "Can I export lead data to my CRM?",
    a: "Yes. Pro users can export lead lists as CSV or sync directly with Slack for instant outreach notifications."
  }
]

export function FAQ() {
  return (
    <section id="faq" className="py-20 lg:py-32 relative overflow-hidden bg-background">
      {/* Background Decorative Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 blur-[120px] rounded-full pointer-events-none opacity-50" />

      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        <div className="flex flex-col items-center text-center mb-12 sm:mb-20">
          <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-primary mb-4 transition-all duration-700 ease-out">
            <HelpCircle className="h-3 w-3 mr-2" />
            Support
          </div>
          <h2 className="text-4xl sm:text-6xl font-black tracking-tighter text-foreground leading-tight max-w-2xl transition-all duration-700 delay-100 ease-out">
            Everything you need to <span className="text-muted-foreground/40">know before scaling.</span>
          </h2>
        </div>

        <div className="grid gap-4">
          {faqs.map((faq, i) => (
            <details 
              key={i}
              className="glass rounded-2xl sm:rounded-3xl border border-border/50 transition-all duration-500 overflow-hidden group"
            >
              <summary className="list-none cursor-pointer w-full p-6 sm:p-8 flex items-center justify-between text-left hover:bg-white/5 transition-colors">
                <span className="text-base sm:text-xl font-black tracking-tight text-foreground pr-4">{faq.q}</span>
                <div className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center bg-secondary text-muted-foreground transition-all duration-300 group-open:bg-primary group-open:text-primary-foreground group-open:rotate-180">
                  <Plus className="h-4 w-4" />
                </div>
              </summary>
              
              <div className="px-6 pb-6 sm:px-8 sm:pb-8 text-sm sm:text-base text-muted-foreground font-medium leading-relaxed max-w-2xl animate-in fade-in slide-in-from-top-1 duration-300">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
