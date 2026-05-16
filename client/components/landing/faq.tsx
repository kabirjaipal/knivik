import { ChevronDown, HelpCircle } from "lucide-react"

const faqs = [
  {
    q: "Is Knivik's social listening legal?",
    a: "Absolutely. Knivik only monitors public conversations on platforms like Reddit and X. We strictly adhere to platform terms of service and never access private data."
  },
  {
    q: "How fast will I find my first lead?",
    a: "Instantly. Once your Neural Radar is deployed, our system scans historical and real-time data blocks. You'll typically see your first high-intent signal in under 60 seconds."
  },
  {
    q: "What is an 'AI-Filtered Signal'?",
    a: "Unlike simple keyword alerts, our neural engine analyzes the deep intent behind a post. It distinguishes between passive discussion and active buying intent."
  },
  {
    q: "Can I export lead data to my CRM?",
    a: "Yes. Our enterprise integration layer allows for one-click CSV exports or direct syncing with platforms like Slack and various CRMs via our API."
  }
]

export function FAQ() {
  return (
    <section id="faq" className="relative">
      <div className="w-full">
        {/* Header - Compact */}
        <div className="flex flex-col mb-10 sm:mb-16">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-primary mb-4">
            <HelpCircle className="h-2.5 w-2.5" />
            Intelligence FAQ
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-foreground leading-tight">
            Common <span className="text-muted-foreground/30">Inquiries.</span>
          </h2>
        </div>

        {/* Minimalist Accordion - Tighter */}
        <div className="flex flex-col">
          {faqs.map((faq, i) => (
            <details 
              key={i}
              className="group border-b border-white/5 py-5 first:border-t"
            >
              <summary className="list-none cursor-pointer flex items-center justify-between group-hover:text-primary transition-all duration-300">
                <span className="text-base sm:text-lg font-black tracking-tight text-foreground group-hover:text-inherit pr-8 transition-colors">
                  {faq.q}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground/40 group-open:rotate-180 group-open:text-primary transition-all duration-500" />
              </summary>
              
              <div className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-2xl animate-in fade-in slide-in-from-top-1 duration-500">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
        
        {/* Simple Footer Link - Tighter */}
        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
            Still unsure? Access neural docs.
          </p>
          <button className="text-[9px] font-black uppercase tracking-widest text-primary hover:text-accent transition-colors">
            Engineering Support &rarr;
          </button>
        </div>
      </div>
    </section>
  )
}
