import Link from 'next/link'
import { Logo } from "@/components/logo"
import { ShieldCheck, Heart } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-background py-10 border-t border-border/40">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 group">
              <Logo size={24} />
              <span className="font-black tracking-tighter text-xl text-foreground">
                Knivik
              </span>
            </Link>
            <p className="text-muted-foreground text-[13px] font-medium leading-relaxed max-w-xs">
              AI-powered social lead generation. Catch high-intent conversations on Reddit and X in real-time.
            </p>
          </div>

          <div>
            <h4 className="font-black text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-6">Platform</h4>
            <ul className="space-y-3">
              <li><Link href="/#how-it-works" className="text-xs font-bold text-foreground/70 hover:text-primary transition-colors">How it works</Link></li>
              <li><Link href="/pricing" className="text-xs font-bold text-foreground/70 hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link href="/#faq" className="text-xs font-bold text-foreground/70 hover:text-primary transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-6">Legal</h4>
            <ul className="space-y-3">
              <li><Link href="/privacy" className="text-xs font-bold text-foreground/70 hover:text-primary transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="text-xs font-bold text-foreground/70 hover:text-primary transition-colors">Terms</Link></li>
              <li><Link href="/contact" className="text-xs font-bold text-foreground/70 hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-6 border-t border-border/40">
          <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
            © {new Date().getFullYear()} Knivik. Built for the community.
          </div>
          
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-secondary/30 border border-border/50">
            <ShieldCheck className="h-3 w-3 text-primary/60" />
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Secure & Private</span>
          </div>
        </div>
      </div>
    </footer>
  )
}



