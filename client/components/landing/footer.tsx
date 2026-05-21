import Link from 'next/link'
import { Logo } from "@/components/logo"
import { ShieldCheck } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-background py-6 border-t border-border/40">
      <div className="container mx-auto px-6">
        
        {/* Compact Upper Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-6">
          <div className="flex flex-col gap-2">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <Logo size={20} />
              <span className="font-black tracking-tighter text-lg text-foreground">
                Knivik
              </span>
            </Link>
            <p className="text-muted-foreground text-xs font-medium leading-relaxed max-w-xs">
              AI-powered social lead generation. Catch high-intent conversations in real-time.
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2.5">
            <h4 className="font-black text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Legal</h4>
            <ul className="flex flex-wrap items-center gap-4 text-xs font-bold text-foreground/70">
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms</Link></li>
              <li><Link href="/refund-policy" className="hover:text-primary transition-colors">Refunds</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        {/* Compact Lower Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-border/40">
          <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
            © {new Date().getFullYear()} Knivik. Built for the community.
          </div>
          
          <div className="flex items-center gap-2 px-2 py-0.5 rounded-full bg-secondary/30 border border-border/50">
            <ShieldCheck className="h-2.5 w-2.5 text-primary/60" />
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Secure & Private</span>
          </div>
        </div>

      </div>
    </footer>
  )
}
