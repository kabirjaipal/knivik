import { Button } from "@/components/ui/button"
import { Radar, Menu, X, Circle } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PROJECT_NAME } from "@/lib/constants"
import { getSession } from "@/lib/auth-client"
import { headers } from "next/headers"

export async function Navbar() {
  const { data: session } = await getSession({
    fetchOptions: {
      headers: await headers()
    }
  })
  const user = session?.user
  
  const navLinks = [
    { label: "Pricing", href: "/pricing" },
    { label: "Features", href: "/#features" },
    { label: "Workflow", href: "/#workflow" },
    { label: "FAQ", href: "/#faq" },
  ]

  return (
    <>
      {/* Hidden Checkbox for Mobile Menu Toggle (Pure CSS) */}
      <input type="checkbox" id="mobile-menu-toggle" className="peer hidden" />
      
      <div 
        className="fixed top-0 left-0 w-full z-50 md:top-5 md:left-1/2 md:-translate-x-1/2 md:w-11/12 md:max-w-7xl md:rounded-3xl border-b md:border bg-background/60 backdrop-blur-xl shadow-2xl py-2 transition-all duration-500"
      >
        <header className="container mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo Section */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2.5 group relative">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-lg transition-transform group-hover:rotate-12">
                <Radar className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-black tracking-tighter text-lg text-foreground group-hover:text-primary transition-colors leading-none">{PROJECT_NAME}</span>
              </div>
            </Link>
          </div>

          {/* Navigation - Centered */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.label} 
                href={link.href} 
                className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </Link>
            ))}
          </nav>
          
          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* 1. Theme Toggle - Always Visible */}
            <ThemeToggle />
            
            {/* 2. User Profile / Auth Buttons */}
            {user ? (
              <Link href="/dashboard">
                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 overflow-hidden group">
                  <Avatar className="h-8 w-8 border-2 border-primary/20 transition-all group-hover:border-primary">
                    <AvatarFallback className="bg-primary/5 text-primary font-black text-xs">
                      {(user.username || user.email || 'U').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </Link>
            ) : (
              /* Desktop Auth Buttons (Guest Only) */
              <div className="hidden md:flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" className="text-xs h-8 font-black uppercase tracking-widest px-4">Log in</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="font-black uppercase tracking-widest shadow-lg shadow-primary/20 h-8 px-5 rounded-xl text-xs bg-primary hover:scale-105 active:scale-95 transition-all">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {/* 3. Hamburger Menu - Mobile Only */}
            <label 
              htmlFor="mobile-menu-toggle" 
              className="cursor-pointer h-8 w-8 flex items-center justify-center rounded-lg hover:bg-primary/10 transition-colors md:hidden"
            >
              <Menu className="h-5 w-5 block peer-checked:hidden" />
              <X className="h-5 w-5 hidden peer-checked:block text-primary" />
            </label>
          </div>
        </header>
      </div>

      {/* Mobile Drawer (Pure CSS controlled by peer-checked) */}
      <div 
        className="fixed inset-0 z-40 bg-background/95 backdrop-blur-3xl md:hidden opacity-0 pointer-events-none -translate-y-4 peer-checked:opacity-100 peer-checked:pointer-events-auto peer-checked:translate-y-0 transition-all duration-500 ease-in-out"
      >
        <div className="flex flex-col h-full pt-24 px-6 pb-12">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link, i) => (
              <Link 
                key={link.label}
                href={link.href} 
                className="text-2xl font-black tracking-tight text-foreground hover:text-primary transition-colors flex items-center p-2 rounded-xl hover:bg-primary/5"
              >
                {link.label}
              </Link>
            ))}
            
            <div className="h-px w-full bg-border/50 my-6" />
            
            {!user && (
              <div className="flex flex-col gap-3">
                <Link href="/login">
                  <Button variant="outline" className="w-full h-14 text-xs font-black uppercase tracking-widest rounded-xl border-2">Log in</Button>
                </Link>
                <Link href="/register">
                  <Button className="w-full h-14 text-xs font-black uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20">Get Started</Button>
                </Link>
              </div>
            )}
          </nav>

          <div className="mt-auto pt-8 border-t border-border/50 flex justify-center">
             <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground/30">
                <Circle className="h-2 w-2 fill-success text-success animate-pulse" />
                System Active
             </div>
          </div>
        </div>
      </div>
    </>
  )
}
