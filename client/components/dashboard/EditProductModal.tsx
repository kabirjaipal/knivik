"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

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
}

interface EditProductModalProps {
  product: Product
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export function EditProductModal({ product, isOpen, onClose, onUpdate }: EditProductModalProps) {
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description || "",
    websiteUrl: product.websiteUrl || "",
    isActive: product.isActive,
    keywords: product.keywords.map((k) => k.keyword).join(", "),
    negativeKeywords: product.negativeKeywords.map((k) => k.keyword).join(", "),
    competitors: product.competitors.map((c) => c.name).join(", "),
    redditSources: product.sources
      .filter((s) => s.platform === "REDDIT")
      .map((s) => s.identifier)
      .join(", "),
    twitterSources: product.sources
      .filter((s) => s.platform === "TWITTER")
      .map((s) => s.identifier)
      .join(", "),
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const res = await fetch(`${apiUrl}/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          websiteUrl: formData.websiteUrl,
          isActive: formData.isActive,
          keywords: formData.keywords
            .split(",")
            .map((k) => k.trim())
            .filter((k) => k),
          negativeKeywords: formData.negativeKeywords
            .split(",")
            .map((k) => k.trim())
            .filter((k) => k),
          competitors: formData.competitors
            .split(",")
            .map((c) => c.trim())
            .filter((c) => c),
          sources: [
            ...formData.redditSources
              .split(",")
              .map((r) => r.trim())
              .filter((r) => r)
              .map((r) => ({ platform: "REDDIT", identifier: r })),
            ...formData.twitterSources
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t)
              .map((t) => ({ platform: "TWITTER", identifier: t })),
            { platform: "HACKERNEWS", identifier: "global" },
          ],
        }),
      })

      if (!res.ok) throw new Error("Failed to update product")

      onUpdate()
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Edit Product</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Product Name</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border border-input bg-background rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                  placeholder="e.g. Acme CRM"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Website</label>
                <input
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, websiteUrl: e.target.value })
                  }
                  className="w-full border border-input bg-background rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Description</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full border border-input bg-background rounded-lg px-3 py-2 focus:outline-none focus:border-primary h-20 resize-none"
                placeholder="We help freelancers track sales..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Keywords (comma separated)
                </label>
                <input
                  required
                  value={formData.keywords}
                  onChange={(e) =>
                    setFormData({ ...formData, keywords: e.target.value })
                  }
                  className="w-full border border-input bg-background rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                  placeholder="CRM, customer software, sales tool"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Negative Keywords (comma separated)
                </label>
                <input
                  value={formData.negativeKeywords}
                  onChange={(e) =>
                    setFormData({ ...formData, negativeKeywords: e.target.value })
                  }
                  className="w-full border border-input bg-background rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                  placeholder="free, open source, cheap"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Subreddits (comma separated)
                </label>
                <input
                  value={formData.redditSources}
                  onChange={(e) =>
                    setFormData({ ...formData, redditSources: e.target.value })
                  }
                  className="w-full border border-input bg-background rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                  placeholder="startups, saas, entrepreneurship"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Twitter Sources (comma separated)
                </label>
                <input
                  value={formData.twitterSources}
                  onChange={(e) =>
                    setFormData({ ...formData, twitterSources: e.target.value })
                  }
                  className="w-full border border-input bg-background rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                  placeholder="global"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Competitors (comma separated)
              </label>
              <input
                value={formData.competitors}
                onChange={(e) =>
                  setFormData({ ...formData, competitors: e.target.value })
                }
                className="w-full border border-input bg-background rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                placeholder="competitor1, competitor2"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="rounded border-input"
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Active (scanning enabled)
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Product"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
