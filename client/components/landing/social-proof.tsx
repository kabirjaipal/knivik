"use client"

import { motion } from "framer-motion"

export function PlatformSupport() {
  const platforms = [
    {
      name: "Reddit",
      icon: "https://www.redditstatic.com/desktop2x/img/favicon/favicon-32x32.png",
    },
    {
      name: "Twitter (X)",
      icon: "https://abs.twimg.com/favicons/twitter.2.ico",
    },
    { 
      name: "Hacker News", 
      icon: "https://news.ycombinator.com/favicon.ico" 
    },
    {
      name: "Indie Hackers",
      icon: "https://www.google.com/s2/favicons?domain=indiehackers.com&sz=64",
      comingSoon: true,
    },
    {
      name: "Dev.to",
      icon: "https://www.google.com/s2/favicons?domain=dev.to&sz=64",
      comingSoon: true,
    },
  ];

  // We duplicate the platforms to create a seamless infinite scroll loop
  const doubledPlatforms = [...platforms, ...platforms];

  return (
    <section className="py-12 md:py-16 border-y border-border/50 bg-secondary/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none select-none transform-gpu" />
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center gap-8 md:gap-10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 text-center">
            Monitoring High-Intent Leads Across
          </p>

          <div className="w-full overflow-hidden relative py-2">
            {/* Soft gradient masks for seamless sides */}
            <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
            
            <motion.div 
              className="flex items-center gap-8 md:gap-16 whitespace-nowrap w-max transform-gpu will-change-transform"
              animate={{ x: ["0%", "-50%"] }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              {doubledPlatforms.map((platform, i) => (
                <div
                  key={`${platform.name}-${i}`}
                  className="flex items-center gap-3 md:gap-4 opacity-75 hover:opacity-100 transition-all duration-300 group cursor-default"
                >
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-background/50 backdrop-blur-md flex items-center justify-center p-1.5 md:p-2 border border-border group-hover:border-primary/40 group-hover:shadow-2xl group-hover:shadow-primary/10 transition-all transform group-hover:scale-105">
                    <img
                      src={platform.icon}
                      alt={platform.name}
                      className={`w-full h-full object-contain ${platform.name === "Twitter (X)" ? "dark:invert" : ""}`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm md:text-base font-black tracking-tighter text-foreground/80 group-hover:text-foreground transition-colors">
                      {platform.name}
                    </span>
                    {platform.comingSoon && (
                      <span className="px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-[8px] font-black uppercase tracking-tighter text-primary whitespace-nowrap">
                        Soon
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
