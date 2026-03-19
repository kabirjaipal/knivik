"use client"

import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2, Radar, CheckCircle2, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"

function VerifyEmailLogic() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token || !email) {
      setError("Invalid or missing verification link.")
      setLoading(false)
      return
    }

    const verify = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL
        const response = await fetch(`${apiUrl}/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, token })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Verification failed")
        }

        setSuccess(true)
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    verify()
  }, [email, token, router])

  return (
    <div className="text-center space-y-6">
      {loading ? (
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <h3 className="font-semibold text-lg animate-pulse">Verifying Account...</h3>
          <p className="text-muted-foreground text-sm">Validating your cryptographic token.</p>
        </div>
      ) : success ? (
        <div className="bg-success/10 border border-success/30 rounded-lg p-6 flex flex-col items-center space-y-4 shadow-sm">
          <CheckCircle2 className="h-12 w-12 text-success" />
          <div>
            <h3 className="font-bold text-xl text-foreground">Email Verified!</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Your account is successfully unlocked. Redirecting you to login...
            </p>
          </div>
          <Link href="/login" className="w-full">
            <Button className="w-full font-semibold">Login Manually</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 flex flex-col items-center space-y-4 shadow-sm">
          <XCircle className="h-12 w-12 text-destructive" />
          <div>
            <h3 className="font-bold text-xl text-foreground">Verification Failed</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {error}
            </p>
          </div>
          <Link href="/login" className="w-full mt-4">
            <Button variant="outline" className="w-full font-semibold">Return to Login</Button>
          </Link>
        </div>
      )}
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <div className="w-full max-w-[420px] bg-background p-8 rounded-xl border border-border/50 shadow-sm relative overflow-hidden">
        {/* Decorative Radar background element */}
        <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none">
          <Radar className="w-48 h-48" />
        </div>

        <div className="flex justify-center mb-8 relative z-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-md">
            <Radar className="h-7 w-7 text-primary-foreground" />
          </div>
        </div>

        <div className="relative z-10">
          <Suspense fallback={
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Loading secure context...</p>
            </div>
          }>
            <VerifyEmailLogic />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
