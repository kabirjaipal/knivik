import { MetadataService, SchemaService } from "@/lib/seo";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { SchemaScript } from "@/components/seo/schema-script";
import { AskHnFeedClient } from "./ask-hn-feed-client";

export const metadata = MetadataService.constructPageMetadata({
  title: "Free Ask HN Lead Finder Feed | Track HackerNews Buying Intent",
  description:
    "Scan HackerNews and Ask HN threads for real-time customer intent, tool suggestions, and hiring posts. Generate warm outreach pitches instantly.",
  path: "/tools/ask-hn-feed",
  keywords: [
    "hackernews lead finder",
    "ask hn leads",
    "social selling tool",
    "warm lead outreach",
    "hackernews buying intent",
    "track hn posts",
    "find clients on hn",
  ],
});

export default function AskHnFeedPage() {
  const breadcrumbs = [
    { name: "Home", item: "/" },
    { name: "Tools", item: "/tools" },
    { name: "Ask HN Lead Finder Feed", item: "/tools/ask-hn-feed" },
  ];

  const faqs = [
    {
      question: "How does the Ask HN Lead Finder Feed help find customers?",
      answer:
        "It scans, curates, and filters real HackerNews discussions where users ask for software recommendations, complain about current tools, or post hiring roles, helping you identify high-intent prospects.",
    },
    {
      question: "Can I customize the generated outreach templates?",
      answer:
        "Yes. You can use the built-in Pitch Customizer to enter your product name, value proposition, and CTA, which updates the suggested outreach pitches in real-time.",
    },
    {
      question: "Is this tool completely free?",
      answer:
        "Yes, the feed search and custom pitching are free to use. For real-time active alerts, auto-replies, and broader platform integrations, you can upgrade to Knivik Premium.",
    },
  ];

  const faqSchema = SchemaService.generateFAQSchema(faqs);
  const webAppSchema = SchemaService.generateWebApplicationSchema({
    name: "Ask HN Lead Finder Feed",
    description: "Scan HackerNews and Ask HN threads for real-time customer intent and tool suggestions.",
    path: "/tools/ask-hn-feed",
  });

  return (
    <div className="flex flex-col bg-background">
      <BreadcrumbJsonLd items={breadcrumbs} />
      <SchemaScript schema={faqSchema} />
      <SchemaScript schema={webAppSchema} />
      <AskHnFeedClient />
    </div>
  );
}
