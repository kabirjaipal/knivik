"use client"

import { useAuth } from "@/context/auth-context"
import { ProductLeads } from "@/components/dashboard/ProductLeads"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, ExternalLink, Radar, Zap, Globe, ChevronDown, ChevronUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { getSocket } from "@/lib/socket"
import { toast } from "sonner"

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
  const [showConfig, setShowConfig] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [localScanning, setLocalScanning] = useState(false)
  const isCurrentlyScanning = localScanning || !!user?.isScanning
  const lastFetchedId = useRef<string | null>(null)

  const fetchProduct = useCallback(async () => {
    if (!productId || lastFetchedId.current === productId) return
    
    lastFetchedId.current = productId
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${productId}`, {
        credentials: "include",
      })
      if (!res.ok) throw new Error("Failed to fetch product")
      const data = await res.json()
      setProduct(data.product)
    } catch (e: any) {
      toast.error("Could not load the product details right now.")
      lastFetchedId.current = null // Reset on error to allow retry
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    if (user?.id && productId && lastFetchedId.current !== productId) {
      fetchProduct()
    }
  }, [user?.id, productId, fetchProduct])

  // ─── Real-time scan updates via WebSocket ──────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    
    const joinRoom = () => {
      if (productId) {
        console.log('Emitting join-product for:', productId);
        socket.emit('join-product', productId);
      }
    };

    // Join if already connected, otherwise wait for connect event
    if (socket.connected) {
      joinRoom();
    }

    // Always listen for connect/reconnect to ensure we are in the room
    socket.on('connect', joinRoom);

    socket.on('scan-status', (data: { isScanning: boolean; status: string }) => {
      console.log('Real-time scan update:', data);
      
      if (data.isScanning) {
        setLocalScanning(true);
        refresh();
      } else {
        setLocalScanning(false);
        refresh();
        // Refresh product data and leads list
        fetchProduct();
        setRefreshTrigger(prev => prev + 1);
      }
    });

    return () => {
      socket.off('connect', joinRoom);
      socket.off('scan-status');
    };
  }, [productId, fetchProduct, refresh]);

  const handleScanNow = async () => {
    if (isCurrentlyScanning) return
    setLocalScanning(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${productId}/scan`, {
        method: "POST", credentials: "include",
      })
      
      if (res.status === 202) return
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Scan failed")
      }
      setLocalScanning(false)
      fetchProduct()
      setRefreshTrigger(prev => prev + 1)
    } catch (err: any) {
      toast.error(err.message || "Scan failed")
      setLocalScanning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary/60" />
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40">Loading...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
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
    <div className="h-full flex flex-col overflow-y-auto no-scrollbar pb-12 pr-1">
      {/* ── Premium Header Section ────────────────────────────────────────── */}
      <div className="flex flex-col gap-6 border-b border-border/40 pb-8">
        
        {/* Breadcrumb */}
        <button onClick={() => router.push("/dashboard/products")}
          className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors w-fit bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Products
        </button>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-foreground truncate">
                {product.name}
              </h1>

              {product.isActive ? (
                <span className="flex items-center gap-1.5 text-success bg-success/10 border border-success/20 px-3 py-1 rounded-full font-black uppercase tracking-widest text-sm shrink-0 shadow-sm">
                  <span className="w-2 h-2 bg-success rounded-full animate-pulse shadow-sm shadow-success/60" /> Live
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-muted-foreground bg-muted border border-border px-3 py-1 rounded-full font-black uppercase tracking-widest text-sm shrink-0">
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full" /> Standby
                </span>
              )}

              {product.websiteUrl && (
                <a href={product.websiteUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 hover:bg-primary/20 transition-colors px-3 py-1 rounded-lg shrink-0">
                  <Globe className="w-3.5 h-3.5" />
                  {product.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm font-medium text-muted-foreground max-w-3xl leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* AI config toggle */}
            {queries.length > 0 && (
              <button onClick={() => setShowConfig(v => !v)}
                className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all rounded-xl px-4 py-2.5 border ${showConfig ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20' : 'bg-card text-foreground hover:bg-muted border-border/60 shadow-sm'}`}>
                <Zap className="w-4 h-4" />
                AI Config
                {showConfig ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}

            <Button size="lg" disabled={isCurrentlyScanning || !product.isActive} onClick={handleScanNow}
              className="h-auto py-2.5 px-6 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20">
              {isCurrentlyScanning
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Scanning...</>
                : <><Radar className="w-4 h-4 mr-2" /> Force Scan</>}
            </Button>
          </div>
        </div>

        {/* Collapsible AI queries */}
        {showConfig && queries.length > 0 && (
          <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-top-2 duration-200 shadow-inner">
            <p className="text-xs font-black uppercase tracking-widest text-primary/80 flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4" /> Configured Search Vectors
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {queries.map((q, i) => (
                <Badge key={i} variant="secondary"
                  className="text-sm py-1.5 px-4 bg-card border border-primary/20 text-foreground font-bold shadow-sm rounded-lg hover:border-primary/50 transition-colors">
                  "{q}"
                </Badge>
              ))}
            </div>
            {product.aiConfig?.customPersona && (
              <div className="mt-4 pt-4 border-t border-primary/10">
                <p className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-1">Custom Persona</p>
                <p className="text-sm font-medium text-foreground/80 italic border-l-2 border-primary/40 pl-3">
                  "{product.aiConfig.customPersona}"
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Stats + Leads (full width) ───────────────────────────────────────── */}
      <ProductLeads
        productId={productId}
        lastManualScanDate={product.aiConfig?.lastManualScanDate ?? null}
        refreshTrigger={refreshTrigger}
      />
    </div>
  )
}
