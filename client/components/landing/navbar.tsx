"use client"

import { Button } from "@/components/ui/button"
import { Radar } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/context/auth-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PROJECT_NAME } from "@/lib/constants"

export function Navbar() {
  const { user, loading } = useAuth()

  return (
    <div className="sticky top-0 z-50 w-full">
      <header className="w-full border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary shadow-md">
                <Radar className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-black tracking-tighter text-xl text-foreground">{PROJECT_NAME}</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors hidden md:inline-block">
              Pricing
            </Link>
            <ThemeToggle />
            
            {!loading && user ? (
              <Link href="/dashboard" title="Go to Dashboard">
                <Button variant="ghost" className="relative h-9 w-9 rounded-full focus:ring-2 focus:ring-primary focus:outline-none p-0 overflow-hidden group">
                  <Avatar className="h-9 w-9 border-2 border-primary/20 transition-all group-hover:border-primary">
                    <AvatarFallback className="bg-primary/5 text-primary font-black text-xs">
                      {(user.username || user.email || 'U').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </Link>
            ) : !loading && !user ? (
              <div className="flex items-center gap-3">
                <Link href="/login" className="hidden sm:inline-block">
                  <Button variant="ghost" className="text-sm font-black uppercase tracking-widest">Log in</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="font-black uppercase tracking-widest shadow-lg shadow-primary/20 h-9 px-6 rounded-sm text-xs">
                    Get Started
                  </Button>
                </Link>
              </div>
            ) : (
               <div className="w-9 h-9 animate-pulse bg-muted rounded-full" />
            )}
          </div>
        </div>
      </header>
    </div>
  )
}
