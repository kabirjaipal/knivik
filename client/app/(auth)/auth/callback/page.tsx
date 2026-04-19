"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Loader2 } from "lucide-react"

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refresh } = useAuth()

  useEffect(() => {
    const token = searchParams.get("token")
    
    if (token) {
      // Set the token as a first-party cookie on the frontend domain
      // This bypasses third-party cookie blocking issues from cross-domain OAuth
      const isSecure = window.location.protocol === 'https:' ? 'secure;' : ''
      const cookieStr = `token=${token}; path=/; max-age=604800; ${isSecure} samesite=lax`
      
      document.cookie = cookieStr
      
      // Refresh the auth context and redirect
      refresh()
        .then(() => {
          router.push("/dashboard")
        })
        .catch((err) => {
          console.error("[AuthCallback] Refresh failed:", err)
          router.push("/login?error=Refresh+Failed")
        })
    } else {
      console.warn("[AuthCallback] No token found in URL, redirecting to login")
      router.push("/login?error=Authentication+Failed")
    }
  }, [searchParams, router, refresh])

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <h2 className="text-xl font-bold tracking-tight">Completing sign in...</h2>
      <p className="text-muted-foreground text-sm mt-2">Please wait while we log you in safely.</p>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <AuthCallbackContent />
    </Suspense>
  )
}
