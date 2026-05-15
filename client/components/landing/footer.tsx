import Link from 'next/link'
import { Radar, ShieldCheck } from 'lucide-react'
import { PROJECT_NAME } from "@/lib/constants"

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-32 bg-primary/5 blur-[80px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-7xl relative z-10 py-12">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12">
          {/* Logo & Vision */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-lg">
                <Radar className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-black tracking-tighter text-xl text-foreground">{PROJECT_NAME}</span>
            </div>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              Autonomous social listening for high-growth teams. Find your next 100 customers on autopilot.
            </p>
          </div>
          
          {/* Nav Links */}
          <nav className="flex flex-wrap gap-x-10 gap-y-4">
            {[
              { label: "Pricing", href: "/pricing" },
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
              { label: "Refunds", href: "/refund-policy" },
              { label: "Contact", href: "/contact" },
            ].map((link) => (
              <Link 
                key={link.label} 
                href={link.href} 
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Security Badge */}
          <div className="flex items-center gap-3 px-4 py-2 bg-secondary/50 border border-border/50 rounded-2xl">
            <ShieldCheck className="h-4 w-4 text-success" />
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Secure & GDPR Ready</span>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground/60 text-[10px] font-black uppercase tracking-widest">
            © {new Date().getFullYear()} {PROJECT_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
             <div className="h-1 w-1 rounded-full bg-success animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
