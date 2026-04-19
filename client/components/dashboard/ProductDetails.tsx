"use client"

import { Hash, XCircle, Target, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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
  aiConfig?: any
}

interface ProductDetailsProps {
  product: Product
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const platforms = Array.from(new Set(product.sources.map((s) => s.platform)))

  return (
    <div className="space-y-8">
      {/* Description Section */}
      <section>
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2">Description</h2>
        <p className="text-sm font-medium leading-relaxed text-foreground/80">
          {product.description || "No description provided."}
        </p>
      </section>

      <div className="space-y-6">
        {/* Keywords */}
        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-3 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5" /> Keywords
          </h2>
          <div className="flex flex-wrap gap-2">
            {product.keywords.map((k) => (
              <Badge key={k.id} variant="secondary" className="text-xs py-1 px-3 bg-secondary/50 text-secondary-foreground hover:bg-secondary/70 border-none transition-colors">
                {k.keyword}
              </Badge>
            ))}
          </div>
        </section>

        {/* Negative Keywords */}
        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-3 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-destructive/60" /> Exclusions
          </h2>
          <div className="flex flex-wrap gap-2">
            {product.negativeKeywords.length > 0 ? (
              product.negativeKeywords.map((k) => (
                <Badge key={k.id} variant="outline" className="text-xs py-1 px-3 text-destructive border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors">
                  {k.keyword}
                </Badge>
              ))
            ) : (
              <p className="text-xs text-muted-foreground/40 italic">No exclusions defined</p>
            )}
          </div>
        </section>

        {/* Competitors */}
        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-3 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" /> Competitors
          </h2>
          <div className="flex flex-wrap gap-2">
            {product.competitors.length > 0 ? (
                product.competitors.map((c) => (
                <Badge key={c.id} variant="secondary" className="text-xs py-1 px-3 bg-secondary/50 text-secondary-foreground border-none">
                    {c.name}
                </Badge>
                ))
            ) : (
                <p className="text-xs text-muted-foreground/40 italic">None</p>
            )}
          </div>
        </section>

        {/* Platforms */}
        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-3 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-primary/60" /> Platforms
          </h2>
          <div className="flex flex-wrap gap-2">
            {platforms.map((p) => (
              <Badge key={p} className="text-[11px] font-bold uppercase tracking-wider bg-primary/10 text-primary hover:bg-primary/20 border-none px-3 py-1">
                {p}
              </Badge>
            ))}
          </div>
        </section>
      </div>

      {/* AI Persona */}
      {product.aiConfig?.customPersona && (
        <section className="bg-primary/[0.03] p-5 rounded-2xl border border-primary/10">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-primary/50 mb-2 flex items-center gap-1.5">
            <Zap className="w-3 h-3 fill-current" /> AI Persona
          </h2>
          <p className="text-[13px] font-medium italic text-foreground/70 leading-relaxed">
            "{product.aiConfig.customPersona}"
          </p>
        </section>
      )}
    </div>
  )
}
