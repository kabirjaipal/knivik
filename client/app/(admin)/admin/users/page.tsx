"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog"
import { Search, ShieldAlert, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { AdminPagination } from "@/components/admin/admin-pagination"

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  plan: string;
  isScanning: boolean;
  createdAt: string;
  metadata: any;
  _count: {
    products: number;
    leads: number;
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Pagination state
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Action states
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const fetchUsers = () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: page.toString(),
      search: searchQuery,
      limit: "20"
    })
    
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users?${params}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const sorted = [...data.data].sort((a, b) => {
            if (a.role === "admin" && b.role !== "admin") return -1
            if (a.role !== "admin" && b.role === "admin") return 1
            return 0
          })
          setUsers(sorted)
          setTotalPages(data.pagination.totalPages)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchUsers()
  }, [page, searchQuery])

  const handleUpdatePlan = async (user: User, plan: string) => {
    if (user.plan === plan) return
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${user.id}/update-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
        credentials: 'include'
      })
      
      const data = await res.json()
      if (data.success) {
        toast.success(`Plan for ${user.username} updated to ${plan}`)
        fetchUsers()
      } else {
        toast.error(data.error || "Failed to update plan")
      }
    } catch (err) {
      toast.error("Network error")
    }
  }

  const handleToggleStatus = async (user: User) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${user.id}/toggle-status`, {
        method: 'POST',
        credentials: 'include'
      })
      
      const data = await res.json()
      if (data.success) {
        toast.success(data.suspended ? "User suspended" : "User activated")
        fetchUsers()
      }
    } catch (err) {
      toast.error("Network error")
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      const data = await res.json()
      if (data.success) {
        toast.success("User account deleted permanently")
        fetchUsers()
        setIsDeleteDialogOpen(false)
      } else {
        toast.error(data.error || "Failed to delete user")
      }
    } catch (err) {
      toast.error("Network error")
    }
  }

  if (loading && users.length === 0) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">User Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all registered accounts and their performance.</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground/70" />
          <Input 
            placeholder="Search by email or username..." 
            className="pl-10 h-11 bg-card/45 border-border/40 focus-visible:ring-1 focus-visible:ring-primary/40 rounded-xl text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-border/40 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">User</TableHead>
              <TableHead className="font-bold">Plan</TableHead>
              <TableHead className="font-bold text-center">Products</TableHead>
              <TableHead className="font-bold text-center">Leads</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="font-bold">Joined</TableHead>
              <TableHead className="text-right font-bold w-48">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isSuspended = user.metadata?.suspended === true;
              return (
                <TableRow key={user.id} className={isSuspended ? "opacity-50 grayscale bg-muted/10" : ""}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold flex items-center gap-1.5">
                        {user.username}
                        {user.role === 'admin' && (
                          <Badge variant="outline" className="text-xs h-4 px-1 uppercase border-primary/40 text-primary">Admin</Badge>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
                      <button
                        type="button"
                        onClick={() => handleUpdatePlan(user, 'FREE')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          user.plan === 'FREE'
                            ? "bg-background text-foreground shadow-xs border border-border/10"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Free
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdatePlan(user, 'PRO')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          user.plan === 'PRO'
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Pro
                      </button>
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-center font-bold">{user._count?.products ?? 0}</TableCell>
                  <TableCell className="text-center font-bold">{user._count?.leads ?? 0}</TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isSuspended ? (
                        <Badge variant="destructive" className="text-xs uppercase font-bold">Suspended</Badge>
                      ) : user.isScanning ? (
                        <span className="text-xs text-success font-bold flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse shadow-lg shadow-success/50" /> 
                          Scanning
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Idle</span>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`h-8 text-xs font-semibold cursor-pointer ${
                          isSuspended 
                            ? "text-success hover:text-success/90 hover:bg-success/10 border-success/20" 
                            : "text-warning hover:text-warning/90 hover:bg-warning/10 border-warning/20"
                        }`}
                        onClick={() => handleToggleStatus(user)}
                      >
                        {isSuspended ? "Activate" : "Suspend"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-semibold text-destructive hover:text-destructive/90 hover:bg-destructive/10 border-destructive/20 cursor-pointer"
                        onClick={() => {
                          setSelectedUser(user)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        {users.length === 0 && !loading && (
          <div className="p-12 text-center text-muted-foreground">
            No users found matching your search.
          </div>
        )}
      </Card>

      <AdminPagination 
        page={page} 
        totalPages={totalPages} 
        onPageChange={setPage} 
      />

      {/* Delete Confirmation Alert */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-destructive" />
              Permanent Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedUser?.username}</strong> ({selectedUser?.email})? 
              This action is irreversible and will remove all their products, leads, and settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
