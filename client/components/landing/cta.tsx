import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Zap } from "lucide-react"

export function CTA() {
  return (
    <section className="py-24 bg-background px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl bg-muted/50 border border-border/50 px-8 py-16 sm:px-16 sm:py-20 text-center">
          {/* Subtle Decorative Background Accent */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6">
              <Zap className="h-3 w-3 fill-current" />
              Get Started Today
            </div>
            
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6">
              Ready to find your next <span className="text-primary italic">big lead</span>?
            </h2>
            
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Stop waiting for customers to find you. Join founders using Knivik to capture high-intent demand while it's still hot.
            </p>
            
            <div className="flex flex-col items-center gap-4">
              <Link href="/register">
                <Button size="lg" className="h-14 px-10 text-base font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                  Start Your Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground/60 font-medium">
                No credit card required • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
