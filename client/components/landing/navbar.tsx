import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Logo } from "@/components/logo"

export function Navbar({ user }: { user: any }) {
  
  const navLinks = [
    { label: "How it works", href: "/#how-it-works" },
    { label: "Product", href: "/#benefits" },
    { label: "Integrations", href: "/#integrations" },
    { label: "Pricing", href: "/pricing" },
    { label: "FAQ", href: "/#faq" },
  ]

  return (
    <>
      <input type="checkbox" id="mobile-menu-toggle" className="peer hidden" />
      
      <div 
        className="fixed top-0 left-0 w-full z-50 py-4 border-b border-border/50 bg-background/80 backdrop-blur-xl"
      >
        <header className="container mx-auto flex items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground group-hover:scale-110 transition-transform">
              <Logo size={24} />
            </div>
            <span className="font-black tracking-tighter text-2xl text-foreground">
              Knivik
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.label} 
                href={link.href} 
                className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            {user ? (
              <Link href="/dashboard">
                <Button variant="ghost" className="h-9 w-9 rounded-full p-0 overflow-hidden border border-border">
                  <Avatar className="h-full w-full">
                    <AvatarFallback className="bg-primary/5 text-primary font-black text-xs">
                      {(user.username || user.email || 'U').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" className="text-sm font-bold">Log in</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="font-bold h-10 px-6 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                    Get First Leads Free
                  </Button>
                </Link>
              </div>
            )}

            <label 
              htmlFor="mobile-menu-toggle" 
              className="lg:hidden cursor-pointer h-9 w-9 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
            >
              <Menu className="h-5 w-5 block peer-checked:hidden" />
              <X className="h-5 w-5 hidden peer-checked:block text-primary" />
            </label>
          </div>
        </header>
      </div>

      <div 
        className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl lg:hidden opacity-0 pointer-events-none -translate-y-4 peer-checked:opacity-100 peer-checked:pointer-events-auto peer-checked:translate-y-0 transition-all duration-500 ease-in-out"
      >
        <div className="flex flex-col h-full pt-24 px-8">
          <nav className="flex flex-col gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.label}
                href={link.href} 
                className="text-4xl font-black tracking-tighter text-foreground"
              >
                {link.label}
              </Link>
            ))}
            
            <div className="h-px w-full bg-border mt-4" />
            
            {!user && (
              <div className="flex flex-col gap-4">
                <Link href="/login">
                  <Button variant="outline" className="w-full h-14 text-lg font-bold rounded-2xl">Log in</Button>
                </Link>
                <Link href="/register">
                  <Button className="w-full h-14 text-lg font-bold rounded-2xl">Get First Leads Free</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </>
  )
}
