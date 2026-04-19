"use client"

import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Plus, Trash2, X, Zap, ChevronRight, Loader2, Radar, Edit } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
  const { user } = useAuth()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<any | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)

  // Auto-hide success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    websiteUrl: "",
    keywords: "",
    negativeKeywords: "",
    competitors: "",
    redditSources: "",
    twitterSources: "",
  })

  const router = useRouter()

  useEffect(() => {
    if (user) {
      fetchProducts()
    }
  }, [user])

  const fetchProducts = async () => {
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
      console.error('Failed to fetch products:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
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
          isActive: true,
          keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
          negativeKeywords: formData.negativeKeywords.split(',').map(k => k.trim()).filter(k => k),
          competitors: formData.competitors.split(',').map(c => c.trim()).filter(c => c),
          sources: [
            ...formData.redditSources.split(',').map(r => r.trim()).filter(r => r).map(r => ({ platform: 'REDDIT', identifier: r })),
            ...formData.twitterSources.split(',').map(t => t.trim()).filter(t => t).map(t => ({ platform: 'TWITTER', identifier: t })),
            { platform: 'HACKERNEWS', identifier: 'global' }
          ],
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
        setFormError(errorMessage);
        setIsSubmitting(false);
        return; // Exit early without throwing
      }
      
      // Reset form
      const actionLabel = editingProductId ? "Product updated" : "Product created";
      setFormData({
        name: "", description: "", websiteUrl: "", keywords: "",
        negativeKeywords: "", competitors: "", redditSources: "", twitterSources: ""
      })
      setIsCreating(false)
      setEditingProductId(null)
      setSuccessMessage(actionLabel)
      await fetchProducts()
    } catch (e: any) {
      setFormError("A network error occurred. Please try again.");
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
      
      setSuccessMessage('Product deleted')
      setIsDeleteDialogOpen(false)
      setProductToDelete(null)
      await fetchProducts()
    } catch (e: any) {
      setSuccessMessage('Failed to delete product')
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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground mt-1">Configure what the engines should look for</p>
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
            name: "", description: "", websiteUrl: "", keywords: "", 
            negativeKeywords: "", competitors: "", redditSources: "", twitterSources: "" 
          });
        }
      }}>
        <SheetContent side="right" className="w-full sm:max-w-lg lg:max-w-2xl xl:w-1/2 xl:max-w-none border-l p-0">
          <SheetHeader className="border-b shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
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
                formError={formError}
                isSubmitting={isSubmitting}
                isAiLoading={isAiLoading}
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
                  name: "", description: "", websiteUrl: "", keywords: "", 
                  negativeKeywords: "", competitors: "", redditSources: "", twitterSources: "" 
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
            name: "", description: "", websiteUrl: "", keywords: "", 
            negativeKeywords: "", competitors: "", redditSources: "", twitterSources: "" 
          });
        }
      }}>
        <SheetContent side="right" className="w-full sm:max-w-lg lg:max-w-2xl xl:w-1/2 xl:max-w-none border-l p-0">
          <SheetHeader className="border-b shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
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
                formError={formError}
                isSubmitting={isSubmitting}
                isAiLoading={isAiLoading}
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
                  name: "", description: "", websiteUrl: "", keywords: "", 
                  negativeKeywords: "", competitors: "", redditSources: "", twitterSources: "" 
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
          <div className="flex justify-center flex-col items-center py-24 bg-muted/5 rounded-[40px] border border-dashed border-border/60 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 rounded-3xl bg-primary/5 flex items-center justify-center border border-primary/10 shadow-inner mb-6">
              <Radar className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <h3 className="text-2xl font-black text-foreground tracking-tight">No products yet</h3>
            <p className="text-muted-foreground mt-2 text-base max-w-sm text-center font-medium leading-relaxed">
              Create your first product to start finding high-intent buyers on Social Media.
            </p>
            {!isCreating && (
              <button 
                onClick={() => setIsCreating(true)}
                className="mt-8 flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-2xl hover:bg-primary/90 transition-all font-black shadow-2xl active:scale-95 hover:shadow-primary/20"
              >
                <Plus className="w-5 h-5" /> Start Tracking
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
                    keywords: product.keywords.map((k: any) => k.keyword).join(", "),
                    negativeKeywords: product.negativeKeywords.map((k: any) => k.keyword).join(", "),
                    competitors: product.competitors.map((c: any) => c.name).join(", "),
                    redditSources: product.sources.filter((s: any) => s.platform === 'REDDIT').map((s: any) => s.identifier).join(", "),
                    twitterSources: product.sources.filter((s: any) => s.platform === 'TWITTER').map((s: any) => s.identifier).join(", "),
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

      {/* Floating Success Toast */}
      {successMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-100 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-foreground text-background dark:bg-card dark:text-foreground border border-border/50 shadow-2xl px-6 py-4 rounded-2xl flex items-center gap-4 min-w backdrop-blur-xl">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
               <Zap className="w-5 h-5 fill-current text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-primary leading-none mb-0.5">Success</p>
              <p className="text-xs font-bold opacity-80">{successMessage}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface ProductFormProps {
  formData: {
    name: string;
    description: string;
    websiteUrl: string;
    keywords: string;
    negativeKeywords: string;
    competitors: string;
    redditSources: string;
    twitterSources: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  formError: string | null;
  isSubmitting: boolean;
  isAiLoading: boolean;
  formId: string;
  onSubmit: (e: React.FormEvent) => void;
}

function ProductForm({ formData, setFormData, formError, isSubmitting, isAiLoading, formId, onSubmit }: ProductFormProps) {
  return (
    <form id={formId} onSubmit={onSubmit} className="space-y-4">
      {formError && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm">
          {formError}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Product Name</label>
            <input 
              required 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              className="w-full border border-input bg-background rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors" 
              placeholder="e.g. Acme CRM" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Website</label>
            <input 
              type="url"
              value={formData.websiteUrl} 
              onChange={e => setFormData({...formData, websiteUrl: e.target.value})} 
              className="w-full border border-input bg-background rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors" 
              placeholder="https://example.com" 
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-foreground">Description</label>
            <button
              type="button"
              disabled={!formData.name || !formData.description || isAiLoading || isSubmitting}
              onClick={async () => {
                try {
                  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
                  const res = await fetch(`${apiUrl}/products/analyze`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ name: formData.name, description: formData.description })
                  });
                  if (!res.ok) throw new Error('AI analysis failed');
                  const data = await res.json();
                  const strategy = data.strategy;
                  
                  setFormData({
                    ...formData,
                    keywords: strategy.keywords.join(', '),
                    negativeKeywords: strategy.negativeKeywords.join(', '),
                    competitors: strategy.competitors.join(', '),
                    redditSources: strategy.subreddits.join(', '),
                    twitterSources: strategy.twitterHandles.map((h: string) => h.replace('@', '')).join(', '),
                  });
                } catch (err: any) {
                  // Error handled silently
                }
              }}
              className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 text-primary bg-primary/10 px-2 py-1 rounded-md hover:bg-primary/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isAiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 fill-current" />}
              Magic AI Suggest
            </button>
          </div>
          <textarea 
            required 
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value})} 
            className="w-full border border-input bg-background rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors h-26 resize-none" 
            placeholder="We help freelancers track sales..." 
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Keywords (comma separated)</label>
          <input 
            value={formData.keywords} 
            onChange={e => setFormData({...formData, keywords: e.target.value})} 
            className="w-full border border-input bg-background rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors" 
            placeholder="CRM, customer software, sales tool" 
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Negative Keywords (comma separated)</label>
          <input 
            value={formData.negativeKeywords} 
            onChange={e => setFormData({...formData, negativeKeywords: e.target.value})} 
            className="w-full border border-input bg-background rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors" 
            placeholder="free, open source, cheap" 
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Subreddits (comma separated)</label>
          <input 
            value={formData.redditSources} 
            onChange={e => setFormData({...formData, redditSources: e.target.value})} 
            className="w-full border border-input bg-background rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors" 
            placeholder="startups, saas, entrepreneurship" 
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Twitter Sources (comma separated)</label>
          <input 
            value={formData.twitterSources} 
            onChange={e => setFormData({...formData, twitterSources: e.target.value})} 
            className="w-full border border-input bg-background rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors" 
            placeholder="global" 
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">Competitors (comma separated)</label>
        <input 
          value={formData.competitors} 
          onChange={e => setFormData({...formData, competitors: e.target.value})} 
          className="w-full border border-input bg-background rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors" 
          placeholder="competitor1, competitor2" 
        />
      </div>

    </form>
  );
}

function CompactProductCard({ product, onDelete, onEdit }: { product: any, onDelete: () => void, onEdit: () => void }) {
  const platforms = Array.from(new Set(product.sources.map((s: any) => s.platform)))
  const router = useRouter()
  
  return (
    <Card className="border-border rounded-sm hover:border-primary/50 group cursor-pointer overflow-hidden">
      <CardHeader className="pb-3 border-b border-gray-800">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-base text-foreground truncate tracking-tight">
              {product.name}
            </h3>
            <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-2">
              {product.isActive ? (
                <span className="flex items-center gap-1.5 font-black uppercase tracking-widest text-green-500">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                  Active
                </span>
              ) : (
                <span className="flex items-center gap-1.5 font-black uppercase tracking-widest text-muted-foreground">
                  <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></div>
                  Paused
                </span>
              )}
              <span className="opacity-30">•</span>
              <span className="font-bold">{platforms.length} Platforms</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-medium">
          {product.description || "No description provided."}
        </p>
        
        <div className="flex flex-wrap gap-1.5">
          {product.keywords.slice(0, 3).map((k: any) => (
            <span key={k.id} className="text-[9px] font-black uppercase tracking-widest bg-muted border border-border/40 px-2 py-0.5 rounded text-muted-foreground truncate max-w-[100px]">
              {k.keyword}
            </span>
          ))}
          {product.keywords.length > 3 && (
            <span className="text-[9px] font-black text-muted-foreground/50 self-center">+{product.keywords.length - 3}</span>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex gap-1">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); }} 
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
              title="Edit product"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }} 
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
              title="Delete product"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          <Link 
            href={`/dashboard/products/${product.id}`}
            className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1 transition-all"
          >
            View Signal
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
