import { BlogService } from "@/lib/services/blog-service";
import { ComparisonService, getBaseUrl } from "@/lib/seo";
import { toolsList } from "@/lib/tools";

export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = getBaseUrl();
  const posts = await BlogService.getAllPosts();
  const competitorSlugs = ComparisonService.getAllSlugs();

  let markdown = `# Knivik\n\n`;
  markdown += `> Knivik is an AI-powered Buying Intent Lead Finder and social selling intelligence platform. It continuously monitors live online conversations across Reddit, HackerNews, and X (Twitter) to detect prospects actively seeking products, services, or software recommendations. Knivik scores buyer intent and crafts tailored, contextual outreach reply angles.\n\n`;
  markdown += `For full documentation, deep feature comparisons, and comprehensive articles, see: [Full Knowledge Text](${baseUrl}/llms-full.txt)\n\n`;

  markdown += `## Product Overview\n`;
  markdown += `- **Category:** AI Lead Generation, Social Selling, Buyer Intent Intelligence, B2B Prospecting.\n`;
  markdown += `- **Target Users:** Startup founders, B2B sales teams, growth marketers, marketing agencies, SaaS builders, and freelancers.\n`;
  markdown += `- **Supported Channels:** Reddit, HackerNews, and X (Twitter).\n`;
  markdown += `- **Core Value Proposition:** Cuts through noisy keyword alerts by using LLM semantic understanding to identify high-intent buyers (e.g., "looking for an alternative to X", "recommend me a tool for Y") and draft conversion-ready outreach replies.\n`;
  markdown += `- **Pricing:** Free tier available ($0/month forever) with scalable paid Pro tiers for heavy monitoring and unlimited tracking.\n\n`;

  markdown += `## Core Pages\n`;
  markdown += `- [Home](${baseUrl}/): Main landing page and platform features.\n`;
  markdown += `- [Pricing](${baseUrl}/pricing): Detailed subscription pricing and plan comparisons.\n`;
  markdown += `- [Alternatives Hub](${baseUrl}/alternatives): Comprehensive directory comparing Knivik to legacy tools.\n`;
  markdown += `- [Free Tools Suite](${baseUrl}/tools): Free SEO utilities, Reddit keyword search builder, and social selling tools.\n`;
  markdown += `- [Blog](${baseUrl}/blog): In-depth guides on social lead generation, finding clients on Reddit, and outreach strategies.\n`;
  markdown += `- [Contact](${baseUrl}/contact): Support and business inquiries.\n\n`;

  markdown += `## Free Interactive Tools\n`;
  toolsList.forEach((tool) => {
    markdown += `- [${tool.title}](${baseUrl}${tool.href}): ${tool.description}\n`;
  });
  markdown += `\n`;

  if (competitorSlugs.length > 0) {
    markdown += `## Competitor Alternatives & Comparisons\n`;
    competitorSlugs.forEach((slug) => {
      const formattedName = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      markdown += `- [${formattedName} Alternative](${baseUrl}/alternatives/${slug}): Side-by-side comparison with ${formattedName}.\n`;
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
