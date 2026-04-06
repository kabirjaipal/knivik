"use client"

import { useAuth } from "@/context/auth-context"
import { Navbar } from "@/components/landing/navbar"
import { ProductDetails } from "@/components/dashboard/ProductDetails"
import { ProductLeads } from "@/components/dashboard/ProductLeads"
import { EditProductModal } from "@/components/dashboard/EditProductModal"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit3, Trash2 } from "lucide-react"
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
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    } else if (user && productId) {
      fetchProduct()
    }
  }, [user, authLoading, router, productId])

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

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 max-w-7xl">
          <div className="text-center">
            <p className="text-muted-foreground">Product not found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/dashboard/products")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Products
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <button 
            onClick={() => router.push("/dashboard/products")}
            className="hover:text-primary transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Products
          </button>
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {product.isActive ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Scanning active
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full"></span>
                  Scanning paused
                </span>
              )}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit3 className="w-4 h-4 mr-2" /> Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Product Details */}
          <div>
            <ProductDetails product={product} />
          </div>

          {/* Right: Leads */}
          <div>
            <ProductLeads productId={productId} />
          </div>
        </div>
      </main>

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
