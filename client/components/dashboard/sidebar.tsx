"use client"

import { useAuth } from "@/context/auth-context"
import { 
  Radar, 
  CreditCard, 
  LogOut, 
  Users, 
  ChevronLeft,
  ChevronRight,
  Menu,
  LayoutDashboard,
  Terminal,
  Cpu,
  LineChart,
  Database,
  Coins,
  Brain,
  BellRing,
  Sliders,
  ShieldAlert,
  Settings,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { PROJECT_NAME } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useMemo } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"
import { useBilling } from "@/context/billing-context"
import { LucideIcon } from "lucide-react"

interface SidebarProps {
  className?: string
}

interface NavLink {
  href: string
  label: string
  icon: LucideIcon
  accent?: boolean
}

export function Sidebar({ className }: SidebarProps) {
  const { user, logout } = useAuth()
  const { billingData } = useBilling()
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const currentPlan = billingData?.user?.plan?.toUpperCase() || user?.plan?.toUpperCase() || 'FREE'

  const isAtAdmin = pathname.startsWith('/admin')

  const userLinks: NavLink[] = useMemo(() => [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/products", label: "Products", icon: Radar },
    { href: "/dashboard/analytics", label: "Analytics", icon: LineChart },
    { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ], [])

  const adminLinks: NavLink[] = useMemo(() => [
    { href: "/admin", label: "System Overview", icon: LayoutDashboard },
    { href: "/admin/leads", label: "Global Leads", icon: Database },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/revenue", label: "Revenue", icon: Coins },
    { href: "/admin/usage", label: "LLM Usage", icon: Brain },
    { href: "/admin/alerts", label: "Alert Logs", icon: BellRing },
    { href: "/admin/logs", label: "API Logs", icon: Terminal },
    { href: "/admin/memory", label: "Memory Monitor", icon: Cpu },
    { href: "/admin/settings", label: "Global Settings", icon: Sliders },
  ], [])

  const links = useMemo(() => isAtAdmin ? adminLinks : userLinks, [isAtAdmin, adminLinks, userLinks])

  const toggleSidebar = () => setIsCollapsed(!isCollapsed)
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen)

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-border/40 bg-background px-6 shadow-sm">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl">
            <Logo size={24} />
          </div>
          <div className="flex flex-col">
            <span className="font-black tracking-tighter text-xl text-foreground leading-none">Knivik</span>
          </div>
        </Link>
        <Button variant="ghost" size="icon" onClick={toggleMobile}>
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-50 bg-background/90 lg:hidden"
          onClick={toggleMobile}
        />
      )}

      {/* Sidebar Content */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border/40 bg-background transition-all duration-300 lg:sticky lg:h-screen lg:z-40",
        isCollapsed ? "w-20" : "w-64",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        className
      )}>
        {/* Logo Container */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-border/40">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl shrink-0 group-hover:scale-110 transition-transform">
              <Logo size={24} />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col animate-in fade-in duration-300">
                <span className="font-black tracking-tighter text-xl text-foreground leading-none">Knivik</span>
              </div>
            )}
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="hidden lg:flex h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={toggleSidebar}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          
          {links.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative",
                  isActive 
                    ? "bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  link.accent && !isActive && "text-primary hover:bg-primary/5"
                )}
                title={isCollapsed ? link.label : undefined}
              >
                <link.icon className={cn("h-5 w-5 shrink-0 transition-transform group-hover:scale-110", isActive && "scale-110")} />
                {!isCollapsed && <span className="text-sm tracking-tight">{link.label}</span>}
                {isCollapsed && isActive && (
                  <div className="absolute left-0 w-1 h-6 bg-primary-foreground rounded-r-full" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Admin Switcher (If Admin is on User Dashboard) */}
        {!isAtAdmin && user?.role === 'admin' && (
          <div className="px-4 py-2">
            <Link 
              href="/admin"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all group",
                isCollapsed && "justify-center px-0"
              )}
              title={isCollapsed ? "Go to Admin" : undefined}
            >
              <ShieldAlert className="h-5 w-5" />
              {!isCollapsed && <span className="text-xs font-black uppercase tracking-widest">Go to Admin</span>}
            </Link>
          </div>
        )}

        {/* App Switcher (If on Admin Dashboard) */}
        {isAtAdmin && (
          <div className="px-4 py-2">
            <Link 
              href="/dashboard"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all group",
                isCollapsed && "justify-center px-0"
              )}
              title={isCollapsed ? "Return to App" : undefined}
            >
              <div className="relative h-5 w-5 shrink-0 flex items-center justify-center">
                <Logo size={20} />
              </div>
              {!isCollapsed && <span className="text-xs font-black uppercase tracking-widest">Return to App</span>}
            </Link>
          </div>
        )}

        {/* Footer Area */}
        <div className="border-t border-border/40 p-4 space-y-4">
          <div className={cn("flex items-center justify-between gap-4 px-2", isCollapsed && "flex-col")}>
            <div className="flex items-center gap-3 min-w-0">
               <Avatar className="h-8 w-8 border border-border shadow-sm">
                  <AvatarFallback className="bg-primary/5 text-primary text-xs font-black uppercase">
                    {user?.username?.slice(0, 2) || "U"}
                  </AvatarFallback>
               </Avatar>
               {!isCollapsed && (
                 <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold truncate">{user?.username}</span>
                      {currentPlan === 'PRO' ? (
                        <Badge variant="outline" className="h-4 px-1.5 text-xs font-black uppercase tracking-tighter bg-primary/10 text-primary border-primary/20 gap-0.5">
                          <Sparkles className="h-2 w-2" />
                          Pro
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="h-4 px-1.5 text-xs font-black uppercase tracking-tighter bg-muted text-muted-foreground border-border/50">
                          Free
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                 </div>
               )}
            </div>
            <ThemeToggle />
          </div>

          <Button 
            variant="ghost" 
            className={cn(
              "w-full flex items-center justify-start gap-3 px-3 py-2 text-destructive hover:bg-destructive/10 hover:text-destructive",
              isCollapsed && "justify-center px-0 h-9"
            )}
            onClick={logout}
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span className="text-sm font-semibold">Logout</span>}
          </Button>
        </div>
      </aside>
    </>
  )
}
