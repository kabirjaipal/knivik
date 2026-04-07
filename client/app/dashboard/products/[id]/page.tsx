"use client"

import { useAuth } from "@/context/auth-context"
import { ProductDetails } from "@/components/dashboard/ProductDetails"
import { ProductLeads } from "@/components/dashboard/ProductLeads"
import { EditProductModal } from "@/components/dashboard/EditProductModal"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit3, Trash2, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"

interface Product {
  id: string
  name: string
  description: string | null
  websiteUrl: string | null
  isActive: boolean
  keywords: Array<{ id: string; keyword: string }>
  negativeKeywords: Array<{ id: string; keyword: string }>
  competitors: Array<{ id: string; name: string }>
  sources: Array<{ id: string; platform: string; identifier: string }>
  searchQueries?: string[]
}

export default function ProductDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

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

  const handleDelete = async () => {
    if (!confirm("Are you sure? This will delete all associated leads.")) return

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const res = await fetch(`${apiUrl}/products/${productId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!res.ok) throw new Error("Failed to delete product")
      router.push("/dashboard/products")
    } catch (e: any) {
      alert("Failed to delete product: " + e.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 h-64">
        <p className="text-muted-foreground font-bold">Product not found</p>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/products")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Products
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button 
          onClick={() => router.push("/dashboard/products")}
          className="hover:text-primary transition-colors flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Products
        </button>
        <span className="opacity-30">/</span>
        <span className="text-foreground font-bold tracking-tight truncate max-w-[200px]">{product.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">{product.name}</h1>
          <div className="text-sm mt-1.5 flex items-center gap-2">
            {product.isActive ? (
              <span className="flex items-center gap-1.5 text-green-500 font-bold uppercase tracking-wider text-[10px]">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                In-flight scanning active
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></span>
                Scanning standby
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="font-bold gap-2 rounded-xl"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit3 className="w-4 h-4" /> Edit Configuration
          </Button>
          <Button
            variant="destructive"
            className="font-bold gap-2 rounded-xl"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" /> Purge Product
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="grid lg:grid-cols-2 gap-10">
        {/* Left: Product Details */}
        <div className="space-y-6">
          <ProductDetails product={product} />
        </div>

        {/* Right: Leads */}
        <div className="space-y-6">
          <ProductLeads productId={productId} />
        </div>
      </div>

      {/* Edit Modal */}
      <EditProductModal
        product={product}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={fetchProduct}
      />
    </div>
  )
}
