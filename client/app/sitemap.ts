import { MetadataRoute } from "next";
import { EnvConfig } from "@/lib/seo/infrastructure/env.config";
import { ComparisonService } from "@/lib/seo/application/comparison.service";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/pricing",
    "/contact",
    "/terms",
    "/privacy",
    "/refund-policy",
    "/tools",
    "/tools/search-builder",
    "/tools/warmth-auditor",
    "/tools/testimonial-generator",
    "/tools/ask-hn-feed",
    "/tools/subreddit-directory",
  ].map((route) => ({
    url: EnvConfig.resolveUrl(route),
    lastModified: new Date().toISOString().split("T")[0],
    changeFrequency: "weekly" as const,
    priority: route === "" || route === "/tools" ? 1.0 : 0.8,
  }));

  // Dynamically resolve comparison page routes for search-engine indexing
  const competitorSlugs = ComparisonService.getAllSlugs();
  const comparisonRoutes = competitorSlugs.map((slug) => ({
    url: EnvConfig.resolveUrl(`/alternatives/${slug}`),
    lastModified: new Date().toISOString().split("T")[0],
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...comparisonRoutes];
}
