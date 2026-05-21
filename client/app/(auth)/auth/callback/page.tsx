"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getSession } from "@/lib/auth-client"

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
    }
    
    // Refresh the auth context and redirect
    refresh()
      .then(async () => {
        const session = await getSession()
        const user = session?.data?.user as { role?: string } | undefined
        if (user) {
          if (user.role === 'admin') {
            router.push("/admin")
          } else {
            router.push("/dashboard")
          }
        } else if (token) {
          // If a token was provided but session is still null
          toast.error("We couldn't complete your sign in. Please try again.")
          router.push("/login?error=Refresh+Failed")
        } else {
          // No token and no active session (direct hit to page)
          router.push("/login")
        }
      })
      .catch((err) => {
        toast.error("We couldn't complete your sign in. Please try again.")
        router.push("/login?error=Refresh+Failed")
      })
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
