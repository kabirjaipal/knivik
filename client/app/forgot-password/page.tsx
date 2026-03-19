"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, CheckCircle2, Radar } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
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
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <Link href="/login" className="absolute top-8 left-8 inline-flex items-center text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to login
      </Link>
      
      <div className="w-full max-w-[400px] space-y-8 bg-background p-8 rounded-xl border border-border/50 shadow-sm">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Radar className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>

        {success ? (
          <div className="bg-success/10 border border-success/30 rounded-lg p-6 flex flex-col items-center text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 text-success" />
            <h3 className="font-semibold text-lg">Check your email</h3>
            <p className="text-muted-foreground text-sm">
              If an account with that email exists, we've sent you a secure link to reset your password.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 text-center">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Forgot Password</h1>
              <p className="text-muted-foreground text-sm">
                Enter your email address and we'll send you a secure link to reset your password.
              </p>
            </div>

            <form onSubmit={handleReset} className="space-y-6">
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
                  className="h-12 px-4 bg-background border-border/60 focus:ring-primary transition-all"
                />
              </div>
              
              {error && (
                <div className="text-sm font-medium text-destructive mt-2 bg-destructive/10 p-3 rounded-md border border-destructive/20">
                  {error}
                </div>
              )}
              
              <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold shadow-sm">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {loading ? "Sending link..." : "Send Reset Link"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
