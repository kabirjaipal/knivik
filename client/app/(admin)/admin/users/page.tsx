"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  plan: string;
  isScanning: boolean;
  createdAt: string;
  _count: {
    products: number;
    leads: number;
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setUsers(data.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading users...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">User Directory</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage all registered accounts and their performance.</p>
      </div>

      <Card className="border-border/40">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Scanning</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold">{user.username}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={user.plan === 'PRO' ? 'default' : 'secondary'}>
                    {user.plan}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{user._count.products}</TableCell>
                <TableCell>
                  {user.isScanning ? (
                    <span className="text-xs text-success font-bold flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" /> Active
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Idle</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
