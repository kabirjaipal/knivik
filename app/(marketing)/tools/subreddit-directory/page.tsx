import { MetadataService, SchemaService } from "@/lib/seo";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { SchemaScript } from "@/components/seo/schema-script";
import { SubredditDirectoryClient } from "./subreddit-directory-client";

export const metadata = MetadataService.constructPageMetadata({
  title: "Free Subreddit Niche Lead Directory | Sourcing Social Leads",
  description:
    "Explore high-value subreddits categorized by business niche. View active subscriber sizes, common pain points, intent triggers, and launch search builders.",
  path: "/tools/subreddit-directory",
  keywords: [
    "subreddit lead directory",
    "reddit marketing list",
    "subreddit target audience",
    "social selling subreddits",
    "find leads on reddit",
    "b2b marketing subreddits",
  ],
});

export default function SubredditDirectoryPage() {
  const breadcrumbs = [
    { name: "Home", item: "/" },
    { name: "Tools", item: "/tools" },
    { name: "Subreddit Niche Lead Directory", item: "/tools/subreddit-directory" },
  ];

  const faqs = [
    {
      question: "How is the Subreddit Niche Lead Directory structured?",
      answer:
        "It groups the most active marketing, technology, sales, and freelance subreddits by business niche, highlighting customer pain points and intent query triggers for each community.",
    },
    {
      question: "Can I directly search keywords in these subreddits?",
      answer:
        "Yes. You can click 'Launch Search Operator' on any card to open our Search Builder tool, pre-populated with niche-specific keywords and competitor targets for that exact community.",
    },
    {
      question: "What are the common niches covered?",
      answer:
        "We cover SaaS & Tech, eCommerce, DevTools, Freelance & Agency, and Marketing subreddits where buyers actively ask for tool recommendations.",
    },
  ];

  const faqSchema = SchemaService.generateFAQSchema(faqs);
  const webAppSchema = SchemaService.generateWebApplicationSchema({
    name: "Subreddit Niche Lead Directory",
    description: "Explore high-value subreddits categorized by business niche with common pain points and triggers.",
    path: "/tools/subreddit-directory",
  });

  return (
    <div className="flex flex-col bg-background">
      <BreadcrumbJsonLd items={breadcrumbs} />
      <SchemaScript schema={faqSchema} />
      <SchemaScript schema={webAppSchema} />
      <SubredditDirectoryClient />
    </div>
  );
}
