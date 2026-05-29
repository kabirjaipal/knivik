"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Hammer, UserPlus, Cpu, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [models, setModels] = useState<LlmModel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [configRes, modelsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/config`, {
          credentials: "include",
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/models`, {
          credentials: "include",
        }),
      ]);

      const configData = await configRes.json();
      const modelsData = await modelsRes.json();

      if (configData.success) setConfig(configData.data);
      if (modelsData.success) setModels(modelsData.data);
    } catch (err) {
      toast.error("Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdate = async (key: string, value: any) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/config`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value }),
          credentials: "include",
        },
      );

      const data = await res.json();
      if (data.success) {
        setConfig((prev) => (prev ? { ...prev, [key]: value } : null));
        toast.success(`Setting '${key}' updated`);
      }
    } catch (err) {
      toast.error("Update failed");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="">
      <h2 className="text-xl font-black tracking-tight text-foreground border-b border-border/40 pb-4">Global Settings</h2>

      {/* Compact Grid Card adapting fully to standard application theme settings */}
      <div className="bg-background/95 grid md:grid-cols-2 rounded-2xl border border-border/40 overflow-hidden shadow-lg">
        
        {/* Left Side: Access Controls */}
        <div className="p-4 space-y-3.5 border-b md:border-b-0 md:border-r border-border/30">
          <div className="flex items-center gap-2 border-b border-border/10 pb-2">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <h2 className="text-[10px] font-black uppercase tracking-wider text-foreground">
              Access Control
            </h2>
          </div>

          <div className="space-y-2.5">
            {/* Maintenance Mode */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/10 border border-border/5">
              <div className="flex items-center gap-2">
                <Hammer className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-bold text-foreground">Maintenance Mode</span>
                {config?.maintenanceMode && (
                  <Badge variant="destructive" className="text-[8px] font-black uppercase tracking-wider py-0 px-1">Active</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-bold ${config?.maintenanceMode ? "text-destructive" : "text-muted-foreground/60"}`}>
                  {config?.maintenanceMode ? "Active" : "Disabled"}
                </span>
                <Switch
                  checked={config?.maintenanceMode || false}
                  onCheckedChange={(checked) => handleUpdate("maintenanceMode", checked)}
                />
              </div>
            </div>

            {/* User Registration */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/10 border border-border/5">
              <div className="flex items-center gap-2">
                <UserPlus className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-bold text-foreground">User Registration</span>
                <Badge variant={config?.registrationEnabled ? "default" : "outline"} className={`text-[8px] font-black uppercase tracking-wider py-0 px-1 border-none ${config?.registrationEnabled ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>
                  {config?.registrationEnabled ? "Open" : "Closed"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-bold ${config?.registrationEnabled ? "text-emerald-500" : "text-amber-500"}`}>
                  {config?.registrationEnabled ? "Enabled" : "Closed"}
                </span>
                <Switch
                  checked={config?.registrationEnabled || false}
                  onCheckedChange={(checked) => handleUpdate("registrationEnabled", checked)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: AI Models */}
        <div className="p-4 space-y-3.5">
          <div className="flex items-center gap-2 border-b border-border/10 pb-2">
            <Cpu className="w-3.5 h-3.5 text-primary" />
            <h2 className="text-[10px] font-black uppercase tracking-wider text-foreground">
              AI Routing
            </h2>
          </div>

          <div className="space-y-3">
            {/* Advanced Model */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Advanced Model</Label>
                <Badge variant="outline" className="text-[7px] font-mono border-primary/20 text-primary bg-primary/5 py-0 px-1">Insight Tier</Badge>
              </div>
              <Select
                value={config?.aiModelVersatile}
                onValueChange={(val) => handleUpdate("aiModelVersatile", val)}
              >
                <SelectTrigger className="bg-background border-border/40 font-mono text-xs h-8.5 rounded-lg focus:ring-1 focus:ring-primary shadow-sm">
                  <SelectValue placeholder="Select Model" />
                </SelectTrigger>
                <SelectContent className="font-mono text-xs">
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="font-mono text-xs">
                      {m.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lite Model */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Lite Model</Label>
                <Badge variant="outline" className="text-[7px] font-mono border-amber-500/20 text-amber-500 bg-amber-500/5 py-0 px-1">Scan Tier</Badge>
              </div>
              <Select
                value={config?.aiModelLite}
                onValueChange={(val) => handleUpdate("aiModelLite", val)}
              >
                <SelectTrigger className="bg-background border-border/40 font-mono text-xs h-8.5 rounded-lg focus:ring-1 focus:ring-primary shadow-sm">
                  <SelectValue placeholder="Select Model" />
                </SelectTrigger>
                <SelectContent className="font-mono text-xs">
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="font-mono text-xs">
                      {m.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
