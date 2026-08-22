import { Metadata } from "next";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth-client";
import { MetadataService, SchemaService, siteConfig } from "@/lib/seo";
import { SchemaScript } from "@/components/seo/schema-script";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { CortexLandingClient } from "./cortex-landing-client";

export const metadata: Metadata = MetadataService.constructPageMetadata({
  title: "Cortex AI | Autonomous AI Lead Hunter & Social Prospecting Agent",
  description: "Cortex AI is Knivik's autonomous AI Growth Agent that hunts live leads on Reddit, HackerNews, and X (Twitter), scores buyer intent in real-time, and drafts high-converting outreach.",
  path: "/cortex",
  keywords: [
    "Cortex AI",
    "Knivik Cortex",
    "autonomous lead generation agent",
    "AI SDR",
    "AI lead hunter",
    "live Reddit lead scraper agent",
    "AI sales copilot",
    "autonomous social prospecting",
    "AI buying intent hunter",
    "real-time social lead finder agent",
    ...siteConfig.keywords.slice(0, 20),
  ],
});

export default async function CortexPage() {
  const { data: session } = await getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  const user = session?.user;

  // Structured SoftwareApplication schema for Cortex AI
  const agentAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${siteConfig.url}/cortex#agent`,
    name: "Cortex AI - Autonomous Lead Hunter & Social Prospecting Agent",
    description:
      "Conversational AI SDR and real-time social prospecting agent that hunts Reddit, HackerNews, and Twitter for high-intent B2B sales leads.",
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Sales Intelligence & AI Agents",
    operatingSystem: "Web, Cloud",
    url: `${siteConfig.url}/cortex`,
    screenshot: `${siteConfig.url}/og-image.png`,
    author: {
      "@type": "Organization",
      name: "Knivik",
      url: siteConfig.url,
    },
    offers: {
      "@type": "Offer",
      price: "0.00",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    featureList: [
      "Live ad-hoc Reddit, HackerNews, and Twitter lead discovery",
      "Autonomous 0-100 buying intent scoring with Zod validation",
      "1-click workspace lead funnel ingestion",
      "Natural-language workspace pipeline search and analytics",
      "Contextual, non-salesy warm outreach reply drafting",
      "Anti-detection scraper defense with jitter and proxy fallbacks",
    ],
  };

  const breadcrumbItems = [
    { name: "Home", item: "/" },
    { name: "Cortex AI Agent", item: "/cortex" },
  ];

  return (
    <>
      <SchemaScript schema={agentAppSchema} />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <CortexLandingClient user={user} />
    </>
  );
}
