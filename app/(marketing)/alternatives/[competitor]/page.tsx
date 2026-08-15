import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { ComparisonService } from "@/lib/seo/application/comparison.service";
import { SchemaScript } from "@/components/seo/schema-script";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ competitor: string }>;
}

/**
 * Pre-renders paths at compile time for maximum speed.
 */
export async function generateStaticParams() {
  const slugs = ComparisonService.getAllSlugs();
  return slugs.map((slug) => ({
    competitor: slug,
  }));
}

/**
 * Dynamic metadata resolving.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  return ComparisonService.generateMetadata(resolvedParams.competitor);
}

export default async function CompetitorAlternativePage({ params }: PageProps) {
  const resolvedParams = await params;
  const comparisonData = ComparisonService.getComparison(resolvedParams.competitor);

  if (!comparisonData) {
    notFound();
  }

  const { competitor, features } = comparisonData;
  const allSlugs = ComparisonService.getAllSlugs();
  const otherSlugs = allSlugs.filter((s) => s !== competitor.slug).slice(0, 4);
  const otherComparisons = otherSlugs
    .map((s) => ComparisonService.getComparison(s))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);

  // Dynamic Schemas for maximum search engine crawl authority
  const breadcrumbsSchema = ComparisonService.generateBreadcrumbsSchema(comparisonData);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": (comparisonData.faq || []).map((f) => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.answer,
      },
    })),
  };

  return (
    <article className="relative w-full min-h-screen pt-28 pb-16 md:pt-36 md:pb-24 bg-background text-foreground">
      {/* Search Engine Structured Schema Scripts */}
      <SchemaScript schema={breadcrumbsSchema} />
      <SchemaScript schema={faqSchema} />

      <div className="container mx-auto px-6 max-w-4xl leading-relaxed">
        {/* Visual Breadcrumb Navigation */}
        <nav aria-label="Breadcrumbs" className="mb-6 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/alternatives" className="hover:text-foreground transition-colors">
            Alternatives
          </Link>
          <span>/</span>
          <span className="text-foreground font-bold">{competitor.name} Alternative</span>
        </nav>

        {/* Semantic H1 Header - Primary Keywords for Search Spiders */}
        <header className="mb-10 border-b border-border pb-6">
          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black uppercase tracking-widest px-3 py-1 mb-3 inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            2026 Comparison Review
          </Badge>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-foreground font-heading">
            Compare {competitor.name} vs Knivik: The Best AI Social Lead Finder Tool
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
            Discover a comprehensive B2B lead generation and automatic keyword alert comparison. Learn why Knivik offers a more intelligent, real-time AI social sales pipeline solution compared to {competitor.name}.
          </p>
        </header>

        {/* Competitor Overview Profile Card */}
        <section className="mb-10 rounded-2xl border border-border/60 bg-secondary/10 p-6" aria-label="Competitor Profile">
          <h2 className="text-lg sm:text-xl font-bold text-foreground font-heading mb-3">
            Overview of {competitor.name} for Social Lead Generation
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">
            {competitor.description}
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-muted-foreground mt-3">
            <li><strong>Starting Price Model:</strong> {competitor.pricing} (Knivik is completely free to start at $0 / forever)</li>
            <li><strong>Community Monitoring Coverage:</strong> {competitor.platforms.join(", ")} (Knivik monitors Reddit, HackerNews, X Twitter, GitHub, and Bluesky)</li>
            <li><strong>Average User Rating:</strong> {competitor.rating} / 5 stars across directory reviews</li>
          </ul>
        </section>

        {/* Key Differences Analysis */}
        <section className="mb-10" aria-label="Key Differences">
          <h2 className="text-lg sm:text-xl font-bold text-foreground font-heading mb-3">
            Key Differences: Why Knivik is the Superior Community Sales Alert Engine
          </h2>
          <ul className="list-disc pl-5 space-y-2.5 text-xs sm:text-sm text-muted-foreground">
            {comparisonData.keyDifferences.map((diff, index) => {
              const parts = diff.split(":");
              const title = parts[0];
              const desc = parts.slice(1).join(":");
              return (
                <li key={index} className="leading-relaxed">
                  <span className="text-foreground font-semibold font-heading">{title}:</span>
                  {desc || diff}
                </li>
              );
            })}
          </ul>
        </section>

        {/* Feature-by-Feature Text Comparison (Highly crawlable by indexing algorithms) */}
        <section className="mb-10 space-y-6" aria-label="Feature Comparison">
          <h2 className="text-lg sm:text-xl font-bold text-foreground font-heading mb-2">
            Technical Feature Breakdown: Knivik vs {competitor.name}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">
            A granular comparison of B2B social selling parameters, AI capabilities, and database pipelines:
          </p>
          
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="border-t border-border pt-4">
                <h3 className="text-xs sm:text-sm font-bold text-foreground mb-1">{feature.name}</h3>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed mb-2">{feature.description}</p>
                
                <ul className="list-none pl-4 space-y-1 text-xs text-muted-foreground">
                  <li className="leading-relaxed">
                    <strong className="text-foreground">Knivik:</strong> Yes. Automated B2B semantic intent monitoring and AI pipelines are natively integrated.
                  </li>
                  <li className="leading-relaxed">
                    <strong className="text-foreground">{competitor.name}:</strong> {feature.competitorHas 
                      ? "Yes. Supports rules-based keyword alert triggers." 
                      : `No. Lacks native conversational AI or B2B sales automation capabilities.`}
                  </li>
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Analytical Verdict */}
        <section className="mb-10 rounded-2xl border border-primary/30 bg-primary/5 p-6" aria-label="Verdict">
          <h2 className="text-lg sm:text-xl font-bold text-foreground font-heading mb-3">The Final Verdict</h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {comparisonData.verdict}
          </p>
        </section>

        {/* crawlable FAQ Block (Matches JSON-LD FAQ Schema exactly) */}
        {(comparisonData.faq || []).length > 0 && (
          <section className="mb-12 border-t border-border pt-6" aria-label="FAQ">
            <h2 className="text-lg sm:text-xl font-bold text-foreground font-heading mb-4">
              Frequently Asked Questions & Answers
            </h2>
            <div className="space-y-5">
              {(comparisonData.faq || []).map((f, index) => (
                <div key={index} className="space-y-1.5 rounded-xl border border-border/50 bg-background/50 p-4">
                  <h3 className="text-xs sm:text-sm font-bold text-foreground leading-snug">
                    {f.question}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                    {f.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Competitor Comparisons Cluster */}
        {otherComparisons.length > 0 && (
          <section className="mb-12 border-t border-border pt-8" aria-label="Related Comparisons">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Other Lead Generation Alternatives to Explore
              </h2>
              <Link href="/alternatives" className="text-xs font-bold text-primary hover:underline">
                View all alternatives →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {otherComparisons.map((c) => (
                <Link
                  key={c.competitor.slug}
                  href={`/alternatives/${c.competitor.slug}`}
                  className="p-4 rounded-xl border border-border/60 bg-secondary/10 hover:border-primary/40 hover:bg-secondary/20 transition-all flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-sm font-bold text-foreground mb-1">
                      {c.competitor.name} vs Knivik
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {c.competitor.tagline}
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-primary mt-3 inline-flex items-center gap-1">
                    Read comparison <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* High-Converting CTA Box */}
        <section className="rounded-2xl border border-border/80 bg-background p-8 text-center shadow-sm">
          <h2 className="text-xl sm:text-2xl font-black text-foreground mb-2">
            Switch to Knivik for AI-Powered Social Selling
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
            Stop drowning in keyword spam. Start discovering real people actively looking for what you sell.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register">
              <Button size="sm" className="h-10 px-6 text-xs font-black rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground">
                Start Free ($0 / mo)
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
            <Link href="/tools">
              <Button variant="outline" size="sm" className="h-10 px-6 text-xs font-bold rounded-lg border-border/80">
                Try Free Tools Suite
              </Button>
            </Link>
          </div>
        </section>

        {/* Structured Crawler Footnote Disclaimer */}
        <footer className="border-t border-border pt-6 mt-12 text-center">
          <p className="text-[9px] text-muted-foreground/45 leading-relaxed">
            Disclaimer: Competitor pricing, features, ratings, and supported channels are compiled from publicly available official sites, documentation directories, G2, and Capterra reviews as of 2026. Trademarks belong to their respective owners and are cited solely for comparison purposes.
          </p>
        </footer>
      </div>
    </article>
  );
}
