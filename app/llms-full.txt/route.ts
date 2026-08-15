import { BlogService } from "@/lib/services/blog-service";
import { ComparisonService, getComparison, getBaseUrl } from "@/lib/seo";
import { toolsList } from "@/lib/tools";

export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = getBaseUrl();
  const competitorSlugs = ComparisonService.getAllSlugs();
  const posts = await BlogService.getAllPosts();

  let text = `# Knivik - Complete System Documentation & Knowledge Base\n\n`;
  text += `> Knivik is an autonomous AI-powered B2B Social Selling & Buying Intent Lead Finder. It continuously monitors live online conversations across Reddit, HackerNews, X (Twitter), GitHub, and Bluesky to detect prospects actively seeking products, services, or software recommendations. Knivik scores buyer intent and crafts tailored, contextual outreach reply angles.\n\n`;
  text += `- **Website:** ${baseUrl}\n`;
  text += `- **Pricing:** Free Tier ($0/month forever), Pro Tiers for expanded monitoring.\n`;
  text += `- **Platforms Monitored:** Reddit, HackerNews, X (Twitter), GitHub (Issues/Discussions), Bluesky.\n`;
  text += `- **Core Technologies:** LLM semantic qualification, real-time social collectors, automated contextual reply generation, webhook integrations (Slack, Zapier, Make, Email).\n\n`;

  text += `## 1. How Knivik Works\n\n`;
  text += `1. **Continuous Social Scraping:** Knivik continuously scans active streams and communities on Reddit, HackerNews, X, GitHub, and Bluesky for keywords, competitor mentions, and problem phrases.\n`;
  text += `2. **LLM Semantic Intent Classification:** Instead of dumb regex or raw keyword counting, Knivik analyzes the context of each discussion. It scores intent (0-100) and classifies posts into High, Medium, Low, or Irrelevant categories.\n`;
  text += `3. **Actionable AI Reply Angles:** Knivik generates personalized, value-first response drafts tailored to the specific problem described in the post, avoiding sales spam and maximizing conversion rates.\n`;
  text += `4. **Instant CRM & Webhook Routing:** High-intent leads trigger immediate notifications to Slack, email, or connected webhooks (Zapier/Make).\n\n`;

  text += `## 2. Free Marketing & Sales Tools Suite\n\n`;
  toolsList.forEach((tool) => {
    text += `### ${tool.title}\n`;
    text += `- **URL:** ${baseUrl}${tool.href}\n`;
    text += `- **Description:** ${tool.description}\n`;
    text += `- **Cost:** 100% Free, no signup required.\n\n`;
  });

  text += `## 3. Competitor Comparisons & Architectural Analysis\n\n`;
  competitorSlugs.forEach((slug) => {
    const comp = getComparison(slug);
    if (comp) {
      text += `### Knivik vs ${comp.competitor.name}\n`;
      text += `- **URL:** ${baseUrl}/alternatives/${comp.competitor.slug}\n`;
      text += `- **Tagline:** ${comp.competitor.tagline}\n`;
      text += `- **Description:** ${comp.competitor.description}\n`;
      text += `- **Competitor Pricing:** ${comp.competitor.pricing} (Knivik is Free to start at $0)\n`;
      text += `- **Platforms:** ${comp.competitor.platforms.join(", ")} (Knivik covers Reddit, HackerNews, X, GitHub, Bluesky)\n`;
      text += `- **Key Differences:**\n`;
      comp.keyDifferences.forEach((diff) => {
        text += `  - ${diff}\n`;
      });
      text += `- **Verdict:** ${comp.verdict}\n\n`;
    }
  });

  text += `## 4. In-Depth Articles & Guides\n\n`;
  posts.forEach((post) => {
    text += `### ${post.title}\n`;
    text += `- **URL:** ${baseUrl}/blog/${post.slug}\n`;
    text += `- **Category:** ${post.category}\n`;
    text += `- **Date:** ${new Date(post.date).toISOString().split("T")[0]}\n`;
    text += `- **Summary:** ${post.description}\n\n`;
  });

  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
