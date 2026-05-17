import { Metadata } from "next";
import PricingClient from "./pricing-client";
import { MetadataService } from "@/lib/seo/application/metadata.service";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";

export const metadata: Metadata = MetadataService.constructPageMetadata({
  title: "Simple, Transparent Pricing Plans",
  description: "Get started for free or upgrade to find high-intent buyers on Reddit, Twitter, and HackerNews automatically. Scalable lead generation for startups and marketing agencies.",
  path: "/pricing",
});

export default function PricingPage() {
  const breadcrumbItems = [
    { name: "Home", item: "/" },
    { name: "Pricing", item: "/pricing" },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <PricingClient />
    </>
  );
}

