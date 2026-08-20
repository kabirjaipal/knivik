import { Metadata } from "next";
import PricingClient from "./pricing-client";
import { MetadataService } from "@/lib/seo";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { getPrices } from "@/lib/billing";

export const metadata: Metadata = MetadataService.constructPageMetadata({
  title: "Simple, Transparent Pricing Plans",
  description: "Get started for free or upgrade to find high-intent buyers on Reddit, HackerNews, and Twitter (X) automatically. Scalable lead generation for startups and marketing agencies.",
  path: "/pricing",
});

export const revalidate = 3600; // Revalidate every hour

export default async function PricingPage() {
  const prices = await getPrices();
  const breadcrumbItems = [
    { name: "Home", item: "/" },
    { name: "Pricing", item: "/pricing" },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <PricingClient initialPrices={prices} />
    </>
  );
}

