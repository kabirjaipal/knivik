export function SocialProof() {
  return (
    <section className="py-12 border-y border-border/40 bg-muted/5">
      <div className="container mx-auto px-4 max-w-7xl">
        <p className="text-center text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-10 opacity-50">
          Actively scanning the ecosystem
        </p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 hover:opacity-100 transition-opacity duration-500">
          <div className="flex items-center gap-3 grayscale group cursor-default">
            <div className="w-8 h-8 rounded bg-foreground/10 flex items-center justify-center font-black text-xs">R/</div>
            <span className="font-bold text-lg tracking-tight">Reddit</span>
          </div>
          <div className="flex items-center gap-3 grayscale group cursor-default">
            <div className="w-8 h-8 rounded bg-foreground/10 flex items-center justify-center font-black text-xs">Y</div>
            <span className="font-bold text-lg tracking-tight">HackerNews</span>
          </div>
          <div className="flex items-center gap-3 grayscale group cursor-default">
            <div className="w-8 h-8 rounded bg-foreground/10 flex items-center justify-center font-black text-xs">𝕏</div>
            <span className="font-bold text-lg tracking-tight">Twitter</span>
          </div>
          <div className="flex items-center gap-3 grayscale group cursor-default">
            <div className="w-8 h-8 rounded bg-foreground/10 flex items-center justify-center font-black text-xs">in</div>
            <span className="font-bold text-lg tracking-tight">LinkedIn</span>
          </div>
        </div>
      </div>
    </section>
  )
}
