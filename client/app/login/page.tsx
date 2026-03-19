"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Radar, ArrowLeft, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const { refresh } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include" // Important: Tells the browser to accept the backend's HTTP-Only Session Cookie
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to login")
      }

      // Success - Refresh AuthContext UI State, then Redirect user to dashboard
      await refresh()
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between bg-primary p-12 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_bottom_left,var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>
        
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm font-medium mb-12">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </Link>
          <div className="flex items-center space-x-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Radar className="h-6 w-6" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight">IntentRadar</span>
          </div>
          <h1 className="text-4xl font-extrabold leading-tight mb-4">
            Welcome back to your ultimate growth engine.
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            Your automated pipeline is ready. Log in to check your latest high-intent leads and close some deals today.
          </p>
        </div>

        <div className="relative z-10 mt-auto">
          <blockquote className="border-l-2 border-white/20 pl-6 italic">
            "Since using IntentRadar, we've engaged directly with customers at the exact moment they need us. Our conversion rate tripled."
            <footer className="mt-4 font-semibold text-sm">
              — Sarah Jenkins, Founder @ TechFlow
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-col items-center justify-center p-8 lg:p-16 bg-background">
        <Link href="/" className="absolute top-8 left-8 lg:hidden inline-flex items-center text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to home
        </Link>
        
        <div className="w-full max-w-[400px] space-y-8">
          <div className="space-y-3 text-center sm:text-left">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Sign in</h1>
            <p className="text-muted-foreground text-base">
              Enter your email and password to access your dashboard.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-foreground font-semibold">Email address</Label>
              <Input 
                id="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com" 
                required 
                disabled={loading}
                className="h-12 px-4 bg-background border-border/60 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground font-semibold">Password</Label>
                <Link href="/forgot-password" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                disabled={loading}
                className="h-12 px-4 bg-background border-border/60 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            {error && (
              <div className="text-sm font-medium text-destructive mt-2 bg-destructive/10 p-3 rounded-md border border-destructive/20">
                {error}
              </div>
            )}
            
            <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold shadow-sm mt-2">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {loading ? "Signing in..." : "Sign in"}
            </Button>
            
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/80" />
              </div>
              <div className="relative flex justify-center text-xs uppercase font-semibold">
                <span className="bg-background px-3 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Button 
                variant="outline" 
                type="button" 
                className="w-full h-12 font-semibold border-border/80 hover:bg-muted/40 transition-colors"
                onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/google`}
              >
                Continue with Google
              </Button>
            </div>
          </form>

          <p className="text-sm text-muted-foreground text-center pt-4">
            Don't have an account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
