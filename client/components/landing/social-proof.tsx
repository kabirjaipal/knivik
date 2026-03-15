import { ShieldCheck, Zap, Globe, Cpu } from "lucide-react"

export function SocialProof() {
  return (
    <section className="py-12 border-y border-border/40 bg-muted/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-8">
          Trusted by forward-thinking founders and growth teams
        </p>
        <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20 grayscale opacity-70">
          <div className="flex items-center gap-2 font-bold text-xl text-foreground">
            <Globe className="h-6 w-6" /> Globex
          </div>
          <div className="flex items-center gap-2 font-bold text-xl text-foreground">
            <Zap className="h-6 w-6" /> Acme Corp
          </div>
          <div className="flex items-center gap-2 font-bold text-xl text-foreground">
            <ShieldCheck className="h-6 w-6" /> TrustFlow
          </div>
          <div className="flex items-center gap-2 font-bold text-xl text-foreground">
            <Cpu className="h-6 w-6" /> NeuroSys
          </div>
        </div>
      </div>
    </section>
  )
}
