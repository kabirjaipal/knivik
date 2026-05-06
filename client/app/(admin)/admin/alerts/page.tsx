"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, Mail, Slack, Info, Clock, User } from "lucide-react"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { AdminPagination } from "@/components/admin/admin-pagination"

interface AlertLog {
  id: string;
  channel: string;
  status: string;
  errorMessage: string | null;
  sentAt: string;
  lead: {
    title: string | null;
    intentScore: number;
  };
  alertSetting: {
    user: {
      username: string;
      email: string;
    }
  }
}

export default function AdminAlertsPage() {
  const [logs, setLogs] = useState<AlertLog[]>([])
  const [loading, setLoading] = useState(true)
  
  // Pagination state
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setLoading(true)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/alerts?page=${page}&limit=20`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLogs(data.data)
          setTotalPages(data.pagination.totalPages)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [page])

  if (loading && logs.length === 0) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Alert Delivery Logs</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor the health and reliability of user notifications.</p>
      </div>

      <Card className="border-border/40 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="font-bold">User</TableHead>
              <TableHead className="font-bold">Channel</TableHead>
              <TableHead className="font-bold">Lead Details</TableHead>
              <TableHead className="font-bold">Timestamp</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id} className={log.status === 'failed' ? 'bg-destructive/5' : ''}>
                <TableCell>
                  {log.status === 'sent' ? (
                    <Badge variant="outline" className="text-success border-success/30 bg-success/5 gap-1 font-bold uppercase tracking-widest text-[10px]">
                      <CheckCircle2 className="w-3 h-3" /> Sent
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1 font-bold uppercase tracking-widest text-[10px]">
                      <AlertCircle className="w-3 h-3" /> Failed
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{log.alertSetting.user.username}</span>
                    <span className="text-[10px] text-muted-foreground italic truncate max-w-[150px]">{log.alertSetting.user.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {log.channel === 'EMAIL' ? (
                      <Mail className="w-4 h-4 text-primary" />
                    ) : (
                      <Slack className="w-4 h-4 text-primary" />
                    )}
                    <span className="text-xs font-bold">{log.channel}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col max-w-[250px]">
                    <span className="text-xs font-bold truncate">{log.lead.title || "Social Match"}</span>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Score: {log.lead.intentScore}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-[10px] text-muted-foreground font-mono">
                  {new Date(log.sentAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  {log.errorMessage && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive">
                            <Info className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-destructive text-destructive-foreground border-none">
                          <p className="max-w-xs text-xs font-bold">{log.errorMessage}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {logs.length === 0 && !loading && (
          <div className="p-12 text-center text-muted-foreground italic">
            No alert logs found yet. Alerts are triggered by high-intent leads.
          </div>
        )}
      </Card>

      <AdminPagination 
        page={page} 
        totalPages={totalPages} 
        onPageChange={setPage} 
      />
    </div>
  )
}
