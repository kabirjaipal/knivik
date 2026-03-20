"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Radar, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PROJECT_NAME } from "@/lib/constants"

export default function RegisterPage() {
  const router = useRouter()
  
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

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
        credentials: "include" // Automatically sets the secure HTTP-only cookie
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create account")
      }

      setSuccess(true)
      // Instead of an auto-redirect, we will let them read the email verification prompt
      // and they can manually click "Sign in" when ready.
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid xl:grid-cols-[1fr_500px] lg:grid-cols-[1fr_450px]">
      
      {/* Left Panel - Registration Form */}
      <div className="flex flex-col items-center justify-center p-8 lg:p-16 bg-background order-2 lg:order-1 relative">
        <Link href="/" className="absolute top-8 left-8 inline-flex items-center text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to home
        </Link>
        
        <div className="w-full max-w-[400px] mt-12 lg:mt-0 space-y-8">
          <div className="flex items-center space-x-2 mb-8 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Radar className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-extrabold text-xl tracking-tight">{PROJECT_NAME}</span>
          </div>

          <div className="space-y-3 text-center sm:text-left">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Create an account</h1>
            <p className="text-muted-foreground text-base">
              Start converting high-intent leads out of thin air. No credit card required.
            </p>
          </div>

          {success ? (
             <div className="bg-success/10 border border-success/30 rounded-lg p-6 flex flex-col items-center text-center space-y-3">
               <CheckCircle2 className="h-10 w-10 text-success" />
               <h3 className="font-semibold text-lg text-foreground">Verify your email address</h3>
               <p className="text-muted-foreground text-sm">We've sent a cryptographic verification link to you. You must click it before you can sign in to your new workspace.</p>
             </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="username" className="text-foreground font-semibold">Username</Label>
                <Input 
                  id="username" 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe" 
                  required 
                  disabled={loading}
                  className="h-12 px-4 bg-background border-border/60 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
              
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
                <Label htmlFor="password" className="text-foreground font-semibold">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  disabled={loading}
                  className="h-12 px-4 bg-background border-border/60 focus:ring-primary focus:border-primary transition-all"
                />
                <p className="text-xs text-muted-foreground mt-1">Must be at least 8 characters long.</p>
              </div>

              {error && (
                <div className="text-sm font-medium text-destructive mt-2 bg-destructive/10 p-3 rounded-md border border-destructive/20">
                  {error}
                </div>
              )}
              
              <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold shadow-sm mt-4">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {loading ? "Creating account..." : "Create Account"}
              </Button>
              
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/80" />
                </div>
                <div className="relative flex justify-center text-xs uppercase font-semibold">
                  <span className="bg-background px-3 text-muted-foreground">
                    Or sign up with
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <Button 
                  variant="outline" 
                  type="button" 
                  disabled={loading} 
                  className="w-full h-12 font-semibold border-border/80 hover:bg-muted/40 transition-colors"
                  onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
                >
                  Continue with Google
                </Button>
              </div>
            </form>
          )}

          <div className="flex flex-col space-y-4 pt-4 text-center">
             <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                Sign in
              </Link>
            </p>
            <p className="text-xs text-muted-foreground mt-4 px-8 leading-relaxed">
              By clicking continue, you agree to our{" "}
              <Link href="/terms" className="underline underline-offset-4 hover:text-primary transition-colors">Terms of Service</Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline underline-offset-4 hover:text-primary transition-colors">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="hidden lg:flex flex-col bg-muted/30 p-12 relative overflow-hidden order-1 lg:order-2 border-l border-border/40">
        <div className="absolute top-8 right-8 flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Radar className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-foreground">{PROJECT_NAME}</span>
        </div>

        <div className="mt-24 space-y-8">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Get started in seconds.
          </h2>
          
          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold shadow-sm">
                1
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Create your account</h3>
                <p className="text-sm text-muted-foreground mt-1">Start your free trial today. No credit card required upfront.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold shadow-sm">
                2
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Add your keywords</h3>
                <p className="text-sm text-muted-foreground mt-1">Tell our AI exactly what your ideal customer is actively complaining about.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold shadow-sm">
                3
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Close deals</h3>
                <p className="text-sm text-muted-foreground mt-1">Sit back while we pipe heavily-vetted leads straight to your inbox.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
