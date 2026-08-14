import { BlogService } from "@/lib/blog/application/blog.service";
import { ComparisonService } from "@/lib/seo/application/comparison.service";
import { EnvConfig } from "@/lib/seo/infrastructure/env.config";

export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = EnvConfig.getBaseUrl();
  const posts = await BlogService.getAllPosts();
  const competitorSlugs = ComparisonService.getAllSlugs();

  let markdown = `# Knivik\n\n`;
  markdown += `> Knivik is an AI-powered Buying Intent Lead Finder that scans Reddit, HackerNews, and Twitter to detect people actively looking for products or solutions, scores their buying intent, and automatically suggests warm outreach replies.\n\n`;

  markdown += `## Core Pages\n`;
  markdown += `- [Home](${baseUrl}/): Main landing page.\n`;
  markdown += `- [Pricing](${baseUrl}/pricing): Pricing and subscription plans.\n`;
  markdown += `- [Tools](${baseUrl}/tools): Free SEO and outreach utilities directory.\n`;
  markdown += `- [Blog](${baseUrl}/blog): Sales growth guides and social selling tips.\n\n`;

  if (competitorSlugs.length > 0) {
    markdown += `## Competitor Alternatives & Comparisons\n`;
    competitorSlugs.forEach((slug) => {
      const formattedName = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      markdown += `- [${formattedName} Alternative](${baseUrl}/alternatives/${slug}): Comparison analysis.\n`;
    });
    markdown += `\n`;
  }

  if (posts.length > 0) {
    markdown += `## Blog Articles & Guides\n`;
    posts.forEach((post) => {
      markdown += `- [${post.title}](${baseUrl}/blog/${post.slug}): ${post.description}\n`;
    });
  }

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
