"use client"

import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Plus, Trash2, X, Zap, ChevronRight, Loader2, Radar, Edit, Globe, Package } from "lucide-react"
import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { ConfirmationDialog } from "@/components/dashboard/ConfirmationDialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function ProductsPage() {
  const { user, loading: authLoading } = useAuth()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<any | null>(null)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const hasFetchedProducts = useRef(false)
  const lastFetchedUserId = useRef<string | null>(null)

  // Auto-hide success message - REMOVED since we use sonner now


  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    websiteUrl: "",
    isActive: true,
  })

  const router = useRouter()

  const fetchProducts = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/products`, { 
        credentials: 'include',
        cache: 'no-store'
      })
      if (!res.ok) throw new Error('Failed to fetch products')
      const data = await res.json()
      setProducts(data.products)
    } catch (e: any) {
      toast.error("We couldn't load your products right now. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading || !user) return
    
    // Only fetch if identity actually changed or we've never fetched
    if (hasFetchedProducts.current && lastFetchedUserId.current === user.id) return
    
    hasFetchedProducts.current = true
    lastFetchedUserId.current = user.id

    fetchProducts()
  }, [user, authLoading, fetchProducts])

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const url = editingProductId ? `${apiUrl}/products/${editingProductId}` : `${apiUrl}/products`;
      
      const res = await fetch(url, {
        method: editingProductId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          websiteUrl: formData.websiteUrl,
          isActive: formData.isActive,
        })
      });

      if (!res.ok) {
        let errorMessage = 'Failed to save product';
        try {
          const errData = await res.json();
          errorMessage = errData.error || errorMessage;
        } catch (parseErr) {
          errorMessage = res.statusText || errorMessage;
        }
        toast.error(errorMessage);
        setIsSubmitting(false);
        return; // Exit early without throwing
      }
      
      // Reset form
      const actionLabel = editingProductId ? "Product updated" : "Product created";
      setFormData({
        name: "", description: "", websiteUrl: "", isActive: true
      })
      setIsCreating(false)
      setEditingProductId(null)
      toast.success(actionLabel)
      await fetchProducts()
    } catch (e: any) {
      toast.error("A network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!productToDelete) return
    setIsDeleting(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/products/${productToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!res.ok) throw new Error('Failed to delete product')
      
      toast.success('Product deleted')
      setIsDeleteDialogOpen(false)
      setProductToDelete(null)
      await fetchProducts()
    } catch (e: any) {
      toast.error('Failed to delete product')
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground mt-1">Configure what the AI should look for</p>
        </div>
        
        <Button size={"default"} onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4" /> New Product
        </Button>
      </div>

      {/* Create Sheet */}
      <Sheet open={isCreating} onOpenChange={(open) => {
        // Only update state when sheet is closing
        if (!open) {
          setIsCreating(false);
          setFormData({ 
            name: "", description: "", websiteUrl: "", isActive: true 
          });
        }
      }}>
        <SheetContent side="right" className="w-full sm:max-w-lg lg:max-w-2xl xl:w-1/2 xl:max-w-none border-l p-0">
          <SheetHeader className="border-b shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center border border-primary/20">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-xl font-black tracking-tight">New Product</SheetTitle>
                <SheetDescription className="text-muted-foreground">
                  Create a new product to track
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <div className="p-6">
              <ProductForm 
                formData={formData}
                setFormData={setFormData}
                isSubmitting={isSubmitting}
                isAiLoading={isAiLoading}
                setIsAiLoading={setIsAiLoading}
                formId="create-product-form"
                onSubmit={handleCreateProduct}
              />
            </div>
          </ScrollArea>
          <SheetFooter className="border-t p-4 gap-2 flex-row justify-end">
            <Button 
              type="button"
              size={"default"}
              variant="outline"
              disabled={isSubmitting || isAiLoading}
              onClick={() => {
                setIsCreating(false);
                setFormData({ 
                  name: "", description: "", websiteUrl: "", isActive: true 
                });
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              size={"default"}
              form="create-product-form"
              disabled={isSubmitting || isAiLoading}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Product
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Edit Sheet */}
      <Sheet open={!!editingProductId} onOpenChange={(open) => {
        // Only update state when sheet is closing (not when opening)
        if (!open) {
          setEditingProductId(null);
          setFormData({ 
            name: "", description: "", websiteUrl: "", isActive: true 
          });
        }
      }}>
        <SheetContent side="right" className="w-full sm:max-w-lg lg:max-w-2xl xl:w-1/2 xl:max-w-none border-l p-0">
          <SheetHeader className="border-b shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center border border-primary/20">
                <Edit className="w-5 h-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-xl font-black tracking-tight">Edit Product</SheetTitle>
                <SheetDescription className="text-muted-foreground">
                  Update your product configuration
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <div className="p-6">
              <ProductForm 
                formData={formData}
                setFormData={setFormData}
                isSubmitting={isSubmitting}
                isAiLoading={isAiLoading}
                setIsAiLoading={setIsAiLoading}
                formId="edit-product-form"
                onSubmit={handleCreateProduct}
              />
            </div>
          </ScrollArea>
          <SheetFooter className="border-t p-4 gap-2 flex-row justify-end">
            <Button 
              type="button"
              variant="outline"
              disabled={isSubmitting || isAiLoading}
              onClick={() => {
                setEditingProductId(null);
                setFormData({ 
                  name: "", description: "", websiteUrl: "", isActive: true 
                });
                
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              form="edit-product-form"
              disabled={isSubmitting || isAiLoading}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Update Product
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Products Grid */}
      <div className="space-y-4">
        {products.length === 0 ? (
          <div className="flex justify-center flex-col items-center py-32 bg-muted/5 rounded-xl border border-dashed border-border/40">
            <Radar className="w-12 h-12 text-muted-foreground/20 mb-4" />
            <h3 className="text-xl font-bold text-foreground">No products found</h3>
            <p className="text-muted-foreground mt-1 text-sm text-center max-w-xs">
              Click the "New Product" button above to start scanning for high-intent customer leads.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((product) => (
              <CompactProductCard 
                key={product.id} 
                product={product} 
                onEdit={() => {
                  setEditingProductId(product.id)
                  setFormData({
                    name: product.name,
                    description: product.description || "",
                    websiteUrl: product.websiteUrl || "",
                    isActive: product.isActive ?? true,
                  })
                }}
                onDelete={() => {
                  setProductToDelete(product)
                  setIsDeleteDialogOpen(true)
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog 
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Product?"
        description={
          <>
            Are you sure you want to delete <span className="font-black text-foreground">"{productToDelete?.name}"</span>? 
            This will permanently remove all associated leads, search queries, and historical data. This action cannot be undone.
          </>
        }
        confirmText="Confirm Delete"
        isLoading={isDeleting}
        variant="danger"
      />

      {/* Success Toast removed (now handled by sonner) */}
    </div>
  )
}

interface ProductFormProps {
  formData: {
    name: string;
    description: string;
    websiteUrl: string;
    isActive: boolean;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  isSubmitting: boolean;
  isAiLoading: boolean;
  setIsAiLoading: React.Dispatch<React.SetStateAction<boolean>>;
  formId: string;
  onSubmit: (e: React.FormEvent) => void;
}

function ProductForm({ formData, setFormData, isSubmitting, isAiLoading, setIsAiLoading, formId, onSubmit }: ProductFormProps) {
  return (
    <form id={formId} onSubmit={onSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Product Name</label>
          <input 
            required 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            className="w-full border border-input bg-background rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors" 
            placeholder="e.g. Acme CRM" 
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Website</label>
          <input 
            type="url"
            value={formData.websiteUrl} 
            onChange={e => setFormData({...formData, websiteUrl: e.target.value})} 
            className="w-full border border-input bg-background rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors" 
            placeholder="https://example.com" 
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          Description <span className="text-muted-foreground font-normal text-xs ml-1">(Used by AI to find leads)</span>
        </label>
        <textarea 
          required 
          value={formData.description} 
          onChange={e => setFormData({...formData, description: e.target.value})} 
          className="w-full border border-input bg-background rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors h-28 resize-none" 
          placeholder="We help freelancers track sales and manage invoices effortlessly..." 
        />
      </div>

      <div className="space-y-3 pt-2 border-t border-border/50">
        <label className="block text-sm font-medium text-foreground">Tracking Status</label>
        <div className="flex bg-muted/30 p-1 rounded-lg border border-border/50 w-full sm:max-w-xs">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isActive: true })}
            className={`flex-1 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider py-2 px-3 rounded-md transition-all ${
              formData.isActive 
                ? "bg-background text-success shadow-sm border border-border/50" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Radar className={`w-3.5 h-3.5 ${formData.isActive ? "text-success" : ""}`} />
            Active
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isActive: false })}
            className={`flex-1 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider py-2 px-3 rounded-md transition-all ${
              !formData.isActive 
                ? "bg-background text-foreground shadow-sm border border-border/50" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${!formData.isActive ? "bg-muted-foreground" : "bg-muted-foreground/50"}`}></div>
            Paused
          </button>
        </div>
        <p className="text-xs text-muted-foreground font-medium">
          {formData.isActive ? "The AI will continuously scan for new leads." : "Scanning is paused. No new leads will be found."}
        </p>
      </div>

    </form>
  );
}

function CompactProductCard({ product, onDelete, onEdit }: { product: any, onDelete: () => void, onEdit: () => void }) {
  const leadCount = product._count?.leads ?? 0;
  const isActive = product.isActive;
  
  return (
    <div className="relative bg-card border border-border/40 rounded-3xl p-5 flex flex-col justify-between gap-4 group transition-all hover:border-primary/20 shadow-sm min-w-0">
      
      <div className="space-y-4">
        {/* Header section */}
        <div className="flex justify-between items-start gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-center text-primary group-hover:border-primary/20 transition-colors shrink-0">
              <Package className="w-5.5 h-5.5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <h3 className="text-base font-bold text-foreground tracking-tight truncate" title={product.name}>
                {product.name}
              </h3>
              {product.websiteUrl && (
                <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest truncate">
                  <Globe className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">
                    {product.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0">
            {isActive ? (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 border border-success/20 text-success">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shadow-sm shadow-success/50"></div>
                <span className="text-[9px] font-black uppercase tracking-widest">Live</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/50 border border-border/40 text-muted-foreground/60">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30"></div>
                <span className="text-[9px] font-black uppercase tracking-widest">Paused</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground/60 leading-relaxed font-medium line-clamp-2" title={product.description || ""}>
          {product.description || "No specific detection vectors defined for this product yet."}
        </p>

        {/* Leads block */}
        <Link
          href={`/dashboard/products/${product.id}`}
          className="bg-muted/20 border border-border/40 rounded-xl p-3 flex items-center justify-between group/leads hover:bg-muted/30 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted/40 flex items-center justify-center text-primary/80 shrink-0">
              <Radar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest mb-0.5">Total Leads</p>
              <p className="text-base font-bold text-foreground leading-none">{leadCount}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/20 group-hover/leads:text-primary transition-colors shrink-0" />
        </Link>
      </div>

      {/* Footer / Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/20">
        <div className="flex items-center gap-3.5 shrink-0">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); }} 
            className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground/50 hover:text-foreground transition-colors cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            Edit
          </button>
          <div className="w-px h-3 bg-border/40"></div>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }} 
            className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground/50 hover:text-destructive transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>

        <Link 
          href={`/dashboard/products/${product.id}`}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3.5 py-1.5 rounded-lg font-bold text-[11px] hover:bg-primary/90 transition-all active:scale-95 shadow-md shadow-primary/20 shrink-0 uppercase tracking-wider"
        >
          Open Feed
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}
