"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
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
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { MoreHorizontal, Search, ShieldAlert, UserCog, UserMinus, Zap } from "lucide-react"
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
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false)

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
          setUsers(data.data)
          setTotalPages(data.pagination.totalPages)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchUsers()
  }, [page, searchQuery])

  const handleUpdatePlan = async (plan: string) => {
    if (!selectedUser) return
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${selectedUser.id}/update-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
        credentials: 'include'
      })
      
      const data = await res.json()
      if (data.success) {
        toast.success(`User plan updated to ${plan}`)
        fetchUsers()
        setIsPlanDialogOpen(false)
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
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">User Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all registered accounts and their performance.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by email or username..." 
            className="pl-9 bg-card/50 border-border/40"
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
              <TableHead className="font-bold text-center">Topics</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="font-bold">Joined</TableHead>
              <TableHead className="w-[80px]"></TableHead>
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
                        {user.role === 'admin' && <Badge variant="outline" className="text-[10px] h-4 px-1 uppercase border-primary/40 text-primary">Admin</Badge>}
                      </span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.plan === 'PRO' ? 'default' : 'secondary'} className="font-black uppercase tracking-widest text-[10px]">
                      {user.plan}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-bold">{user._count.products}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isSuspended ? (
                        <Badge variant="destructive" className="text-[10px] uppercase font-black tracking-widest">Suspended</Badge>
                      ) : user.isScanning ? (
                        <span className="text-xs text-success font-bold flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" /> 
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
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="cursor-pointer gap-2"
                          onClick={() => {
                            setSelectedUser(user)
                            setIsPlanDialogOpen(true)
                          }}
                        >
                          <Zap className="w-4 h-4 text-primary" /> Change Plan
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="cursor-pointer gap-2"
                          onClick={() => handleToggleStatus(user)}
                        >
                          <UserCog className="w-4 h-4" /> {isSuspended ? "Activate Account" : "Suspend Account"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                          onClick={() => {
                            setSelectedUser(user)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <UserMinus className="w-4 h-4" /> Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

      {/* Plan Update Dialog */}
      <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update User Plan</DialogTitle>
            <DialogDescription>
              Modify the subscription tier for <strong>{selectedUser?.username}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button 
              variant={selectedUser?.plan === 'FREE' ? 'default' : 'outline'} 
              className="w-full"
              onClick={() => handleUpdatePlan('FREE')}
            >
              FREE Plan
            </Button>
            <Button 
              variant={selectedUser?.plan === 'PRO' ? 'default' : 'outline'} 
              className="w-full"
              onClick={() => handleUpdatePlan('PRO')}
            >
              PRO Plan
            </Button>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button type="button" variant="secondary" onClick={() => setIsPlanDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
