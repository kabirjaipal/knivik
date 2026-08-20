import React from "react";
import { FaReddit, FaHackerNews, FaLinkedin } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { Sparkles } from "lucide-react";

export function PlatformSupport() {
  const platforms = [
    {
      name: "Reddit",
      icon: FaReddit,
      tag: "Live Monitoring",
      description: "Subreddits & buyer discussion threads",
      status: "active",
    },
    {
      name: "Twitter / X",
      icon: FaXTwitter,
      tag: "Live Monitoring",
      description: "Conversations, mentions & pain points",
      status: "active",
    },
    { 
      name: "Hacker News", 
      icon: FaHackerNews,
      tag: "Live Monitoring",
      description: "Ask HN discussions & founder posts",
      status: "active",
    },
    {
      name: "LinkedIn",
      icon: FaLinkedin,
      tag: "Coming Soon",
      description: "B2B professional feed signals",
      status: "soon",
    },
  ];

  return (
    <section className="py-16 md:py-24 border-y border-border/50 bg-secondary/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none select-none" />
      <div className="container mx-auto px-6 relative z-10 max-w-6xl">
        <div className="flex flex-col items-center text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-6 border border-primary/20">
            <Sparkles className="h-3 w-3" />
            Supported Channels
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground mb-4">
            Monitoring High-Intent Conversations 24/7
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl font-medium">
            Knivik continuously scans active communities for buying signals, competitor complaints, and recommendation requests.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            const isSoon = platform.status === "soon";
            return (
              <div
                key={platform.name}
                className="flex flex-col p-6 rounded-2xl bg-card border border-border/60 hover:border-border transition-all duration-200 shadow-sm group"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-foreground border border-border/50 transition-colors group-hover:border-primary/30">
                    <Icon className="w-6 h-6" />
                  </div>
                  {isSoon ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-secondary border border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Soon
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1.5">
                    {platform.name}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                    {platform.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
