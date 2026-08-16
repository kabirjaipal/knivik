"use client";

import { useState, useEffect } from "react";
import { Sparkles, ArrowRight, X, Check, Copy } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const STORAGE_KEY = "knivik_promo_banner_v1";

export function AnnouncementBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const promoCode = "WELCOME20";

  useEffect(() => {
    const isDismissed = localStorage.getItem(STORAGE_KEY);
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const handleCopyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    toast.success(`Coupon code "${promoCode}" copied!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative z-50 w-full bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b border-primary/15 backdrop-blur-md select-none"
        >
          <div className="container mx-auto px-4 py-1.5 flex items-center justify-between gap-4">
            <div className="flex-1 flex items-center justify-center gap-2 text-xs sm:text-[13px] font-medium text-foreground/90 flex-wrap">
              <Badge
                variant="outline"
                className="bg-primary/15 text-primary border-primary/25 font-black uppercase text-[10px] tracking-wider py-0 px-2 h-5 gap-1"
              >
                <Sparkles className="h-2.5 w-2.5 fill-primary" />
                Launch Special
              </Badge>

              <span>
                Get <span className="font-bold text-foreground">20% off</span> Knivik Pro with
              </span>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={handleCopyCode}
                    className="h-6 px-2 font-mono font-bold text-xs text-primary border-border/80 hover:border-primary/50 hover:bg-background active:scale-95 transition-all shadow-2xs gap-1 rounded-md"
                  >
                    <span>{promoCode}</span>
                    {copied ? (
                      <Check className="h-3 w-3 text-success animate-in zoom-in" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground hover:text-primary transition-colors" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {copied ? "Copied!" : "Click to copy code"}
                </TooltipContent>
              </Tooltip>

              <span className="text-muted-foreground/50 hidden sm:inline">•</span>

              <Button
                asChild
                variant="link"
                size="xs"
                className="h-auto p-0 font-bold text-xs sm:text-[13px] text-primary hover:text-primary/80 transition-colors group"
              >
                <Link href={`/pricing?promo=${promoCode}`} className="flex items-center gap-1">
                  <span>Claim discount</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </Button>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleDismiss}
                  aria-label="Dismiss banner"
                  className="text-muted-foreground/60 hover:text-foreground hover:bg-foreground/5 h-6 w-6 rounded-md transition-colors shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Dismiss
              </TooltipContent>
            </Tooltip>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
