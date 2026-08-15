import { Suspense } from "react";
import { MetadataService } from "@/lib/seo/application/metadata.service";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { SchemaScript } from "@/components/seo/schema-script";
import { SchemaService } from "@/lib/seo/application/schema.service";
import { SearchBuilderClient } from "@/app/(marketing)/tools/search-builder/SearchBuilderClient";

export const metadata = MetadataService.constructPageMetadata({
  title: "Free Social Search Operator Builder | Reddit, HackerNews & X Lead Finder",
  description: "Generate advanced Google, Reddit, HackerNews, and X (Twitter) search queries instantly. Find ready-to-buy customers, poach competitor accounts, and source warm leads for free.",
  path: "/tools/search-builder",
  keywords: [
    "reddit search operators",
    "advanced search operators reddit",
    "how to find clients on reddit",
    "twitter advanced search for leads",
    "hackernews lead finder",
    "social listening free tool",
    "find customers on reddit",
    "find clients on twitter",
    "b2b sales prospecting tools",
    "free lead generation tool",
    "gummysearch alternative free"
  ]
});

export default function SearchBuilderPage() {
  const breadcrumbs = [
    { name: "Home", item: "/" },
    { name: "Tools", item: "/tools" },
    { name: "Social Search Operator Builder", item: "/tools/search-builder" }
  ];

  const faqs = [
    {
      question: "What are social search operators?",
      answer: "Social search operators are special search queries (like site:reddit.com or title:'looking for') that filter search engine and platform indices to retrieve exact conversational matches. They help you find people asking for recommendations or expressing frustration with competitors."
    },
    {
      question: "How do I use this tool to find clients?",
      answer: "Enter your product niche, your competitors, and select an intent trigger. The tool generates tailored query strings. Click any platform button to run the query directly, or copy the string to use in search bars."
    },
    {
      question: "Is this social search tool free?",
      answer: "Yes, this tool is 100% free and runs entirely in your browser without requiring registration. For automated, 24/7 scanning, alerts, and AI qualification, you can sign up for a Knivik account."
    }
  ];

  const faqSchema = SchemaService.generateFAQSchema(faqs);
  const webAppSchema = SchemaService.generateWebApplicationSchema({
    name: "Social Search Operator Builder",
    description: "Generate advanced Google, Reddit, HackerNews, and X (Twitter) search queries instantly to find high-intent leads.",
    path: "/tools/search-builder",
  });

  return (
    <div className="flex flex-col bg-background">
      <BreadcrumbJsonLd items={breadcrumbs} />
      <SchemaScript schema={faqSchema} />
      <SchemaScript schema={webAppSchema} />
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <SearchBuilderClient />
      </Suspense>
    </div>
  );
}
