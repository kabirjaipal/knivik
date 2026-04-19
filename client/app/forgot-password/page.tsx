"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, CheckCircle2, Radar, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { PROJECT_NAME } from "@/lib/constants"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const response = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to process request")
      }

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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(var(--primary-rgb),0.07),transparent_70%)] blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-[400px] animate-in fade-in zoom-in-95 duration-500">
        <Card className="border-border/40 shadow-2xl bg-card/80 backdrop-blur-xl rounded-2xl overflow-hidden">
          <CardHeader className="space-y-4 pb-4 pt-6 text-center">
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
              <CardTitle className="text-xl font-black tracking-tight">Forgot password?</CardTitle>
              <CardDescription className="text-sm">
                No worries, we'll send you reset instructions.
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="pb-4">
            {success ? (
              <div className="bg-success/5 border border-success/20 rounded-xl p-6 flex flex-col items-center text-center space-y-3 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success mb-1">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="font-black text-lg text-foreground tracking-tight">Check your inbox</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  We've sent a password reset link to <span className="text-foreground font-semibold">{email}</span>. Please check your email.
                </p>
                <Button variant="outline" size="sm" className="mt-2 rounded-xl font-bold" onClick={() => router.push('/login')}>
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
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

                {error && (
                  <div className="text-xs font-bold text-destructive px-3 py-2 bg-destructive/10 rounded-xl border border-destructive/20 animate-in shake duration-300">
                    {error}
                  </div>
                )}
                
                <Button type="submit" disabled={loading} className="w-full h-11 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all rounded-xl">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            )}
          </CardContent>
          
          <CardFooter className="pb-6 pt-5 flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link href="/login" className="font-bold text-primary hover:text-primary/80 transition-colors">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
