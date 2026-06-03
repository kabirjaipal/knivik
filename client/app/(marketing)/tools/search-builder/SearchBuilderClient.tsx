"use client";

import React, { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Info,
  RefreshCw,
  Sliders,
  HelpCircle,
  Eye,
  Settings,
} from "lucide-react";
import { FaRedditAlien, FaHackerNews, FaXTwitter } from "react-icons/fa6";
import { SiGoogle } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface QueryTemplate {
  id: string;
  name: string;
  shortName: string;
  description: string;
  intentLevel: "BUY_NOW" | "COMPARING";
  triggers: string[];
}

const INTENT_TEMPLATES: QueryTemplate[] = [
  {
    id: "recommendations",
    name: "Looking for Recommendations",
    shortName: "Recommendations",
    description: "Find prospects actively asking for tools or services to buy.",
    intentLevel: "BUY_NOW",
    triggers: [
      "recommend tool",
      "best software for",
      "looking for recommendations",
      "what tool do you use",
      "recommendations for CRM",
      "any good tools for",
      "best CRM for",
      "looking for software",
    ],
  },
  {
    id: "alternatives",
    name: "Competitor Migrations",
    shortName: "Alternatives",
    description:
      "Target users seeking alternatives to competitors or leaving them.",
    intentLevel: "COMPARING",
    triggers: [
      "alternative to",
      "replace",
      "switching from",
      "alternatives to",
      "better than",
      "moving away from",
      "leaving",
    ],
  },
  {
    id: "frustrations",
    name: "Competitor Frustrations",
    shortName: "Frustrations",
    description:
      "Find users complaining about competitors' pricing, features, or support.",
    intentLevel: "COMPARING",
    triggers: [
      "pricing is too high",
      "overpriced",
      "sucks",
      "hate",
      "annoyed with",
      "broken",
      "worst support",
      "slow",
    ],
  },
  {
    id: "services-hiring",
    name: "Freelance & Agency Gigs",
    shortName: "Hiring / Gigs",
    description:
      "Find prospects seeking to hire service providers (editors, web dev).",
    intentLevel: "BUY_NOW",
    triggers: [
      "hiring a",
      "looking for a freelancer",
      "recommend agency",
      "hire video editor",
      "looking to hire",
      "need web developer",
      "freelance work",
    ],
  },
];

export function SearchBuilderClient() {
  const searchParams = useSearchParams();
  const initialNiche = searchParams.get("niche") || "CRM software";
  const initialCompetitors = searchParams.get("competitors") || "Salesforce, Hubspot";
  const initialKeywords = searchParams.get("keywords") || "freelancers, startups";
  const initialTemplate = searchParams.get("template") || "recommendations";
  const initialTimeframe = searchParams.get("timeframe") || "month";

  // Input states with conversion-optimized defaults
  const [niche, setNiche] = useState(initialNiche);
  const [competitors, setCompetitors] = useState(initialCompetitors);
  const [customKeywords, setCustomKeywords] = useState(initialKeywords);
  const [selectedTemplate, setSelectedTemplate] = useState(initialTemplate);
  const [timeframe, setTimeframe] = useState(initialTimeframe); // 'day', 'week', 'month', 'all'
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const queries = useMemo<
    Array<{
      id: string;
      platform: "Reddit" | "Google" | "HackerNews" | "Twitter";
      label: string;
      queryString: string;
      searchUrl: string;
      description: string;
      syntaxTip: string;
    }>
  >(() => {
    const template =
      INTENT_TEMPLATES.find((t) => t.id === selectedTemplate) ||
      INTENT_TEMPLATES[0]!;

    const quoteTerm = (value: string) => `"${value.replaceAll('"', "")}"`;
    const buildOrGroup = (values: string[]) =>
      values.map((value) => quoteTerm(value)).join(" OR ");
    const buildFieldOrGroup = (field: string, values: string[]) =>
      values.map((value) => `${field}:${quoteTerm(value)}`).join(" OR ");

    const productWords = niche
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean);
    const competitorList = competitors
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean);
    const keywordList = customKeywords
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean);

    const targetTerms =
      template.id === "alternatives" && competitorList.length > 0
        ? competitorList
        : [...productWords, ...keywordList];
    const intentTerms = template.triggers.slice(0, 3);
    const hasTargetTerms = targetTerms.length > 0;

    const generated: Array<{
      id: string;
      platform: "Reddit" | "Google" | "HackerNews" | "Twitter";
      label: string;
      queryString: string;
      searchUrl: string;
      description: string;
      syntaxTip: string;
    }> = [];

    const getDateLimit = (frame: string) => {
      const now = new Date();
      if (frame === "day") now.setDate(now.getDate() - 1);
      else if (frame === "week") now.setDate(now.getDate() - 7);
      else if (frame === "month") now.setDate(now.getDate() - 30);
      else return null;
      return now.toISOString().split("T")[0];
    };

    const dateLimit = getDateLimit(timeframe);

    const redditIntent = buildFieldOrGroup("title", intentTerms);
    const redditTarget = buildFieldOrGroup(
      "selftext",
      targetTerms.length > 0 ? targetTerms.slice(0, 3) : ["recommendation"],
    );
    const redditQuery = `(${redditIntent}) AND (${redditTarget})`;

    generated.push({
      id: "reddit-search",
      platform: "Reddit",
      label: "Reddit Search",
      queryString: redditQuery,
      searchUrl: `https://www.reddit.com/search/?q=${encodeURIComponent(redditQuery)}&sort=new`,
      description: "Uses Reddit field search to find posts with buying intent.",
      syntaxTip:
        "Reddit works best with title: and selftext: filters plus AND/OR grouping.",
    });

    const googleIntent = buildOrGroup(intentTerms.slice(0, 3));
    const googleTarget = buildOrGroup(
      hasTargetTerms ? targetTerms.slice(0, 3) : ["recommendation"],
    );
    let googleRedditQuery = `site:reddit.com/r/ (${googleIntent}) (${googleTarget})`;
    if (dateLimit) {
      googleRedditQuery += ` after:${dateLimit}`;
    }

    generated.push({
      id: "google-reddit",
      platform: "Google",
      label: "Google Reddit Dork",
      queryString: googleRedditQuery,
      searchUrl: `https://www.google.com/search?q=${encodeURIComponent(googleRedditQuery)}`,
      description: "Uses Google operators to find Reddit threads faster.",
      syntaxTip:
        "site:reddit.com/r/ limits results to Reddit, and after: narrows to fresh posts.",
    });

    const hnIntent = buildOrGroup(intentTerms.slice(0, 3));
    const hnTarget = buildOrGroup(
      hasTargetTerms ? targetTerms.slice(0, 3) : ["recommendation"],
    );
    const hnQuery = `(${hnIntent}) (${hnTarget})`;

    generated.push({
      id: "hn-algo",
      platform: "HackerNews",
      label: "HN Comment Search",
      queryString: hnQuery,
      searchUrl: `https://hn.algolia.com/?q=${encodeURIComponent(hnQuery)}&sort=byDate&type=comment`,
      description:
        "Searches HN comments for people asking for tools or alternatives.",
      syntaxTip:
        "Search comments on HN for recommendations, comparisons, and pain points.",
    });

    const twitterIntent = buildOrGroup(intentTerms.slice(0, 3));
    const twitterTarget = buildOrGroup(
      hasTargetTerms ? targetTerms.slice(0, 3) : ["recommendation"],
    );
    const twitterQuery = `(${twitterIntent}) (${twitterTarget}) lang:en -is:retweet`;

    generated.push({
      id: "twitter-search",
      platform: "Twitter",
      label: "X Search",
      queryString: twitterQuery,
      searchUrl: `https://x.com/search?q=${encodeURIComponent(twitterQuery)}&f=live`,
      description: "Searches live X posts with supported query operators.",
      syntaxTip:
        "X works best with OR groups, lang:en, and -is:retweet for clean results.",
    });

    return generated;
  }, [niche, competitors, customKeywords, selectedTemplate, timeframe]);

  // Clear states
  const handleReset = () => {
    setNiche("");
    setCompetitors("");
    setCustomKeywords("");
  };

  // Pre-fill sample values
  const loadExample = (type: "saas" | "agency" | "creator") => {
    if (type === "saas") {
      setNiche("email marketing tool");
      setCompetitors("Mailchimp, ActiveCampaign");
      setCustomKeywords("shopify, ecommerce");
      setSelectedTemplate("alternatives");
    } else if (type === "agency") {
      setNiche("video editor");
      setCompetitors("Veed, Premiere Pro");
      setCustomKeywords("youtube, shorts, tiktok");
      setSelectedTemplate("services-hiring");
    } else {
      setNiche("SEO audit");
      setCompetitors("Ahrefs, Semrush");
      setCustomKeywords("bloggers, local business");
      setSelectedTemplate("recommendations");
    }
  };

  // Copy to clipboard helper
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section className="pt-28 pb-12 relative overflow-hidden bg-background">
      {/* Background Glows */}
      <div className="absolute top-0 right-1/4 w-[300px] h-[300px] bg-primary/10 blur-[90px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-accent/5 blur-[90px] rounded-full pointer-events-none -z-10" />

      <div className="container mx-auto px-6">
        {/* Breadcrumbs (Compact) */}
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/50 mb-3 uppercase tracking-wider">
          <Link href="/" className="hover:text-primary transition-all">
            Home
          </Link>
          <span>/</span>
          <span>Tools</span>
          <span>/</span>
          <span className="text-primary font-black">Search Builder</span>
        </div>

        {/* Header - Compact Inline layout to save top space */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-border/40">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-foreground">
              Social Lead{" "}
              <span className="bg-gradient-to-r from-primary via-indigo-500 to-accent bg-clip-text text-transparent">
                Search Operator
              </span>{" "}
              Builder
            </h1>
            <p className="text-xs text-muted-foreground font-medium max-w-xl">
              Build high-intent search operators for Reddit, HackerNews, and
              Twitter instantly.
            </p>
          </div>

          {/* Quick presets (Pills inline with header) */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <span className="font-bold text-muted-foreground/60 text-[10px] uppercase tracking-wider">
              Samples:
            </span>
            <button
              onClick={() => loadExample("saas")}
              className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-border bg-card hover:bg-primary/5 hover:border-primary/40 active:scale-[0.97] transition-all text-foreground/80"
            >
              SaaS Product
            </button>
            <button
              onClick={() => loadExample("agency")}
              className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-border bg-card hover:bg-primary/5 hover:border-primary/40 active:scale-[0.97] transition-all text-foreground/80"
            >
              Freelance/Agency
            </button>
            <button
              onClick={() => loadExample("creator")}
              className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-border bg-card hover:bg-primary/5 hover:border-primary/40 active:scale-[0.97] transition-all text-foreground/80"
            >
              SEO Consultant
            </button>
          </div>
        </div>

        {/* Dashboard layout */}
        <div className="flex flex-col gap-6">
          {/* Top row: equal-height cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Column (Inputs & Intents consolidated into a single card) */}
            <div className="lg:col-span-5 bg-card border border-border/60 rounded-xl p-4 shadow-lg flex flex-col gap-3 h-full">
              <div className="flex justify-between items-center pb-2 border-b border-border/40">
                <h2 className="text-xs font-black text-foreground flex items-center gap-1.5">
                  <Settings className="h-3.5 w-3.5 text-primary" />
                  Configure Leads Query
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleReset}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-full"
                  title="Reset parameters"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>

              {/* Horizontal Radio tabs for Intent Angle (Replaces massive vertical cards) */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider">
                  1. Intent Trigger Type
                </span>
                <div className="grid grid-cols-2 gap-1.5 bg-secondary/30 p-1 border border-border/80 rounded-lg">
                  {INTENT_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => setSelectedTemplate(tmpl.id)}
                      className={`text-[10px] py-1.5 px-2 font-black rounded-md transition-all text-center truncate ${
                        selectedTemplate === tmpl.id
                          ? "bg-primary text-primary-foreground shadow-sm font-black"
                          : "hover:bg-secondary/80 text-muted-foreground"
                      }`}
                      title={tmpl.description}
                    >
                      {tmpl.shortName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tight Form fields side-by-side */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider">
                  2. Niche & Target Keywords
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Niche Input */}
                  <div className="flex flex-col gap-1">
                    <Label
                      htmlFor="niche"
                      className="text-[10px] font-bold text-foreground/60 uppercase"
                    >
                      Keywords / Product
                    </Label>
                    <Input
                      id="niche"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                      placeholder="e.g. CRM software"
                      className="bg-secondary/20 border-border/80 text-xs font-bold h-9 py-1 px-2.5"
                    />
                  </div>

                  {/* Competitors Input */}
                  <div className="flex flex-col gap-1">
                    <Label
                      htmlFor="competitors"
                      className="text-[10px] font-bold text-foreground/60 uppercase"
                    >
                      Competitors
                    </Label>
                    <Input
                      id="competitors"
                      value={competitors}
                      onChange={(e) => setCompetitors(e.target.value)}
                      placeholder="e.g. Salesforce, Hubspot"
                      className="bg-secondary/20 border-border/80 text-xs font-bold h-9 py-1 px-2.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Target filters */}
                  <div className="flex flex-col gap-1">
                    <Label
                      htmlFor="customKeywords"
                      className="text-[10px] font-bold text-foreground/60 uppercase"
                    >
                      Industry / Audience
                    </Label>
                    <Input
                      id="customKeywords"
                      value={customKeywords}
                      onChange={(e) => setCustomKeywords(e.target.value)}
                      placeholder="e.g. freelancers, startups"
                      className="bg-secondary/20 border-border/80 text-xs font-bold h-9 py-1 px-2.5"
                    />
                  </div>

                  {/* Timeframe lookback */}
                  <div className="flex flex-col gap-1">
                    <Label className="text-[10px] font-bold text-foreground/60 uppercase">
                      Google Timeframe
                    </Label>
                    <div className="grid grid-cols-4 gap-1 bg-secondary/30 border border-border/80 p-0.5 rounded-lg h-9 items-center">
                      {[
                        { key: "day", label: "24h" },
                        { key: "week", label: "7d" },
                        { key: "month", label: "30d" },
                        { key: "all", label: "All" },
                      ].map((f) => (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => setTimeframe(f.key)}
                          className={`text-[9px] h-7 font-black rounded transition-all ${
                            timeframe === f.key
                              ? "bg-background text-primary shadow-sm border border-border/30"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Selected Trigger Info display */}
              <div className="bg-secondary/30 border border-border/30 rounded-lg p-2 text-[10px] font-medium text-muted-foreground leading-normal flex items-start gap-2">
                <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-foreground block mb-0.5">
                    {
                      INTENT_TEMPLATES.find((t) => t.id === selectedTemplate)
                        ?.name
                    }
                  </span>
                  {
                    INTENT_TEMPLATES.find((t) => t.id === selectedTemplate)
                      ?.description
                  }
                </div>
              </div>
            </div>

            {/* Right Column (Queries Feed) */}
            <div className="lg:col-span-7 flex flex-col">
              {/* Main outputs panel */}
              <div className="bg-card border border-border/60 rounded-xl p-4 shadow-lg flex flex-col gap-3 h-full">
                {/* Header inside output card */}
                <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                  <h2 className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-primary" />
                    Operator Output
                  </h2>
                </div>

                {/* Queries cards mapping */}
                <div className="flex flex-col gap-2">
                  {queries.length > 0 ? (
                    queries.map((q) => {
                      const isCopied = copiedId === q.id;
                      return (
                        <div
                          key={q.id}
                          className="bg-secondary/10 border border-border/40 rounded-lg p-2 hover:border-primary/20 hover:bg-secondary/20 transition-all duration-200 group"
                        >
                          <div className="flex justify-between items-center gap-3 mb-1.5">
                            <div className="flex items-center gap-2">
                              {q.platform === "Reddit" && (
                                <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider px-1.5 py-0.5 rounded border bg-orange-500/10 text-orange-500 border-orange-500/25">
                                  <FaRedditAlien className="h-3 w-3" />
                                  Reddit
                                </span>
                              )}
                              {q.platform === "HackerNews" && (
                                <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-500 border-amber-500/25">
                                  <FaHackerNews className="h-3 w-3" />
                                  HN
                                </span>
                              )}
                              {q.platform === "Twitter" && (
                                <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider px-1.5 py-0.5 rounded border bg-sky-500/10 text-sky-500 border-sky-500/25">
                                  <FaXTwitter className="h-3 w-3" />X
                                </span>
                              )}
                              {q.platform === "Google" && (
                                <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider px-1.5 py-0.5 rounded border bg-blue-500/10 text-blue-500 border-blue-500/25">
                                  <SiGoogle className="h-3 w-3" />
                                  Google
                                </span>
                              )}
                              <span className="text-xs font-black text-foreground">
                                {q.label}
                              </span>
                            </div>

                            {/* Action links */}
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCopy(q.id, q.queryString)}
                                className="h-6 w-6 hover:bg-background border border-transparent hover:border-border text-muted-foreground hover:text-foreground rounded-md"
                                title="Copy query text"
                              >
                                {isCopied ? (
                                  <Check className="h-3 w-3 text-success" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>

                              <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:bg-background border border-transparent hover:border-border text-muted-foreground hover:text-foreground rounded-md"
                              >
                                <a
                                  href={q.searchUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Search live in new tab"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                            </div>
                          </div>

                          {/* Copyable query code block (compact) */}
                          <div className="relative">
                            <pre className="text-xs font-mono bg-background border border-border/80 text-foreground/80 px-2.5 py-1.5 rounded-md overflow-x-auto break-all whitespace-pre-wrap select-all font-bold tracking-tight">
                              {q.queryString}
                            </pre>
                          </div>

                          {/* Tip text (Minimal) */}
                          <div className="flex items-start gap-1.5 mt-1.5 text-xs text-muted-foreground/80 font-medium leading-normal">
                            <HelpCircle className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                            <span>{q.syntaxTip}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border/60 rounded-lg bg-secondary/10">
                      <Sliders className="h-6 w-6 text-muted-foreground/30 mb-2" />
                      <span className="text-xs font-bold text-muted-foreground">
                        No queries match this filter.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Full-width CTA banner */}
          <div className="w-full rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/5 dark:from-primary/15 dark:via-card/30 dark:to-accent/10 p-5 shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-col gap-1 max-w-2xl">
                <h3 className="text-xs font-black tracking-tight text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Autopilot Your Social Listening
                </h3>
                <p className="text-[10px] text-muted-foreground leading-normal font-semibold">
                  Manually running these is time-consuming. Let Knivik scan
                  Reddit, HN, and Twitter 24/7. Get alerts immediately on
                  matching posts.
                </p>
              </div>
              <Button
                asChild
                className="font-bold text-[10px] h-8 px-4 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground shadow-md transition-all shrink-0"
              >
                <Link
                  href="/pricing"
                  className="flex items-center gap-1.5 group"
                >
                  Automate Social Selling
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* FAQs - Compact */}
        <div className="mt-12 border-t border-border/40 pt-10">
          <h2 className="text-base font-black tracking-tight text-center text-foreground mb-6">
            Social Prospecting Tips
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-black text-foreground flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-primary shrink-0" />
                Google vs Native Search
              </h3>
              <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                Google handles complex search operators (like parentheses,
                exclusions) better than Reddit or Twitter native engines, which
                is why Google dorks are highly recommended.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-black text-foreground flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-primary shrink-0" />
                Exclude Competitor Links
              </h3>
              <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                When searching Twitter/X, adding <code>-filter:links</code> and{" "}
                <code>-filter:replies</code> filters out affiliate links and
                marketing pitches to help find authentic customer threads.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-black text-foreground flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-primary shrink-0" />
                HackerNews Intent Comments
              </h3>
              <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                Technology buyers ask for recommendations inside “Ask HN”
                comments. Querying the HN Algolia archive specifically yields
                high-conversion enterprise B2B leads.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
