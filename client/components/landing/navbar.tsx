"use client"

import { Button } from "@/components/ui/button"
import { Menu, X, ArrowRight } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Logo } from "@/components/logo"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"

export function Navbar({ user }: { user: any }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Smooth scroll handler for anchor links (handles both cross-page and same-page clicks)
  useEffect(() => {
    const handleHashScroll = () => {
      const hash = window.location.hash
      if (hash) {
        const id = hash.replace("#", "")
        const element = document.getElementById(id)
        if (element) {
          // 300ms delay to allow route changes and framer-motion page animations to render
          setTimeout(() => {
            element.scrollIntoView({ behavior: "smooth", block: "start" })
          }, 300)
        }
      }
    }

    // Trigger scroll check on mount and pathname changes
    handleHashScroll()

    // Listen for hashchange events when already on the same page
    window.addEventListener("hashchange", handleHashScroll)
    return () => window.removeEventListener("hashchange", handleHashScroll)
  }, [pathname])

  const navLinks = [
    { label: "How it works", href: "/#how-it-works" },
    { label: "Product", href: "/#benefits" },
    { label: "Integrations", href: "/#integrations" },
    { label: "Pricing", href: "/pricing" },
    { label: "FAQ", href: "/#faq" },
    { label: "Contact", href: "/contact" },
  ]

  const isLinkActive = (href: string) => {
    if (href === pathname) return true
    if (href.startsWith("/#") && pathname === "/") return false
    return false
  }

  return (
    <header 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        isScrolled 
          ? "py-3 bg-background/60 backdrop-blur-xl border-b border-border/50 shadow-sm" 
          : "py-6 bg-transparent"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 group relative">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl text-primary group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
            <Logo size={28} />
          </div>
          <span className="font-black tracking-tighter text-2xl text-foreground">
            Knivik
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-10">
          {navLinks.map((link) => {
            const active = isLinkActive(link.href)
            return (
              <Link 
                key={link.label} 
                href={link.href} 
                className={`text-sm font-bold transition-all duration-300 relative group ${
                  active ? "text-primary" : "text-muted-foreground hover:text-primary"
                }`}
              >
                {link.label}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300 ${
                  active ? "w-full" : "w-0 group-hover:w-full"
                }`} />
              </Link>
            )
          })}
        </nav>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          {user ? (
            <Link href="/dashboard">
              <Button variant="ghost" className="h-10 w-10 rounded-xl p-0 overflow-hidden border border-border/50 hover:border-primary/50 transition-colors bg-background/50">
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
                <Button variant="ghost" className="text-sm font-bold hover:bg-primary/5">Log in</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="font-black h-11 px-7 rounded-xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 group">
                  Start Free
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          )}

          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden cursor-pointer h-10 w-10 flex items-center justify-center rounded-xl bg-secondary/50 border border-border/50 hover:bg-secondary transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5 text-primary" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background/95 backdrop-blur-2xl border-b border-border/50 overflow-hidden"
          >
            <div className="container mx-auto px-6 py-12 flex flex-col gap-8">
              <nav className="flex flex-col gap-6">
                {navLinks.map((link) => {
                  const active = isLinkActive(link.href)
                  return (
                    <Link 
                      key={link.label}
                      href={link.href} 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`text-4xl font-black tracking-tighter transition-colors ${
                        active ? "text-primary" : "text-foreground hover:text-primary"
                      }`}
                    >
                      {link.label}
                    </Link>
                  )
                })}
              </nav>
              
              <div className="h-px w-full bg-border/50" />
              
              {!user && (
                <div className="flex flex-col gap-4">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full h-14 text-lg font-bold rounded-2xl border-2">Log in</Button>
                  </Link>
                  <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full h-14 text-lg font-black rounded-2xl shadow-xl shadow-primary/20">Get Started Free</Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

