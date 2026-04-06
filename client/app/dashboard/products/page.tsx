"use client"

import { useAuth } from "@/context/auth-context"
import { Navbar } from "@/components/landing/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Edit3, X, Server, Zap } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PROJECT_NAME } from "@/lib/constants"

export default function ProductsPage() {
  const { user, loading: authLoading } = useAuth()
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
    if (!authLoading && !user) {
      router.push("/login")
    } else if (user) {
      fetchProducts()
    }
  }, [user, authLoading, router])

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

  const handleEdit = (product: any) => {
    setFormData({
      name: product.name,
      description: product.description,
      websiteUrl: product.websiteUrl || "",
      keywords: product.keywords.map((k: any) => k.keyword).join(', '),
      negativeKeywords: product.negativeKeywords.map((k: any) => k.keyword).join(', '),
      competitors: product.competitors.map((c: any) => c.name).join(', '),
      redditSources: product.sources.filter((s: any) => s.platform === 'REDDIT').map((s: any) => s.identifier).join(', '),
      twitterSources: product.sources.filter((s: any) => s.platform === 'TWITTER').map((s: any) => s.identifier).join(', '),
    })
    setEditingProductId(product.id)
    setIsCreating(true)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 max-w-7xl">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-muted-foreground">Loading...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
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
          <Card className="mb-8 border-border">
            <CardHeader className="bg-card/50">
              <div className="flex justify-between items-center">
                <CardTitle className="text-foreground">{editingProductId ? "Edit Product" : "New Product"}</CardTitle>
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
            <CardContent className="space-y-6">
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
                      className="w-full border border-input bg-background rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors" 
                      placeholder="e.g. Acme CRM" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Website</label>
                    <input 
                      type="url"
                      value={formData.websiteUrl} 
                      onChange={e => setFormData({...formData, websiteUrl: e.target.value})} 
                      className="w-full border border-input bg-background rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors" 
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
                    className="w-full border border-input bg-background rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors h-20 resize-none" 
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
                      className="w-full border border-input bg-background rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors" 
                      placeholder="CRM, customer software, sales tool" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Negative Keywords (comma separated)</label>
                    <input 
                      value={formData.negativeKeywords} 
                      onChange={e => setFormData({...formData, negativeKeywords: e.target.value})} 
                      className="w-full border border-input bg-background rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors" 
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
                      className="w-full border border-input bg-background rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors" 
                      placeholder="startups, saas, entrepreneurship" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Twitter Sources (comma separated)</label>
                    <input 
                      value={formData.twitterSources} 
                      onChange={e => setFormData({...formData, twitterSources: e.target.value})} 
                      className="w-full border border-input bg-background rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors" 
                      placeholder="global" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Competitors (comma separated)</label>
                  <input 
                    value={formData.competitors} 
                    onChange={e => setFormData({...formData, competitors: e.target.value})} 
                    className="w-full border border-input bg-background rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors" 
                    placeholder="competitor1, competitor2" 
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    type="submit" 
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
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
                    className="border border-input bg-background hover:bg-muted px-4 py-2 rounded-lg transition-colors"
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onEdit={() => handleEdit(product)}
                onDelete={() => handleDelete(product.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function ProductCard({ product, onEdit, onDelete }: { product: any, onEdit: () => void, onDelete: () => void }) {
  const platforms = Array.from(new Set(product.sources.map((s: any) => s.platform)))
  
  return (
    <Card className="border-border hover:shadow-md transition-all duration-200 hover:border-primary/50 group">
      <CardHeader className="bg-card/50">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">{product.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {product.isActive ? (
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Active
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                  Paused
                </span>
              )}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {product.description}
        </p>
        
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Keywords</p>
            <div className="flex flex-wrap gap-1">
              {product.keywords.slice(0, 3).map((k: any) => (
                <span key={k.id} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md border border-border">
                  {k.keyword}
                </span>
              ))}
              {product.keywords.length > 3 && (
                <span className="text-xs text-muted-foreground font-medium">+{product.keywords.length - 3} more</span>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Platforms</p>
            <div className="flex flex-wrap gap-1">
              {platforms.map((p: any) => (
                <span key={p} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md border border-primary/20 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-3 border-t border-border">
          <button 
            onClick={onEdit} 
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
          >
            <Edit3 className="w-3 h-3" /> Edit
          </button>
          <button 
            onClick={onDelete} 
            className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors font-medium"
          >
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
