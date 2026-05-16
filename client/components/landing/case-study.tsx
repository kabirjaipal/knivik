import { TrendingUp, Users, Clock, CheckCircle2, Quote, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function CaseStudy() {
  const stats = [
    { label: "Leads Detected", value: "40+", icon: <Users className="h-4 w-4" /> },
    { label: "Scan Frequency", value: "Hourly", icon: <Clock className="h-4 w-4" /> },
    { label: "Intent Accuracy", value: "95%", icon: <TrendingUp className="h-4 w-4" /> },
    { label: "Setup Time", value: "10m", icon: <CheckCircle2 className="h-4 w-4" /> }
  ]

  return (
    <section className="py-20 bg-background relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="relative bg-card rounded-3xl p-8 lg:p-12 border border-border/40 shadow-xl overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32" />
          
          <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-center">
            <div className="flex-[1.2]">
              <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary mb-6 border border-primary/20">
                Product Proof
              </div>
              
              <h2 className="text-3xl lg:text-5xl font-black tracking-tighter text-foreground mb-6 leading-tight">
                How one user found <span className="text-primary italic">42 qualified leads</span> in their first week.
              </h2>
              
              <div className="relative mb-8">
                <Quote className="absolute -left-3 -top-3 h-10 w-10 text-primary/5 -z-10" />
                <p className="text-lg lg:text-xl text-muted-foreground font-medium italic leading-relaxed pl-6 border-l-2 border-primary/20">
                  "Knivik replaced my manual Reddit searching and doubled my sales pipeline. I was first to every conversation that mattered."
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-black text-foreground text-xs border border-border">VC</div>
                <div>
                  <div className="text-sm font-black text-foreground">Verified Customer</div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Founder @ Early-stage SaaS</div>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, i) => (
                  <div key={i} className="bg-background/50 backdrop-blur-md p-6 rounded-2xl border border-border/40 hover:border-primary/20 transition-all group/stat">
                    <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary mb-3 border border-primary/10 transition-all">
                      {stat.icon}
                    </div>
                    <div className="text-3xl font-black text-foreground mb-1 tracking-tighter tabular-nums">{stat.value}</div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
              
              <Link href="/register" className="w-full">
                <Button className="w-full h-14 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-black transition-all group/btn">
                  Start finding leads
                  <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
