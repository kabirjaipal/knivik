import { Metadata } from "next";
import { BlogService } from "@/lib/services/blog-service";
import { BlogClient } from "./blog-client";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { MetadataService, SchemaService } from "@/lib/seo";
import { SchemaScript } from "@/components/seo/schema-script";

export const metadata: Metadata = MetadataService.constructPageMetadata({
  title: "B2B Sales Lead Finder & Social Selling Blog",
  description: "Read the latest tips, guides, and strategies for social selling, automated buyer intent alerts, and building B2B pipelines on Reddit, HackerNews, and X.",
  path: "/blog",
  keywords: [
    "b2b sales blog",
    "social selling tips",
    "reddit marketing guide",
    "syften alternative reviews",
    "buyer intent alerts",
    "warm sales outreach",
  ]
});

export default async function BlogPage() {
  const posts = await BlogService.getAllPosts();
  const categories = await BlogService.getAllCategories();
  const breadcrumbItems = [
    { name: "Home", item: "/" },
    { name: "Blog", item: "/blog" },
  ];

  const collectionSchema = SchemaService.generateCollectionPageSchema({
    name: "Knivik B2B Sales & Social Selling Guides",
    description: "Actionable guides on social prospecting, buying intent scoring, and warm lead outreach.",
    path: "/blog",
  });

  return (
    <div className="flex flex-col min-h-screen">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <SchemaScript schema={collectionSchema} />

      <section className="pt-24 pb-12 bg-background relative overflow-hidden flex-grow">
        {/* Decorative Grid Background and Radial Glows */}
        <div className="absolute inset-0 bg-grid opacity-20 -z-10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[10%] w-[80%] h-[40%] rounded-[100%] bg-primary/10 blur-[120px]" />
        </div>

        <div className="container mx-auto px-6">
          {/* Hero Header */}
          <div className="flex flex-col items-center text-center mb-6 lg:mb-8 max-w-2xl mx-auto">
            <span className="text-primary font-black uppercase tracking-widest text-[9px] px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 mb-3 inline-block">
              Sales Growth Guides
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter text-foreground mb-3">
              Insights on Social Prospecting
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Read actionable B2B guides, case studies, and tutorials on finding leads, scoring intent, and drafting outreach copies.
            </p>
          </div>

          {/* Interactive Client Component list */}
          <BlogClient posts={posts} categories={categories} />
        </div>
      </section>
    </div>
  );
}
