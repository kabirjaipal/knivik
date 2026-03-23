import Link from 'next/link'
import { Radar } from 'lucide-react'
import { PROJECT_NAME } from "@/lib/constants"

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background py-10">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Radar className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold tracking-tight text-foreground">{PROJECT_NAME}</span>
          </div>
          
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground font-medium">
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
            <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="/refund-policy" className="hover:text-primary transition-colors">Refunds</Link>
          </nav>

          <p className="text-muted-foreground/60 text-xs">
            © {new Date().getFullYear()} {PROJECT_NAME}. Built for Founders.
          </p>
        </div>
      </div>
    </footer>
  )
}
