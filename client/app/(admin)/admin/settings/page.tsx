"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Shield, Hammer, UserPlus, Cpu, Save, RefreshCcw } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SystemConfig {
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  aiModelVersatile: string;
  aiModelLite: string;
}

interface LlmModel {
  id: string;
  name: string;
}

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [models, setModels] = useState<LlmModel[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [configRes, modelsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/config`, { credentials: 'include' }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/models`, { credentials: 'include' })
      ])
      
      const configData = await configRes.json()
      const modelsData = await modelsRes.json()
      
      if (configData.success) setConfig(configData.data)
      if (modelsData.success) setModels(modelsData.data)
    } catch (err) {
      toast.error("Failed to fetch settings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleUpdate = async (key: string, value: any) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
        credentials: 'include'
      })
      
      const data = await res.json()
      if (data.success) {
        setConfig(prev => prev ? { ...prev, [key]: value } : null)
        toast.success(`Setting '${key}' updated successfully`)
      }
    } catch (err) {
      toast.error("Update failed")
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-foreground">Global System Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure platform behavior and infrastructure defaults.</p>
      </div>

      <div className="grid gap-6">
        {/* Safety & Access */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Access Control
            </CardTitle>
            <CardDescription>Manage platform availability and new user onboarding.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/40">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold flex items-center gap-2">
                  <Hammer className="w-3 h-3" /> Maintenance Mode
                </Label>
                <p className="text-xs text-muted-foreground">Force all non-admin users to a maintenance landing page.</p>
              </div>
              <Button 
                variant={config?.maintenanceMode ? "destructive" : "outline"}
                size="sm"
                onClick={() => handleUpdate('maintenanceMode', !config?.maintenanceMode)}
              >
                {config?.maintenanceMode ? "Enabled" : "Disabled"}
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/40">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold flex items-center gap-2">
                  <UserPlus className="w-3 h-3" /> User Registration
                </Label>
                <p className="text-xs text-muted-foreground">Allow new users to create accounts on the platform.</p>
              </div>
              <Button 
                variant={config?.registrationEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => handleUpdate('registrationEnabled', !config?.registrationEnabled)}
              >
                {config?.registrationEnabled ? "Open" : "Closed"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Infrastructure */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" /> AI Engine Configuration
            </CardTitle>
            <CardDescription>Select default LLM models for different processing tiers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Advanced Model (Insight/Analysis)</Label>
              <Select 
                value={config?.aiModelVersatile} 
                onValueChange={(val) => handleUpdate('aiModelVersatile', val)}
              >
                <SelectTrigger className="bg-muted/30 border-border/40 font-mono text-xs">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map(m => (
                    <SelectItem key={m.id} value={m.id} className="text-xs font-mono">{m.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground italic">Currently active: {config?.aiModelVersatile}</p>
            </div>

            <div className="grid gap-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Lite Model (Classification/Quick Scan)</Label>
              <Select 
                value={config?.aiModelLite} 
                onValueChange={(val) => handleUpdate('aiModelLite', val)}
              >
                <SelectTrigger className="bg-muted/30 border-border/40 font-mono text-xs">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map(m => (
                    <SelectItem key={m.id} value={m.id} className="text-xs font-mono">{m.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground italic">Currently active: {config?.aiModelLite}</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={fetchData}>
            <RefreshCcw className="w-4 h-4" /> Sync from Server
          </Button>
        </div>
      </div>
    </div>
  )
}
