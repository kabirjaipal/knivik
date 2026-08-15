import { MetadataRoute } from "next";
import { resolveUrl, ComparisonService } from "@/lib/seo";
import { BlogService } from "@/lib/services/blog-service";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/pricing",
    "/alternatives",
    "/tools",
    "/tools/search-builder",
    "/tools/reply-generator",
    "/tools/warmth-auditor",
    "/tools/testimonial-generator",
    "/tools/ask-hn-feed",
    "/tools/subreddit-directory",
    "/blog",
    "/contact",
    "/terms",
    "/privacy",
    "/refund-policy",
  ].map((route) => ({
    url: resolveUrl(route),
    lastModified: new Date().toISOString().split("T")[0],
    changeFrequency: (route === "" || route === "/blog" ? "daily" : "weekly") as "daily" | "weekly",
    priority: route === "" ? 1.0 : route === "/alternatives" || route === "/tools" || route === "/blog" || route === "/pricing" ? 0.9 : 0.8,
  }));

  // Dynamically resolve comparison page routes for search-engine indexing
  const competitorSlugs = ComparisonService.getAllSlugs();
  const comparisonRoutes = competitorSlugs.map((slug) => ({
    url: resolveUrl(`/alternatives/${slug}`),
    lastModified: new Date().toISOString().split("T")[0],
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Dynamically resolve blog post routes for search-engine indexing
  const posts = await BlogService.getAllPosts();
  const blogRoutes = posts.map((post) => {
    const dateStr = typeof post.date === 'string' ? post.date : new Date(post.date).toISOString().split('T')[0];
    return {
      url: resolveUrl(`/blog/${post.slug}`),
      lastModified: dateStr,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    };
  });

  return [...staticRoutes, ...comparisonRoutes, ...blogRoutes];
}
