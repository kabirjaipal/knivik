import { Search, BrainCircuit, Globe, Zap, ShieldCheck, Sparkles, MessageSquare, BarChart3 } from "lucide-react"

export function Features() {
  return (
    <section id="features" className="py-16 lg:py-32 relative overflow-hidden bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="flex flex-col items-center text-center mb-16 sm:mb-24">
          <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-primary mb-4 sm:mb-6 transition-all duration-700 ease-out">
            <Sparkles className="h-3 w-3 mr-2" />
            Capabilities
          </div>
          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-foreground leading-[1] sm:leading-[0.9] max-w-3xl transition-all duration-700 delay-100 ease-out">
            Everything you need to <span className="text-muted-foreground/40">own the social web.</span>
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-6 md:grid-rows-2">
          {/* Main Feature - Large */}
          <div 
            className="md:col-span-3 md:row-span-2 glass p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-border/50 flex flex-col justify-between group overflow-hidden relative min-h-[400px] md:min-h-0 transition-all duration-700 hover:-translate-y-1"
          >
            <div className="absolute -right-12 -top-12 h-64 w-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
            <div className="relative z-10">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 sm:mb-8 transition-transform group-hover:scale-110">
                <Globe className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black mb-4 tracking-tight">Omni-Channel Radar</h3>
              <p className="text-base sm:text-lg text-muted-foreground font-medium max-w-sm leading-relaxed">
                Our autonomous system scans Reddit, X, and HackerNews 24/7. We find the conversations your competitors miss.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-2 relative z-10">
              {["Reddit", "X / Twitter", "HackerNews", "Dev.to"].map((t) => (
                <span key={t} className="px-3 py-1 bg-secondary/50 backdrop-blur-md text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-full border border-border/50 hover:bg-primary hover:text-primary-foreground transition-colors cursor-default">{t}</span>
              ))}
            </div>
          </div>

          {/* AI Intent - Wide */}
          <div 
            className="md:col-span-3 glass p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-border/50 flex flex-col sm:flex-row items-start gap-6 group transition-all duration-700 hover:-translate-y-1"
          >
            <div className="h-12 w-12 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary transition-transform group-hover:scale-110">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black mb-2 tracking-tight">AI Intent Engine</h3>
              <p className="text-sm sm:text-base text-muted-foreground font-medium leading-relaxed">
                LLM-powered analysis filters out the noise, delivering only leads with clear buying signals.
              </p>
            </div>
          </div>

          {/* Quick Stats - Small */}
          <div 
            className="md:col-span-1 glass p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-border/50 flex flex-col items-center justify-center text-center group min-h-[160px] md:min-h-0 transition-all duration-700 hover:-translate-y-1"
          >
            <div className="text-4xl sm:text-3xl lg:text-4xl font-black text-primary mb-1 transition-transform group-hover:scale-110">98%</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Accuracy</div>
          </div>

          {/* Instant Alerts - Medium */}
          <div 
            className="md:col-span-2 glass p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-border/50 flex flex-col justify-between group min-h-[160px] md:min-h-0 transition-all duration-700 hover:-translate-y-1"
          >
            <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center text-success mb-4 sm:mb-2 transition-transform group-hover:scale-110">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black mb-1 tracking-tight">Instant Alerts</h3>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                Slack & Email notifications the second a lead surfaces.
              </p>
            </div>
          </div>
        </div>

        {/* Small Ticker Features */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <MessageSquare className="h-4 w-4" />, text: "Auto-Drafting" },
            { icon: <ShieldCheck className="h-4 w-4" />, text: "GDPR Compliant" },
            { icon: <BarChart3 className="h-4 w-4" />, text: "Lead Analytics" },
            { icon: <Search className="h-4 w-4" />, text: "Deep Search" },
          ].map((item, i) => (
            <div 
              key={i} 
              className="glass p-4 rounded-2xl border border-border/50 flex items-center gap-3 hover:bg-white/5 transition-all duration-300 hover:-translate-y-1"
            >
               <div className="text-primary">{item.icon}</div>
               <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ArrowRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}
