import { MetadataService, SchemaService } from "@/lib/seo";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { SchemaScript } from "@/components/seo/schema-script";
import { WarmthAuditorClient } from "./warmth-auditor-client";

export const metadata = MetadataService.constructPageMetadata({
  title: "Free Outreach Warmth & Spam Auditor | Improve Cold Messages",
  description:
    "Audit your outreach messages for warmth, trust, and spam risk. Get instant scoring and rewrite suggestions to improve reply rates.",
  path: "/tools/warmth-auditor",
  keywords: [
    "outreach message checker",
    "cold message spam score",
    "sales message warmth score",
    "cold outreach improvement",
    "email outreach audit",
    "spammy message detector",
    "reply rate optimizer",
  ],
});

export default function WarmthAuditorPage() {
  const breadcrumbs = [
    { name: "Home", item: "/" },
    { name: "Tools", item: "/tools" },
    { name: "Outreach Warmth & Spam Auditor", item: "/tools/warmth-auditor" },
  ];

  const faqs = [
    {
      question: "How does the warmth score work?",
      answer:
        "The warmth score estimates how human, respectful, and context-aware your message sounds by checking signals like empathy, personalization, and clarity.",
    },
    {
      question: "What increases spam risk in outreach?",
      answer:
        "Pushy calls-to-action, hype words, excessive links, and urgency-heavy phrasing can increase spam risk and reduce trust.",
    },
    {
      question: "Can I use this for social DMs and cold emails?",
      answer:
        "Yes. The scoring is channel-agnostic and works for most text outreach formats where tone and trust matter.",
    },
  ];

  const faqSchema = SchemaService.generateFAQSchema(faqs);
  const webAppSchema = SchemaService.generateWebApplicationSchema({
    name: "Outreach Warmth & Spam Auditor",
    description: "Free tool to audit cold outreach email drafts and social DMs for warmth, trust, and spam risk.",
    path: "/tools/warmth-auditor",
  });

  return (
    <div className="flex flex-col bg-background">
      <BreadcrumbJsonLd items={breadcrumbs} />
      <SchemaScript schema={faqSchema} />
      <SchemaScript schema={webAppSchema} />
      <WarmthAuditorClient />
    </div>
  );
}
