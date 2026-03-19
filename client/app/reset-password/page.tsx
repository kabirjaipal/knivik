"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Radar, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // Basic guard preventing users from browsing here blindly
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
    <>
      <div className="space-y-3 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Set New Password</h1>
        <p className="text-muted-foreground text-sm">
          Securing account for <span className="font-semibold text-foreground">{email}</span>.
        </p>
      </div>

      <form onSubmit={handleReset} className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="password" className="text-foreground font-semibold">New Password</Label>
          <Input 
            id="password" 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••" 
            required 
            disabled={loading}
            className="h-12 px-4 bg-background border-border/60 focus:ring-primary transition-all"
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
          {loading ? "Updating password..." : "Confirm & Update"}
        </Button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <div className="w-full max-w-[400px] space-y-8 bg-background p-8 rounded-xl border border-border/50 shadow-sm">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Radar className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>

        <Suspense fallback={
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
