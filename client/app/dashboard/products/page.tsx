"use client"

import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, X, Server, Zap, ChevronRight, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function ProductsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)

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
      const res = await fetch(`${apiUrl}/products`, { credentials: 'include' })
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

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/products`, {
        method: editingProductId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
          negativeKeywords: formData.negativeKeywords.split(',').map(k => k.trim()).filter(k => k),
          competitors: formData.competitors.split(',').map(c => c.trim()).filter(c => c),
          redditSources: formData.redditSources.split(',').map(r => r.trim()).filter(r => r),
          twitterSources: formData.twitterSources.split(',').map(t => t.trim()).filter(t => t),
          ...(editingProductId && { id: editingProductId })
        })
      })

      if (!res.ok) throw new Error('Failed to save product')
      
      // Reset form
      setFormData({
        name: "", description: "", websiteUrl: "", keywords: "",
        negativeKeywords: "", competitors: "", redditSources: "", twitterSources: ""
      })
      setIsCreating(false)
      setEditingProductId(null)
      fetchProducts()
    } catch (e: any) {
      setFormError(e.message)
    }
  }

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure? This will delete all associated leads.')) return

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!res.ok) throw new Error('Failed to delete product')
      fetchProducts()
    } catch (e: any) {
      alert('Failed to delete product: ' + e.message)
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
        
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Product
        </button>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <Card className="mb-8 border-border overflow-hidden">
          <CardHeader className="bg-muted/50 pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-foreground text-lg">{editingProductId ? "Edit Product" : "New Product"}</CardTitle>
              <button 
                onClick={() => { 
                  setIsCreating(false); 
                  setEditingProductId(null); 
                  setFormData({ 
                    name: "", description: "", websiteUrl: "", keywords: "", 
                    negativeKeywords: "", competitors: "", redditSources: "", twitterSources: "" 
                  }); 
                }} 
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <form onSubmit={handleCreateProduct} className="space-y-4">
              {formError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm">
                  {formError}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium text-foreground">Description</label>
                <textarea 
                  required 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  className="w-full border border-input bg-background rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors h-20 resize-none" 
                  placeholder="We help freelancers track sales..." 
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Keywords (comma separated)</label>
                  <input 
                    required 
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

              <div className="flex gap-2 pt-4 border-t border-border">
                <button 
                  type="submit" 
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm font-bold text-sm"
                >
                  {editingProductId ? "Update" : "Create"} Product
                </button>
                <button 
                  type="button" 
                  onClick={() => { 
                    setIsCreating(false); 
                    setEditingProductId(null); 
                    setFormData({ 
                      name: "", description: "", websiteUrl: "", keywords: "", 
                      negativeKeywords: "", competitors: "", redditSources: "", twitterSources: "" 
                    }); 
                  }} 
                  className="border border-input bg-background hover:bg-muted px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Products Grid */}
      {products.length === 0 ? (
        <Card className="border-border">
          <CardContent className="text-center py-12">
            <Server className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No products yet</h3>
            <p className="text-muted-foreground mb-6">Create your first product to start finding leads</p>
            <button 
              onClick={() => setIsCreating(true)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
            >
              Create Product
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <CompactProductCard 
              key={product.id} 
              product={product} 
              onDelete={() => handleDelete(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CompactProductCard({ product, onDelete }: { product: any, onDelete: () => void }) {
  const platforms = Array.from(new Set(product.sources.map((s: any) => s.platform)))
  const router = useRouter()
  
  return (
    <Card className="border-border hover:shadow-lg transition-all duration-300 hover:border-primary/50 group cursor-pointer overflow-hidden bg-card"
      onClick={() => router.push(`/dashboard/products/${product.id}`)}>
      <CardHeader className="pb-3 border-b border-border/40 bg-muted/5 group-hover:bg-primary/5 transition-colors">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors truncate">
              {product.name}
            </h3>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              {product.isActive ? (
                <span className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
                  <span className="font-bold uppercase tracking-wider text-[10px]">Active</span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></div>
                  <span className="font-bold uppercase tracking-wider text-[10px]">Paused</span>
                </span>
              )}
              <span className="opacity-30">•</span>
              <span className="font-medium">{platforms.length} platforms</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {product.description || "No description"}
        </p>
        
        <div className="flex flex-wrap gap-1.5">
          {product.keywords.slice(0, 3).map((k: any) => (
            <span key={k.id} className="text-[10px] font-bold uppercase tracking-wider bg-secondary border border-border/50 px-2 py-0.5 rounded-md text-muted-foreground truncate max-w-[100px]">
              {k.keyword}
            </span>
          ))}
          {product.keywords.length > 3 && (
            <span className="text-[10px] font-bold text-muted-foreground self-center">+{product.keywords.length - 3} more</span>
          )}
        </div>

        {/* AI Search Queries count */}
        {product.searchQueries && product.searchQueries.length > 0 && (
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary bg-primary/5 border border-primary/20 px-2 py-1 rounded-lg w-fit">
            <Zap className="w-3 h-3 fill-current" />
            <span>{product.searchQueries.length} Intelligent Scan Units</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-border/40">
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }} 
            className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
            title="Delete product"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-primary flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
            Dashboard <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
