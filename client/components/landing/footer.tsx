import Link from 'next/link'
import { Radar, ShieldCheck } from 'lucide-react'
import { PROJECT_NAME } from "@/lib/constants"

export function Footer() {
  return (
    <footer className="border-t border-border/40 py-8 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Radar className="h-4 w-4 text-primary" />
            <span className="font-black tracking-tighter text-lg text-foreground">{PROJECT_NAME}</span>
            <span className="text-muted-foreground/40 text-xs font-black uppercase tracking-widest ml-2">
              © {new Date().getFullYear()}
            </span>
          </div>
          
          <nav className="flex items-center gap-6">
            {[
              { label: "Pricing", href: "/pricing" },
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
              { label: "Contact", href: "/contact" },
            ].map((link) => (
              <Link 
                key={link.label} 
                href={link.href} 
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 opacity-60">
             <div className="h-1 w-1 rounded-full bg-success animate-pulse shadow-sm shadow-success/60" />
             <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Systems Active</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
