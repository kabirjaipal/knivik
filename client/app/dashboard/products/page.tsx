"use client"

import { useAuth } from "@/context/auth-context"
import { Navbar } from "@/components/landing/navbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, Trash2, Edit3, Save, X, Server, Tags, AlertTriangle, Blocks, Zap } from "lucide-react"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { PROJECT_NAME } from "@/lib/constants"

export default function ProductsPage() {
  const { user, loading: authLoading } = useAuth()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

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
      
      const sources = formData.redditSources.split(',').map(s => s.trim()).filter(Boolean).map(s => ({
        platform: 'REDDIT',
        identifier: s
      }))

      // Always include HackerNews global as a base source
      sources.push({ platform: 'HACKERNEWS', identifier: 'global' })

      const payload = {
        name: formData.name,
        description: formData.description,
        websiteUrl: formData.websiteUrl,
        keywords: formData.keywords.split(',').map(s => s.trim()).filter(Boolean),
        negativeKeywords: formData.negativeKeywords.split(',').map(s => s.trim()).filter(Boolean),
        competitors: formData.competitors.split(',').map(s => s.trim()).filter(Boolean),
        sources
      }

      const method = editingProductId ? 'PUT' : 'POST'
      const urlEnding = editingProductId ? `/${editingProductId}` : ''

      const res = await fetch(`${apiUrl}/products${urlEnding}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Failed to ${editingProductId ? 'update' : 'create'} product`)
      
      if (editingProductId) {
         setProducts(products.map(p => p.id === editingProductId ? data.product : p))
      } else {
         setProducts([data.product, ...products])
      }
      
      setIsCreating(false)
      setEditingProductId(null)
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

  const handleEdit = (product: any) => {
    setFormData({
      name: product.name,
      description: product.description || "",
      websiteUrl: product.websiteUrl || "",
      keywords: product.keywords?.map((k: any) => k.keyword).join(', ') || "",
      negativeKeywords: product.negativeKeywords?.map((k: any) => k.keyword).join(', ') || "",
      competitors: product.competitors?.map((c: any) => c.name).join(', ') || "",
      redditSources: product.sources?.map((s: any) => s.identifier).join(', ') || ""
    })
    setEditingProductId(product.id)
    setIsCreating(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAnalyze = async () => {
    if (!formData.name || !formData.description) {
      alert("Please provide at least a name and a short description first.")
      return
    }
    
    setIsAnalyzing(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/products/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: formData.name, description: formData.description })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      setFormData({
        ...formData,
        keywords: data.strategy.keywords.join(', '),
        negativeKeywords: data.strategy.negativeKeywords.join(', '),
        competitors: data.strategy.competitors.join(', '),
        redditSources: data.strategy.subreddits.join(', ')
      })
    } catch (e: any) {
      alert("AI analysis failed: " + e.message)
    } finally {
      setIsAnalyzing(false)
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
                Configure exactly what the {PROJECT_NAME} engines should look for to catch your leads.
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
                      <CardTitle className="text-2xl">{editingProductId ? "Edit Tracking Configuration" : "New Tracking Configuration"}</CardTitle>
                      <CardDescription>Engine variables for the AI classifiers</CardDescription>
                    </div>
                    <button 
                      onClick={() => { setIsCreating(false); setEditingProductId(null); setFormData({ name: "", description: "", websiteUrl: "", keywords: "", negativeKeywords: "", competitors: "", redditSources: "" }); }} 
                      className="text-muted-foreground hover:bg-muted p-2 rounded-full transition-colors"
                    >
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
            <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">Keep it short and catchy.</p>
          </div>
          
          <div>
            <label className="text-sm font-bold text-foreground mb-1.5 block">Short Description</label>
            <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full h-24 bg-background border border-border rounded-lg px-4 py-2.5 outline-none focus:border-primary transition-all resize-none" placeholder="We help freelancers track sales..." />
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Explain what it does, who it's for, and why they need it.</p>
          </div>

          <div className="relative group/magic pt-2">
            <button type="button" onClick={handleAnalyze} disabled={isAnalyzing}
              className="group/btn flex items-center justify-center gap-2 w-full py-3 px-4 bg-violet-600 text-white font-bold rounded-xl text-sm transition-all hover:bg-violet-500 hover:shadow-[0_4_20px_rgba(139,92,246,0.3)] active:scale-[0.98] disabled:opacity-50 relative overflow-hidden">
              {isAnalyzing ? (
                 <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating Strategy...</>
              ) : (
                 <><Zap className="w-4 h-4 fill-current group-hover/btn:animate-pulse" /> Magic Analyze (AI Tool)</>
              )}
            </button>
            <div className="flex items-center gap-1.5 mt-2 px-1">
               <span className="text-[9px] font-black uppercase tracking-tighter bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded leading-none border border-violet-500/20">Recommended</span>
               <p className="text-[10px] text-muted-foreground/80 font-medium leading-tight line-clamp-1">AI will find 10+ keywords & top competitors.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-foreground mb-1.5 block">Target Keywords (AI Generated or Manual)</label>
            <input required value={formData.keywords} onChange={e => setFormData({...formData, keywords: e.target.value})} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 outline-none focus:border-primary transition-all" placeholder="CRM, customer software, sales tool" />
          </div>
          <div>
            <label className="text-sm font-bold text-foreground mb-1.5 block">Subreddits to Scan (comma separated, or 'global')</label>
            <input required value={formData.redditSources} onChange={e => setFormData({...formData, redditSources: e.target.value})} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 outline-none focus:border-primary transition-all" placeholder="startups, SaaS, sales" />
          </div>
          <div>
            <label className="text-sm font-bold text-foreground mb-1.5 block">Negative Keywords</label>
            <input value={formData.negativeKeywords} onChange={e => setFormData({...formData, negativeKeywords: e.target.value})} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 outline-none focus:border-primary transition-all" placeholder="job, hiring, salary, internship" />
          </div>
          <div>
            <label className="text-sm font-bold text-foreground mb-1.5 block">Competitors</label>
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

          {/* Product Grid */}
          <div className="grid gap-8 md:grid-cols-2">
            {products.length === 0 && !isCreating ? (
              <div className="md:col-span-2 flex flex-col items-center justify-center p-20 border border-dashed border-border rounded-3xl bg-muted/10">
                <Blocks className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">No Tracking Contexts Built</h3>
                <p className="text-muted-foreground max-w-md text-center">Engine is offline. Establish a Product Configuration Context to begin actively parsing live leads.</p>
              </div>
            ) : (
              products.map((product, i) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  index={i} 
                  onEdit={() => handleEdit(product)} 
                  onDelete={() => handleDelete(product.id)} 
                />
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function ProductCard({ product, index, onEdit, onDelete }: { product: any, index: number, onEdit: () => void, onDelete: () => void }) {
  const [showFull, setShowFull] = useState(false)
  
  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
        onClick={() => setShowFull(true)}
        className="group relative flex flex-col bg-card/40 backdrop-blur-xl border border-border/60 rounded-[2rem] overflow-hidden hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all cursor-pointer min-h-[320px]"
      >
        <div className={`absolute top-0 left-0 w-full h-1.5 ${product.isActive ? 'bg-linear-to-r from-green-500 to-emerald-400' : 'bg-muted'}`} />
        
        <CardHeader className="p-8 pb-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="font-black text-2xl tracking-tight text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                <Server className="w-5 h-5" /> {product.name}
              </h3>
              <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">Tracking Context v1.0</p>
            </div>
            <span className={`text-[10px] font-black tracking-tighter px-3 py-1 rounded-full border ${product.isActive ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-muted text-muted-foreground'}`}>
              {product.isActive ? 'SCANNING' : 'PAUSED'}
            </span>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-6 flex-1">
          <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed font-medium italic">
            "{product.description}"
          </p>
          
          <div className="mt-8 space-y-4">
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-2">Primary Intent Signals</p>
               <div className="flex flex-wrap gap-1.5">
                 {product.keywords.slice(0, 4).map((k: any) => (
                    <span key={k.id} className="text-[11px] font-bold bg-secondary/50 text-foreground/70 px-2.5 py-1 rounded-lg border border-border/50">
                      {k.keyword}
                    </span>
                 ))}
                 {product.keywords.length > 4 && <span className="text-[10px] font-bold text-primary self-center ml-1">+{product.keywords.length - 4} more</span>}
               </div>
            </div>

            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-2">Targeted Communities</p>
               <div className="flex flex-wrap gap-1.5">
                 {product.sources.slice(0, 3).map((s: any) => (
                    <span key={s.id} className="text-[10px] font-bold text-muted-foreground bg-muted/30 px-2 py-0.5 rounded border border-border">
                      {s.platform === 'REDDIT' ? `r/${s.identifier}` : `HN: ${s.identifier}`}
                    </span>
                 ))}
               </div>
            </div>
          </div>
        </CardContent>

        <div className="px-8 py-5 border-t border-border/20 bg-muted/5 flex justify-between items-center group-hover:bg-muted/20 transition-all">
           <div className="flex items-center gap-4">
             <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="flex items-center gap-1.5 text-xs font-black text-primary hover:scale-105 transition-transform">
               <Edit3 className="w-3.5 h-3.5" /> Configure
             </button>
             <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="flex items-center gap-1.5 text-xs font-black text-destructive/60 hover:text-destructive transition-colors">
               <Trash2 className="w-3.5 h-3.5" /> Terminate
             </button>
           </div>
           
           <div className="flex items-center gap-1.5 text-muted-foreground/30">
              <span className="text-[10px] font-bold">Details</span>
              <Plus className="w-3 h-3 rotate-45" />
           </div>
        </div>
      </motion.div>

      {/* Full Detail Modal */}
      <AnimatePresence>
        {showFull && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowFull(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.98, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.98, opacity: 0, y: 10 }}
              className="relative w-full max-w-4xl max-h-[85vh] bg-card border border-border/80 shadow-2xl rounded-[1.5rem] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-border/40 flex justify-between items-center bg-muted/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Server className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight leading-none">{product.name}</h2>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">{product.description}</p>
                  </div>
                </div>
                <button onClick={() => setShowFull(false)} className="bg-muted hover:bg-muted/80 p-2 rounded-lg transition-all active:scale-95 text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                {/* Visual Stats row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Expressions', val: product.keywords.length, icon: Tags, color: 'text-primary' },
                    { label: 'Radar Sites', val: product.sources.length, icon: Blocks, color: 'text-emerald-400' },
                    { label: 'Negatives', val: product.negativeKeywords.length, icon: AlertTriangle, color: 'text-red-400' },
                    { label: 'Competitors', val: product.competitors.length, icon: Zap, color: 'text-orange-400' },
                  ].map((stat, idx) => (
                    <div key={idx} className="px-4 py-3 bg-secondary/20 rounded-xl border border-border/40 flex items-center gap-3">
                      <stat.icon className={`w-3.5 h-3.5 ${stat.color} opacity-60`} />
                      <div>
                        <p className="text-sm font-black leading-none">{stat.val}</p>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-1">{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.15em] text-primary/70 mb-3">
                         Intent Signals
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {product.keywords.map((k: any) => (
                          <span key={k.id} className="bg-primary/5 text-primary px-2.5 py-1 rounded-lg text-xs font-bold border border-primary/10">
                            {k.keyword}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.15em] text-red-400/70 mb-3">
                         Negative Suppression
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {product.negativeKeywords.map((k: any) => (
                          <span key={k.id} className="bg-red-500/5 text-red-400/80 px-2.5 py-1 rounded-lg text-xs font-bold border border-red-500/10">
                            ! {k.keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.15em] text-emerald-400/70 mb-3">
                         Radar Sources
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {product.sources.map((s: any) => (
                          <span key={s.id} className="bg-muted border border-border text-foreground/80 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm">
                            {s.platform === 'REDDIT' ? `r/${s.identifier}` : `HN: global`}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.15em] text-orange-400/70 mb-3">
                         Poach Targets
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {product.competitors.length > 0 ? product.competitors.map((c: any) => (
                          <span key={c.id} className="bg-orange-500/5 text-orange-400 px-2.5 py-1 rounded-lg text-xs font-bold border border-orange-500/10">
                            {c.name}
                          </span>
                        )) : <p className="text-xs italic text-muted-foreground/40 ml-1 leading-none">None configured.</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-border/40 bg-muted/10 flex justify-end">
                 <button onClick={() => { setShowFull(false); onEdit(); }} className="flex items-center gap-2 bg-foreground text-background px-5 py-2 rounded-xl font-bold text-xs hover:opacity-90 transition-all active:scale-95 shadow-lg">
                   <Edit3 className="w-3.5 h-3.5" /> Modify Context
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
