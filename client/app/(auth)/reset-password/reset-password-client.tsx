"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2, Radar, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PROJECT_NAME } from "@/lib/constants"

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  if (!token || !email) {
    return (
      <div className="text-center space-y-4">
        <h3 className="font-semibold text-destructive text-lg">Invalid or Missing Link</h3>
        <p className="text-muted-foreground text-sm">This reset link does not contain a valid security token.</p>
        <Link href="/forgot-password">
          <Button variant="outline" className="mt-4">Request a new link</Button>
        </Link>
      </div>
    )
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters long.")
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const response = await fetch(`${apiUrl}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword: password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password")
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-success/10 border border-success/30 rounded-lg p-6 flex flex-col items-center text-center space-y-3">
        <CheckCircle2 className="h-10 w-10 text-success" />
        <h3 className="font-semibold text-lg">Password Reset Complete</h3>
        <p className="text-muted-foreground text-sm">
          Your security keys have been updated. Redirecting to login...
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleReset} className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">New Password</Label>
        <Input 
          id="password" 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••" 
          required 
          disabled={loading}
          className="h-11 bg-background/50 border-border/60 focus:ring-primary rounded-sm transition-all"
        />
        <p className="text-xs text-muted-foreground font-medium px-1">Must be at least 8 characters long.</p>
      </div>
      
      {error && (
        <div className="text-xs font-bold text-destructive px-3 py-2 bg-destructive/10 rounded-sm border border-destructive/20">
          {error}
        </div>
      )}
      
      <Button type="submit" disabled={loading} className="w-full h-11 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all rounded-sm">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {loading ? "Updating..." : "Update Password"}
      </Button>
    </form>
  )
}

function ResetPasswordHeader() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  
  return (
    <div className="space-y-1">
      <CardTitle className="text-xl font-black tracking-tight">Set New Password</CardTitle>
      <CardDescription className="text-sm">
        Securing account for <span className="font-semibold text-foreground">{email || "your account"}</span>.
      </CardDescription>
    </div>
  )
}

export default function ResetPasswordClient() {
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
            
            <Suspense fallback={<div className="h-20 flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
              <ResetPasswordHeader />
            </Suspense>
          </CardHeader>
          
          <CardContent className="pb-8">
            <Suspense fallback={
              <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            }>
              <ResetPasswordForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
