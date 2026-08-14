"use client"

import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { User, Lock, Save, AlertCircle, Loader2, ShieldCheck, Mail, Sliders, Info, Bell, Zap, MessageSquare, Workflow, Code, Eye, EyeOff, Send, MailCheck } from "lucide-react"
import { useState, useEffect, useCallback, useRef } from "react"
import { FaSlack, FaDiscord } from "react-icons/fa"
import { SiZapier, SiMake } from "react-icons/si"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { API_URL } from "@/lib/constants"

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading, refresh } = useAuth()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState("")
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);

    try {
      const res = await fetch(`${API_URL}/users/me`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: deleteConfirmPassword })
      });

      if (!res.ok) {
        let errMsg = "Failed to delete account";
        try {
          const data = await res.json();
          errMsg = data.error?.message || data.error || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      toast.success("Your account has been deleted successfully.");
      setShowDeleteModal(false);
      setDeleteConfirmPassword("");
      setDeleteConfirmText("");
      await authClient.signOut();
      router.push('/login');
    } catch (err: any) {
      toast.error(err.message || "An error occurred while deleting your account.");
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email || resendCooldown > 0) return
    setResendLoading(true)
    try {
      await authClient.sendVerificationEmail({
        email: user.email,
        callbackURL: `${window.location.origin}/dashboard`,
      })
      toast.success('Verification email sent! Check your inbox.')
      // Start 60s cooldown
      setResendCooldown(60)
      const interval = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) { clearInterval(interval); return 0 }
          return prev - 1
        })
      }, 1000)
    } catch (err: any) {
      toast.error(err.message || 'Failed to send verification email')
    } finally {
      setResendLoading(false)
    }
  }

  const hasFetchedAlerts = useRef(false)
  const lastFetchedUserId = useRef<string | null>(null)

  // Profile State
  const [profileData, setProfileData] = useState({
    username: "",
    fullName: "",
    company: ""
  })
  const [savingProfile, setSavingProfile] = useState(false)

  // Alerts State
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [savingAlerts, setSavingAlerts] = useState(false)
  
  const [alertSettings, setAlertSettings] = useState({
    emailEnabled: false,
    slackEnabled: false,
    slackWebhook: "",
    webhookType: "SLACK",
    emailTarget: "",
    minIntentScore: 85
  })

  const fetchAlertSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/alerts`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch settings')
      const data = await res.json()
      if (data.settings) {
        setAlertSettings({
          emailEnabled: data.settings.emailEnabled ?? false,
          slackEnabled: data.settings.slackEnabled,
          slackWebhook: data.settings.slackWebhook || "",
          webhookType: data.settings.webhookType || "SLACK",
          emailTarget: data.settings.emailTarget || "",
          minIntentScore: data.settings.minIntentScore
        })
      }
    } catch (e: any) {
      toast.error("Could not load alert configuration.")
    } finally {
      setLoadingSettings(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading || !user) return
    
    // Sync profile data from user object
    setProfileData({
      username: user.username || "",
      fullName: (user.metadata?.fullName as string) || "",
      company: (user.metadata?.company as string) || ""
    })

    // Only fetch alerts if identity actually changed or we've never fetched
    if (hasFetchedAlerts.current && lastFetchedUserId.current === user.id) return
    
    hasFetchedAlerts.current = true
    lastFetchedUserId.current = user.id

    fetchAlertSettings()
  }, [user, authLoading, fetchAlertSettings])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/users/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: 'include'
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || "Failed to update password")

      toast.success("Password updated successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)

    try {
      const res = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: profileData.username,
          metadata: {
            fullName: profileData.fullName,
            company: profileData.company
          }
        }),
        credentials: 'include'
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || "Failed to update profile")

      toast.success("Profile updated successfully")
      await refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSaveAlerts = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingAlerts(true)

    try {
      const res = await fetch(`${API_URL}/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(alertSettings)
      })

      if (!res.ok) throw new Error('Failed to update settings')
      toast.success("Alert settings saved successfully.")
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSavingAlerts(false)
    }
  }

  if (loadingSettings) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <h2 className="text-xl font-black tracking-tight text-foreground border-b border-border/40 pb-4">
        Settings
      </h2>

      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {/* Profile Information */}
          <Card className="border border-border/40 overflow-hidden rounded-md bg-card shadow-none py-0 gap-0 ring-0">
            <div className="border-b border-border/40 py-2.5 px-4 bg-muted/5">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-primary/10 rounded-md text-primary">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Profile Information</h3>
                  <p className="text-xs text-muted-foreground">Your account details.</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleUpdateProfile}>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Email Address</Label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 text-muted-foreground/60"><Mail className="w-4 h-4" /></div>
                    <div className="w-full pl-10 pr-3 py-1.5 bg-muted/35 rounded-md border border-border/50 font-medium text-muted-foreground text-sm flex justify-between items-center">
                      <span>{user?.email}</span>
                      {user?.emailVerified ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-md font-medium">
                          <ShieldCheck className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-md font-medium">
                          <AlertCircle className="w-3 h-3" /> Unverified
                        </span>
                      )}
                    </div>
                  </div>
                  {!user?.emailVerified && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-3 py-2 bg-amber-500/5 border border-amber-500/10 rounded-md">
                      <div className="flex items-center gap-2 text-xs text-amber-500">
                        <MailCheck className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-medium text-xs">Check your inbox or resend the verification link.</span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleResendVerification}
                        disabled={resendLoading || resendCooldown > 0}
                        className="w-full sm:w-auto shrink-0 text-xs h-8 px-3 border-amber-500/20 text-amber-500 hover:bg-amber-500/10 gap-1.5 rounded-md"
                      >
                        {resendLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Email'}
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-muted-foreground">Username</Label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 text-muted-foreground/60"><User className="w-4 h-4" /></div>
                    <Input 
                      id="username"
                      value={profileData.username}
                      onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                      className="pl-10 bg-background border-border/60 rounded-md h-9 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium text-muted-foreground">Full Name</Label>
                    <Input 
                      id="fullName"
                      placeholder="John Doe"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                      className="bg-background border-border/60 rounded-md h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-sm font-medium text-muted-foreground">Company</Label>
                    <Input 
                      id="company"
                      placeholder="Acme Corp"
                      value={profileData.company}
                      onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                      className="bg-background border-border/60 rounded-md h-9 text-sm"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border/40 py-2.5 px-4 bg-muted/5">
                <Button type="submit" disabled={savingProfile} className="w-full sm:w-auto h-9 px-4 rounded-md text-sm font-medium">
                  {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Profile
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Security */}
          <Card className="border border-border/40 overflow-hidden rounded-md bg-card shadow-none py-0 gap-0 ring-0">
            <div className="border-b border-border/40 py-2.5 px-4 bg-muted/5">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-primary/10 rounded-md text-primary">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Security</h3>
                  <p className="text-xs text-muted-foreground">Update your password to keep your account secure.</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleUpdatePassword}>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-sm font-medium text-muted-foreground">Current Password</Label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 text-muted-foreground/60"><Lock className="w-4 h-4" /></div>
                    <Input 
                      id="currentPassword" 
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="pl-10 pr-10 bg-background border-border/60 rounded-md h-9 text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(v => !v)}
                      className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium text-muted-foreground">New Password</Label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 text-muted-foreground/60"><Lock className="w-4 h-4" /></div>
                    <Input 
                      id="newPassword" 
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="pl-10 pr-10 bg-background border-border/60 rounded-md h-9 text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(v => !v)}
                      className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-muted-foreground">Confirm New Password</Label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 text-muted-foreground/60"><Lock className="w-4 h-4" /></div>
                    <Input 
                      id="confirmPassword" 
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10 bg-background border-border/60 rounded-md h-9 text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(v => !v)}
                      className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border/40 py-2.5 px-4 bg-muted/5">
                <Button type="submit" disabled={loading} className="w-full sm:w-auto h-9 px-4 rounded-md text-sm font-medium">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Update Password
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Alert Routing */}
        <Card className="border border-border/40 overflow-hidden rounded-md bg-card shadow-none py-0 gap-0 ring-0">
          <div className="border-b border-border/40 py-2.5 px-4 bg-muted/5">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-primary/10 rounded-md text-primary">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Alert Routing</h3>
                <p className="text-xs text-muted-foreground">Configure how radar detects and delivers high-value leads.</p>
              </div>
            </div>
          </div>
          <form onSubmit={handleSaveAlerts}>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-3 bg-background border border-border/60 p-3 rounded-md">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-primary" />
                    <label className="text-sm font-medium text-muted-foreground">Scan Sensitivity Threshold</label>
                  </div>
                  <span className="text-primary text-sm font-semibold bg-primary/10 px-2 py-0.5 rounded-md">{alertSettings.minIntentScore}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="5"
                  value={alertSettings.minIntentScore}
                  onChange={e => setAlertSettings({...alertSettings, minIntentScore: parseInt(e.target.value)})}
                  className="w-full h-1.5 bg-secondary rounded-md appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground font-semibold uppercase tracking-wider px-1">
                  <span>Low (Noisy)</span>
                  <span>High (Precise)</span>
                </div>
                <div className="mt-2 p-2.5 bg-primary/5 border border-primary/10 rounded-md flex gap-2 text-xs text-muted-foreground font-medium">
                   <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                   <span>We recommend 80-90% for the best balance between speed and precision. Scores above 90% are usually direct "where do I buy" questions.</span>
                </div>
              </div>

              <div className={`space-y-3 bg-background border border-border/60 p-3 rounded-md ${!alertSettings.slackEnabled ? 'opacity-70' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <label className="text-sm font-medium text-muted-foreground">
                      Premium Webhooks 
                      <span className="ml-2 text-xs font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-md uppercase tracking-wider">PRO ONLY</span>
                    </label>
                  </div>
                  {user?.plan === 'PRO' ? (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={alertSettings.slackEnabled} onChange={e => setAlertSettings({...alertSettings, slackEnabled: e.target.checked})} />
                      <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:bg-foreground after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-muted-foreground after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  ) : (
                    <div className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1 bg-muted/20 px-2 py-0.5 rounded-md border border-border/40"><Lock className="w-3 h-3 text-muted-foreground/80"/> Locked</div>
                  )}
                </div>
                
                <div className={`space-y-3 ${!alertSettings.slackEnabled || user?.plan !== 'PRO' ? 'hidden' : ''}`}>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Target Platform</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                      {[
                        { id: 'SLACK', name: 'Slack', icon: FaSlack },
                        { id: 'DISCORD', name: 'Discord', icon: FaDiscord },
                        { id: 'ZAPIER', name: 'Zapier', icon: SiZapier },
                        { id: 'MAKE', name: 'Make', icon: SiMake },
                        { id: 'CUSTOM', name: 'Raw JSON', icon: Code }
                      ].map(({ id, name, icon: Icon }) => (
                        <div 
                          key={id}
                          onClick={() => setAlertSettings({...alertSettings, webhookType: id})}
                          className={`px-2.5 py-1.5 border rounded-md flex items-center justify-center gap-1.5 cursor-pointer ${alertSettings.webhookType === id ? 'bg-primary/10 text-primary border-primary' : 'bg-background hover:bg-muted text-muted-foreground border-border'}`}>
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-xs font-semibold tracking-wider uppercase">{name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-muted-foreground">Webhook URL</Label>
                    <Input 
                      placeholder="https://..."
                      value={alertSettings.slackWebhook}
                      onChange={e => setAlertSettings({...alertSettings, slackWebhook: e.target.value})}
                      className="font-mono text-sm bg-background border-border/60 rounded-md h-9"
                    />
                    <p className="text-xs text-muted-foreground px-1 font-medium">
                      {alertSettings.webhookType === 'SLACK' && "We'll send Slack-formatted markdown with intent metrics directly into a channel."}
                      {alertSettings.webhookType === 'DISCORD' && "We'll hit your Discord webhook with rich formatted Embeds."}
                      {alertSettings.webhookType === 'ZAPIER' && "We'll shoot structured JSON data directly into your Zapier Catch Hook."}
                      {alertSettings.webhookType === 'MAKE' && "We'll shoot structured JSON data directly into your Make.com target."}
                      {alertSettings.webhookType === 'CUSTOM' && "We'll transmit a generic JSON POST request for your custom APIs to ingest."}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`space-y-3 bg-background border border-border/60 p-3 rounded-md ${!alertSettings.emailEnabled ? 'opacity-70' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    <label className="text-sm font-medium text-muted-foreground">
                      Email Deliveries 
                      <span className="ml-2 text-xs font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-md uppercase tracking-wider">PRO ONLY</span>
                    </label>
                  </div>
                  {user?.plan !== 'FREE' ? (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={alertSettings.emailEnabled} onChange={e => setAlertSettings({...alertSettings, emailEnabled: e.target.checked})} />
                      <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:bg-foreground after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-muted-foreground after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  ) : (
                    <div className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1 bg-muted/20 px-2 py-0.5 rounded-md border border-border/40"><Lock className="w-3 h-3 text-muted-foreground/80"/> Locked</div>
                  )}
                </div>
                
                <div className={`space-y-1 mt-2 ${!alertSettings.emailEnabled || user?.plan === 'FREE' ? 'hidden' : ''}`}>
                  <Label className="text-sm font-medium text-muted-foreground">Target Email Address</Label>
                  <Input 
                    placeholder={user?.email || "team@yourcompany.com"}
                    value={alertSettings.emailTarget}
                    onChange={e => setAlertSettings({...alertSettings, emailTarget: e.target.value})}
                    className="font-mono text-sm bg-background border-border/60 rounded-md h-9"
                  />
                  <p className="text-xs text-muted-foreground px-1 font-medium">
                    Leave blank to automatically deliver to your primary account email.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-border/40 py-2.5 px-4 bg-muted/5">
              <Button type="submit" disabled={savingAlerts} className="w-full sm:w-auto h-9 px-4 rounded-md text-sm font-medium">
                {savingAlerts ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Alert Config
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Danger Zone */}
        <Card className="border border-destructive/20 overflow-hidden rounded-md bg-destructive/5 shadow-none py-0 gap-0 ring-0">
          <div className="border-b border-destructive/10 py-2.5 px-4">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-destructive/10 rounded-md text-destructive">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-destructive">Danger Zone</h3>
                <p className="text-xs text-destructive/80">Permanent actions for your account.</p>
              </div>
            </div>
          </div>
          <CardContent className="p-4 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              Once you delete your account, all your products, services, leads, and settings will be permanently removed from our active databases. This action cannot be undone.
            </p>
            <Button 
              variant="destructive" 
              className="w-full sm:w-auto h-9 px-4 rounded-md text-sm font-semibold uppercase tracking-wider shadow-none"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteModal} onOpenChange={(open) => {
        if (!open) {
          setShowDeleteModal(false);
          setDeleteConfirmPassword("");
          setDeleteConfirmText("");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-1 bg-destructive/10 rounded-md text-destructive">
                <AlertCircle className="w-4.5 h-4.5" />
              </div>
              <DialogTitle>Delete Account</DialogTitle>
            </div>
            <DialogDescription>
              Permanently delete your account and all associated data.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Once you delete your account, all your products, services, leads, and settings will be permanently removed from our active databases. <strong>This action is irreversible and cannot be undone.</strong>
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="delete-confirm-password" className="text-xs font-semibold text-muted-foreground">
                  Verify Current Password
                </Label>
                <Input
                  id="delete-confirm-password"
                  type="password"
                  value={deleteConfirmPassword}
                  onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="bg-background border-border/60 rounded-md h-9 text-sm"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="delete-confirm-text" className="text-xs font-semibold text-muted-foreground">
                  Confirm email address: <span className="font-bold text-foreground select-all">{user?.email}</span>
                </Label>
                <Input
                  id="delete-confirm-text"
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type your email address to confirm"
                  className="bg-background border-border/60 rounded-md h-9 text-sm"
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={deletingAccount}
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmPassword("");
                setDeleteConfirmText("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deletingAccount || !deleteConfirmPassword || deleteConfirmText !== user?.email}
              onClick={handleDeleteAccount}
              className="uppercase tracking-wider font-bold"
            >
              {deletingAccount ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : null}
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
