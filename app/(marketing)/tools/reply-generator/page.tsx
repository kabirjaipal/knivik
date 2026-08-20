import { MetadataService, SchemaService } from "@/lib/seo";
import { SchemaScript } from "@/components/seo/schema-script";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { ReplyGeneratorClient } from "./reply-generator-client";

export const metadata = MetadataService.constructPageMetadata({
  title: "Free AI Outreach Reply Generator | High-Converting DMs",
  description:
    "Generate highly personalized, high-converting outreach replies and social DMs for Reddit, HackerNews, and X (Twitter) posts in seconds.",
  path: "/tools/reply-generator",
  keywords: [
    "outreach message generator",
    "reddit dm writer",
    "twitter reply generator",
    "hackernews buyer intent response",
    "free social selling tool",
    "cold dm templates",
    "b2b sales copy maker",
  ],
});

export default function ReplyGeneratorPage() {
  const breadcrumbs = [
    { name: "Home", item: "/" },
    { name: "Tools", item: "/tools" },
    { name: "Outreach Reply Generator", item: "/tools/reply-generator" },
  ];

  const faqs = [
    {
      question: "How does the AI Outreach Reply Generator create personalized messages?",
      answer:
        "It analyzes the original post or discussion topic, identifies the poster's underlying pain point, and formats an empathetic, value-first response that naturally introduces your solution without sounding salesy.",
    },
    {
      question: "Can I use this for Reddit comments and Twitter/X replies?",
      answer:
        "Yes! The tool generates formats suitable for Reddit comments, direct messages, HackerNews discussions, and X (Twitter) replies.",
    },
    {
      question: "Is this reply generator tool free?",
      answer:
        "Yes, this tool is 100% free to use in your browser. For automated lead discovery and auto-generated reply angles across thousands of live threads, you can sign up for Knivik.",
    },
  ];

  const faqSchema = SchemaService.generateFAQSchema(faqs);
  const webAppSchema = SchemaService.generateWebApplicationSchema({
    name: "AI Outreach Reply Generator",
    description: "Free tool to generate personalized, high-converting outreach replies and social DMs.",
    path: "/tools/reply-generator",
  });

  return (
    <div className="flex flex-col bg-background">
      <BreadcrumbJsonLd items={breadcrumbs} />
      <SchemaScript schema={faqSchema} />
      <SchemaScript schema={webAppSchema} />
      <ReplyGeneratorClient />
    </div>
  );
}

