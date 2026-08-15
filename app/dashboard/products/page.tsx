"use client"

import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Plus, Trash2, X, Zap, ChevronRight, Loader2, Radar, Edit, Globe, Package, Briefcase } from "lucide-react"
import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { ConfirmationDialog } from "@/components/dashboard/confirmation-dialog"
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
import { API_URL } from "@/lib/constants"

interface ProductFormData {
  name: string;
  description: string;
  websiteUrl: string;
  isActive: boolean;
  config: {
    customPersona: string;
    negativeKeywords: string[];
    excludedAuthors: string[];
    productType: 'product' | 'service';
  };
}

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

  // Form State
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    websiteUrl: "",
    isActive: true,
    config: {
      customPersona: "",
      negativeKeywords: [],
      excludedAuthors: [],
      productType: "product"
    }
  })

  const router = useRouter()

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/products`, { 
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

    const isService = formData.config.productType === 'service';

    try {
      const url = editingProductId ? `${API_URL}/products/${editingProductId}` : `${API_URL}/products`;
      
      let cleanWebsiteUrl = formData.websiteUrl.trim();
      if (cleanWebsiteUrl === 'https://' || cleanWebsiteUrl === 'http://') {
        cleanWebsiteUrl = '';
      } else if (cleanWebsiteUrl && !/^https?:\/\//i.test(cleanWebsiteUrl)) {
        cleanWebsiteUrl = `https://${cleanWebsiteUrl}`;
      }

      const res = await fetch(url, {
        method: editingProductId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          websiteUrl: cleanWebsiteUrl,
          isActive: formData.isActive,
          config: formData.config,
        })
      });

      if (!res.ok) {
        let errorMessage = isService ? 'Failed to save service' : 'Failed to save product';
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

      const data = await res.json();
      
      // Reset form
      const actionLabel = editingProductId 
        ? (isService ? "Service updated" : "Product updated") 
        : (isService ? "Service created" : "Product created");

      setFormData({
        name: "", 
        description: "", 
        websiteUrl: "", 
        isActive: true,
        config: { 
          customPersona: "", 
          negativeKeywords: [], 
          excludedAuthors: [],
          productType: "product"
        }
      })
      setIsCreating(false)
      const wasEditing = !!editingProductId;
      setEditingProductId(null)
      toast.success(actionLabel)

      if (!wasEditing && data?.product?.id) {
        router.push(`/dashboard/products/${data.product.id}`);
      } else {
        await fetchProducts()
      }
    } catch (e: any) {
      toast.error("A network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!productToDelete) return
    setIsDeleting(true)

    const isService = productToDelete.config?.productType === 'service';

    try {
      const res = await fetch(`${API_URL}/products/${productToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!res.ok) throw new Error(isService ? 'Failed to delete service' : 'Failed to delete product')
      
      toast.success(isService ? 'Service deleted' : 'Product deleted')
      setIsDeleteDialogOpen(false)
      setProductToDelete(null)
      await fetchProducts()
    } catch (e: any) {
      toast.error(isService ? 'Failed to delete service' : 'Failed to delete product')
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
      <div className="flex items-center justify-between gap-4 border-b border-border/40 pb-4">
        <h2 className="text-xl font-black tracking-tight text-foreground">Products & Services</h2>
        
        <Button size={"default"} onClick={() => {
          setFormData({ 
            name: "", description: "", websiteUrl: "", isActive: true,
            config: { customPersona: "", negativeKeywords: [], excludedAuthors: [], productType: "product" }
          });
          setIsCreating(true);
        }}>
          <Plus className="w-4 h-4" /> New Offering
        </Button>
      </div>

      {/* Create Sheet */}
      <Sheet open={isCreating} onOpenChange={(open) => {
        // Only update state when sheet is closing
        if (!open) {
          setIsCreating(false);
          setFormData({ 
            name: "", description: "", websiteUrl: "", isActive: true,
            config: { customPersona: "", negativeKeywords: [], excludedAuthors: [], productType: "product" }
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
                <SheetTitle className="text-xl font-black tracking-tight">
                  {formData.config.productType === 'service' ? 'New Service' : 'New Product'}
                </SheetTitle>
                <SheetDescription className="text-muted-foreground">
                  {formData.config.productType === 'service' 
                    ? 'Create a new service offering to track' 
                    : 'Create a new product to track'}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
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
          </div>
          <SheetFooter className="border-t p-4 gap-2 flex-row justify-end">
            <Button 
              type="button"
              size={"default"}
              variant="outline"
              disabled={isSubmitting || isAiLoading}
              onClick={() => {
                setIsCreating(false);
                setFormData({ 
                  name: "", description: "", websiteUrl: "", isActive: true,
                  config: { customPersona: "", negativeKeywords: [], excludedAuthors: [], productType: "product" }
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
              {formData.config.productType === 'service' ? 'Create Service' : 'Create Product'}
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
            name: "", description: "", websiteUrl: "", isActive: true,
            config: { customPersona: "", negativeKeywords: [], excludedAuthors: [], productType: "product" }
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
                <SheetTitle className="text-xl font-black tracking-tight">
                  {formData.config.productType === 'service' ? 'Edit Service' : 'Edit Product'}
                </SheetTitle>
                <SheetDescription className="text-muted-foreground">
                  {formData.config.productType === 'service' 
                    ? 'Update your service configuration' 
                    : 'Update your product configuration'}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
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
          </div>
          <SheetFooter className="border-t p-4 gap-2 flex-row justify-end">
            <Button 
              type="button"
              variant="outline"
              disabled={isSubmitting || isAiLoading}
              onClick={() => {
                setEditingProductId(null);
                setFormData({ 
                  name: "", description: "", websiteUrl: "", isActive: true,
                  config: { customPersona: "", negativeKeywords: [], excludedAuthors: [], productType: "product" }
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
              {formData.config.productType === 'service' ? 'Update Service' : 'Update Product'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Products Grid */}
      <div className="space-y-4">
        {products.length === 0 ? (
          <div className="flex justify-center flex-col items-center py-32 bg-muted/5 rounded-xl border border-dashed border-border/40">
            <Radar className="w-12 h-12 text-muted-foreground/20 mb-4" />
            <h3 className="text-xl font-bold text-foreground">No offerings found</h3>
            <p className="text-muted-foreground mt-1 text-sm text-center max-w-xs">
              Click the "New Offering" button above to start scanning for high-intent customer leads.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
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
                    config: {
                      customPersona: product.config?.customPersona || "",
                      negativeKeywords: product.config?.negativeKeywords || [],
                      excludedAuthors: product.config?.excludedAuthors || [],
                      productType: product.config?.productType === 'service' ? 'service' : 'product',
                    }
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
        title={productToDelete?.config?.productType === 'service' ? "Delete Service?" : "Delete Product?"}
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
  formData: ProductFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
  isSubmitting: boolean;
  isAiLoading: boolean;
  setIsAiLoading: React.Dispatch<React.SetStateAction<boolean>>;
  formId: string;
  onSubmit: (e: React.FormEvent) => void;
}

function ProductForm({ formData, setFormData, isSubmitting, isAiLoading, setIsAiLoading, formId, onSubmit }: ProductFormProps) {
  const { user } = useAuth()
  const isFreePlan = user?.plan?.toUpperCase() !== "PRO"
  const isService = formData.config.productType === 'service'

  return (
    <form id={formId} onSubmit={onSubmit} className="space-y-6">
      {/* Offering Type Selector */}
      <div className="space-y-2.5">
        <label className="block text-sm font-medium text-foreground">Offering Type</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData({
              ...formData,
              config: { ...formData.config, productType: 'product' }
            })}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
              formData.config.productType === 'product'
                ? "border-primary bg-primary/5 text-primary shadow-sm"
                : "border-border/60 hover:border-border hover:bg-muted/50 text-muted-foreground"
            }`}
          >
            <Package className="w-5 h-5 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-bold leading-tight">Product Offering</div>
              <div className="text-[10px] text-muted-foreground truncate mt-0.5">SaaS, software apps</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFormData({
              ...formData,
              config: { ...formData.config, productType: 'service' }
            })}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
              formData.config.productType === 'service'
                ? "border-primary bg-primary/5 text-primary shadow-sm"
                : "border-border/60 hover:border-border hover:bg-muted/50 text-muted-foreground"
            }`}
          >
            <Briefcase className="w-5 h-5 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-bold leading-tight">Service Offering</div>
              <div className="text-[10px] text-muted-foreground truncate mt-0.5">Freelance, agency, consulting</div>
            </div>
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            {isService ? 'Service Name' : 'Product Name'}
          </label>
          <input 
            required 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            className="w-full border border-input bg-background rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors" 
            placeholder={isService ? "e.g. Video Editing Studio" : "e.g. Acme CRM"} 
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            {isService ? 'Website / Portfolio' : 'Website'}
          </label>
          <div className="flex rounded-sm border border-input bg-background focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-colors overflow-hidden">
            <span className="inline-flex items-center px-3 text-xs font-semibold text-muted-foreground bg-muted/50 border-r border-input select-none font-mono">
              https://
            </span>
            <input 
              type="text"
              value={formData.websiteUrl.replace(/^https?:\/\//i, '')} 
              onChange={e => {
                const raw = e.target.value.trim().replace(/^https?:\/\//i, '');
                setFormData({
                  ...formData, 
                  websiteUrl: raw ? `https://${raw}` : ''
                });
              }} 
              className="w-full bg-transparent px-3 py-2 text-sm focus:outline-none placeholder:text-muted-foreground/50" 
              placeholder="example.com" 
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-foreground">
            Description <span className="text-muted-foreground font-normal text-xs ml-1">(Used by AI to find leads)</span>
          </label>
          <span className={`text-[10px] font-bold transition-colors ${
            formData.description.length >= 2000 ? 'text-destructive animate-pulse' : 'text-muted-foreground'
          }`}>
            {formData.description.length}/2000
          </span>
        </div>
        <textarea 
          required 
          maxLength={2000}
          value={formData.description} 
          onChange={e => setFormData({...formData, description: e.target.value})} 
          className="w-full border border-input bg-background rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors h-28 resize-none" 
          placeholder={isService 
            ? "e.g. We provide professional short-form video editing for YouTube creators and TikTok channels. Focuses on high pacing and animation..."
            : "e.g. We help freelancers track sales and manage invoices effortlessly..."
          } 
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          Exclude Keywords <span className="text-muted-foreground font-normal text-xs ml-1">(Negative Keywords)</span>
        </label>
        <p className="text-xs text-muted-foreground font-medium mb-1">
          Exclude conversations containing any of these terms (comma-separated). Leave empty to automatically generate them using AI.
        </p>
        <textarea 
          value={Array.isArray(formData.config.negativeKeywords) 
            ? formData.config.negativeKeywords.join(", ") 
            : typeof formData.config.negativeKeywords === 'string'
              ? formData.config.negativeKeywords
              : ""
          }
          onChange={e => {
            const keywordsArray = e.target.value.split(",").map(k => k.trim());
            setFormData({
              ...formData,
              config: {
                ...formData.config,
                negativeKeywords: keywordsArray
              }
            });
          }}
          className="w-full border border-input bg-background rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors h-16 resize-none" 
          placeholder={isService ? "e.g. job search, looking for a job, hire me, resume" : "e.g. free, course, job, hiring, tutorial, funny"} 
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          Exclude Authors <span className="text-muted-foreground font-normal text-xs ml-1">(Ignore Users/Bots)</span>
        </label>
        <p className="text-xs text-muted-foreground font-medium mb-1">
          Ignore posts/comments from specific authors or bot accounts (comma-separated).
        </p>
        <textarea 
          value={Array.isArray(formData.config.excludedAuthors) 
            ? formData.config.excludedAuthors.join(", ") 
            : typeof formData.config.excludedAuthors === 'string'
              ? formData.config.excludedAuthors
              : ""
          }
          onChange={e => {
            const authorsArray = e.target.value.split(",").map(a => a.trim());
            setFormData({
              ...formData,
              config: {
                ...formData.config,
                excludedAuthors: authorsArray
              }
            });
          }}
          className="w-full border border-input bg-background rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors h-16 resize-none" 
          placeholder="e.g. AutoModerator, Subreddit-Bot, CompetitorName" 
        />
      </div>

      <div className="space-y-2 pt-2 border-t border-border/50">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-foreground flex items-center gap-1.5">
            Reply Persona / Custom Brand Voice
          </label>
          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
            isFreePlan 
              ? "bg-primary/10 text-primary border border-primary/20" 
              : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
          }`}>
            {isFreePlan ? "Pro Upgrade" : "Active"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground font-medium mb-2">
          Specify the tone, name, and style the AI should use when drafting outreach replies (e.g. "Draft as Josh, founder of Knivik. Keep it helpful, casual, and suggest a meeting link").
        </p>

        {isFreePlan ? (
          <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] pointer-events-none" />
            <textarea
              disabled
              value="Tone: Friendly founder. Goal: Share a helpful tip and invite them to try Knivik."
              className="w-full border border-input bg-muted/50 rounded-sm px-3 py-2 text-sm text-muted-foreground/60 h-20 resize-none opacity-50"
            />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
              <p className="text-xs font-semibold text-foreground/80 max-w-sm leading-normal">
                Unlock custom brand voices, persona matching, and automated draft customization with the Pro Plan.
              </p>
              <Button size="sm" className="w-full sm:w-auto font-black text-xs h-8 bg-primary text-primary-foreground shrink-0" asChild>
                <Link href="/dashboard/billing">Upgrade to Pro</Link>
              </Button>
            </div>
          </div>
        ) : (
          <textarea
            value={formData.config.customPersona || ""}
            onChange={e => setFormData({
              ...formData,
              config: {
                ...formData.config,
                customPersona: e.target.value
              }
            })}
            className="w-full border border-input bg-background rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors h-24 resize-none"
            placeholder={isService 
              ? "e.g. Write from the perspective of Josh, video editing lead. Tone should be friendly, helpful, and suggest a quick review of their current pacing..."
              : "e.g. Write from the perspective of John, the CEO of Acme. Tone should be expert, direct, and helpful. Mention that Acme provides 24/7 client support."
            }
          />
        )}
      </div>

      {/* Tracking Status Selector */}
      <div className="space-y-2.5 pt-2 border-t border-border/50">
        <label className="block text-sm font-medium text-foreground">Tracking Status</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isActive: true })}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
              formData.isActive
                ? "border-success bg-success/5 text-success shadow-sm"
                : "border-border/60 hover:border-border hover:bg-muted/50 text-muted-foreground"
            }`}
          >
            <Radar className={`w-5 h-5 shrink-0 ${formData.isActive ? "text-success" : ""}`} />
            <div className="min-w-0">
              <div className="text-xs font-bold leading-tight">Active Scan</div>
              <div className="text-[10px] text-muted-foreground truncate mt-0.5">Scan continuously for leads</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFormData({ ...formData, isActive: false })}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
              !formData.isActive
                ? "border-muted-foreground/60 bg-muted/20 text-foreground shadow-sm"
                : "border-border/60 hover:border-border hover:bg-muted/50 text-muted-foreground"
            }`}
          >
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <div className={`w-2.5 h-2.5 rounded-full ${!formData.isActive ? "bg-muted-foreground" : "bg-muted-foreground/50"}`} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold leading-tight">Paused Scan</div>
              <div className="text-[10px] text-muted-foreground truncate mt-0.5">Stop finding new leads</div>
            </div>
          </button>
        </div>
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
              {product.config?.productType === 'service' ? (
                <Briefcase className="w-5 h-5" />
              ) : (
                <Package className="w-5 h-5" />
              )}
            </div>
            <div className="space-y-0.5 min-w-0">
              <h3 className="text-base font-bold text-foreground tracking-tight truncate" title={product.name}>
                {product.name}
              </h3>
              {product.websiteUrl && (
                <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground/85 uppercase tracking-widest truncate">
                  <Globe className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">
                    {product.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1.5">
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
              product.config?.productType === 'service'
                ? "bg-teal-500/10 text-teal-600 border-teal-500/20 dark:text-teal-400"
                : "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400"
            }`}>
              {product.config?.productType === 'service' ? 'Service' : 'Product'}
            </span>

            {isActive ? (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 border border-success/20 text-success">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shadow-sm shadow-success/50"></div>
                <span className="text-[9px] font-black uppercase tracking-widest">Live</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/50 border border-border/40 text-muted-foreground/85">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"></div>
                <span className="text-[9px] font-black uppercase tracking-widest">Paused</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed font-medium line-clamp-2" title={product.description || ""}>
          {product.description || "No specific detection vectors defined for this offering yet."}
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
              <p className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-widest mb-0.5">Total Leads</p>
              <p className="text-base font-bold text-foreground leading-none">{leadCount}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover/leads:text-primary transition-colors shrink-0" />
        </Link>
      </div>

      {/* Footer / Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/20">
        <div className="flex items-center gap-3.5 shrink-0">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); }} 
            className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground/85 hover:text-foreground transition-colors cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            Edit
          </button>
          <div className="w-px h-3 bg-border/40"></div>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }} 
            className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground/85 hover:text-destructive transition-colors cursor-pointer"
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
