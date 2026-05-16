import { Button } from "@/components/ui/button"
import { ArrowRight, Zap, ShieldCheck, MessageSquare, Timer } from "lucide-react"
import Link from "next/link"

interface CTAProps {
  user: any
}

export function FinalCTA({ user }: CTAProps) {
  return (
    <section className="py-20 bg-background relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="relative bg-card rounded-3xl p-8 lg:p-16 text-center border border-border/40 shadow-xl overflow-hidden">
          {/* Subtle background elements */}
          <div className="absolute inset-0 bg-grid opacity-5 -z-10" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10">
            <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[50%] rounded-[100%] bg-primary/5 blur-[100px]" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary mb-8 border border-primary/20">
              <Zap className="h-3.5 w-3.5 mr-2 fill-primary" />
              Start Scaling Today
            </div>
            
            <h2 className="text-4xl lg:text-6xl font-black tracking-tighter mb-6 leading-tight text-foreground">
              Ready to find qualified <br />
              <span className="text-primary italic">social leads?</span>
            </h2>
            
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto font-medium leading-relaxed">
              Automate your Reddit and X outreach. Get qualified leads delivered directly to your dashboard.
            </p>
            
            <div className="flex flex-col items-center gap-8">
              <Link href={user ? "/dashboard" : "/register"} className="w-full sm:w-auto">
                <Button size="lg" className="h-14 px-12 text-base font-black rounded-xl w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 group/btn">
                  {user ? "Enter Dashboard" : "Get My First Lead Free"}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Link>
              
              <div className="flex flex-wrap justify-center gap-8 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                <div className="flex items-center gap-2">
                  <Timer className="h-3.5 w-3.5 text-primary/50" />
                  10m Setup
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary/50" />
                  No CC Required
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5 text-primary/50" />
                  Cancel Anytime
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
