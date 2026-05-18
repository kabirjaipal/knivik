"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { authClient, signIn } from "@/lib/auth-client"
import { Radar, Loader2, CheckCircle2, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { FcGoogle } from "react-icons/fc"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { PROJECT_NAME } from "@/lib/constants"

export default function RegisterClient() {
  const router = useRouter()
  const { user, loading: authLoading, registrationEnabled } = useAuth()
  
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

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
      const result = await authClient.signUp.email({
        email,
        password,
        name: username,
        username: username,
        callbackURL: window.location.origin + "/dashboard",
      })

      if (result.error) {
        if (result.error.code === "USERNAME_ALREADY_EXISTS") {
          setError("This username is already taken")
        } else {
          setError(result.error.message || "Failed to create account")
        }
        return
      }

      toast.success("Account created successfully! Please log in to your workspace.")
      router.push('/login')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
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
          <CardHeader className="space-y-4 pb-3 pt-6 text-center">
            <div className="flex flex-col items-center">
              <Link href="/" className="group flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary shadow-md">
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
            {!registrationEnabled ? (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-md p-6 flex flex-col items-center text-center space-y-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 mb-1">
                  <UserPlus className="h-6 w-6 stroke-[2.5]" />
                </div>
                <h3 className="font-black text-base text-foreground tracking-tight">Onboarding Closed</h3>
                <p className="text-muted-foreground text-xs leading-relaxed max-w-[280px]">
                  New account registrations are temporarily paused while we optimize workspace queues. Please check back shortly!
                </p>
                <Button variant="outline" size="sm" className="mt-2 rounded-xl font-bold" onClick={() => router.push('/')}>
                  Return Home
                </Button>
              </div>
            ) : success ? (
              <div className="bg-success/5 border border-success/20 rounded-sm p-6 flex flex-col items-center text-center space-y-3">
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
                      className="h-11 bg-background/50 border-border/60 focus:ring-primary focus:border-primary rounded-sm transition-all"
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
                      className="h-11 bg-background/50 border-border/60 focus:ring-primary focus:border-primary rounded-sm transition-all"
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
                      className="h-11 bg-background/50 border-border/60 focus:ring-primary focus:border-primary rounded-sm transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-xs font-bold text-destructive px-3 py-2 bg-destructive/10 rounded-sm border border-destructive/20">
                    {error}
                  </div>
                )}
                
                <Button type="submit" disabled={loading} className="w-full h-11 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all rounded-sm">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  {loading ? "Creating..." : "Start Free Trial"}
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
                  className="w-full h-11 border-border/60 hover:bg-muted/50 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                  onClick={handleGoogleRegister}
                >
                  <FcGoogle className="h-5 w-5" />
                  <span className="text-xs font-bold">Continue with Google</span>
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
              <p className="text-xs text-muted-foreground/60 text-center px-10 leading-relaxed">
                By signing up, you agree to our{" "}
                <Link href="/terms" className="underline hover:text-primary transition-colors">Terms</Link>{" "}
                &{" "}
                <Link href="/privacy" className="underline hover:text-primary transition-colors">Privacy</Link>.
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
