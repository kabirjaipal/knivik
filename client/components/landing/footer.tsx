import Link from 'next/link'
import { Logo } from "@/components/logo"

const footerLinks = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "Benefits", href: "/#benefits" },
      { label: "Pricing", href: "/pricing" },
      { label: "FAQ", href: "/#faq" },
    ]
  },
  {
    title: "Company",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Refund Policy", href: "/refund-policy" },
      { label: "Contact Us", href: "/contact" },
    ]
  },
  {
    title: "Integrations",
    links: [
      { label: "Slack", href: "/#integrations" },
      { label: "Discord", href: "/#integrations" },
      { label: "API Docs", href: "/docs" },
      { label: "Webhooks", href: "/docs/webhooks" },
    ]
  }
]

export function Footer() {
  return (
    <footer className="bg-secondary/30 pt-20 pb-10 border-t border-border/50">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Logo size={20} />
              </div>
              <span className="font-black tracking-tighter text-xl text-foreground">
                Knivik
              </span>
            </Link>
            <p className="text-muted-foreground text-sm font-medium max-w-xs leading-relaxed">
              Knivik is an AI-powered lead generation tool that monitors social platforms for high-intent buying signals. Built for founders, agencies, and growth teams.
            </p>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="font-black text-xs uppercase tracking-widest text-foreground mb-6">{section.title}</h4>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link 
                      href={link.href} 
                      className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-10 border-t border-border/50 gap-6">
          <div className="text-xs font-bold text-muted-foreground">
            © {new Date().getFullYear()} Knivik. All rights reserved.
          </div>
          
          <div className="flex items-center gap-2 opacity-60">
             <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">All Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
