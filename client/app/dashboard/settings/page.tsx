"use client"

import { useAuth } from "@/context/auth-context"
import { Navbar } from "@/components/landing/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { User, Lock, Save, AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const res = await fetch(`${apiUrl}/users/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: 'include'
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || "Failed to update password")

      setSuccess("Password updated successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/30">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="space-y-10"
        >
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-foreground">Settings</h1>
            <p className="text-muted-foreground text-lg">Manage your account preferences and security.</p>
          </div>

          <div className="grid gap-8">
            {/* Profile Section */}
            <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Your account details.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid gap-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Username</Label>
                  <div className="px-4 py-3 bg-muted/50 rounded-xl border border-border/50 font-medium text-foreground">
                    {user?.username}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</Label>
                  <div className="px-4 py-3 bg-muted/50 rounded-xl border border-border/50 font-medium text-foreground">
                    {user?.email}
                  </div>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 px-1">
                    <ShieldCheck className="w-3 h-3 text-success" /> Verified Account
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Security Section */}
            <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>Update your password to keep your account secure.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <form onSubmit={handleUpdatePassword}>
                <CardContent className="pt-6 space-y-4">
                  {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in zoom-in duration-300">
                      <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                    </div>
                  )}
                  {success && (
                    <div className="p-4 bg-success/10 border border-success/20 text-success rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in zoom-in duration-300">
                      <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input 
                      id="currentPassword" 
                      type="password" 
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="bg-background border-border/60"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input 
                      id="newPassword" 
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="bg-background border-border/60"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="bg-background border-border/60"
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/10 border-t border-border/40 py-4">
                  <Button type="submit" disabled={loading} className="w-full sm:w-auto min-w-[160px] gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Update Password
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
