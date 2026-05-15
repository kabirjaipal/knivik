"use client"

import { Button } from "@/components/ui/button"
import { Radar, Menu, X, Circle } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/context/auth-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PROJECT_NAME } from "@/lib/constants"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"

export function Navbar() {
  const { user, loading } = useAuth()
  const { scrollY } = useScroll()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const navWidth = useTransform(scrollY, [0, 50], ["100%", "92%"])
  const navPadding = useTransform(scrollY, [0, 50], ["16px", "8px"])
  const navBorderRadius = useTransform(scrollY, [0, 50], ["0px", "28px"])
  const navTop = useTransform(scrollY, [0, 50], ["0px", "20px"])
  const navShadow = useTransform(scrollY, [0, 50], ["0px 0px 0px rgba(0,0,0,0)", "0px 20px 40px rgba(0,0,0,0.1)"])

  const navLinks = [
    { label: "Pricing", href: "/pricing" },
    { label: "Features", href: "/#features" },
    { label: "Workflow", href: "/#workflow" },
    { label: "FAQ", href: "/#faq" },
  ]

  return (
    <>
      <motion.div 
        style={{ 
          width: navWidth,
          paddingTop: navPadding,
          paddingBottom: navPadding,
          borderRadius: navBorderRadius,
          top: navTop,
          boxShadow: navShadow
        }}
        className="fixed left-1/2 -translate-x-1/2 z-50 border-b lg:border border-border/40 bg-background/60 backdrop-blur-xl transition-colors duration-500 max-w-7xl"
      >
        <header className="container mx-auto flex h-12 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo Section */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2.5 group relative">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-lg transition-transform group-hover:rotate-12">
                <Radar className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-black tracking-tighter text-lg text-foreground group-hover:text-primary transition-colors leading-none">{PROJECT_NAME}</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-[7px] font-black uppercase tracking-[0.2em] text-success/80">Live</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation - Centered */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.label} 
                href={link.href} 
                className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </Link>
            ))}
          </nav>
          
          {/* Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            
            <div className="hidden md:flex items-center gap-3">
              {!loading && user ? (
                <Link href="/dashboard">
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 overflow-hidden group">
                    <Avatar className="h-8 w-8 border-2 border-primary/20 transition-all group-hover:border-primary">
                      <AvatarFallback className="bg-primary/5 text-primary font-black text-[10px]">
                        {(user.username || user.email || 'U').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </Link>
              ) : !loading && !user ? (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="text-[10px] h-8 font-black uppercase tracking-widest px-4">Log in</Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="font-black uppercase tracking-widest shadow-lg shadow-primary/20 h-8 px-5 rounded-xl text-[10px] bg-primary hover:scale-105 active:scale-95 transition-all">
                      Get Started
                    </Button>
                  </Link>
                </>
              ) : (
                 <div className="w-8 h-8 animate-pulse bg-muted rounded-full" />
              )}
            </div>

            {/* Mobile Toggle */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden h-8 w-8 p-0"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </header>
      </motion.div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-2xl md:hidden pt-32 px-6"
          >
            <nav className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.label} 
                  href={link.href} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-3xl font-black tracking-tighter text-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="h-px w-full bg-border/50 my-4" />
              {!user ? (
                <div className="flex flex-col gap-4">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full h-14 text-sm font-black uppercase tracking-widest rounded-2xl">Log in</Button>
                  </Link>
                  <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full h-14 text-sm font-black uppercase tracking-widest rounded-2xl">Get Started</Button>
                  </Link>
                </div>
              ) : (
                <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full h-14 text-sm font-black uppercase tracking-widest rounded-2xl">Go to Dashboard</Button>
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
