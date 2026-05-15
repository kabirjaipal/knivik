"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, Users, ArrowUpRight, ArrowDownRight, CreditCard } from "lucide-react"

interface RevenueStats {
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  mrr: number;
  activeSubscribers: number;
  recentPayments: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
    user: {
      username: string;
      email: string;
    }
  }>;
}

export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenueStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/revenue`, { credentials: 'include' })
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-foreground">Revenue & Subscriptions</h1>
        <p className="text-sm text-muted-foreground mt-1">Financial performance, infrastructure cost deduction, and profit oversight.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-primary">Monthly Recurring</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">${data?.mrr.toFixed(2)}</div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-success mt-1 uppercase">
              <ArrowUpRight className="w-3 h-3" /> Growth stable
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Gross Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">${data?.totalRevenue.toFixed(2)}</div>
            <div className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-wider">All-time processed</div>
          </CardContent>
        </Card>

        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-destructive">Infra Cost (LLMs)</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-destructive">${data?.totalCost?.toFixed(4)}</div>
            <div className="text-[10px] font-bold text-destructive/80 mt-1 uppercase tracking-wider">API input/output usage</div>
          </CardContent>
        </Card>

        <Card className="border-success/30 bg-success/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-success">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-success">${data?.netProfit?.toFixed(2)}</div>
            <div className="text-[10px] font-bold text-success/80 mt-1 uppercase tracking-wider">Gross minus infrastructure</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/40 overflow-hidden">
        <CardHeader className="border-b border-border/40">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/10 hover:bg-muted/10">
              <TableHead className="font-bold">Customer</TableHead>
              <TableHead className="font-bold">Amount</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="font-bold text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.recentPayments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{payment.user.username}</span>
                    <span className="text-[10px] text-muted-foreground italic truncate max-w-[200px]">{payment.user.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-black text-foreground">${payment.amount.toFixed(2)}</span>
                  <span className="text-[10px] text-muted-foreground ml-1 uppercase">{payment.currency}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'} className="font-black uppercase tracking-widest text-[9px]">
                    {payment.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-[10px] text-muted-foreground font-mono">
                  {new Date(payment.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data?.recentPayments.length === 0 && (
          <div className="p-12 text-center text-muted-foreground italic">
            No payments recorded yet.
          </div>
        )}
      </Card>
    </div>
  )
}
