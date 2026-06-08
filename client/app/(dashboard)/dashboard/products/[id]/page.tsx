"use client"

import { useAuth } from "@/context/auth-context"
import { ProductLeads } from "@/components/dashboard/ProductLeads"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, ExternalLink, Radar, Zap, Globe, ChevronDown, ChevronUp, Ban, Briefcase, Package, Activity } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { getSocket } from "@/lib/socket"
import { useSession } from "@/lib/auth-client"
import { toast } from "sonner"

interface Product {
  id: string
  name: string
  description: string | null
  websiteUrl: string | null
  isActive: boolean
  searchQueries?: string[] | null
  config?: {
    lastManualScanDate?: string | null
    customPersona?: string | null
    [key: string]: any
  } | null
}

export default function ProductDetailPage() {
  const { user } = useAuth()
  const { data: sessionData } = useSession()
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  const sessionToken = sessionData?.session?.token

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [showConfig, setShowConfig] = useState(false)
  const [isDescExpanded, setIsDescExpanded] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [localScanning, setLocalScanning] = useState(false)
  const [scanStep, setScanStep] = useState<string>(user?.isScanning ? "INITIALIZING" : "")
  const isCurrentlyScanning = localScanning || !!user?.isScanning
  const lastFetchedId = useRef<string | null>(null)

  const getScanStepMessage = (step: string) => {
    switch (step) {
      case "INITIALIZING":
        return "Booting scan worker and loading search keywords..."
      case "COLLECTING":
        return "Scanning Reddit, HackerNews, X (Twitter), GitHub, and Bluesky for matching conversations..."
      case "ANALYZING":
        return "AI model classifying buying intent levels and scoring leads..."
      case "SAVING":
        return "Saving qualified leads and triggering instant email/Slack alerts..."
      default:
        return "Scan processing in background..."
    }
  }

  const renderScanStepDot = (dotStep: string, currentStep: string) => {
    const stepsOrder = ["INITIALIZING", "COLLECTING", "ANALYZING", "SAVING"]
    const dotIndex = stepsOrder.indexOf(dotStep)
    const effectiveCurrentStep = currentStep || "INITIALIZING"
    const currentIndex = stepsOrder.indexOf(effectiveCurrentStep)
    
    let label = ""
    if (dotStep === "INITIALIZING") label = "Setup"
    if (dotStep === "COLLECTING") label = "Scrape"
    if (dotStep === "ANALYZING") label = "AI Score"
    if (dotStep === "SAVING") label = "Alert & Save"

    if (dotIndex < currentIndex) {
      return (
        <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
          ✓ {label}
        </span>
      )
    } else if (dotIndex === currentIndex) {
      return (
        <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full animate-pulse shrink-0">
          <span className="w-1 h-1 bg-indigo-400 rounded-full animate-ping" /> {label}
        </span>
      )
    } else {
      return (
        <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-slate-500 bg-white/[0.02] border border-white/5 px-2 py-0.5 rounded-full shrink-0 opacity-60">
          {label}
        </span>
      )
    }
  }

  const fetchProduct = useCallback(async () => {
    if (!productId || lastFetchedId.current === productId) return
    
    lastFetchedId.current = productId
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${productId}`, {
        credentials: "include",
      })
      if (!res.ok) throw new Error("Failed to load details")
      const data = await res.json()
      setProduct(data.product)
    } catch (e: any) {
      toast.error("Could not load details right now.")
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
    if (!sessionToken) return;

    const socket = getSocket(sessionToken);
    
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
        setScanStep(data.status);
      } else {
        setLocalScanning(false);
        setScanStep("");
        // Refresh product data and leads list
        fetchProduct();
        setRefreshTrigger(prev => prev + 1);
      }
    });

    return () => {
      socket.off('connect', joinRoom);
      socket.off('scan-status');
    };
  }, [productId, fetchProduct, sessionToken]);

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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
        <p className="text-sm font-bold text-muted-foreground">Product or Service not found</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/products")}
          className="rounded-xl px-4 font-bold text-xs uppercase tracking-wider">
          <ArrowLeft className="w-3 h-3 mr-2" /> Back
        </Button>
      </div>
    )
  }

  const queries = Array.isArray(product.searchQueries) ? product.searchQueries : []

  return (
    <div className="xl:h-full flex flex-col xl:overflow-hidden pr-1">
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
            <div className="flex items-center gap-2 truncate">
              {product.config?.productType === 'service' ? (
                <Briefcase className="w-5 h-5 text-primary shrink-0 animate-in fade-in" />
              ) : (
                <Package className="w-5 h-5 text-primary shrink-0 animate-in fade-in" />
              )}
              <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-foreground truncate">
                {product.name}
              </h1>
            </div>

            {product.isActive ? (
              <span className="flex items-center gap-1 text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-full font-black uppercase tracking-widest text-[10px] shrink-0 animate-in fade-in">
                <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" /> Live
              </span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full font-black uppercase tracking-widest text-[10px] shrink-0 animate-in fade-in">
                <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full" /> Standby
              </span>
            )}

            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border shrink-0 animate-in fade-in ${
              product.config?.productType === 'service'
                ? "bg-teal-500/10 text-teal-600 border-teal-500/20 dark:text-teal-400"
                : "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400"
            }`}>
              {product.config?.productType === 'service' ? 'Service' : 'Product'}
            </span>

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
              {product.description.length > 200 && !isDescExpanded ? (
                <>
                  {product.description.slice(0, 200)}...{" "}
                  <button
                    onClick={() => setIsDescExpanded(true)}
                    className="text-primary hover:underline font-bold focus:outline-none"
                  >
                    Read more
                  </button>
                </>
              ) : (
                <>
                  {product.description}{" "}
                  {product.description.length > 200 && (
                    <button
                      onClick={() => setIsDescExpanded(false)}
                      className="text-primary hover:underline font-bold focus:outline-none ml-1"
                    >
                      Show less
                    </button>
                  )}
                </>
              )}
            </p>
          )}

          {/* Real-time Scanning Progress Box */}
          {isCurrentlyScanning && (
            <div className="mt-4 p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-950/10 animate-in fade-in slide-in-from-top-1 duration-200 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-4.5 h-4.5 animate-spin text-indigo-400 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" /> Scan In Progress
                    </p>
                    <p className="text-xs font-semibold text-slate-300">
                      {getScanStepMessage(scanStep)}
                    </p>
                  </div>
                </div>
                
                {/* Visual steps */}
                <div className="flex items-center gap-1.5 select-none overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
                  {renderScanStepDot("INITIALIZING", scanStep)}
                  <div className="w-3 h-[1px] bg-white/[0.08] shrink-0" />
                  {renderScanStepDot("COLLECTING", scanStep)}
                  <div className="w-3 h-[1px] bg-white/[0.08] shrink-0" />
                  {renderScanStepDot("ANALYZING", scanStep)}
                  <div className="w-3 h-[1px] bg-white/[0.08] shrink-0" />
                  {renderScanStepDot("SAVING", scanStep)}
                </div>
              </div>
            </div>
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
          {product.config?.negativeKeywords && Array.isArray(product.config.negativeKeywords) && product.config.negativeKeywords.length > 0 && (
            <div className="mt-3 pt-3 border-t border-primary/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-destructive mb-1.5 flex items-center gap-1">
                <Ban className="w-3.5 h-3.5" /> Exclude Keywords (Negative Keywords)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {product.config.negativeKeywords.map((kw, i) => (
                  <Badge key={i} variant="outline"
                    className="text-xs py-0.5 px-2 bg-destructive/5 border-destructive/20 text-destructive/80 font-bold rounded-md">
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {product.config?.customPersona && (
            <div className="mt-3 pt-3 border-t border-primary/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Custom Persona</p>
              <p className="text-xs font-medium text-foreground/80 italic border-l border-primary/40 pl-2">
                "{product.config.customPersona}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Stats + Leads (full width) ───────────────────────────────────────── */}
      <ProductLeads
        productId={productId}
        lastManualScanDate={product.config?.lastManualScanDate ?? null}
        refreshTrigger={refreshTrigger}
        productType={product.config?.productType === 'service' ? 'service' : 'product'}
      />
    </div>
  )
}
