"use client"

import { useAuth } from "@/context/auth-context"
import { Navbar } from "@/components/landing/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Radar, Users, MessageSquareText, Activity } from "lucide-react"

export default function DashboardPage() {
  const { user, loading } = useAuth()

  // Display a full-screen loading spinner while checking permissions
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      {/* We reuse the generic Navbar. Later we can swap this for a Dashboard sidebar */}
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 mt-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Welcome back, {user?.username}
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Here's an overview of what's happening with your leads today.
          </p>
        </div>

        {/* Top-Level Metric Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Total Signals Scanned</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">14,231</div>
              <p className="text-xs text-success font-medium mt-1">+20.1% from last week</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-primary/20 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-primary uppercase tracking-wide">High-Intent Leads</CardTitle>
              <Radar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">42</div>
              <p className="text-xs text-primary/80 font-medium mt-1">Score &gt; 80</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Auto-Replies Drafted</CardTitle>
              <MessageSquareText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">18</div>
              <p className="text-xs text-muted-foreground mt-1">Ready for your review</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Active Keywords</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">3</div>
              <p className="text-xs text-muted-foreground mt-1">Monitoring active spaces</p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Detailed Data Pane */}
        <div className="mt-8">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Recent Detected Leads</CardTitle>
              <CardDescription className="text-sm">
                The actual AI data engine hasn't been connected yet. Once you define keywords, leads will stream from the Express Server natively.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center border-t border-dashed border-border/60 bg-muted/10 rounded-b-xl">
               <div className="text-center">
                 <Radar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                 <p className="text-sm text-foreground font-semibold">No live data connected.</p>
                 <p className="text-xs text-muted-foreground mt-1">Awaiting Express Backend integration for scraper data.</p>
               </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
