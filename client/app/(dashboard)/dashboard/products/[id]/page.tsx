"use client"

import { useAuth } from "@/context/auth-context"
import { ProductDetails } from "@/components/dashboard/ProductDetails"
import { ProductLeads } from "@/components/dashboard/ProductLeads"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, ExternalLink } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"

interface Product {
  id: string
  name: string
  description: string | null
  websiteUrl: string | null
  isActive: boolean
}

export default function ProductDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && productId) {
      fetchProduct()
    }
  }, [user, productId])

  const fetchProduct = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const res = await fetch(`${apiUrl}/products/${productId}`, {
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
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40">Loading Signal Data...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
        <p className="text-sm font-bold text-muted-foreground">Product not found</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/products")}
          className="rounded-xl px-4 font-bold text-xs uppercase tracking-wider"
        >
          <ArrowLeft className="w-3 h-3 mr-2" /> Back to Overview
        </Button>
      </div>
    )
  }

  return (
    <div className="">
      {/* Navigation */}
      <nav className="mb-4">
        <button 
          onClick={() => router.push("/dashboard/products")}
          className="group flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> 
          Back
        </button>
      </nav>

      {/* Main Header */}
      <header className="mb-8 border-b border-border/50 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              {product.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                {product.isActive ? (
                  <span className="flex items-center gap-1.5 text-success font-bold uppercase tracking-wider text-xs">
                    <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse shadow-success/40"></span>
                    Live Scanning
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-muted-foreground font-bold uppercase tracking-wider text-xs">
                    <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full"></span>
                    Standby
                  </span>
                )}
              </div>
              {product.websiteUrl && (
                <a 
                  href={product.websiteUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs font-bold uppercase tracking-wider text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                >
                  Visit <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
          
          <div className="text-xs font-mono text-muted-foreground/30 tabular-nums">
            {product.id}
          </div>
        </div>
      </header>

      {/* Grid Content */}
      <div className="grid lg:grid-cols-[350px_1fr] gap-8 xl:gap-12">
        {/* Left: Product Logic */}
        <aside className="space-y-8">
          <ProductDetails product={product} />
        </aside>

        {/* Right: Detected Signals */}
        <main className="lg:border-l lg:border-border/20 lg:pl-8 xl:pl-12">
          <ProductLeads productId={productId} />
        </main>
      </div>
    </div>
  )
}
