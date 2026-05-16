"use client"

import { Hash, XCircle, Target, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Product {
  id: string
  name: string
  description: string | null
  websiteUrl: string | null
  isActive: boolean
  searchQueries?: string[]
  aiConfig?: any
}

interface ProductDetailsProps {
  product: Product
}

export function ProductDetails({ product }: ProductDetailsProps) {
  return (
    <div className="space-y-8">
      {/* Description Section */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40 mb-2">Description</h2>
        <p className="text-sm font-medium leading-relaxed text-foreground/80">
          {product.description || "No description provided."}
        </p>
      </section>

      <div className="space-y-6">
        {/* Universal AI Configuration */}
        <section className="bg-primary/3 p-5 rounded-2xl border border-primary/10">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary/50 mb-3 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 fill-current" /> Universal AI System
          </h2>
          <p className="text-sm font-medium text-foreground/70 leading-relaxed mb-4">
            Global network scanning is enabled. The AI will autonomously find leads across Reddit, HackerNews, and Twitter by semantically matching their posts against your product description.
          </p>
          
          {product.searchQueries && product.searchQueries.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 mb-2">Generated AI Search Vectors</p>
              <div className="flex flex-wrap gap-2">
                {product.searchQueries.slice(0, 5).map((q, i) => (
                  <Badge key={i} variant="secondary" className="text-xs py-1 px-3 bg-secondary/50 text-secondary-foreground border-none">
                    "{q}"
                  </Badge>
                ))}
                {product.searchQueries.length > 5 && (
                  <span className="text-xs font-black text-muted-foreground/50 self-center">+{product.searchQueries.length - 5} more</span>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* AI Persona */}
      {product.aiConfig?.customPersona && (
        <section className="bg-primary/3 p-5 rounded-2xl border border-primary/10">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary/50 mb-2 flex items-center gap-1.5">
            <Zap className="w-3 h-3 fill-current" /> AI Persona
          </h2>
          <p className="text-sm font-medium italic text-foreground/70 leading-relaxed">
            "{product.aiConfig.customPersona}"
          </p>
        </section>
      )}
    </div>
  )
}
