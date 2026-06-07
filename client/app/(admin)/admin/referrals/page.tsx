"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Coins, 
  Users, 
  CreditCard, 
  Loader2, 
  Search, 
  Calendar, 
  DollarSign, 
  ArrowRightLeft, 
  Clock,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { toast } from "sonner"

interface Creator {
  id: string
  username: string
  email: string
  role: string
  createdAt: string
  approvedAt?: string
  referralCode: string | null
  stats: {
    totalSignups: number
    totalConversions: number
    totalEarned: number
    totalPaidOut: number
    unpaidBalance: number
  }
}

interface AdminPayout {
  id: string
  amount: number
  currency: string
  status: 'PENDING' | 'PAID' | 'CANCELLED'
  notes?: string
  createdAt: string
  creator: {
    id: string
    username: string
    email: string
  }
}

export default function AdminReferralsPage() {
  const [payouts, setPayouts] = useState<AdminPayout[]>([])
  const [referralUsers, setReferralUsers] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Payout Dialog Form State
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null)
  const [payoutAmount, setPayoutAmount] = useState("")
  const [payoutNotes, setPayoutNotes] = useState("")
  const [submittingPayout, setSubmittingPayout] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Sheet State for individual payout logs and filters
  const [selectedCreatorForPayouts, setSelectedCreatorForPayouts] = useState<Creator | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [payoutSearch, setPayoutSearch] = useState("")
  const [payoutStatusFilter, setPayoutStatusFilter] = useState("ALL")
  const [payoutSortOrder, setPayoutSortOrder] = useState<"asc" | "desc">("desc")

  const fetchReferralDetails = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const res = await fetch(`${apiUrl}/referrals/admin/payouts`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch referral details')
      const json = await res.json()
      if (json.success) {
        setPayouts(json.payouts || [])
        setReferralUsers(json.creators || [])
      }
    } catch (err: any) {
      toast.error("Failed to load admin referral details.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReferralDetails()
  }, [fetchReferralDetails])

  const handleRecordPayout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCreator) return

    const amountFloat = parseFloat(payoutAmount)
    if (isNaN(amountFloat) || amountFloat <= 0) {
      toast.error("Please enter a valid payout amount.")
      return
    }

    const amountInCents = Math.round(amountFloat * 100)
    setSubmittingPayout(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const res = await fetch(`${apiUrl}/referrals/admin/payouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: selectedCreator.id,
          amount: amountInCents,
          currency: 'USD',
          notes: payoutNotes
        }),
        credentials: 'include'
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to record manual payout")

      toast.success("Manual payout logged successfully!")
      setIsDialogOpen(false)
      setPayoutAmount("")
      setPayoutNotes("")
      setSelectedCreator(null)
      fetchReferralDetails()
    } catch (err: any) {
      toast.error(err.message || "Failed to record payout")
    } finally {
      setSubmittingPayout(false)
    }
  }

  // Compute Platform stats
  const totalPaidOut = referralUsers.reduce((sum, c) => sum + (c.stats?.totalPaidOut || 0), 0)
  const totalUnpaid = referralUsers.reduce((sum, c) => sum + (c.stats?.unpaidBalance || 0), 0)
  const totalConversions = referralUsers.reduce((sum, c) => sum + (c.stats?.totalConversions || 0), 0)
  const totalReferralUsers = referralUsers.length

  const filteredCreators = referralUsers.filter(c => 
    c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatCurrency = (amountInCents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amountInCents / 100)
  }

  // Filter creator payouts in memory based on sheet filters
  const filteredCreatorPayouts = payouts
    .filter(p => p.creator?.id === selectedCreatorForPayouts?.id)
    .filter(p => {
      if (payoutStatusFilter !== "ALL" && p.status !== payoutStatusFilter) return false
      if (payoutSearch && !p.notes?.toLowerCase().includes(payoutSearch.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime()
      const timeB = new Date(b.createdAt).getTime()
      return payoutSortOrder === "desc" ? timeB - timeA : timeA - timeB
    })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <h2 className="text-xl font-black tracking-tight text-foreground border-b border-border/40 pb-4">
        Referrals
      </h2>

      {/* Aggregate Stats */}
      {(() => {
        const stats = [
          { label: 'Settled Payouts', value: formatCurrency(totalPaidOut), icon: <Coins className="w-4 h-4" />, color: 'bg-primary/10 text-primary' },
          { label: 'Unpaid Balance',  value: formatCurrency(totalUnpaid),  icon: <Clock className="w-4 h-4" />,  color: 'bg-warning/10 text-warning' },
          { label: 'Conversions',     value: totalConversions,              icon: <CreditCard className="w-4 h-4" />, color: 'bg-success/10 text-success' },
          { label: 'Creators',        value: totalReferralUsers,            icon: <Users className="w-4 h-4" />,  color: 'bg-accent/10 text-accent' },
        ]
        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map(({ label, value, icon, color }) => (
              <Card key={label} className="border border-border/40 bg-card/60 backdrop-blur-sm shadow-none">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
                    <p className="text-xl font-black text-foreground">{value}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      })()}

      {/* Referral Partner List */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div>
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary" />
              Referral Users List
            </p>
          </div>
          <div className="relative shrink-0 w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/60" />
            <Input
              placeholder="Search creators..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 bg-background border-border/50 h-8 rounded text-xs"
            />
          </div>
        </div>
        <div className="rounded-md border border-border/40 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Creator User</TableHead>
                <TableHead className="font-bold">Code</TableHead>
                <TableHead className="font-bold text-center">Signups</TableHead>
                <TableHead className="font-bold text-center">Conversions</TableHead>
                <TableHead className="font-bold">Total Earned</TableHead>
                <TableHead className="font-bold">Paid Out</TableHead>
                <TableHead className="font-bold">Unpaid Balance</TableHead>
                <TableHead className="text-right font-bold w-64">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCreators.map((creator) => (
                <TableRow key={creator.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        {creator.username}
                        {creator.role === 'admin' && (
                          <Badge variant="outline" className="text-[8px] h-3.5 px-1 uppercase border-primary/40 text-primary">Admin</Badge>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground italic truncate max-w-64">{creator.email}</span>
                      {creator.approvedAt && (
                        <span className="text-[10px] text-muted-foreground/80 mt-0.5">
                          Approved: {new Date(creator.approvedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-3">
                    {creator.referralCode ? (
                      <span className="text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-mono tracking-wider">
                        {creator.referralCode}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-semibold text-sm">
                    {creator.stats?.totalSignups || 0}
                  </TableCell>
                  <TableCell className="text-center font-semibold text-sm">
                    {creator.stats?.totalConversions || 0}
                  </TableCell>
                  <TableCell className="font-semibold text-sm text-foreground">
                    {formatCurrency(creator.stats?.totalEarned || 0)}
                  </TableCell>
                  <TableCell className="font-semibold text-sm text-foreground">
                    {formatCurrency(creator.stats?.totalPaidOut || 0)}
                  </TableCell>
                  <TableCell className="font-semibold text-sm text-warning">
                    {formatCurrency(creator.stats?.unpaidBalance || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-semibold cursor-pointer border-border/50 hover:bg-muted"
                        onClick={() => {
                          setSelectedCreatorForPayouts(creator)
                          setPayoutSearch("")
                          setPayoutStatusFilter("ALL")
                          setIsSheetOpen(true)
                        }}
                      >
                        View Payouts
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-semibold cursor-pointer text-primary border-primary/20 hover:bg-primary/10"
                        onClick={() => {
                          setSelectedCreator(creator)
                          setPayoutAmount(( (creator.stats?.unpaidBalance || 0) / 100 ).toFixed(2))
                          setIsDialogOpen(true)
                        }}
                      >
                        Record Payout
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredCreators.length === 0 && (
            <div className="p-12 text-center text-muted-foreground italic">
              No approved referral users found.
            </div>
          )}
        </div>
      </div>

      {/* Record Payout Dialog Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <form onSubmit={handleRecordPayout}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-1.5 text-base font-bold">
                <DollarSign className="w-5 h-5 text-primary" />
                Record Creator Payout
              </DialogTitle>
              <DialogDescription className="text-xs">
                Log a manual payment for <strong>{selectedCreator?.username}</strong>. This updates their estimated unpaid commission balance history.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="amount" className="text-xs font-semibold">
                  Payout Amount (USD)
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="1.00"
                    placeholder="0.00"
                    className="pl-8 bg-background border-border/50 text-sm h-9"
                    value={payoutAmount}
                    onChange={e => setPayoutAmount(e.target.value)}
                    required
                  />
                </div>
                {selectedCreator && (
                  <p className="text-[10px] text-muted-foreground">
                    Current Unpaid Balance: <span className="font-semibold">{formatCurrency(selectedCreator.stats?.unpaidBalance || 0)}</span>
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes" className="text-xs font-semibold">
                  Reference Notes
                </Label>
                <Textarea
                  id="notes"
                  placeholder="e.g., Sent via PayPal transaction ID ID-12345..."
                  className="min-h-[70px] bg-background border-border/50 text-xs"
                  value={payoutNotes}
                  onChange={e => setPayoutNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="h-9 text-xs"
                onClick={() => setIsDialogOpen(false)}
                disabled={submittingPayout}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 text-xs"
                disabled={submittingPayout}
              >
                {submittingPayout ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                    Recording...
                  </>
                ) : (
                  "Record Payout"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payout History Side Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:w-[40%] max-w-none overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-border/40">
            <SheetTitle className="text-base font-bold flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-primary" />
              Payout History
            </SheetTitle>
            <SheetDescription className="text-xs">
              Recorded manual payments for creator <strong>{selectedCreatorForPayouts?.username}</strong> ({selectedCreatorForPayouts?.email}).
            </SheetDescription>
          </SheetHeader>

          {/* Payout Filters */}
          <div className="px-6 pt-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-[60%]">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/60" />
              <Input
                placeholder="Search notes..."
                value={payoutSearch}
                onChange={e => setPayoutSearch(e.target.value)}
                className="pl-8 bg-background border-border/50 h-8 rounded text-xs w-full"
              />
            </div>
            <div className="w-full sm:w-[35%]">
              <Select value={payoutStatusFilter} onValueChange={setPayoutStatusFilter}>
                <SelectTrigger className="bg-background border-border/50 h-8 rounded text-xs w-full">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PAID">PAID</SelectItem>
                  <SelectItem value="PENDING">PENDING</SelectItem>
                  <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {selectedCreatorForPayouts && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 border border-border/50 rounded-lg">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground">Total Paid Out</span>
                  <div className="text-lg font-black text-foreground">
                    {formatCurrency(selectedCreatorForPayouts.stats?.totalPaidOut || 0)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground">Unpaid Balance</span>
                  <div className="text-lg font-black text-warning">
                    {formatCurrency(selectedCreatorForPayouts.stats?.unpaidBalance || 0)}
                  </div>
                </div>
              </div>
            )}

            <div className="border border-border/40 rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-xs font-bold py-2">Amount</TableHead>
                    <TableHead className="text-xs font-bold py-2">Notes</TableHead>
                    <TableHead 
                      className="text-xs font-bold py-2 text-right cursor-pointer select-none hover:text-foreground transition-colors"
                      onClick={() => setPayoutSortOrder(prev => prev === "desc" ? "asc" : "desc")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Date
                        {payoutSortOrder === "desc" ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronUp className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCreatorPayouts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-xs text-muted-foreground italic">
                        No payouts matching criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCreatorPayouts.map((payout) => (
                      <TableRow key={payout.id} className="hover:bg-muted/10">
                        <TableCell className="font-bold text-xs py-2.5 text-foreground">
                          {formatCurrency(payout.amount)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground py-2.5 max-w-[180px] truncate" title={payout.notes}>
                          {payout.notes || "-"}
                        </TableCell>
                        <TableCell className="text-right text-[10px] text-muted-foreground font-mono py-2.5">
                          {new Date(payout.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
