"use client"

import { useAuth } from "@/context/auth-context"
import { ProductLeads } from "@/components/dashboard/ProductLeads"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, ExternalLink, Radar, Zap, Globe, ChevronDown, ChevronUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"

interface Product {
  id: string
  name: string
  description: string | null
  websiteUrl: string | null
  isActive: boolean
  searchQueries?: string[] | null
  aiConfig?: {
    lastManualScanDate?: string | null
    customPersona?: string | null
    [key: string]: any
  } | null
}

export default function ProductDetailPage() {
  const { user, refresh } = useAuth()
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [isScanning, setIsScanning] = useState(false)
  const [showConfig, setShowConfig] = useState(false)

  // ─── Background scan polling ──────────────────────────────────────────────
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (user?.isScanning) {
      setIsScanning(true)
      interval = setInterval(() => { refresh() }, 3000)
    } else if (isScanning && !user?.isScanning) {
      setIsScanning(false)
      setTimeout(() => window.location.reload(), 500)
    }
    return () => { if (interval) clearInterval(interval) }
  }, [user?.isScanning, isScanning, refresh])

  const handleScanNow = async () => {
    if (isScanning) return
    setIsScanning(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${productId}/scan`, {
        method: "POST", credentials: "include",
      })
      if (res.status === 202) return
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Scan failed")
      }
      window.location.reload()
    } catch (err: any) {
      alert(err.message || "Scan failed")
      setIsScanning(false)
    }
  }

  useEffect(() => {
    if (user && productId) fetchProduct()
  }, [user, productId])

  const fetchProduct = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${productId}`, {
        credentials: "include",
      })
      if (!res.ok) throw new Error("Failed to fetch product")
      const data = await res.json()
      setProduct(data.product)
    } catch (e: any) {
      console.error("Failed to fetch product:", e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary/60" />
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40">Loading...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
        <p className="text-sm font-bold text-muted-foreground">Product not found</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/products")}
          className="rounded-xl px-4 font-bold text-xs uppercase tracking-wider">
          <ArrowLeft className="w-3 h-3 mr-2" /> Back
        </Button>
      </div>
    )
  }

  const queries = Array.isArray(product.searchQueries) ? product.searchQueries : []

  return (
    <div className="space-y-4">
      {/* ── Slim header bar ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        {/* Breadcrumb */}
        <button onClick={() => router.push("/dashboard/products")}
          className="group flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground/50 hover:text-primary transition-colors w-fit">
          <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
          All Products
        </button>

        {/* Title row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-xl font-black tracking-tight truncate">{product.name}</h1>

            {product.isActive ? (
              <span className="flex items-center gap-1 text-success font-black uppercase tracking-wider text-[10px] shrink-0">
                <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" /> Live
              </span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground font-black uppercase tracking-wider text-[10px] shrink-0">
                <span className="w-1.5 h-1.5 bg-muted-foreground/30 rounded-full" /> Standby
              </span>
            )}

            {product.websiteUrl && (
              <a href={product.websiteUrl} target="_blank" rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors shrink-0">
                <Globe className="w-2.5 h-2.5" />
                {product.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                <ExternalLink className="w-2 h-2" />
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* AI config toggle */}
            {queries.length > 0 && (
              <button onClick={() => setShowConfig(v => !v)}
                className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 hover:text-primary transition-colors border border-border/40 rounded-lg px-2.5 py-1.5">
                <Zap className="w-2.5 h-2.5" />
                Queries
                {showConfig ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
              </button>
            )}

            <Button size="sm" disabled={isScanning || !product.isActive} onClick={handleScanNow}
              className="h-8 px-4 font-black text-[10px] uppercase tracking-wider rounded-lg">
              {isScanning
                ? <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Scanning...</>
                : <><Radar className="w-3 h-3 mr-1" /> Scan Now</>}
            </Button>
          </div>
        </div>

        {/* Description — single line, muted */}
        {product.description && (
          <p className="text-xs text-muted-foreground/60 truncate max-w-2xl">{product.description}</p>
        )}

        {/* Collapsible AI queries */}
        {showConfig && queries.length > 0 && (
          <div className="mt-1 p-3 rounded-xl border border-primary/15 bg-primary/[0.03] animate-in fade-in slide-in-from-top-1 duration-150 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">AI Search Vectors</p>
            <div className="flex flex-wrap gap-1.5">
              {queries.map((q, i) => (
                <Badge key={i} variant="secondary"
                  className="text-[10px] py-0.5 px-2.5 bg-primary/5 text-primary/60 border border-primary/10 font-medium">
                  "{q}"
                </Badge>
              ))}
            </div>
            {product.aiConfig?.customPersona && (
              <p className="text-xs italic text-muted-foreground/50">
                Persona: "{product.aiConfig.customPersona}"
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Stats + Leads (full width) ───────────────────────────────────────── */}
      <ProductLeads
        productId={productId}
        lastManualScanDate={product.aiConfig?.lastManualScanDate ?? null}
      />
    </div>
  )
}
