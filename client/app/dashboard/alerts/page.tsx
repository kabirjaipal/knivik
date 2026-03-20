"use client"

import { useAuth } from "@/context/auth-context"
import { Navbar } from "@/components/landing/navbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Bell, Slack, Mail, Save, AlertCircle, Info, Sliders } from "lucide-react"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { PROJECT_NAME } from "@/lib/constants"

export default function AlertsPage() {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [settings, setSettings] = useState({
    emailEnabled: true,
    slackEnabled: false,
    slackWebhook: "",
    minIntentScore: 70
  })

  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    } else if (user) {
      fetchSettings()
    }
  }, [user, authLoading, router])

  const fetchSettings = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/alerts`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch settings')
      const data = await res.json()
      if (data.settings) {
        setSettings({
          emailEnabled: data.settings.emailEnabled,
          slackEnabled: data.settings.slackEnabled,
          slackWebhook: data.settings.slackWebhook || "",
          minIntentScore: data.settings.minIntentScore
        })
      }
    } catch (e: any) {
      console.error(e)
      setError("Could not load alert configuration.")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      })

      if (!res.ok) throw new Error('Failed to update settings')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/30 font-sans">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[15%] right-[-10%] w-[45%] h-[45%] bg-primary/10 rounded-full blur-[120px] opacity-60"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <Navbar />
        
        <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
            <h1 className="text-4xl font-black tracking-tighter text-foreground mb-4">
              Alert Routing System
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Configure how the {PROJECT_NAME} engines should notify you when a high-value signal is detected.
            </p>
          </motion.div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5" /> {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl flex items-center gap-3 animate-bounce">
               Settings saved successfully. Your radar is optimized.
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-8">
            <div className="grid gap-6">
              {/* Intent Score Threshold */}
              <Card className="border-border/50 shadow-xl bg-card/60 backdrop-blur-xl overflow-hidden rounded-2xl">
                <CardHeader className="bg-muted/30 pb-4">
                   <div className="flex items-center gap-3">
                     <div className="p-2 bg-primary/10 rounded-lg text-primary">
                       <Sliders className="w-5 h-5" />
                     </div>
                     <CardTitle className="text-xl">Sensitivity Threshold</CardTitle>
                   </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-bold text-foreground">Minimum Intent Score to notify: <span className="text-primary text-lg ml-2">{settings.minIntentScore}%</span></label>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      step="5"
                      value={settings.minIntentScore}
                      onChange={e => setSettings({...settings, minIntentScore: parseInt(e.target.value)})}
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
                </CardContent>
              </Card>

              {/* Discord / Slack Webhook */}
              <Card className="border-border/50 shadow-xl bg-card/60 backdrop-blur-xl overflow-hidden rounded-2xl relative">
                <CardHeader className="bg-muted/30 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                        <Slack className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Instant Messaging</CardTitle>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={settings.slackEnabled} onChange={e => setSettings({...settings, slackEnabled: e.target.checked})} />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </CardHeader>
                <CardContent className={`pt-6 transition-all duration-500 ${!settings.slackEnabled ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                   <div className="space-y-4">
                     <label className="text-sm font-bold text-foreground block">Webhook URL (Slack or Discord)</label>
                     <input 
                       className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-all font-mono text-sm" 
                       placeholder="https://hooks.slack.com/services/..."
                       value={settings.slackWebhook}
                       onChange={e => setSettings({...settings, slackWebhook: e.target.value})}
                     />
                     <p className="text-[11px] text-muted-foreground">
                        Create an "Incoming Webhook" in your Slack App settings or a "Webhook" in Discord Integrations to get this URL.
                     </p>
                   </div>
                </CardContent>
              </Card>

              {/* Email Notifications */}
              <Card className="border-border/50 shadow-xl bg-card/60 backdrop-blur-xl overflow-hidden rounded-2xl">
                 <CardHeader className="bg-muted/30 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Email Alerts</CardTitle>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={settings.emailEnabled} onChange={e => setSettings({...settings, emailEnabled: e.target.checked})} />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </CardHeader>
                <CardContent className={`pt-6 transition-all duration-300 ${!settings.emailEnabled ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                   <p className="text-sm font-medium text-foreground">Notifications will be sent to:</p>
                   <div className="mt-2 text-primary font-bold">{user?.email}</div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center pt-6">
              <button 
                type="submit" 
                disabled={saving}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-12 py-4 rounded-2xl font-black text-lg hover:bg-primary/90 transition-all shadow-[0_10px_30px_rgba(37,99,235,0.4)] hover:shadow-[0_15px_40px_rgba(37,99,235,0.6)] active:scale-95 disabled:opacity-50"
              >
                {saving ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Optimizing Engines...</>
                ) : (
                  <><Save className="w-5 h-5" /> Deploy Alert Config</>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}
