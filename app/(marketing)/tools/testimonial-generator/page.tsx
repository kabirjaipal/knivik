import { MetadataService } from "@/lib/seo/application/metadata.service";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { SchemaScript } from "@/components/seo/schema-script";
import { SchemaService } from "@/lib/seo/application/schema.service";
import { TestimonialGeneratorClient } from "@/app/(marketing)/tools/testimonial-generator/TestimonialGeneratorClient";

export const metadata = MetadataService.constructPageMetadata({
  title: "Free Reddit & HackerNews Testimonial Card Generator | Turn Quotes Into Social Proof",
  description:
    "Generate polished testimonial cards from Reddit and HackerNews quotes. Copy the text, preview the design, and download a shareable SVG card for free.",
  path: "/tools/testimonial-generator",
  keywords: [
    "testimonial card generator",
    "reddit testimonial generator",
    "hackernews testimonial card",
    "social proof card maker",
    "customer quote image generator",
    "free marketing design tool",
    "download testimonial svg",
  ],
});

export default function TestimonialGeneratorPage() {
  const breadcrumbs = [
    { name: "Home", item: "/" },
    { name: "Tools", item: "/tools" },
    {
      name: "Testimonial Card Generator",
      item: "/tools/testimonial-generator",
    },
  ];

  const faqs = [
    {
      question: "What does the testimonial card generator do?",
      answer:
        "It turns a quote, author handle, source platform, and optional product tag into a polished testimonial card preview you can copy or download.",
    },
    {
      question: "Can I use Reddit or HackerNews quotes?",
      answer:
        "Yes. The tool is designed for Reddit and HackerNews quotes and lets you keep the source visible for credibility.",
    },
    {
      question: "Do I need design software to use it?",
      answer:
        "No. You can preview, copy, and download the card directly in the browser without installing anything.",
    },
  ];

  const faqSchema = SchemaService.generateFAQSchema(faqs);
  const webAppSchema = SchemaService.generateWebApplicationSchema({
    name: "Reddit & HackerNews Testimonial Card Generator",
    description: "Free tool to generate polished testimonial cards from Reddit and HackerNews quotes.",
    path: "/tools/testimonial-generator",
  });

  return (
    <div className="flex flex-col bg-background">
      <BreadcrumbJsonLd items={breadcrumbs} />
      <SchemaScript schema={faqSchema} />
      <SchemaScript schema={webAppSchema} />
      <TestimonialGeneratorClient />
    </div>
  );
}
