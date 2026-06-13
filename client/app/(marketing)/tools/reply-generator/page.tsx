import { MetadataService } from "@/lib/seo/application/metadata.service";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { ReplyGeneratorClient } from "@/app/(marketing)/tools/reply-generator/ReplyGeneratorClient";

export const metadata = MetadataService.constructPageMetadata({
  title: "Free AI Outreach Reply Generator | Compile High-Converting DMs",
  description:
    "Generate highly personalized, high-converting outreach replies and social DMs for Reddit, HackerNews, X (Twitter), and LinkedIn posts in seconds.",
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

  return (
    <div className="flex flex-col bg-background">
      <BreadcrumbJsonLd items={breadcrumbs} />
      <ReplyGeneratorClient />
    </div>
  );
}
