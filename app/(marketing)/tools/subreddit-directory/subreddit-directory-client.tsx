"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Filter,
  Search,
  Sparkles,
  Zap,
  TrendingUp,
  RotateCcw,
  Users,
  Compass,
  CheckCircle2,
  ExternalLink,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type NicheFilter = "all" | "saas" | "ecommerce" | "devtools" | "agency" | "marketing";
export type SizeFilter = "all" | "large" | "medium" | "small";

export interface SubredditInfo {
  name: string;
  niche: Exclude<NicheFilter, "all">;
  nicheLabel: string;
  subscribers: number;
  subscribersLabel: string;
  description: string;
  postFrequency: "High" | "Medium" | "Low";
  commonPainPoints: string[];
  intentKeywords: string[];
  suggestedKeywords: string;
  suggestedCompetitors: string;
  sampleQuestions: string[];
}

const SUBREDDITS_DATA: SubredditInfo[] = [
  {
    name: "r/SaaS",
    niche: "saas",
    nicheLabel: "SaaS & Tech",
    subscribers: 52000,
    subscribersLabel: "52K",
    description: "The primary community for SaaS founders, builders, and developers. Packed with questions about toolstacks, marketing, and competitor migration.",
    postFrequency: "High",
    commonPainPoints: ["Acquiring initial users", "Stripe subscription setup", "Churn reduction tools", "Cold outreach strategies"],
    intentKeywords: ["recommend tool", "best software for", "Stripe alternative", "alternative to Hubspot"],
    suggestedKeywords: "SaaS growth CRM, billing software",
    suggestedCompetitors: "Stripe, HubSpot, Paddle",
    sampleQuestions: [
      "What is the best CRM for B2B SaaS startup with 5 people?",
      "Are there any cheap alternatives to Stripe for Europe?"
    ]
  },
  {
    name: "r/startups",
    niche: "saas",
    nicheLabel: "SaaS & Tech",
    subscribers: 1200000,
    subscribersLabel: "1.2M",
    description: "A massive directory of early-stage startup discussions covering cofounder search, pitch validation, launching advice, and team management.",
    postFrequency: "High",
    commonPainPoints: ["Product validation", "Pitch deck design", "Finding developer cofounders", "Marketing channel attribution"],
    intentKeywords: ["looking to hire", "pitch deck review", "marketing ideas", "recommend agency"],
    suggestedKeywords: "Pitch builder, marketing attribution",
    suggestedCompetitors: "DocSend, Mixpanel, Amplitude",
    sampleQuestions: [
      "Can anyone recommend a good agency for building an MVP?",
      "How are you tracking ad spend ROI across search and social?"
    ]
  },
  {
    name: "r/IndieHackers",
    niche: "saas",
    nicheLabel: "SaaS & Tech",
    subscribers: 32000,
    subscribersLabel: "32K",
    description: "Inspired by the bootstrapped founders community. Solo founders sharing code milestones, payment provider setup issues, and launching tips.",
    postFrequency: "Medium",
    commonPainPoints: ["Stripe country support", "Zero-budget marketing", "Email newsletter setup", "Hosting costs scaling"],
    intentKeywords: ["stripe alternative", "launching today", "newsletter tool", "cheap database"],
    suggestedKeywords: "Newsletter platform, hosting manager",
    suggestedCompetitors: "Substack, Mailchimp, Render, Supabase",
    sampleQuestions: [
      "Looking for a simple Substack alternative for developer blogs.",
      "What database host is cheapest for side projects?"
    ]
  },
  {
    name: "r/ecommerce",
    niche: "ecommerce",
    nicheLabel: "eCommerce",
    subscribers: 220000,
    subscribersLabel: "220K",
    description: "A hub for online shop owners, Shopify merchants, and dropshippers discussing abandoned carts, theme performance, and logistics.",
    postFrequency: "High",
    commonPainPoints: ["Checkout page dropoffs", "Shopify site speed audits", "Ad attribution updates", "Custom shipping logistics API"],
    intentKeywords: ["Shopify app for", "checkout conversion", "best payment gateway", "shipping plugin"],
    suggestedKeywords: "Shopify checkout optimizer, shipping API",
    suggestedCompetitors: "Shopify, WooCommerce, Shippo, Stripe",
    sampleQuestions: [
      "Which Shopify app is best for reducing cart abandonment?",
      "Is WooCommerce fast enough for a 10K SKU shop?"
    ]
  },
  {
    name: "r/shopify",
    niche: "ecommerce",
    nicheLabel: "eCommerce",
    subscribers: 195000,
    subscribersLabel: "195K",
    description: "Focused strictly on merchants running on the Shopify ecosystem. High-intent queries for page builders, SEO tools, and plug-in advice.",
    postFrequency: "High",
    commonPainPoints: ["Theme page builder restrictions", "SEO blog optimization", "Abandoned cart email flows", "Multi-currency checkout"],
    intentKeywords: ["theme builder app", "Shopify SEO audit", "cart flows email", "payment gateway"],
    suggestedKeywords: "Shopify SEO, Page builder widget",
    suggestedCompetitors: "Klaviyo, Shogun, PageFly, Ahrefs",
    sampleQuestions: [
      "What is the best alternative to Klaviyo for store emails?",
      "Is there a free page builder that doesn't bloat site speed?"
    ]
  },
  {
    name: "r/webdev",
    niche: "devtools",
    nicheLabel: "DevTools",
    subscribers: 2600000,
    subscribersLabel: "2.6M",
    description: "The internet's biggest frontend and backend developer community. Constant questions on API keys, framework integrations, and hosting providers.",
    postFrequency: "High",
    commonPainPoints: ["Serverless cold starts", "Next.js App Router caching", "Managed database costs", "Secure API key vaults"],
    intentKeywords: ["auth solution", "database host", "Auth0 alternative", "cheap serverless"],
    suggestedKeywords: "Database hosting, API secrets manager",
    suggestedCompetitors: "Auth0, Supabase, Clerk, Vercel, AWS",
    sampleQuestions: [
      "What authentication provider are you using for Next.js in 2026?",
      "Vault feels too heavy for 3 developers. Any simpler alternatives?"
    ]
  },
  {
    name: "r/reactjs",
    niche: "devtools",
    nicheLabel: "DevTools",
    subscribers: 470000,
    subscribersLabel: "470K",
    description: "Focused strictly on the React ecosystem. Core developer discussions on state managers, query libraries, React 19 migrations, and component libraries.",
    postFrequency: "Medium",
    commonPainPoints: ["State synchronization", "React 19 Server Components", "Query data caching", "Bundle size optimization"],
    intentKeywords: ["useQuery vs useEffect", "React state manager", "Next.js routing error", "UI component library"],
    suggestedKeywords: "React state library, visual query client",
    suggestedCompetitors: "Redux, Zustand, React Query, Tailwind UI",
    sampleQuestions: [
      "Is Zustand enough for enterprise state management or do we need Redux?",
      "Which UI library has the best accessibility features out of the box?"
    ]
  },
  {
    name: "r/freelance",
    niche: "agency",
    nicheLabel: "Freelance & Agency",
    subscribers: 360000,
    subscribersLabel: "360K",
    description: "Independent service providers discussing contracts, project scope creep, automated invoicing, and chasing down late-paying clients.",
    postFrequency: "Medium",
    commonPainPoints: ["Late payments follow-up", "Contract template generation", "Scope creep invoicing", "Client acquisition sources"],
    intentKeywords: ["invoicing software", "contract template for", "proposal builder", "freelance proposal"],
    suggestedKeywords: "Contract builder, invoicing software",
    suggestedCompetitors: "Bonsai, Freshbooks, QuickBooks, Honeybook",
    sampleQuestions: [
      "What invoicing tool allows automatic late-payment reminders?",
      "Is there a good contract builder that handles remote UK clients?"
    ]
  },
  {
    name: "r/agency",
    niche: "agency",
    nicheLabel: "Freelance & Agency",
    subscribers: 48000,
    subscribersLabel: "48K",
    description: "A niche directory for digital, design, and SEO agency owners scaling operations. Active inquiries for CRM pipelines and proposal systems.",
    postFrequency: "Medium",
    commonPainPoints: ["Client proposal generation", "CRM pipeline management", "White-label design services", "Lead generation volume"],
    intentKeywords: ["proposal software", "lead sourcing", "white label services", "B2B email scraper"],
    suggestedKeywords: "Agency proposal tool, CRM lead automation",
    suggestedCompetitors: "PandaDoc, HubSpot, Apollo, ZoomInfo",
    sampleQuestions: [
      "What tool do you use to build interactive proposals for high-ticket sales?",
      "How are you scaling your outbound email list without landing in spam?"
    ]
  },
  {
    name: "r/marketing",
    niche: "marketing",
    nicheLabel: "Marketing",
    subscribers: 620000,
    subscribersLabel: "620K",
    description: "A wide-reaching community for marketing directors, growth experts, and SEO professionals discussing brand building and automation software.",
    postFrequency: "High",
    commonPainPoints: ["Organic SEO rank tracking", "Social post auto-schedulers", "Ad account blockages", "Attribution modeling"],
    intentKeywords: ["SEO auditor", "schedule twitter posts", "attribution tracker", "analytics dashboard"],
    suggestedKeywords: "SEO keyword tracker, social auto-scheduler",
    suggestedCompetitors: "Ahrefs, Semrush, Hootsuite, Buffer",
    sampleQuestions: [
      "Which tool is best for tracking organic search ranks at a city-level?",
      "Is buffer or hootsuite better for managing multiple client Twitter pages?"
    ]
  },
  {
    name: "r/contentmarketing",
    niche: "marketing",
    nicheLabel: "Marketing",
    subscribers: 125000,
    subscribersLabel: "125K",
    description: "Focused on creators, bloggers, and copywriters sharing insights on newsletter marketing, video editing tooling, and writing layouts.",
    postFrequency: "Medium",
    commonPainPoints: ["Newsletter platform pricing", "Audio-to-video transcription", "Content calendar workflows", "Social graphic designs"],
    intentKeywords: ["newsletter platform", "transcribe audio", "social graphic editor", "content calendar tool"],
    suggestedKeywords: "Audio transcript API, content workflow",
    suggestedCompetitors: "Substack, Beehiiv, Descript, Canva",
    sampleQuestions: [
      "Beehiiv vs Substack: which is better for a developer newsletter?",
      "Is there an easy API to automatically convert video clips to text?"
    ]
  },
  {
    name: "r/copywriting",
    niche: "marketing",
    nicheLabel: "Marketing",
    subscribers: 180000,
    subscribersLabel: "180K",
    description: "A focused group of email writers and sales copy professionals discussing email subject lines, landing page hooks, and conversion rates.",
    postFrequency: "Medium",
    commonPainPoints: ["Email subject line testing", "Cold outreach script audits", "Landing page hero hooks", "Conversion rate benchmarks"],
    intentKeywords: ["email subject helper", "copy audit", "cold email template", "hero hook feedback"],
    suggestedKeywords: "Email subject line analyzer, cold copywriter",
    suggestedCompetitors: "Copylist, Jasper, CopyAI, Grammarly",
    sampleQuestions: [
      "Who can give me some honest feedback on this SaaS landing page hero hook?",
      "What tool do you use to test email subjects before sending out campaigns?"
    ]
  }
];

interface SubredditCardProps {
  sub: SubredditInfo;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function SubredditCard({ sub, isExpanded, onToggleExpand }: SubredditCardProps) {
  const searchBuilderLink = `/tools/search-builder?niche=${encodeURIComponent(
    sub.suggestedKeywords
  )}&competitors=${encodeURIComponent(sub.suggestedCompetitors)}&ref=subreddit-directory`;

  return (
    <div
      className={`relative group overflow-hidden rounded-xl border transition-all duration-300 flex flex-col justify-between ${
        isExpanded
          ? "border-primary/40 bg-white/[0.04] shadow-[0_12px_36px_rgba(99,102,241,0.08)]"
          : "border-border/60 bg-white/[0.02] hover:border-primary/20 hover:bg-white/[0.03]"
      }`}
    >
      {/* Glow Highlight */}
      <div className="absolute -inset-px bg-gradient-to-r from-primary to-accent rounded-xl opacity-0 group-hover:opacity-5 blur-lg transition-opacity duration-500 pointer-events-none" />

      <div className="p-4 relative z-10 flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="text-sm font-black text-foreground tracking-tight flex items-center gap-1.5">
              <Compass className="h-4 w-4 text-primary shrink-0" />
              {sub.name}
            </h3>

            <span className="text-[10px] font-black uppercase tracking-wider bg-secondary/35 border border-border/40 px-2 py-0.5 rounded-full text-foreground/80">
              {sub.nicheLabel}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {sub.subscribersLabel} members
            </div>
            <span className="text-[10px] font-bold text-muted-foreground/60">•</span>
            <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
              Posts: <span className="font-black text-primary">{sub.postFrequency}</span>
            </div>
          </div>

          <p className="text-xs font-medium text-muted-foreground leading-relaxed">
            {sub.description}
          </p>
        </div>

        {/* Expandable Buying Signals Drawer */}
        <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
          <button
            onClick={onToggleExpand}
            className="text-left text-[10px] font-black uppercase tracking-wider text-foreground hover:text-primary flex items-center justify-between gap-1 transition-all"
          >
            <span>Buying Intent Details</span>
            <span className="text-primary font-bold">{isExpanded ? "[-]" : "[+]"}</span>
          </button>

          {isExpanded ? (
            <div className="flex flex-col gap-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/75">
                  Common Pain Points:
                </span>
                <ul className="grid grid-cols-1 gap-1">
                  {sub.commonPainPoints.map((point) => (
                    <li
                      key={point}
                      className="text-[10px] font-bold text-foreground/90 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/75">
                  High-Intent Triggers:
                </span>
                <div className="flex flex-wrap gap-1">
                  {sub.intentKeywords.map((k) => (
                    <span
                      key={k}
                      className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/65 bg-secondary/20 px-2 py-0.5 rounded-md border border-border/30"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 bg-secondary/15 p-2 rounded-lg border border-border/30">
                <span className="text-[9px] font-black uppercase tracking-wider text-primary">
                  Sample Reddit Query:
                </span>
                {sub.sampleQuestions.map((q, idx) => (
                  <p key={idx} className="text-[10px] font-medium text-foreground italic leading-relaxed">
                    “{q}”
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1 pt-1">
              {sub.intentKeywords.slice(0, 2).map((k) => (
                <span
                  key={k}
                  className="text-[8px] font-black uppercase tracking-wider text-muted-foreground/50 bg-secondary/10 px-1.5 py-0.5 rounded-md border border-border/20"
                >
                  {k}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/40">
          <Button
            asChild
            className="flex-1 rounded-lg text-[9px] font-black uppercase tracking-wider h-8 bg-primary hover:bg-primary/95 text-primary-foreground transition-all active:scale-[0.97]"
          >
            <Link href={searchBuilderLink} className="flex items-center justify-center gap-1">
              Launch Builder
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            className="flex-1 rounded-lg text-[9px] font-black uppercase tracking-wider h-8 text-muted-foreground hover:text-foreground border border-border hover:bg-secondary/40 transition-all active:scale-[0.97]"
          >
            <Link href="/pricing" className="flex items-center justify-center gap-1">
              Track Alerts
              <Zap className="h-3 w-3 text-primary shrink-0" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SubredditDirectoryClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNiche, setSelectedNiche] = useState<NicheFilter>("all");
  const [selectedSize, setSelectedSize] = useState<SizeFilter>("all");
  const [expandedSubreddit, setExpandedSubreddit] = useState<string | null>("r/SaaS");

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedNiche("all");
    setSelectedSize("all");
  };

  const filteredSubs = useMemo(() => {
    return SUBREDDITS_DATA.filter((sub) => {
      const matchSearch =
        searchTerm.trim() === "" ||
        sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.commonPainPoints.some((p) => p.toLowerCase().includes(searchTerm.toLowerCase())) ||
        sub.intentKeywords.some((k) => k.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchNiche = selectedNiche === "all" || sub.niche === selectedNiche;

      let matchSize = true;
      if (selectedSize === "large") matchSize = sub.subscribers >= 500000;
      else if (selectedSize === "medium") matchSize = sub.subscribers >= 100000 && sub.subscribers < 500000;
      else if (selectedSize === "small") matchSize = sub.subscribers < 100000;

      return matchSearch && matchNiche && matchSize;
    });
  }, [searchTerm, selectedNiche, selectedSize]);

  return (
    <section className="relative overflow-hidden bg-background pt-28 pb-16">
      <div className="container mx-auto px-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground/60 mb-3">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <span>Tools</span>
          <span>/</span>
          <span className="text-primary">Subreddit Directory</span>
        </div>

        {/* Header */}
        <div className="flex flex-col gap-1 mb-5 pb-4 border-b border-border/40">
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Subreddit <span className="text-primary">Niche Lead Directory</span>
          </h1>
          <p className="text-sm font-medium text-muted-foreground max-w-2xl">
            Explore subreddits segmented by business niche. Identify popular customer communities, common buying pain points, and launch social search alerts instantly.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-card border border-border/60 rounded-xl p-4 shadow-lg flex flex-col gap-3 mb-6">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search subreddits, keywords, or pain points (e.g. shopify, auth, crm)..."
                className="pl-9 h-9 text-xs bg-secondary/20 border-border/70 text-foreground"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value as SizeFilter)}
                className="h-9 px-3 text-xs bg-secondary/20 border border-border/70 rounded-lg text-foreground font-bold hover:bg-secondary/40 transition-colors outline-none"
              >
                <option value="all" className="bg-card text-foreground">Size: All Members</option>
                <option value="large" className="bg-card text-foreground">Size: Large (&gt;500k)</option>
                <option value="medium" className="bg-card text-foreground">Size: Medium (100k-500k)</option>
                <option value="small" className="bg-card text-foreground">Size: Small (&lt;100k)</option>
              </select>

              <Button
                variant="ghost"
                onClick={handleResetFilters}
                className="h-9 px-3 rounded-lg text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-foreground active:scale-95"
                title="Reset filters"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
              </Button>
            </div>
          </div>

          {/* Niche Categories tabs */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1">
              <Filter className="h-3 w-3 text-primary" /> Filter Business Niche
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: "all", label: "All Niches" },
                { key: "saas", label: "SaaS & Tech" },
                { key: "ecommerce", label: "eCommerce" },
                { key: "devtools", label: "DevTools" },
                { key: "agency", label: "Freelance & Agency" },
                { key: "marketing", label: "Marketing" }
              ].map((n) => (
                <button
                  key={n.key}
                  onClick={() => setSelectedNiche(n.key as NicheFilter)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                    selectedNiche === n.key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground border border-border/50"
                  }`}
                >
                  {n.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {filteredSubs.length > 0 ? (
            filteredSubs.map((sub) => (
              <SubredditCard
                key={sub.name}
                sub={sub}
                isExpanded={expandedSubreddit === sub.name}
                onToggleExpand={() =>
                  setExpandedSubreddit(expandedSubreddit === sub.name ? null : sub.name)
                }
              />
            ))
          ) : (
            <div className="col-span-full rounded-xl border border-border/60 bg-card/65 p-8 text-center flex flex-col items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-secondary/30 border border-border/50 flex items-center justify-center text-muted-foreground">
                <Search className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-black text-foreground">No matching subreddits found</p>
                <p className="text-xs text-muted-foreground">
                  Try refining your search keyword or selecting a different business niche category.
                </p>
              </div>
              <Button onClick={handleResetFilters} size="sm" className="rounded-full text-xs font-bold mt-2">
                Reset all filters
              </Button>
            </div>
          )}
        </div>

        {/* Autocomplete callout */}
        <div className="w-full rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/5 dark:from-primary/15 dark:via-card/30 dark:to-accent/10 p-5 mt-8 shadow-md">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col gap-1 max-w-2xl">
              <h3 className="text-xs font-black tracking-tight text-foreground flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                Curate custom subreddits with Knivik Premium
              </h3>
              <p className="text-[10px] text-muted-foreground leading-normal font-semibold">
                Don't limit yourself to pre-populated communities. Knivik allows you to scan any public or private subreddit, track custom keyword clusters, and get automated lead summaries sent directly to Slack/Discord.
              </p>
            </div>
            <Button
              asChild
              className="font-bold text-[10px] h-8 px-4 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground shadow-md transition-all shrink-0"
            >
              <Link href="/pricing" className="flex items-center gap-1.5 group">
                Scale Your Reddit Outreach
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
