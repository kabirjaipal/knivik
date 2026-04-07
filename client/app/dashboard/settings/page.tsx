"use client"

import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { User, Lock, Save, AlertCircle, CheckCircle2, Loader2, ShieldCheck, Slack, Mail, Sliders, Info, Bell, Zap, MessageSquare, Workflow, Code } from "lucide-react"
import { useState, useEffect } from "react"

export default function SettingsPage() {
  const { user, refresh } = useAuth()
  const [activeTab, setActiveTab] = useState<"profile" | "alerts">("profile")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Profile State
  const [profileData, setProfileData] = useState({
    username: "",
    fullName: "",
    company: ""
  })
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)

  // Alerts State
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [savingAlerts, setSavingAlerts] = useState(false)
  const [alertError, setAlertError] = useState<string | null>(null)
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null)
  
  const [alertSettings, setAlertSettings] = useState({
    emailEnabled: false,
    slackEnabled: false,
    slackWebhook: "",
    webhookType: "SLACK",
    emailTarget: "",
    minIntentScore: 70
  })

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || "",
        fullName: user.metadata?.fullName || "",
        company: user.metadata?.company || ""
      })
      fetchAlertSettings()
    }
  }, [user])

  const fetchAlertSettings = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/alerts`, { credentials: 'include' })
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
      console.error(e)
      setAlertError("Could not load alert configuration.")
    } finally {
      setLoadingSettings(false)
    }
  }

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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileError(null)
    setProfileSuccess(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const res = await fetch(`${apiUrl}/users/profile`, {
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

      setProfileSuccess("Profile updated successfully")
      await refresh()
      setTimeout(() => setProfileSuccess(null), 3000)
    } catch (err: any) {
      setProfileError(err.message)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSaveAlerts = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingAlerts(true)
    setAlertError(null)
    setAlertSuccess(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(alertSettings)
      })

      if (!res.ok) throw new Error('Failed to update settings')
      setAlertSuccess("Alert settings saved successfully.")
      setTimeout(() => setAlertSuccess(null), 3000)
    } catch (e: any) {
      setAlertError(e.message)
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
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-black tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground text-lg">Manage your account preferences, security, and alerts.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-12 items-start">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 space-y-1 shrink-0 p-2 border rounded-2xl bg-card">
          <button 
            onClick={() => setActiveTab("profile")} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold ${activeTab === 'profile' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            <User className="w-4 h-4" /> Profile Info
          </button>
          <button 
            onClick={() => setActiveTab("alerts")} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold ${activeTab === 'alerts' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            <Bell className="w-4 h-4" /> Alert Routing
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 w-full space-y-10">
          {activeTab === "profile" && (
            <div className="space-y-8">
              <Card className="border overflow-hidden shadow-none rounded-2xl bg-card">
                <CardHeader>
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
                <form onSubmit={handleUpdateProfile}>
                  <CardContent className="pt-6 pb-8 space-y-6">
                    {profileError && (
                      <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in zoom-in duration-300">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {profileError}
                      </div>
                    )}
                    {profileSuccess && (
                      <div className="p-4 bg-success/10 border border-success/20 text-success rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in zoom-in duration-300">
                        <CheckCircle2 className="w-4 h-4 shrink-0" /> {profileSuccess}
                      </div>
                    )}
                    <div className="grid gap-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</Label>
                      <div className="px-4 py-3 bg-muted/50 rounded-xl border border-border/50 font-medium text-muted-foreground flex justify-between items-center">
                        {user?.email}
                        <div className="flex items-center gap-1.5 px-1 text-[10px] text-success font-bold uppercase">
                          <ShieldCheck className="w-3 h-3" /> Verified
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Username</Label>
                      <Input 
                        id="username"
                        value={profileData.username}
                        onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                        className="bg-background border-border/60 font-medium"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="grid gap-2">
                        <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                        <Input 
                          id="fullName"
                          placeholder="John Doe"
                          value={profileData.fullName}
                          onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                          className="bg-background border-border/60"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="company" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Company</Label>
                        <Input 
                          id="company"
                          placeholder="Acme Corp"
                          value={profileData.company}
                          onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                          className="bg-background border-border/60"
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t border-border/40 py-4">
                    <Button type="submit" disabled={savingProfile} className="w-full sm:w-auto min-w-[160px] gap-2">
                      {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Profile
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              <Card className="border overflow-hidden shadow-none rounded-2xl bg-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle>Security</CardTitle>
                      <CardDescription>Update your password to keep your account secure.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <form onSubmit={handleUpdatePassword}>
                  <CardContent className="pt-6 pb-8 space-y-4">
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
                  <CardFooter className="border-t border-border/40 py-4">
                    <Button type="submit" disabled={loading} className="w-full sm:w-auto min-w-[160px] gap-2">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Update Password
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          )}

          {activeTab === "alerts" && (
            <div>
              <Card className="border overflow-hidden shadow-none rounded-2xl bg-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle>Alert Routing</CardTitle>
                      <CardDescription>Configure how radar detects and delivers high-value signals.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <form onSubmit={handleSaveAlerts}>
                  <CardContent className="pt-6 pb-8 space-y-6">
                    {alertError && (
                      <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in zoom-in duration-300">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {alertError}
                      </div>
                    )}
                    {alertSuccess && (
                      <div className="p-4 bg-success/10 border border-success/20 text-success rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in zoom-in duration-300">
                        <CheckCircle2 className="w-4 h-4 shrink-0" /> {alertSuccess}
                      </div>
                    )}

                    <div className="space-y-4 bg-background/50 p-5 rounded-2xl border border-border/60">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-primary" />
                          <label className="text-sm font-bold text-foreground">Scan Sensitivity Threshold</label>
                        </div>
                        <span className="text-primary text-lg font-black">{alertSettings.minIntentScore}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        step="5"
                        value={alertSettings.minIntentScore}
                        onChange={e => setAlertSettings({...alertSettings, minIntentScore: parseInt(e.target.value)})}
                        className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-widest px-1">
                        <span>Low (Noisy)</span>
                        <span>High (Precise)</span>
                      </div>
                      <div className="mt-4 p-3 bg-primary/5 border border-primary/10 rounded-lg flex gap-3 text-xs text-muted-foreground leading-relaxed">
                         <Info className="w-4 h-4 text-primary shrink-0" />
                         We recommend 70-85% for the best balance between speed and precision. Scores above 90% are usually direct "where do I buy" questions.
                      </div>
                    </div>

                    <div className={`space-y-4 bg-background/50 p-5 rounded-2xl border border-border/60 transition-all duration-300 ${!alertSettings.slackEnabled ? 'opacity-60' : ''}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-primary" />
                          <label className="text-sm font-bold text-foreground">Premium Webhooks <span className="ml-2 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">PRO ONLY</span></label>
                        </div>
                        {user?.plan === 'PRO' ? (
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={alertSettings.slackEnabled} onChange={e => setAlertSettings({...alertSettings, slackEnabled: e.target.checked})} />
                            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        ) : (
                          <div className="text-xs font-bold text-muted-foreground uppercase opacity-50 flex items-center gap-1"><Lock className="w-3 h-3"/> Locked</div>
                        )}
                      </div>
                      
                      <div className={`space-y-5 transition-all duration-300 ${!alertSettings.slackEnabled || user?.plan !== 'PRO' ? 'pointer-events-none hidden opacity-0' : 'opacity-100'}`}>
                        
                        <div className="space-y-3">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target Platform</Label>
                          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                            {[
                              { id: 'SLACK', name: 'Slack', icon: Slack },
                              { id: 'DISCORD', name: 'Discord', icon: MessageSquare },
                              { id: 'ZAPIER', name: 'Zapier', icon: Zap },
                              { id: 'MAKE', name: 'Make', icon: Workflow },
                              { id: 'CUSTOM', name: 'Raw JSON', icon: Code }
                            ].map(({ id, name, icon: Icon }) => (
                              <div 
                                key={id}
                                onClick={() => setAlertSettings({...alertSettings, webhookType: id})}
                                className={`px-3 py-2.5 border rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${alertSettings.webhookType === id ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20' : 'bg-muted/30 hover:bg-muted/60 hover:text-foreground text-muted-foreground border-border/50'}`}>
                                <Icon className={`w-4 h-4 shrink-0 ${alertSettings.webhookType === id ? 'opacity-100' : 'opacity-70'}`} />
                                <span className="text-[11px] font-bold tracking-wider uppercase">{name}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Webhook URL</Label>
                          <Input 
                            placeholder="https://..."
                            value={alertSettings.slackWebhook}
                            onChange={e => setAlertSettings({...alertSettings, slackWebhook: e.target.value})}
                            className="font-mono text-sm bg-background border-border/60"
                          />
                          <p className="text-[11px] text-muted-foreground px-1">
                            {alertSettings.webhookType === 'SLACK' && "We'll send Slack-formatted markdown with intent metrics directly into a channel."}
                            {alertSettings.webhookType === 'DISCORD' && "We'll hit your Discord webhook with rich formatted Embeds."}
                            {alertSettings.webhookType === 'ZAPIER' && "We'll shoot structured JSON data directly into your Zapier Catch Hook."}
                            {alertSettings.webhookType === 'MAKE' && "We'll shoot structured JSON data directly into your Make.com target."}
                            {alertSettings.webhookType === 'CUSTOM' && "We'll transmit a generic JSON POST request for your custom APIs to ingest."}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={`space-y-4 bg-background/50 p-5 rounded-2xl border border-border/60 transition-all duration-300 ${!alertSettings.emailEnabled ? 'opacity-60' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-primary" />
                          <label className="text-sm font-bold text-foreground">Email Deliveries <span className="ml-2 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">STARTER / PRO</span></label>
                        </div>
                        {user?.plan !== 'FREE' ? (
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={alertSettings.emailEnabled} onChange={e => setAlertSettings({...alertSettings, emailEnabled: e.target.checked})} />
                            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        ) : (
                          <div className="text-xs font-bold text-muted-foreground uppercase opacity-50 flex items-center gap-1"><Lock className="w-3 h-3"/> Locked</div>
                        )}
                      </div>
                      
                      <div className={`space-y-2 mt-4 transition-all duration-300 ${!alertSettings.emailEnabled || user?.plan === 'FREE' ? 'pointer-events-none hidden opacity-0' : 'opacity-100'}`}>
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target Email Address</Label>
                        <Input 
                          placeholder={user?.email || "team@yourcompany.com"}
                          value={alertSettings.emailTarget}
                          onChange={e => setAlertSettings({...alertSettings, emailTarget: e.target.value})}
                          className="font-mono text-sm bg-background border-border/60"
                        />
                        <p className="text-[11px] text-muted-foreground px-1">
                          Leave blank to automatically deliver to your primary account email.
                        </p>
                      </div>
                    </div>

                  </CardContent>
                  <CardFooter className="border-t border-border/40 py-4">
                    <Button type="submit" disabled={savingAlerts} className="w-full sm:w-auto min-w-[160px] gap-2">
                      {savingAlerts ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Alert Config
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
