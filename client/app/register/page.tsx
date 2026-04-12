"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Radar, ArrowLeft, Loader2, CheckCircle2, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { PROJECT_NAME } from "@/lib/constants"

export default function RegisterPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
        credentials: "include"
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to create account")

      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Premium Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(var(--primary-rgb),0.07),transparent_70%)] blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-[400px] animate-in fade-in zoom-in-95 duration-500">
        <Card className="border-border/40 shadow-2xl bg-card/80 backdrop-blur-xl rounded-2xl overflow-hidden">
          <CardHeader className="space-y-4 pb-3 pt-6 text-center">
            {/* Logo Section */}
            <div className="flex flex-col items-center">
              <Link href="/" className="group flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
                  <Radar className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="font-black text-2xl tracking-tighter text-foreground">{PROJECT_NAME}</span>
              </Link>
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl font-black tracking-tight">Create workspace</CardTitle>
              <CardDescription className="text-sm">
                Start converting high-intent leads in minutes.
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="pb-3">
            {success ? (
              <div className="bg-success/5 border border-success/20 rounded-xl p-6 flex flex-col items-center text-center space-y-3 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success mb-1">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="font-black text-lg text-foreground tracking-tight">Check your inbox</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  We've sent a verification link to your email. Please click it to activate your workspace.
                </p>
                <Button variant="outline" size="sm" className="mt-2 rounded-xl font-bold" onClick={() => router.push('/login')}>
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="grid grid-cols-1 gap-2.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="username" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Username</Label>
                    <Input 
                      id="username" 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="johndoe" 
                      required 
                      disabled={loading}
                      className="h-11 bg-background/50 border-border/60 focus:ring-primary focus:border-primary rounded-xl transition-all"
                    />
                  </div>
                  
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
                      className="h-11 bg-background/50 border-border/60 focus:ring-primary focus:border-primary rounded-xl transition-all"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required 
                      disabled={loading}
                      className="h-11 bg-background/50 border-border/60 focus:ring-primary focus:border-primary rounded-xl transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-xs font-bold text-destructive px-3 py-2 bg-destructive/10 rounded-xl border border-destructive/20 animate-in shake duration-300">
                    {error}
                  </div>
                )}
                
                <Button type="submit" disabled={loading} className="w-full h-11 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all rounded-xl">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  {loading ? "Creating..." : "Start Free Trial"}
                </Button>
                
                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/60" /></div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                    <span className="bg-card px-2 text-muted-foreground/60">Or</span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  type="button" 
                  disabled={loading}
                  className="w-full h-11 text-xs font-bold border-border/60 hover:bg-muted/50 rounded-xl transition-all active:scale-95"
                  onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
                >
                  Continue with Google
                </Button>
              </form>
            )}
          </CardContent>
          
          <CardFooter className="pb-6 pt-5 flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-primary hover:text-primary/80 transition-colors">
                Sign in
              </Link>
            </p>
            
            <div className="flex flex-col items-center gap-2">
              <p className="text-[10px] text-muted-foreground/60 text-center px-10 leading-relaxed">
                By signing up, you agree to our{" "}
                <Link href="/terms" className="underline hover:text-primary transition-colors">Terms</Link>{" "}
                &{" "}
                <Link href="/privacy" className="underline hover:text-primary transition-colors">Privacy</Link>.
              </p>
              <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors text-xs font-black uppercase tracking-widest opacity-60">
                <ArrowLeft className="mr-1 h-3 w-3" />
                Home
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
