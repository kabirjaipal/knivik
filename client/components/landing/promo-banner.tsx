"use client";

import { useState } from "react";
import { X, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export function PromoBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative isolate flex items-center justify-center gap-x-6 overflow-hidden bg-[#05010d] px-6 py-2.5 border-b border-primary/20">
      {/* Premium Ambient Glow */}
      <div className="absolute left-1/2 top-1/2 -z-10 h-full w-full -translate-x-1/2 -translate-y-1/2 [background:radial-gradient(50%_50%_at_50%_50%,rgba(168,85,247,0.1)_0%,transparent_100%)] animate-pulse" />
      
      {/* Moving Light Streak */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[sweep_5s_infinite] bg-linear-to-r from-transparent via-primary/5 to-transparent skew-x-[-20deg]" />
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-3">
          <div className="relative flex h-6 w-6 items-center justify-center">
            <div className="absolute inset-0 bg-primary/20 blur-md rounded-full animate-ping" />
            <div className="relative flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary border border-primary/30">
              <Sparkles className="h-3 w-3 fill-primary" />
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/80 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">
            Launch Special
          </span>
        </div>

        <p className="text-sm text-indigo-50/90 font-medium">
          Unlock 20% off Pro plans with code{" "}
          <span className="group relative inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-0.5 text-xs font-black text-white border border-white/10 transition-all hover:border-primary/50 hover:bg-primary/10 overflow-hidden">
            <span className="text-primary">LAUNCH20</span>
            <span className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1s_infinite] bg-linear-to-r from-transparent via-white/10 to-transparent" />
          </span>
        </p>

        <Link 
          href="/pricing" 
          className="group/link flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-primary-foreground/60 hover:text-primary transition-all duration-300"
        >
          Claim Now
          <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover/link:translate-x-1" />
        </Link>
      </div>

      <div className="flex flex-1 justify-end sm:absolute sm:right-6">
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="p-1 rounded-full text-indigo-300/30 hover:text-primary hover:bg-primary/10 transition-all"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <style jsx global>{`
        @keyframes sweep {
          0% { transform: translateX(-100%) skewX(-20deg); }
          50% { transform: translateX(200%) skewX(-20deg); }
          100% { transform: translateX(200%) skewX(-20deg); }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
