"use client"

import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
 
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PROJECT_NAME, API_URL } from "@/lib/constants"
import { Logo } from "@/components/logo"
 
function VerifyEmailLogic() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const token = searchParams.get("token")
 
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
 
  useEffect(() => {
    if (!token) {
      setError("Invalid or missing verification link.")
      setLoading(false)
      return
    }
 
    const verify = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
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
  }, [token, router])
 
  return (
    <div className="text-center">
      {loading ? (
        <div className="flex flex-col items-center space-y-4 py-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-lg text-foreground tracking-tight">Verifying Link</h3>
            <p className="text-muted-foreground text-xs font-medium">Validating your cryptographic security token...</p>
          </div>
        </div>
      ) : success ? (
        <div className="space-y-6 py-2">
          <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center border border-success/20">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <div className="space-y-2">
            <h3 className="font-black text-xl text-foreground tracking-tight">Email Verified</h3>
            <p className="text-muted-foreground text-sm font-medium leading-relaxed">
              Your account is successfully unlocked. <br /> Redirecting you to login...
            </p>
          </div>
          <Link href="/login" className="block w-full">
            <Button className="w-full h-11 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 rounded-sm">
              Login Manually
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6 py-2">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center border border-destructive/20">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h3 className="font-black text-xl text-foreground tracking-tight">Verification Failed</h3>
            <p className="text-muted-foreground text-sm font-medium leading-relaxed">
              {error || "This link has expired or is invalid."}
            </p>
          </div>
          <Link href="/login" className="block w-full">
            <Button variant="outline" className="w-full h-11 text-xs font-black uppercase tracking-widest border-border/60 rounded-sm">
              Return to Sign In
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
 
export default function VerifyEmailClient() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="relative z-10 w-full max-w-md">
        <Card className="border-border/60 shadow-2xl bg-card rounded-md overflow-hidden">
          <CardHeader className="space-y-4 pb-3 pt-6 text-center">
            <div className="flex flex-col items-center">
              <Link href="/" className="group flex items-center gap-2.5">
                <Logo size={40} className="shrink-0" />
                <span className="font-black text-2xl tracking-tighter text-foreground">{PROJECT_NAME}</span>
              </Link>
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl font-black tracking-tight">Email Verification</CardTitle>
              <CardDescription className="text-sm">
                Authenticating your access to the workspace.
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="pb-8">
            <Suspense fallback={
              <div className="flex flex-col items-center space-y-4 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Securing Context...</p>
              </div>
            }>
              <VerifyEmailLogic />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
