import { Metadata } from "next";
import Link from "next/link";
import { 
  ArrowRight,
  Info,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MetadataService } from "@/lib/seo/application/metadata.service";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { toolsList } from "@/lib/tools";

import { SchemaScript } from "@/components/seo/schema-script";
import { SchemaService } from "@/lib/seo/application/schema.service";

export const metadata: Metadata = MetadataService.constructPageMetadata({
  title: "Free AI Marketing & Social Outreach Tools Suite",
  description: "Boost your lead generation and B2B sales outreach with our free tools. Build Reddit search queries, audit cold message spam, generate testimonial cards, and monitor HackerNews intent.",
  path: "/tools",
});

export default function ToolsPage() {
  const breadcrumbItems = [
    { name: "Home", item: "/" },
    { name: "Free Tools", item: "/tools" },
  ];

  const collectionSchema = SchemaService.generateCollectionPageSchema({
    name: "Knivik Free Marketing & Social Outreach Tools Suite",
    description: "Free tools for building Reddit search queries, auditing outreach warmth, generating testimonials, and monitoring buyer intent.",
    path: "/tools",
  });

  return (
    <div className="flex flex-col min-h-screen">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <SchemaScript schema={collectionSchema} />

      <section className="pt-32 pb-20 bg-background relative overflow-hidden">
        {/* Decorative Grid Background and Radial Glows */}
        <div className="absolute inset-0 bg-grid opacity-20 -z-10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[10%] w-[80%] h-[40%] rounded-[100%] bg-primary/10 blur-[120px]" />
        </div>

        <div className="container mx-auto px-6">
          {/* Page Hero Header */}
          <div className="flex flex-col items-center text-center mb-10 lg:mb-14">
            <span className="text-primary font-black uppercase tracking-widest text-[10px] px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 fill-primary" />
              Free Outreach Tools Suite
            </span>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-foreground mb-4">
              Accelerate Your Social Prospecting
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Equip your startup or agency with utility tools designed to build queries, audit message warmth, create social proof cards, and capture conversational buying signals.
            </p>
          </div>

          {/* Tools List */}
          <div className="flex flex-col gap-4 mb-16">
            {toolsList.map((tool) => {
              const Icon = tool.icon;
              return (
                <div 
                  key={tool.href}
                  className="relative group overflow-hidden rounded-2xl border border-border/40 bg-background/40 p-4 transition-all duration-300 hover:bg-secondary/10 hover:border-primary/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Subtle background highlight */}
                  <div className="absolute -inset-px bg-linear-to-r from-primary/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10" />

                  <div className="flex items-start md:items-center gap-4 flex-1">
                    {/* Icon */}
                    <div className={`p-2.5 rounded-xl border ${tool.color} shrink-0`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    
                    {/* Content */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors leading-none animate-none">
                          {tool.title}
                        </h3>
                        <Badge className="bg-secondary text-secondary-foreground border-border/40 text-[9px] font-black uppercase tracking-wider px-2 py-0.5">
                          {tool.badge}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-3xl">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link href={tool.href} className="w-full md:w-auto shrink-0">
                    <Button 
                      variant="outline"
                      size="sm" 
                      className="w-full md:w-auto h-9 text-xs font-bold rounded-lg border-border/60 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all group/btn flex items-center justify-center gap-1.5"
                    >
                      {tool.buttonText}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              );
            })}

            {/* AI Sales Agent Promotion Row */}
            <div className="relative group overflow-hidden rounded-2xl border border-primary/20 bg-linear-to-r from-primary/5 via-primary/[0.01] to-background p-4 transition-all duration-300 hover:border-primary/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start md:items-center gap-4 flex-1">
                {/* Icon */}
                <div className="p-2.5 rounded-xl border border-primary/20 bg-primary/10 text-primary shrink-0">
                  <Sparkles className="h-5 w-5 fill-primary animate-pulse" />
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-black text-foreground leading-none">
                      Ready to Automate Lead Finding?
                    </h3>
                    <Badge className="bg-primary text-primary-foreground border-none text-[9px] font-black uppercase tracking-wider px-2 py-0.5">
                      Pro Engine
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-3xl">
                    Get rid of manual search. Let our autonomous AI Sales Agent monitor Reddit, X, and HackerNews, score leads, and write warm reply drafts for you 24/7.
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <Link href="/register" className="w-full md:w-auto shrink-0">
                <Button 
                  size="sm" 
                  className="w-full md:w-auto h-9 text-xs font-black rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-primary/20 hover:scale-[1.01]"
                >
                  Start Automating Free
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Footer Bottom Note */}
          <div className="max-w-4xl mx-auto mt-24 flex flex-col items-center gap-6 text-sm text-muted-foreground font-medium">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              <span>All tool resources are run locally in the browser with maximum privacy protection.</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
