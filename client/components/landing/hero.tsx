import { Button } from "@/components/ui/button"
import { ArrowRight, MessageSquare, ShieldCheck, Zap } from "lucide-react"
import Link from "next/link"

interface HeroProps {
  user: any
}

export function Hero({ user }: HeroProps) {
  return (
    <section className="relative pt-24 pb-16 lg:pt-36 lg:pb-28 overflow-hidden min-h-screen flex items-center">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-grid opacity-10 -z-10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[10%] w-[80%] h-[40%] rounded-[100%] bg-primary/10 blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-primary mb-8 border border-primary/20 backdrop-blur-md">
            <Zap className="h-3.5 w-3.5 mr-2 fill-primary" />
            Real-time Social Lead Generation
          </div>
          
          <h1 className="text-5xl lg:text-8xl font-black tracking-tighter text-foreground mb-6 leading-[1.1]">
            Find your next customer <br />
            <span className="text-primary italic">before</span> they find you.
          </h1>
          
          <p className="text-lg lg:text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl font-medium">
            Knivik monitors Reddit, X, and Hacker News 24/7. Our AI filters the noise and sends qualified leads directly to your dashboard and Slack.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full sm:w-auto mb-12">
            <Link href={user ? "/dashboard" : "/register"} className="w-full sm:w-auto">
              <Button size="lg" className="h-14 px-10 text-base font-black rounded-xl w-full bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                {user ? "Enter Dashboard" : "Get First Leads Free"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#sample-leads" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="h-14 px-8 text-base font-black rounded-xl border-2 hover:bg-secondary/50 transition-all w-full">
                See sample leads
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-[10px] sm:text-xs text-muted-foreground font-black uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-success" />
              No CC required
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Alerts in Slack/Email
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Monitoring Live
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Ambient Lighting for Centered Layout */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[50rem] h-[30rem] bg-primary/15 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/3 w-[30rem] h-[30rem] bg-accent/10 rounded-full blur-[120px]" />
      </div>
    </section>
  )
}
