"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, ExternalLink, Hash, XCircle, Target } from "lucide-react"

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

interface ProductDetailsProps {
  product: Product
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const platforms = Array.from(new Set(product.sources.map((s) => s.platform)))

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
                {product.isActive ? (
                  <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
                    <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                    Paused
                  </span>
                )}
              </div>
              {product.websiteUrl && (
                <a 
                  href={product.websiteUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  {product.websiteUrl} <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            {product.description || "No description provided."}
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Keywords */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Hash className="w-4 h-4 text-primary" />
              Keywords ({product.keywords.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {product.keywords.map((k) => (
                <span 
                  key={k.id} 
                  className="text-sm bg-secondary text-secondary-foreground px-3 py-1 rounded-md"
                >
                  {k.keyword}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Negative Keywords */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <XCircle className="w-4 h-4 text-destructive" />
              Negative Keywords ({product.negativeKeywords.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {product.negativeKeywords.length > 0 ? (
                product.negativeKeywords.map((k) => (
                  <span 
                    key={k.id} 
                    className="text-sm bg-destructive/10 text-destructive px-3 py-1 rounded-md"
                  >
                    {k.keyword}
                  </span>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No negative keywords</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Competitors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Competitors ({product.competitors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {product.competitors.map((c) => (
                <span 
                  key={c.id} 
                  className="text-sm bg-secondary text-secondary-foreground px-3 py-1 rounded-md border border-border"
                >
                  {c.name}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Platforms */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Platforms ({platforms.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {platforms.map((p) => (
                <span 
                  key={p} 
                  className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-md"
                >
                  {p}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Search Queries */}
      {product.searchQueries && product.searchQueries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              AI Search Queries ({product.searchQueries.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {product.searchQueries.map((query, idx) => (
                <span 
                  key={idx}
                  className="text-sm bg-accent text-accent-foreground px-3 py-1 rounded-md border border-border"
                  title={query}
                >
                  {query.length > 40 ? query.substring(0, 40) + "..." : query}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
