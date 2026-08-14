import { MetadataService } from "@/lib/seo/application/metadata.service";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { SchemaScript } from "@/components/seo/schema-script";
import { SchemaService } from "@/lib/seo/application/schema.service";
import { WarmthAuditorClient } from "@/app/(marketing)/tools/warmth-auditor/WarmthAuditorClient";

export const metadata = MetadataService.constructPageMetadata({
  title: "Free Outreach Warmth & Spam Auditor | Improve Cold Messages",
  description:
    "Audit your outreach messages for warmth, trust, and spam risk. Get instant scoring and rewrite suggestions to improve reply rates.",
  path: "/tools/warmth-auditor",
  keywords: [
    "outreach message checker",
    "cold message spam score",
    "sales message warmth score",
    "linkedin outreach improvement",
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
      question: "Can I use this for LinkedIn, email, and Reddit DMs?",
      answer:
        "Yes. The scoring is channel-agnostic and works for most text outreach formats where tone and trust matter.",
    },
  ];

  const faqSchema = SchemaService.generateFAQSchema(faqs);

  return (
    <div className="flex flex-col bg-background">
      <BreadcrumbJsonLd items={breadcrumbs} />
      <SchemaScript schema={faqSchema} />
      <WarmthAuditorClient />
    </div>
  );
}
