"use client"

import { useAuth } from "@/context/auth-context"
import { Navbar } from "@/components/landing/navbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, Trash2, Edit3, Save, X, Server, Tags, AlertTriangle, Blocks } from "lucide-react"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

export default function ProductsPage() {
  const { user, loading: authLoading } = useAuth()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    websiteUrl: "",
    keywords: "",
    negativeKeywords: "",
    competitors: "",
    redditSources: ""
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
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      const payload = {
        name: formData.name,
        description: formData.description,
        websiteUrl: formData.websiteUrl,
        keywords: formData.keywords.split(',').map(s => s.trim()).filter(Boolean),
        negativeKeywords: formData.negativeKeywords.split(',').map(s => s.trim()).filter(Boolean),
        competitors: formData.competitors.split(',').map(s => s.trim()).filter(Boolean),
        sources: formData.redditSources.split(',').map(s => s.trim()).filter(Boolean).map(s => ({
          platform: 'REDDIT',
          identifier: s
        }))
      }

      if (payload.sources.length === 0) {
         // Default to global reddit parsing if empty
         payload.sources.push({ platform: 'REDDIT', identifier: 'global' });
      }

      const res = await fetch(`${apiUrl}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create product')
      
      setProducts([data.product, ...products])
      setIsCreating(false)
      setFormData({ name: "", description: "", websiteUrl: "", keywords: "", negativeKeywords: "", competitors: "", redditSources: "" })
    } catch (e: any) {
      setFormError(e.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product tracing context?")) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      await fetch(`${apiUrl}/products/${id}`, { method: 'DELETE', credentials: 'include' })
      setProducts(products.filter(p => p.id !== id))
    } catch (e) {
      console.error(e)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[10%] left-[-10%] w-[40%] h-[40%] bg-linear-to-r from-blue-500/10 to-transparent rounded-full blur-[120px] opacity-70"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <Navbar />
        
        <main className="flex-1 container mx-auto px-4 py-12 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="text-4xl font-black tracking-tight text-foreground">
                Products & Triggers
              </h1>
              <p className="text-muted-foreground mt-2">
                Configure exactly what the IntentRadar engines should look for to catch your leads.
              </p>
            </motion.div>
            
            <motion.button 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] active:scale-95"
            >
              <Plus className="w-5 h-5" /> New Product
            </motion.button>
          </div>

          <AnimatePresence>
            {isCreating && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: -20 }} 
                animate={{ opacity: 1, height: 'auto', y: 0 }} 
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                className="mb-10 overflow-hidden"
              >
                <Card className="border-primary/20 shadow-2xl bg-card/60 backdrop-blur-xl relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary to-blue-500" />
                  <CardHeader className="flex flex-row justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">New Tracking Configuration</CardTitle>
                      <CardDescription>Engine variables for the AI classifiers</CardDescription>
                    </div>
                    <button onClick={() => setIsCreating(false)} className="text-muted-foreground hover:bg-muted p-2 rounded-full transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateProduct} className="space-y-6">
                      {formError && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm font-semibold flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" /> {formError}
                        </div>
                      )}

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-bold text-foreground mb-1.5 block">Product Name</label>
                            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="e.g. Acme CRM" />
                          </div>
                          <div>
                            <label className="text-sm font-bold text-foreground mb-1.5 block">Target Keywords (comma separated)</label>
                            <input required value={formData.keywords} onChange={e => setFormData({...formData, keywords: e.target.value})} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 outline-none focus:border-primary transition-all" placeholder="CRM, customer software, sales tool" />
                          </div>
                          <div>
                            <label className="text-sm font-bold text-foreground mb-1.5 block">Subreddits to Scan (comma separated, or 'global')</label>
                            <input required value={formData.redditSources} onChange={e => setFormData({...formData, redditSources: e.target.value})} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 outline-none focus:border-primary transition-all" placeholder="startups, SaaS, sales" />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-bold text-foreground mb-1.5 block">Short Description</label>
                            <input required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 outline-none focus:border-primary transition-all" placeholder="We help freelancers track sales..." />
                          </div>
                          <div>
                            <label className="text-sm font-bold text-foreground mb-1.5 block">Negative Keywords (Ignore posts with these)</label>
                            <input value={formData.negativeKeywords} onChange={e => setFormData({...formData, negativeKeywords: e.target.value})} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 outline-none focus:border-primary transition-all" placeholder="job, hiring, salary, internship" />
                          </div>
                          <div>
                            <label className="text-sm font-bold text-foreground mb-1.5 block">Competitors (comma separated)</label>
                            <input value={formData.competitors} onChange={e => setFormData({...formData, competitors: e.target.value})} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 outline-none focus:border-primary transition-all" placeholder="Hubspot, Salesforce" />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-border">
                         <button type="submit" className="flex items-center gap-2 bg-foreground text-background px-8 py-3 rounded-lg font-bold hover:bg-foreground/90 transition-all active:scale-95">
                           <Save className="w-4 h-4" /> Save Configuration
                         </button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid gap-6">
            {products.length === 0 && !isCreating ? (
              <div className="flex flex-col items-center justify-center p-16 border border-dashed border-border rounded-2xl bg-muted/10">
                <Blocks className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">No Tracking Contexts Built</h3>
                <p className="text-muted-foreground max-w-md text-center">Engine is offline. Establish a Product Configuration Context to begin actively parsing live leads from the internet.</p>
              </div>
            ) : (
              products.map((product, i) => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card className="shadow-lg bg-card/40 backdrop-blur-md border border-border group overflow-hidden relative">
                    {/* Active pulse indicator */}
                    <div className="absolute top-0 right-0 p-4">
                      {product.isActive ? (
                         <span className="flex items-center gap-2 text-xs font-bold text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
                           <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Scanning Active
                         </span>
                      ) : (
                         <span className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-muted px-3 py-1.5 rounded-full border border-border">
                           Paused
                         </span>
                      )}
                    </div>

                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-2xl font-bold flex items-center gap-3">
                            <Server className="w-5 h-5 text-primary" /> {product.name}
                          </CardTitle>
                          <CardDescription className="text-sm mt-1 mb-4 max-w-2xl">{product.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-8 p-4 bg-background/50 rounded-xl border border-border/50">
                        {/* Keyword Column */}
                        <div>
                          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                             <Tags className="w-3.5 h-3.5" /> Target Expressions
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {product.keywords.map((k: any) => (
                              <span key={k.id} className="bg-primary/10 text-primary px-3 py-1 rounded-md text-sm font-semibold border border-primary/20">
                                {k.keyword}
                              </span>
                            ))}
                            {product.keywords.length === 0 && <span className="text-sm text-muted-foreground italic">None configured</span>}
                          </div>
                        </div>

                        {/* Negative Config */}
                        <div>
                          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                             <AlertTriangle className="w-3.5 h-3.5" /> Global Negative Modifiers
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {product.negativeKeywords.map((k: any) => (
                              <span key={k.id} className="bg-destructive/10 text-destructive px-3 py-1 rounded-md text-sm font-semibold border border-destructive/20">
                                ! {k.keyword}
                              </span>
                            ))}
                            {product.negativeKeywords.length === 0 && <span className="text-sm text-muted-foreground italic">None configured</span>}
                          </div>
                        </div>
                        
                        {/* Communities */}
                         <div>
                          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                             <Blocks className="w-3.5 h-3.5" /> Scanning Communities
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {product.sources.map((s: any) => (
                              <span key={s.id} className="bg-background border border-border text-foreground px-3 py-1 rounded-md text-sm font-bold shadow-sm">
                                r/{s.identifier}
                              </span>
                            ))}
                          </div>
                        </div>

                      </div>

                      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border/40">
                         <button className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-muted">
                           <Edit3 className="w-4 h-4" /> Edit
                         </button>
                         <button onClick={() => handleDelete(product.id)} className="flex items-center gap-1.5 text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors px-3 py-2 rounded-lg">
                           <Trash2 className="w-4 h-4" /> Terminate
                         </button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
