"use client"

import { Button } from "@/components/ui/button"
import { Radar, User, Settings, LogOut } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/context/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Navbar() {
  const { user, loading, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Radar className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold tracking-tight text-lg">IntentRadar</span>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {user && !loading ? (
            <>
              <Link href="/dashboard" className="transition-colors hover:text-foreground text-foreground/60">Dashboard</Link>
              <Link href="/dashboard/products" className="transition-colors hover:text-foreground text-foreground/60">Products & Config</Link>
              <Link href="/dashboard/alerts" className="transition-colors hover:text-foreground text-foreground/60">Alert Routing</Link>
            </>
          ) : (
            <>
              <Link href="#features" className="transition-colors hover:text-foreground/80 text-foreground/60">Features</Link>
              <Link href="#how-it-works" className="transition-colors hover:text-foreground/80 text-foreground/60">How it Works</Link>
              <Link href="#pricing" className="transition-colors hover:text-foreground/80 text-foreground/60">Pricing</Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          {!loading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full focus:ring-2 focus:ring-primary focus:outline-none">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarImage src={`https://avatar.vercel.sh/${user.username}.png`} alt={user.username} />
                    <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mt-2" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <Link href="/dashboard">
                    <DropdownMenuItem className="cursor-pointer">
                      <Radar className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/dashboard/products">
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Products & Config</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/dashboard/alerts">
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Alert Routing</span>
                    </DropdownMenuItem>
                  </Link>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : !loading && !user ? (
            <div className="flex items-center gap-4">
              <Link href="/login" className="hidden sm:inline-block">
                <Button variant="ghost" className="text-sm font-medium">Log in</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="font-medium shadow-sm">Get Started</Button>
              </Link>
            </div>
          ) : (
             <div className="w-9 h-9 animate-pulse bg-muted rounded-full" />
          )}
        </div>
      </div>
    </header>
  )
}
