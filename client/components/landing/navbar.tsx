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
  
  // Responsive transform hooks
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

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => { document.body.style.overflow = "unset" }
  }, [isMobileMenuOpen])

  return (
    <>
      <motion.div 
        style={{ 
          width: typeof window !== 'undefined' && window.innerWidth < 768 ? "100%" : navWidth,
          paddingTop: typeof window !== 'undefined' && window.innerWidth < 768 ? "12px" : navPadding,
          paddingBottom: typeof window !== 'undefined' && window.innerWidth < 768 ? "12px" : navPadding,
          borderRadius: typeof window !== 'undefined' && window.innerWidth < 768 ? "0px" : navBorderRadius,
          top: typeof window !== 'undefined' && window.innerWidth < 768 ? "0px" : navTop,
          boxShadow: navShadow
        }}
        className="fixed left-1/2 -translate-x-1/2 z-50 border-b md:border border-border/40 bg-background/60 backdrop-blur-xl transition-all duration-500 max-w-7xl"
      >
        <header className="container mx-auto flex h-10 sm:h-12 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo Section */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2.5 group relative">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-primary shadow-lg transition-transform group-hover:rotate-12">
                <Radar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-black tracking-tighter text-base sm:text-lg text-foreground group-hover:text-primary transition-colors leading-none">{PROJECT_NAME}</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-[6px] sm:text-[7px] font-black uppercase tracking-[0.2em] text-success/80">Live</span>
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
          <div className="flex items-center gap-2 sm:gap-3">
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
            <div className="flex items-center gap-2 md:hidden">
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 hover:bg-primary/10 transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5 text-primary" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </header>
      </motion.div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-2xl md:hidden"
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="flex flex-col h-full pt-32 px-8 pb-12"
            >
              <nav className="flex flex-col gap-8">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.label}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link 
                      href={link.href} 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-4xl font-black tracking-tighter text-foreground hover:text-primary transition-colors flex items-center gap-4"
                    >
                      <span className="text-primary/20 text-xl font-mono">0{i+1}</span>
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  transition={{ delay: 0.4 }}
                  className="h-px w-full bg-border/50 my-4" 
                />
                
                {!user ? (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col gap-4"
                  >
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full h-16 text-sm font-black uppercase tracking-widest rounded-2xl border-2">Log in</Button>
                    </Link>
                    <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full h-16 text-sm font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20">Get Started</Button>
                    </Link>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full h-16 text-sm font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20">Go to Dashboard</Button>
                    </Link>
                  </motion.div>
                )}
              </nav>

              <div className="mt-auto flex justify-center">
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                    <Circle className="h-2 w-2 fill-success text-success animate-pulse" />
                    Systems Operational
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
