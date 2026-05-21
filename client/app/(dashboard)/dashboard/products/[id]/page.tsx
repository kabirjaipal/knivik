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
      refresh() // Force refresh the user session from database to capture latest isScanning status
    }
  }, [user?.id, productId, fetchProduct, refresh])

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
    <div className="h-full flex flex-col overflow-hidden pr-1">
      {/* ── Compact Header Section ────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 border-b border-border/40 pb-4 shrink-0">
        
        {/* Top Row: Back button + Actions */}
        <div className="flex items-center justify-between gap-4">
          <button onClick={() => router.push("/dashboard/products")}
            className="group flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors w-fit bg-muted/30 px-2.5 py-1 rounded-md border border-border/40">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>

          <div className="flex items-center gap-2 shrink-0">
            {queries.length > 0 && (
              <button onClick={() => setShowConfig(v => !v)}
                className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg px-3 py-1.5 border ${showConfig ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/10' : 'bg-card text-foreground hover:bg-muted border-border/60 shadow-sm'}`}>
                <Zap className="w-3.5 h-3.5" />
                AI Config
                {showConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}

            <Button size="sm" disabled={isCurrentlyScanning || !product.isActive} onClick={handleScanNow}
              className="h-auto py-1.5 px-4 font-black text-[10px] uppercase tracking-widest rounded-lg shadow-sm shadow-primary/10">
              {isCurrentlyScanning
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Scanning</>
                : <><Radar className="w-3.5 h-3.5 mr-1" /> Force Scan</>}
            </Button>
          </div>
        </div>

        {/* Title, Badge, Description */}
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-foreground truncate">
              {product.name}
            </h1>

            {product.isActive ? (
              <span className="flex items-center gap-1 text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-full font-black uppercase tracking-widest text-[10px] shrink-0">
                <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" /> Live
              </span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full font-black uppercase tracking-widest text-[10px] shrink-0">
                <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full" /> Standby
              </span>
            )}

            {product.websiteUrl && (
              <a href={product.websiteUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 hover:bg-primary/20 transition-colors px-2 py-0.5 rounded-md shrink-0">
                <Globe className="w-3 h-3" />
                {product.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                <ExternalLink className="w-2.5 h-2.5 opacity-70" />
              </a>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-xs font-medium text-muted-foreground max-w-3xl leading-relaxed">
              {product.description}
            </p>
          )}
        </div>
      </div>

      {/* Collapsible AI queries */}
      {showConfig && queries.length > 0 && (
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-top-2 duration-200 shadow-inner mt-2 shrink-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary/80 flex items-center gap-1.5 mb-2">
            <Zap className="w-3.5 h-3.5" /> Configured Search Vectors
          </p>
          <div className="flex flex-wrap gap-1.5">
            {queries.map((q, i) => (
              <Badge key={i} variant="secondary"
                className="text-xs py-1 px-3 bg-card border border-primary/20 text-foreground font-bold shadow-sm rounded-md">
                "{q}"
              </Badge>
            ))}
          </div>
          {product.aiConfig?.customPersona && (
            <div className="mt-3 pt-3 border-t border-primary/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Custom Persona</p>
              <p className="text-xs font-medium text-foreground/80 italic border-l border-primary/40 pl-2">
                "{product.aiConfig.customPersona}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Stats + Leads (full width) ───────────────────────────────────────── */}
      <ProductLeads
        productId={productId}
        lastManualScanDate={product.aiConfig?.lastManualScanDate ?? null}
        refreshTrigger={refreshTrigger}
      />
    </div>
  )
}
