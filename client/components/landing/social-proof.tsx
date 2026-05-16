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
    { name: "Hacker News", icon: "https://news.ycombinator.com/favicon.ico" },
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

  return (
    <section className="py-16 border-y border-border/50 bg-secondary/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-5" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center gap-12">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 text-center">
            Monitoring High-Intent Signals Across
          </p>

          <div className="w-full relative">
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 md:gap-x-24 whitespace-nowrap">
              {platforms.map((platform, i) => (
                <div
                  key={`${platform.name}-${i}`}
                  className="flex items-center gap-4 opacity-70 hover:opacity-100 transition-all duration-300 group cursor-default relative"
                >
                  <div className="w-10 h-10 rounded-xl bg-background/50 backdrop-blur-md flex items-center justify-center p-2 border border-border group-hover:border-primary/40 group-hover:shadow-2xl group-hover:shadow-primary/10 transition-all transform group-hover:scale-110">
                    <img
                      src={platform.icon}
                      alt={platform.name}
                      className={`w-full h-full object-contain ${platform.name === "Twitter (X)" ? "dark:invert-0" : ""}`}
                    />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black tracking-tighter text-foreground/70 group-hover:text-foreground transition-colors">
                        {platform.name}
                      </span>
                      {platform.comingSoon && (
                        <span className="px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-[8px] font-black uppercase tracking-tighter text-primary">
                          Soon
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
