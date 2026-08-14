"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { Search, Calendar, Clock, ArrowRight } from "lucide-react";
import { BlogPost } from "@/lib/blog/domain/blog.model";
import { Badge } from "@/components/ui/badge";

interface BlogClientProps {
  posts: BlogPost[];
  categories: string[];
}

export function BlogClient({ posts, categories }: BlogClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [, startTransition] = useTransition();

  const handleCategoryClick = (cat: string) => {
    startTransition(() => {
      setActiveCategory(cat);
    });
  };

  const filteredPosts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return posts.filter((post) => {
      const matchesCategory =
        activeCategory === "All" || post.category === activeCategory;
      if (!matchesCategory) return false;
      if (!q) return true;

      return (
        post.title.toLowerCase().includes(q) ||
        post.description.toLowerCase().includes(q) ||
        post.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [posts, activeCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Search & Category Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/10 pb-4">
        {/* Categories list */}
        <div className="flex flex-wrap gap-2 order-2 md:order-1">
          {["All", ...categories].map((cat) => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryClick(cat)}
                className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/10"
                    : "bg-background/40 border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:max-w-xs order-1 md:order-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Search guides or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-border/60 bg-background/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-xs sm:text-sm transition-all placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* Grid List of Posts */}
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <Link 
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border/40 bg-background/40 hover:bg-secondary/10 hover:border-primary/30 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5"
            >
              <div>
                {/* Image Section */}
                <div className="relative w-full overflow-hidden border-b border-border/20 bg-muted/20" style={{aspectRatio:'16/9'}}>
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-primary/95 hover:bg-primary/95 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 text-primary-foreground border-0 shadow">
                      {post.category}
                    </Badge>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground/75">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(post.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {post.readTime}
                    </span>
                  </div>

                  <h3 className="text-base font-black tracking-tight text-foreground group-hover:text-primary transition-colors leading-snug">
                    {post.title}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {post.description}
                  </p>
                </div>
              </div>

              {/* Card Footer (Author info) */}
              <div className="p-5 pt-0 border-t border-border/10 mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full border border-border/50 bg-primary/10 text-primary flex items-center justify-center text-[9px] font-black uppercase shrink-0">
                    {post.author.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {post.author.name}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Read
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center border border-dashed border-border/30 rounded-2xl bg-secondary/5">
          <p className="text-sm font-semibold text-muted-foreground">
            No articles found matching "{searchQuery}"
          </p>
        </div>
      )}
    </div>
  );
}
