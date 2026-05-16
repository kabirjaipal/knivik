"use client"

import { Activity, Flame, BarChart2, CheckCircle2, Twitter, Rss, Hash, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import type { LeadCardData } from "./LeadCard"

interface ProductStatsProps {
  leads: LeadCardData[]
}

export function ProductStats({ leads }: ProductStatsProps) {
  const [expanded, setExpanded] = useState(false)

  const total = leads.length
  const highIntent = leads.filter(l => l.intentScore >= 80).length
  const buyNow = leads.filter(l => l.intentLevel === 'BUY_NOW').length
  const converted = leads.filter(l => l.status === 'CONVERTED').length
  const avgScore = total > 0
    ? Math.round(leads.reduce((s, l) => s + l.intentScore, 0) / total)
    : 0

  const byPlatform = {
    REDDIT: leads.filter(l => l.platform === 'REDDIT').length,
    HACKERNEWS: leads.filter(l => l.platform === 'HACKERNEWS').length,
    TWITTER: leads.filter(l => l.platform === 'TWITTER').length,
  }
  const byIntent = {
    BUY_NOW: buyNow,
    COMPARING: leads.filter(l => l.intentLevel === 'COMPARING').length,
    RESEARCHING: leads.filter(l => l.intentLevel === 'RESEARCHING').length,
    LOW_INTENT: leads.filter(l => l.intentLevel === 'LOW_INTENT').length,
  }

  return (
    <div className="border border-border/40 rounded-xl bg-card overflow-hidden mb-4">
      {/* ── Compact single-row stat strip ─────────────────────────────────── */}
      <div className="flex items-center gap-0 divide-x divide-border/40">
        {([
          { label: 'Signals', value: total, icon: Activity, color: 'text-primary' },
          { label: 'High Intent', value: highIntent, icon: Flame, color: 'text-destructive' },
          { label: 'Buy Now', value: buyNow, icon: Flame, color: 'text-orange-500' },
          { label: 'Avg Score', value: avgScore, icon: BarChart2, color: 'text-primary' },
          { label: 'Converted', value: converted, icon: CheckCircle2, color: 'text-success' },
        ] as const).map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex-1 flex flex-col items-center py-3 px-2 min-w-0">
            <span className={`text-lg font-black ${color}`}>{value}</span>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 mt-0.5 truncate">{label}</span>
          </div>
        ))}

        {/* Toggle button */}
        {total > 0 && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="px-3 py-3 flex flex-col items-center justify-center text-muted-foreground/40 hover:text-primary transition-colors self-stretch">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span className="text-xs uppercase tracking-widest mt-0.5">More</span>
          </button>
        )}
      </div>

      {/* ── Expandable breakdown ───────────────────────────────────────────── */}
      {expanded && total > 0 && (
        <div className="grid sm:grid-cols-2 gap-px border-t border-border/40 bg-border/20 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Platform */}
          <div className="bg-card p-4 space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/40">Platform</p>
            {([
              { key: 'REDDIT', label: 'Reddit', icon: Rss, bar: 'bg-orange-500/80' },
              { key: 'HACKERNEWS', label: 'HackerNews', icon: Hash, bar: 'bg-amber-500/80' },
              { key: 'TWITTER', label: 'Twitter', icon: Twitter, bar: 'bg-sky-500/80' },
            ] as const).map(({ key, label, icon: Icon, bar }) => {
              const count = byPlatform[key]
              const pct = Math.round((count / total) * 100)
              return (
                <div key={key} className="space-y-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-foreground/60 font-medium">
                      <Icon className="w-4 h-4" />{label}
                    </span>
                    <span className="font-bold text-muted-foreground tabular-nums">{count} <span className="text-muted-foreground/40">({pct}%)</span></span>
                  </div>
                  <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Intent */}
          <div className="bg-card p-4 space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/40">Intent</p>
            {([
              { key: 'BUY_NOW', label: 'Buy Now 🔥', bar: 'bg-destructive/80' },
              { key: 'COMPARING', label: 'Comparing', bar: 'bg-primary/80' },
              { key: 'RESEARCHING', label: 'Researching', bar: 'bg-primary/40' },
              { key: 'LOW_INTENT', label: 'Low Intent', bar: 'bg-muted-foreground/30' },
            ] as const).map(({ key, label, bar }) => {
              const count = byIntent[key]
              const pct = Math.round((count / total) * 100)
              return (
                <div key={key} className="space-y-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground/60 font-medium">{label}</span>
                    <span className="font-bold text-muted-foreground tabular-nums">{count} <span className="text-muted-foreground/40">({pct}%)</span></span>
                  </div>
                  <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
