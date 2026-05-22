"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Brain, DollarSign, Cpu, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface UsageStats {
  totalCost: number;
  statsByModel: Array<{
    modelId: string;
    requestCount: number;
    tokens: number;
    cost: number;
  }>;
  recentLogs: Array<{
    id: string;
    action: string;
    model: string;
    tokens: number;
    cost: number;
    status: string;
    createdAt: string;
  }>;
}

export default function AdminUsagePage() {
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/llm-usage`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setUsage(data.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black">LLM Infrastructure Usage</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time token consumption and estimated OpenAI/Groq costs.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">Estimated Gross Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black text-foreground">${usage?.totalCost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground mt-2">Aggregated across all system models.</p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Model Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {usage?.statsByModel.map((model) => (
              <div key={model.modelId} className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground">{model.modelId}</span>
                  <span className="text-xs text-muted-foreground">{model.requestCount} requests</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-foreground">${model.cost.toFixed(4)}</div>
                  <div className="text-xs text-muted-foreground uppercase font-bold">{model.tokens} tokens</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/40">
        <CardHeader>
          <CardTitle>Recent Telemetry</CardTitle>
          <CardDescription>Live stream of inference logs and individual call costs.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {usage?.recentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between text-sm py-2 border-b border-border/20 last:border-0">
                <div className="flex items-center gap-3">
                  <Badge variant={log.status === 'success' ? 'secondary' : 'destructive'} className="text-xs h-5 px-1.5 uppercase font-bold">
                    {log.status}
                  </Badge>
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground">{log.action}</span>
                    <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleTimeString()} — {log.model}</span>
                  </div>
                </div>
                <div className="text-right font-mono text-xs text-foreground font-bold">
                  +${log.cost.toFixed(6)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
