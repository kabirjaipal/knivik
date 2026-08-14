"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle2, Mail } from "lucide-react"
import { toast } from "sonner"
 
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { PROJECT_NAME, API_URL } from "@/lib/constants"
import { Logo } from "@/components/logo"
 
export default function ForgotPasswordClient() {
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
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })
 
      const data = await response.json()
 
      if (!response.ok) {
        throw new Error(data.error || "Failed to process request")
      }
 
      setSuccess(true)
      toast.success("Password reset instructions sent to your email!")
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message || "Failed to send reset link")
    } finally {
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
                <Logo size={40} className="shrink-0" />
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
              <div className="bg-success/5 border border-success/20 rounded-sm p-6 flex flex-col items-center text-center space-y-3">
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
                    className="h-11 bg-background/50 border-border/60 focus:ring-primary focus:border-primary rounded-sm transition-all"
                  />
                </div>

                {error && (
                  <div className="text-xs font-bold text-destructive px-3 py-2 bg-destructive/10 rounded-sm border border-destructive/20">
                    {error}
                  </div>
                )}
                
                <Button type="submit" disabled={loading} className="w-full h-11 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all rounded-sm">
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
