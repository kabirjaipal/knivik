"use client"

import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Users,
  Coins,
  Copy,
  Check,
  TrendingUp,
  ShieldCheck,
  Loader2,
  Clock,
} from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { notFound } from "next/navigation"

interface CreatorStats {
  totalSignups: number
  totalConversions: number
  unpaidCommissions: number
  paidCommissions: number
}

interface ReferralCode {
  id: string
  code: string
  createdAt: string
}

interface ReferredUser {
  id: string
  username: string
  plan: string
  createdAt: string
}

interface Referral {
  id: string
  code: string
  status: 'SIGNED_UP' | 'CONVERTED'
  createdAt: string
  user: ReferredUser
}

interface Payout {
  id: string
  amount: number
  currency: string
  status: 'PENDING' | 'PAID' | 'CANCELLED'
  notes?: string
  createdAt: string
}

export default function ReferralsPage() {
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<CreatorStats>({
    totalSignups: 0,
    totalConversions: 0,
    unpaidCommissions: 0,
    paidCommissions: 0
  })
  const [codes, setCodes] = useState<ReferralCode[]>([])
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null)

  const fetchReferralStats = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const res = await fetch(`${apiUrl}/referrals/stats`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch referral statistics')
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
        setCodes(data.codes)
        setReferrals(data.referrals)
        setPayouts(data.payouts)
      }
    } catch {
      toast.error("Could not load referral dashboard details.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading || !user) return
    if (user.allowReferrals) {
      fetchReferralStats()
    } else {
      setLoading(false)
    }
  }, [user, authLoading, fetchReferralStats])

  const handleCopyLink = (code: string, id: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    navigator.clipboard.writeText(`${origin}?ref=${code}`)
    setCopiedCodeId(id)
    toast.success("Referral link copied to clipboard!")
    setTimeout(() => setCopiedCodeId(null), 2000)
  }

  const formatCurrency = (amountInCents: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amountInCents / 100)

  if (authLoading || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user?.allowReferrals) {
    notFound()
  }

  const primaryCode = codes[0] ?? null
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div className="space-y-4 pb-8">

      {/* ── Header + Referral Code inline ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-border/40 pb-4">
        {/* Title */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
            Creator Referral Portal
            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-wider bg-success/10 text-success border-success/20">
              Approved
            </Badge>
          </h2>
          <p className="text-xs text-muted-foreground">
            Promote {process.env.NEXT_PUBLIC_PROJECT_NAME} and track your conversions.
          </p>
        </div>

        {/* Referral Code + Copy — compact inline block */}
        {primaryCode && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded font-mono tracking-wider whitespace-nowrap shrink-0">
              {primaryCode.code}
            </span>
            <div className="flex items-center gap-1.5 flex-1">
              <Input
                readOnly
                value={`${origin}?ref=${primaryCode.code}`}
                className="flex-1 w-full bg-muted/30 border-border/50 font-mono h-8 rounded"
              />
              <Button
                size="icon"
                variant="outline"
                className="shrink-0 h-8 w-8 rounded"
                onClick={() => handleCopyLink(primaryCode.code, primaryCode.id)}
              >
                {copiedCodeId === primaryCode.id ? (
                  <Check className="w-3.5 h-3.5 text-success" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
          </div>
        )}

        {!primaryCode && !loading && (
          <p className="text-xs text-muted-foreground italic shrink-0">No referral code assigned yet.</p>
        )}
      </div>

      {/* ── Metric Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border border-border/40 bg-card/60 backdrop-blur-sm shadow-none">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Referrals</span>
              <p className="text-xl font-black text-foreground">{stats.totalSignups}</p>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Users className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-card/60 backdrop-blur-sm shadow-none">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Conversions</span>
              <p className="text-xl font-black text-foreground">{stats.totalConversions}</p>
            </div>
            <div className="p-2 bg-success/10 rounded-lg text-success">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-card/60 backdrop-blur-sm shadow-none">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Unpaid</span>
              <p className="text-xl font-black text-foreground">{formatCurrency(stats.unpaidCommissions)}</p>
            </div>
            <div className="p-2 bg-warning/10 rounded-lg text-warning">
              <Clock className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-card/60 backdrop-blur-sm shadow-none">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Paid Out</span>
              <p className="text-xl font-black text-foreground">{formatCurrency(stats.paidCommissions)}</p>
            </div>
            <div className="p-2 bg-accent/10 rounded-lg text-accent">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Both tables side by side ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Referred Customers */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-foreground">Referred Customers</p>
              <p className="text-[11px] text-muted-foreground">Users who signed up via your link.</p>
            </div>
            <span className="text-[10px] font-semibold bg-muted px-2 py-0.5 rounded border border-border/50">
              {referrals.length} total
            </span>
          </div>
          <div className="rounded-md border border-border/40 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="h-8 px-3 text-[10px] uppercase font-bold text-muted-foreground">User</TableHead>
                  <TableHead className="h-8 px-3 text-[10px] uppercase font-bold text-muted-foreground">Plan</TableHead>
                  <TableHead className="h-8 px-3 text-[10px] uppercase font-bold text-muted-foreground">Status</TableHead>
                  <TableHead className="h-8 px-3 text-[10px] uppercase font-bold text-muted-foreground">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6 text-center text-xs text-muted-foreground font-medium">
                      No referrals recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  referrals.map((ref) => (
                    <TableRow key={ref.id}>
                      <TableCell className="px-3 py-2 font-semibold text-foreground text-sm">{ref.user.username}</TableCell>
                      <TableCell className="px-3 py-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          ref.user.plan === 'PRO'
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'bg-muted text-muted-foreground border border-border/40'
                        }`}>
                          {ref.user.plan}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                          ref.status === 'CONVERTED' ? 'text-success' : 'text-warning'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            ref.status === 'CONVERTED' ? 'bg-success animate-pulse' : 'bg-warning'
                          }`} />
                          {ref.status === 'CONVERTED' ? 'Converted' : 'Signed Up'}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-[11px] text-muted-foreground">
                        {new Date(ref.user.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Payout History */}
        <div>
          <div className="mb-2">
            <p className="text-sm font-semibold text-foreground">Payout History</p>
            <p className="text-[11px] text-muted-foreground">Payouts recorded by the administrator.</p>
          </div>
          <div className="rounded-md border border-border/40 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="h-8 px-3 text-[10px] uppercase font-bold text-muted-foreground">Amount</TableHead>
                  <TableHead className="h-8 px-3 text-[10px] uppercase font-bold text-muted-foreground">Notes</TableHead>
                  <TableHead className="h-8 px-3 text-[10px] uppercase font-bold text-muted-foreground">Status</TableHead>
                  <TableHead className="h-8 px-3 text-[10px] uppercase font-bold text-muted-foreground">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6 text-center text-xs text-muted-foreground font-medium">
                      No payouts recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  payouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="px-3 py-2 font-bold text-foreground">{formatCurrency(payout.amount)}</TableCell>
                      <TableCell className="px-3 py-2 text-xs text-muted-foreground max-w-[140px] truncate" title={payout.notes}>
                        {payout.notes || "—"}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <span className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/20">
                          {payout.status}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-[11px] text-muted-foreground">
                        {new Date(payout.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

      </div>
    </div>
  )
}
