"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { authClient, signIn } from "@/lib/auth-client"
import { Radar, Loader2, CheckCircle2, UserPlus, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { FcGoogle } from "react-icons/fc"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { PROJECT_NAME } from "@/lib/constants"
import { QUOTES, type Quote } from "@/lib/quotes"

export default function RegisterClient() {
  const router = useRouter()
  const { user, loading: authLoading, registrationEnabled } = useAuth()
  
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [activeQuote, setActiveQuote] = useState<Quote>(QUOTES[0])

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  // Select a random quote on mount to avoid hydration mismatch
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * QUOTES.length)
    setActiveQuote(QUOTES[randomIndex])
  }, [])

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
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2 bg-background relative overflow-hidden">
      
      {/* Left Side: Interactive Brand & Quote Section */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative bg-muted/20 dark:bg-muted/5 border-r border-border/40 overflow-hidden">
        {/* Ambient theme-colored glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(var(--primary-rgb),0.06),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(var(--primary-rgb),0.03),transparent_50%)] pointer-events-none" />
        
        {/* Subtle grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, var(--foreground) 1px, transparent 1px)`,
            backgroundSize: "24px 24px"
          }}
        />

        {/* Header */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/20">
            <Radar className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-black text-xl tracking-tighter text-foreground">{PROJECT_NAME}</span>
        </div>

        {/* Quote Block */}
        <div className="relative z-10 max-w-md my-auto space-y-6">
          <blockquote className="space-y-4">
            <p className="text-xl font-bold tracking-tight text-foreground leading-relaxed">
              &ldquo;{activeQuote.text}&rdquo;
            </p>
            <footer className="mt-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary">
                {activeQuote.initials}
              </div>
              <div>
                <div className="font-bold text-sm text-foreground">{activeQuote.author}</div>
                <div className="text-xs text-muted-foreground">{activeQuote.role}</div>
              </div>
            </footer>
          </blockquote>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-muted-foreground/60">
          &copy; {new Date().getFullYear()} {PROJECT_NAME}. All rights reserved.
        </div>
      </div>

      {/* Right Side: Form Container */}
      <div className="flex items-center justify-center p-4 sm:p-8 relative overflow-hidden bg-background">
        {/* Mobile Background Shimmer Glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none lg:opacity-50">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 dark:bg-primary/5 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/10 dark:bg-accent/5 blur-[120px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative z-10 w-full max-w-md"
        >
          <Card className="border border-border/85 bg-card/60 backdrop-blur-xl shadow-2xl rounded-xl overflow-hidden">
            <CardHeader className="space-y-4 pb-3 pt-8 text-center">
              <div className="flex flex-col items-center lg:hidden">
                <Link href="/" className="group flex items-center gap-2.5">
                  <motion.div 
                    whileHover={{ scale: 1.05, rotate: 12 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/20"
                  >
                    <Radar className="h-6 w-6 text-primary-foreground" />
                  </motion.div>
                  <span className="font-black text-2xl tracking-tighter text-foreground bg-gradient-to-r from-foreground via-foreground/90 to-foreground/75 bg-clip-text">
                    {PROJECT_NAME}
                  </span>
                </Link>
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold tracking-tight text-foreground">Create workspace</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Start converting high-intent leads in minutes.
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="pb-3 px-6">
              {!registrationEnabled ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-6 flex flex-col items-center text-center space-y-4"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 mb-1">
                    <UserPlus className="h-6 w-6 stroke-[2.5]" />
                  </div>
                  <h3 className="font-bold text-base text-foreground tracking-tight">Onboarding Closed</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed max-w-[280px]">
                    New account registrations are temporarily paused while we optimize workspace queues. Please check back shortly!
                  </p>
                  <Button variant="outline" size="sm" className="mt-2 rounded-lg font-bold cursor-pointer" onClick={() => router.push('/')}>
                    Return Home
                  </Button>
                </motion.div>
              ) : success ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-success/5 border border-success/15 rounded-lg p-6 flex flex-col items-center text-center space-y-4"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success mb-1">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground tracking-tight">Check your inbox</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    We've sent a verification link to your email. Please click it to activate your workspace.
                  </p>
                  <Button variant="outline" size="sm" className="mt-2 rounded-lg font-bold cursor-pointer" onClick={() => router.push('/login')}>
                    Back to Sign In
                  </Button>
                </motion.div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4.5">
                  <div className="grid grid-cols-1 gap-3.5">
                    <div className="space-y-1.5">
                      <Label htmlFor="username" className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 ml-0.5">Username</Label>
                      <Input 
                        id="username" 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="johndoe" 
                        required 
                        disabled={loading}
                        className="h-11 bg-background/35 border-border/70 focus-visible:ring-primary/25 rounded-lg transition-all"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 ml-0.5">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com" 
                        required 
                        disabled={loading}
                        className="h-11 bg-background/35 border-border/70 focus-visible:ring-primary/25 rounded-lg transition-all"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 ml-0.5">Password</Label>
                      <div className="relative">
                        <Input 
                          id="password" 
                          type={showPassword ? "text" : "password"} 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required 
                          disabled={loading}
                          className="h-11 bg-background/35 border-border/70 focus-visible:ring-primary/25 rounded-lg transition-all pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={loading}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/75 hover:text-foreground focus:outline-none disabled:opacity-50 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4.5 w-4.5" />
                          ) : (
                            <Eye className="h-4.5 w-4.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs font-bold text-destructive px-3.5 py-2.5 bg-destructive/10 rounded-lg border border-destructive/15"
                    >
                      {error}
                    </motion.div>
                  )}
                  
                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full h-11 text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-[0.98] transition-all rounded-lg cursor-pointer"
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                    {loading ? "Creating..." : "Start Free Trial"}
                  </Button>
                  
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/70" /></div>
                    <div className="relative flex justify-center text-xs uppercase font-black tracking-widest">
                      <span className="bg-card px-3 text-muted-foreground/60">Or</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    type="button"
                    disabled={loading}
                    className="w-full h-11 border-border/80 hover:bg-muted/50 rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                    onClick={handleGoogleRegister}
                  >
                    <FcGoogle className="h-5 w-5" />
                    <span className="text-xs font-bold text-foreground">Continue with Google</span>
                  </Button>
                </form>
              )}
            </CardContent>
            
            <CardFooter className="pb-8 pt-4 flex flex-col items-center gap-3 px-6">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-bold text-primary hover:text-primary/80 transition-colors">
                  Sign in
                </Link>
              </p>
              
              <div className="flex flex-col items-center gap-2">
                <p className="text-[11px] text-muted-foreground/60 text-center px-4 leading-relaxed">
                  By signing up, you agree to our{" "}
                  <Link href="/terms" className="underline hover:text-primary transition-colors">Terms</Link>{" "}
                  &{" "}
                  <Link href="/privacy" className="underline hover:text-primary transition-colors">Privacy</Link>.
                </p>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
