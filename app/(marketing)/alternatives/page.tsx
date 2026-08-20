import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, XCircle, Sparkles, Shield, Zap, Search, Layers } from "lucide-react";
import { ComparisonService, MetadataService, SchemaService, getComparison } from "@/lib/seo";
import { SchemaScript } from "@/components/seo/schema-script";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = MetadataService.constructPageMetadata({
  title: "Best Social Selling & AI Lead Finder Alternatives in 2026",
  description:
    "Compare Knivik against top social listening tools, Reddit keyword alerts, and B2B prospecting platforms like Syften, GummySearch, Brand24, Apollo, and F5Bot.",
  path: "/alternatives",
  keywords: [
    "social selling alternatives",
    "reddit lead generation tools",
    "syften alternative",
    "gummysearch alternative",
    "f5bot alternative",
    "brand24 alternative",
    "apollo alternative",
    "best ai lead finder",
    "buyer intent software comparison",
    "social media monitoring alternatives",
  ],
});

export default function AlternativesHubPage() {
  const slugs = ComparisonService.getAllSlugs();
  const comparisons = slugs
    .map((slug) => getComparison(slug))
    .filter((comp): comp is NonNullable<typeof comp> => comp !== undefined);

  const breadcrumbs = [
    { name: "Home", item: "/" },
    { name: "Alternatives", item: "/alternatives" },
  ];

  const collectionSchema = SchemaService.generateCollectionPageSchema({
    name: "Knivik Competitor Comparisons & Alternatives Directory",
    description:
      "Comprehensive side-by-side comparisons of Knivik versus major B2B lead generation, social listening, and Reddit monitoring software.",
    path: "/alternatives",
  });

  const faqs = [
    {
      question: "How does Knivik compare to traditional keyword monitoring tools?",
      answer:
        "Traditional tools like F5Bot and Syften rely strictly on exact keyword matching, creating alert spam. Knivik uses LLM semantic intent analysis to evaluate context, distinguish genuine buyers from casual mentions, and draft customized outreach replies.",
    },
    {
      question: "How is Knivik different from static B2B databases like Apollo or Cognism?",
      answer:
        "Databases like Apollo provide static contact emails for cold outbound. Knivik detects active, real-time demand conversations happening right now across Reddit, HackerNews, X, and Bluesky when prospects are actively asking for solutions.",
    },
    {
      question: "Which social platforms does Knivik monitor?",
      answer:
        "Knivik continuously scans Reddit, HackerNews, X (Twitter), and Bluesky for high-intent product and service buying signals.",
    },
    {
      question: "Can I try Knivik for free before switching from my current tool?",
      answer:
        "Yes! Knivik provides a free forever tier so you can test lead quality, intent scoring, and automated reply angles with zero credit card required.",
    },
  ];

  const faqSchema = SchemaService.generateFAQSchema(faqs);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <BreadcrumbJsonLd items={breadcrumbs} />
      <SchemaScript schema={collectionSchema} />
      <SchemaScript schema={faqSchema} />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-grid opacity-15 -z-10 pointer-events-none" />
        <div className="container mx-auto px-6 max-w-6xl">
          {/* Visual Breadcrumb Navigation */}
          <nav aria-label="Breadcrumbs" className="mb-6 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-foreground font-bold">Alternatives</span>
          </nav>

          <div className="max-w-3xl">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black uppercase tracking-widest px-3 py-1 mb-4 inline-flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              Software Comparison Hub
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4">
              Compare Knivik vs Other Lead Generation & Social Listening Tools
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Explore honest, side-by-side architectural and feature comparisons between Knivik and other social selling, keyword tracking, and B2B sales intelligence platforms.
            </p>
          </div>
        </div>
      </section>

      {/* High-Level Capability Comparison Matrix */}
      <section className="py-16 bg-secondary/10 border-b border-border/40">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mb-3">
              How Knivik Compares to Traditional Approaches
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Why modern founders, growth marketers, and sales teams are shifting from legacy keyword alerts to autonomous intent qualification.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border/60 bg-background/60 backdrop-blur-sm shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-secondary/30">
                  <th className="p-4 font-black uppercase tracking-wider text-muted-foreground">Capabilities</th>
                  <th className="p-4 font-black uppercase tracking-wider text-primary">Knivik (AI Intent)</th>
                  <th className="p-4 font-black uppercase tracking-wider text-muted-foreground">Keyword Scrapers (Syften / F5Bot)</th>
                  <th className="p-4 font-black uppercase tracking-wider text-muted-foreground">Static Databases (Apollo / ZoomInfo)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                <tr>
                  <td className="p-4 font-bold text-foreground">Semantic Buyer Intent Scoring</td>
                  <td className="p-4 font-semibold text-emerald-500 flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> AI Intent Analysis (0-100)</td>
                  <td className="p-4 text-rose-500"><XCircle className="h-4 w-4 inline mr-1" /> Flat Keyword Matching</td>
                  <td className="p-4 text-muted-foreground">None (Cold Contact Data Only)</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-foreground">Multi-Channel Social Coverage</td>
                  <td className="p-4 font-semibold text-emerald-500"><CheckCircle2 className="h-4 w-4 inline mr-1" /> Reddit, HN, X, Bluesky</td>
                  <td className="p-4 text-muted-foreground">Limited (1-2 Platforms)</td>
                  <td className="p-4 text-rose-500"><XCircle className="h-4 w-4 inline mr-1" /> No Live Social Threads</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-foreground">AI-Generated Contextual Replies</td>
                  <td className="p-4 font-semibold text-emerald-500"><CheckCircle2 className="h-4 w-4 inline mr-1" /> Yes, tailored Reply Angles</td>
                  <td className="p-4 text-rose-500"><XCircle className="h-4 w-4 inline mr-1" /> None</td>
                  <td className="p-4 text-rose-500"><XCircle className="h-4 w-4 inline mr-1" /> Generic Cold Email Templates</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-foreground">First-Mover Advantage</td>
                  <td className="p-4 font-semibold text-emerald-500"><CheckCircle2 className="h-4 w-4 inline mr-1" /> Instant Real-time Alerts</td>
                  <td className="p-4 text-muted-foreground">Varies (10 min to hourly)</td>
                  <td className="p-4 text-rose-500"><XCircle className="h-4 w-4 inline mr-1" /> Delayed Cold Outbound</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-foreground">Free Tier Available</td>
                  <td className="p-4 font-semibold text-emerald-500"><CheckCircle2 className="h-4 w-4 inline mr-1" /> Free $0 Forever</td>
                  <td className="p-4 text-muted-foreground">Trial or Paid Only</td>
                  <td className="p-4 text-muted-foreground">Restricted Trial</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Competitors Grid Directory */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mb-2">
                All Competitor Comparisons ({comparisons.length})
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Click any tool below for an in-depth breakdown of features, pricing models, and key architectural differences.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comparisons.map((item) => {
              const comp = item.competitor;
              return (
                <div
                  key={comp.slug}
                  className="group relative rounded-2xl border border-border/60 bg-background/50 p-6 transition-all duration-300 hover:border-primary/40 hover:bg-secondary/10 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors">
                        {comp.name}
                      </h3>
                      <Badge variant="outline" className="text-[10px] font-bold border-border/80 text-muted-foreground">
                        {comp.rating} ★
                      </Badge>
                    </div>

                    <p className="text-xs font-semibold text-primary/90 mb-2">
                      {comp.tagline}
                    </p>

                    <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                      {comp.description}
                    </p>

                    <div className="pt-3 border-t border-border/40 space-y-1.5 text-[11px] text-muted-foreground mb-6">
                      <div>
                        <strong className="text-foreground">Pricing:</strong> {comp.pricing}
                      </div>
                      <div>
                        <strong className="text-foreground">Channels:</strong> {comp.platforms.join(", ")}
                      </div>
                    </div>
                  </div>

                  <Link href={`/alternatives/${comp.slug}`} className="w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs font-bold rounded-xl border-border/80 group-hover:border-primary/50 group-hover:bg-primary/5 group-hover:text-primary transition-all flex items-center justify-center gap-1.5"
                    >
                      Compare {comp.name} vs Knivik
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-secondary/10 border-t border-border/40">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mb-2">
              Frequently Asked Questions About Tool Alternatives
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Clear answers on how Knivik fits into your existing sales and marketing stack.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="rounded-xl border border-border/60 bg-background/50 p-5">
                <h3 className="text-sm sm:text-base font-bold text-foreground mb-2">
                  {faq.question}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="py-16 border-t border-border/40 bg-background">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mb-4">
            Ready to Catch High-Intent Leads in Real-Time?
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            Create your first monitor in 60 seconds. Start finding warm conversations across Reddit, HackerNews, Twitter, and Bluesky.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="h-12 px-8 text-sm font-black rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/tools">
              <Button variant="outline" size="lg" className="h-12 px-8 text-sm font-black rounded-xl border-border/80 hover:border-primary/50">
                Explore Free Tools
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
