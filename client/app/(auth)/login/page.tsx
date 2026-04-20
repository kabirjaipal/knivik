"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { signIn } from "@/lib/auth-client"
import { Radar, ArrowLeft, Loader2, KeyRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { PROJECT_NAME } from "@/lib/constants"

export default function LoginPage() {
  const router = useRouter()
  const { user, loading: authLoading, refresh } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn.email({
        email,
        password,
        callbackURL: window.location.origin + "/dashboard",
      })

      if (result.error) {
        throw new Error(result.error.message || "Failed to login")
      }

      // Session is automatically handled by Better Auth
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError("")

    try {
      await signIn.social({
        provider: "google",
        callbackURL: window.location.origin + "/dashboard",
      })
      // Better Auth handles the OAuth redirect automatically
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="relative z-10 w-full max-w-md">
        <Card className="border-border/60 shadow-2xl bg-card rounded-md overflow-hidden">
          <CardHeader className="space-y-4 pb-4 pt-6 text-center">
            {/* Logo Section */}
            <div className="flex flex-col items-center">
              <Link href="/" className="group flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary shadow-md">
                  <Radar className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="font-black text-2xl tracking-tighter text-foreground">{PROJECT_NAME}</span>
              </Link>
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl font-black tracking-tight">Welcome back</CardTitle>
              <CardDescription className="text-sm">
                Enter your credentials to access your dashboard.
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="pb-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com" 
                  required 
                  disabled={loading}
                  className="h-11 bg-background/50 border-border/60 focus:ring-primary focus:border-primary rounded-sm transition-all"
                />
              </div>
              
              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Password</Label>
                  <Link href="/forgot-password" title="Recover Password"
                    className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">
                    Forgot?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  disabled={loading}
                  className="h-11 bg-background/50 border-border/60 focus:ring-primary focus:border-primary rounded-sm transition-all"
                />
              </div>

              {error && (
                <div className="text-xs font-bold text-destructive px-3 py-2 bg-destructive/10 rounded-sm border border-destructive/20">
                  {error}
                </div>
              )}
              
              <Button type="submit" disabled={loading} className="w-full h-11 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all rounded-sm">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                {loading ? "Signing in..." : "Sign In"}
              </Button>
              
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/60" /></div>
                <div className="relative flex justify-center text-xs uppercase font-black tracking-widest">
                  <span className="bg-card px-2 text-muted-foreground/60">Or</span>
                </div>
              </div>

              <Button
                variant="outline"
                type="button"
                disabled={loading}
                className="w-full h-11 border-border/60 hover:bg-muted/50 rounded-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                onClick={handleGoogleLogin}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C40.483,35.58,44,30.2,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                </svg>
                <span className="text-xs font-bold">Continue with Google</span>
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="pb-6 pt-5 flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">
              New here?{" "}
              <Link href="/register" className="font-bold text-primary hover:text-primary/80 transition-colors">
                Create account
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
