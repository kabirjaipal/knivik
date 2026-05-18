"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { signIn } from "@/lib/auth-client"
import { Radar, Loader2, KeyRound } from "lucide-react"
import { FcGoogle } from "react-icons/fc"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { PROJECT_NAME } from "@/lib/constants"

export default function LoginClient() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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
                  <FcGoogle className="h-5 w-5" />
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
