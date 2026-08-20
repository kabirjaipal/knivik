"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Filter,
  MessageSquare,
  Search,
  Settings,
  Sparkles,
  Zap,
  TrendingUp,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type Category = "all" | "recommendations" | "pain-points" | "hiring" | "feedback";
export type IntentLevel = "all" | "high" | "medium" | "low";
export type SortOption = "newest" | "score" | "intent";

export interface Comment {
  author: string;
  timeAgo: string;
  body: string;
}

export interface HNPost {
  id: string;
  title: string;
  author: string;
  points: number;
  commentsCount: number;
  timeAgo: string;
  category: Exclude<Category, "all">;
  intent: Exclude<IntentLevel, "all">;
  body: string;
  topics: string[];
  educationalAdvice: string;
  featureMatch: string;
  suggestedSubject: string;
  comments: Comment[];
}

const MOCK_POSTS: HNPost[] = [
  {
    id: "hn-1",
    title: "Ask HN: What is the best way to monitor brand mentions on Reddit and HN?",
    author: "techfounder_99",
    points: 134,
    commentsCount: 42,
    timeAgo: "2 hours ago",
    category: "recommendations",
    intent: "high",
    body: "I want to track mentions of my SaaS product and competitors in real-time. Currently doing manual searches, but it's very tedious and slow. Are there any lightweight alerts tool or indexer you'd recommend?",
    topics: ["Brand Monitoring", "Social Alerts", "Social Listening"],
    educationalAdvice: "setting up lightweight keyword filters and API pollers on HackerNews Algolia API, then feeding results into a Slack webhook",
    featureMatch: "automated real-time scanning of Reddit, HackerNews, and Twitter with active buying intent filtering and instant outreach drafts",
    suggestedSubject: "Brand monitoring tool recommendations",
    comments: [
      {
        author: "indie_hack",
        timeAgo: "1 hour ago",
        body: "I've been looking for this too. F5Bot is cool but it only supports HN and Reddit, and doesn't do any smart sorting. Half of the alerts are noise.",
      },
      {
        author: "growth_lead",
        timeAgo: "45 mins ago",
        body: "Most social listening tools are built for enterprise and cost $500/mo. We need something simpler.",
      },
    ],
  },
  {
    id: "hn-2",
    title: "Ask HN: Help me find a reliable Auth0 alternative for a simple NextJS application",
    author: "clod_dev",
    points: 89,
    commentsCount: 27,
    timeAgo: "4 hours ago",
    category: "recommendations",
    intent: "high",
    body: "Auth0 is getting too expensive for our side projects and the setup is too complex. We need something simple, secure, and with a generous free tier. Next-Auth is cool but we want a managed database auth solution.",
    topics: ["Authentication", "NextJS", "SaaS Boilerplate"],
    educationalAdvice: "utilizing developer-first authentication providers like Supabase Auth or Clerk which offer simple Next.js App Router integrations",
    featureMatch: "clean API-first user management, zero-config hooks, and developer-friendly pricing that starts free",
    suggestedSubject: "Auth0 alternatives for Next.js",
    comments: [
      {
        author: "js_ninja",
        timeAgo: "3 hours ago",
        body: "Clerk is amazing for NextJS App Router. Setup takes less than 15 minutes. Highly recommend it.",
      },
      {
        author: "backend_dan",
        timeAgo: "2 hours ago",
        body: "If you want open source, Supabase is standard. Next-Auth works but database sessions require a bit of manual wiring.",
      },
    ],
  },
  {
    id: "hn-3",
    title: "Ask HN: What's your biggest pain point with current CRMs like HubSpot/Salesforce?",
    author: "saas_guy",
    points: 76,
    commentsCount: 38,
    timeAgo: "6 hours ago",
    category: "pain-points",
    intent: "medium",
    body: "I'm looking to build a micro-CRM for solo founders and small agencies. What are your biggest frustrations with existing tools? What feature do you wish they had?",
    topics: ["CRM", "B2B Sales", "Sales Operations"],
    educationalAdvice: "focusing on a single source of truth for communication history and reducing manual data entry for contacts",
    featureMatch: "a hyper-focused, minimal CRM view designed strictly to help small teams prioritize active deals without standard enterprise bloat",
    suggestedSubject: "Feedback on CRM pain points",
    comments: [
      {
        author: "lead_gen_boss",
        timeAgo: "5 hours ago",
        body: "Manual logging of emails and call notes is the worst part. If it doesn't auto-sync with my inbox, I won't use it.",
      },
      {
        author: "indie_founder",
        timeAgo: "4 hours ago",
        body: "Pricing jumps way too fast. HubSpot goes from free to $400+/month for standard automation. We need a middle tier.",
      },
    ],
  },
  {
    id: "hn-4",
    title: "Ask HN: Who is hiring? (June 2026)",
    author: "knivik_jobs",
    points: 210,
    commentsCount: 88,
    timeAgo: "10 hours ago",
    category: "hiring",
    intent: "high",
    body: "Knivik is looking for a Senior Frontend Engineer (React/TypeScript). We are building tools for modern sales teams. Fully remote, competitive equity and salary. Apply at jobs@knivik.com.",
    topics: ["React", "TypeScript", "Engineering Roles"],
    educationalAdvice: "sharing a short, high-impact summary of your experience optimizing React bundle sizes, loading skeletons, and interactive state design",
    featureMatch: "deep engineering expertise building interactive Next.js apps, strict TypeScript architectures, and elite Tailwind styles",
    suggestedSubject: "Senior Frontend Engineer application",
    comments: [
      {
        author: "vibe_coder",
        timeAgo: "8 hours ago",
        body: "Is the position open to candidates from EMEA timezone?",
      },
    ],
  },
  {
    id: "hn-5",
    title: "Ask HN: How do you build your B2B lead list?",
    author: "outreach_dan",
    points: 45,
    commentsCount: 19,
    timeAgo: "1 day ago",
    category: "feedback",
    intent: "medium",
    body: "We just launched our developer tool and want to reach out to engineering managers. ZoomInfo is way too expensive. LinkedIn Sales Navigator feels saturated. How are you sourcing warm leads?",
    topics: ["Lead Sourcing", "Outreach", "Cold Email"],
    educationalAdvice: "scraping relevant community threads where users actively mention problems, which converts at least 3x higher than general cold emails",
    featureMatch: "identifying buying intent keywords inside public platforms and drafting personalized replies instantly",
    suggestedSubject: "Warm lead sourcing strategies",
    comments: [
      {
        author: "saas_builder_1",
        timeAgo: "20 hours ago",
        body: "Honestly, social listening is the only thing that works for us now. Cold database lists are dead.",
      },
    ],
  },
  {
    id: "hn-6",
    title: "Ask HN: Any tools to audit email templates for spam?",
    author: "marketer_tim",
    points: 62,
    commentsCount: 15,
    timeAgo: "1 day ago",
    category: "recommendations",
    intent: "high",
    body: "Our cold emails are hitting the spam folder recently. We're using standard copy with a few links and CTA. Are there tools to analyze the copy for spam risk and warmth before sending?",
    topics: ["Email Delivery", "Spam Filters", "Copywriting"],
    educationalAdvice: "minimizing links, removing hard-sell terminology (e.g. 'buy now'), and improving the 'warmth' of your introductory hook",
    featureMatch: "an outreach warmth and spam risk auditor that reviews your copywriting signals and generates safe, friendly alternatives",
    suggestedSubject: "Email spam auditing tools",
    comments: [
      {
        author: "deliverability_pro",
        timeAgo: "18 hours ago",
        body: "Make sure you check your domain setup (SPF, DKIM, DMARC) first. But yes, body copy plays a huge role if spam filters are on edge.",
      },
    ],
  },
  {
    id: "hn-7",
    title: "Ask HN: Seeking feedback on a landing page for a developer API",
    author: "api_dev_pete",
    points: 31,
    commentsCount: 22,
    timeAgo: "2 days ago",
    category: "feedback",
    intent: "medium",
    body: "We just launched our payment routing API. Conversion rates are low (around 0.5%). Would love some brutal feedback on the landing page layout and copy. Link: https://payroute.dev",
    topics: ["Landing Page", "UX Audit", "DevTools"],
    educationalAdvice: "simplifying the above-the-fold value proposition and placing a clean, copyable cURL request snippet upfront to captivate engineers",
    featureMatch: "generating dynamic testimonial widgets and developer trust social proof cards directly from community mentions",
    suggestedSubject: "Landing page conversion feedback",
    comments: [
      {
        author: "design_critique",
        timeAgo: "1 day ago",
        body: "The header is too vague. I read it and still have no idea what your API actually routes.",
      },
    ],
  },
  {
    id: "hn-8",
    title: "Ask HN: What tool do you use to manage your API keys?",
    author: "sec_ops",
    points: 152,
    commentsCount: 51,
    timeAgo: "2 days ago",
    category: "recommendations",
    intent: "high",
    body: "We have multiple microservices and team members sharing developer keys (OpenAI, Stripe, AWS). Git secrets are a risk, and Vault feels like overkill for 5 devs. What do you use?",
    topics: ["Security", "API Keys", "Secrets Management"],
    educationalAdvice: "implementing lightweight, modern secret management tools that sync environment variables securely with standard developer local configs",
    featureMatch: "seamless team API key sync, automatic developer env generation, and high-trust key rotation tools",
    suggestedSubject: "Developer secrets management",
    comments: [
      {
        author: "infra_guru",
        timeAgo: "1 day ago",
        body: "Infisical is exactly what you need. Lightweight, self-hostable, and extremely fast to set up compared to HashiCorp Vault.",
      },
    ],
  },
];

interface CustomPitchProps {
  productName: string;
  valueProposition: string;
  cta: string;
  onChange: (field: string, value: string) => void;
}

function PitchCustomizer({ productName, valueProposition, cta, onChange }: CustomPitchProps) {
  return (
    <div className="bg-card border border-border/60 rounded-xl p-4 shadow-lg flex flex-col gap-3.5">
      <div className="flex items-center justify-between border-b border-border/40 pb-2">
        <h2 className="text-xs font-black text-foreground flex items-center gap-1.5 uppercase tracking-wider">
          <Settings className="h-3.5 w-3.5 text-primary" />
          Pitch Customizer
        </h2>
        <span className="text-[10px] font-bold text-primary flex items-center gap-1 bg-primary/15 px-2 py-0.5 rounded-full">
          <Sparkles className="h-2.5 w-2.5" /> Live Updates
        </span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Customize your product profile below. The outreach pitches generated on each lead card will update dynamically.
      </p>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70">
            Product Name
          </Label>
          <Input
            value={productName}
            onChange={(e) => onChange("productName", e.target.value)}
            placeholder="MySaaS"
            className="h-9 text-xs font-semibold bg-secondary/20 border-border/70 text-foreground"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70">
            Value Proposition
          </Label>
          <Input
            value={valueProposition}
            onChange={(e) => onChange("valueProposition", e.target.value)}
            placeholder="describes what it helps users solve..."
            className="h-9 text-xs font-semibold bg-secondary/20 border-border/70 text-foreground"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70">
            Call to Action (CTA)
          </Label>
          <Input
            value={cta}
            onChange={(e) => onChange("cta", e.target.value)}
            placeholder="try the free demo today"
            className="h-9 text-xs font-semibold bg-secondary/20 border-border/70 text-foreground"
          />
        </div>
      </div>
    </div>
  );
}

interface PostCardProps {
  post: HNPost;
  isExpanded: boolean;
  onToggleExpand: () => void;
  productName: string;
  valueProposition: string;
  cta: string;
}

function PostCard({ post, isExpanded, onToggleExpand, productName, valueProposition, cta }: PostCardProps) {
  const [pitchType, setPitchType] = useState<"direct" | "educational">("direct");
  const [copied, setCopied] = useState(false);

  const directPitch = useMemo(() => {
    return [
      `Hey @${post.author},`,
      "",
      `I saw your Ask HN post regarding: "${post.title.replace("Ask HN: ", "")}".`,
      "",
      `We built ${productName || "Knivik"} specifically to solve this: ${valueProposition || "streamline the process"}.`,
      `Particularly, it provides ${post.featureMatch}.`,
      "",
      `If you'd like to check it out, you can ${cta || "try our free demo"}. Let me know if you want a quick walkthrough!`,
    ].join("\n");
  }, [post, productName, valueProposition, cta]);

  const educationalPitch = useMemo(() => {
    return [
      `Hi @${post.author},`,
      "",
      `Regarding your HN question on ${post.topics.join(", ")} — a common recommendation is ${post.educationalAdvice}.`,
      "",
      `If you're looking to automate or optimize this, ${productName || "Knivik"} might be a fit because it ${valueProposition || "simplifies the workflow"}.`,
      "",
      `Feel free to ${cta || "visit our site"} or ask any questions about this setup. Happy to share what worked for us!`,
    ].join("\n");
  }, [post, productName, valueProposition, cta]);

  const activePitch = pitchType === "direct" ? directPitch : educationalPitch;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(activePitch);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const intentColor =
    post.intent === "high"
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      : post.intent === "medium"
        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
        : "bg-blue-500/10 text-blue-400 border-blue-500/20";

  return (
    <div
      className={`relative group overflow-hidden rounded-xl border transition-all duration-300 ${
        isExpanded
          ? "border-primary/40 bg-white/[0.04] shadow-[0_12px_36px_rgba(99,102,241,0.08)]"
          : "border-border/60 bg-white/[0.02] hover:border-primary/20 hover:bg-white/[0.03]"
      }`}
    >
      <div
        className="absolute -inset-px bg-gradient-to-r from-primary to-accent rounded-xl opacity-0 group-hover:opacity-5 blur-lg transition-opacity duration-500 pointer-events-none"
      />

      <div className="p-4 relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/80">
              {post.timeAgo}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground/60">•</span>
            <span className="text-[10px] font-black uppercase tracking-wider text-primary">
              @{post.author}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground/60">•</span>
            <span className="text-[10px] font-black uppercase tracking-wider bg-secondary/35 border border-border/40 px-2 py-0.5 rounded-full text-foreground/80">
              {post.category.replace("-", " ")}
            </span>
          </div>

          <span className={`text-[10px] font-black uppercase tracking-wider border px-2 py-0.5 rounded-full ${intentColor}`}>
            {post.intent} Intent
          </span>
        </div>

        <h3
          onClick={onToggleExpand}
          className="text-sm font-black text-foreground tracking-tight hover:text-primary transition-colors cursor-pointer leading-tight mb-2"
        >
          {post.title}
        </h3>

        <p className="text-xs font-medium text-muted-foreground leading-relaxed mb-3 line-clamp-2">
          {post.body}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/40">
          <div className="flex flex-wrap gap-1.5">
            {post.topics.map((t) => (
              <span
                key={t}
                className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/65 bg-secondary/20 px-2 py-0.5 rounded-md border border-border/30"
              >
                {t}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleExpand}
              className="text-xs font-bold text-foreground/80 hover:text-primary flex items-center gap-1 transition-all"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {post.commentsCount} comments
            </button>
            <Button
              onClick={onToggleExpand}
              variant={isExpanded ? "secondary" : "ghost"}
              className="h-7 px-3 text-[10px] font-black uppercase tracking-wider rounded-full active:scale-95 transition-all"
            >
              {isExpanded ? "Close Pitch" : "Get Pitch"}
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-border/40 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Pitch output */}
              <div className="lg:col-span-8 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1.5">
                  <div className="flex gap-1.5 bg-secondary/30 p-0.5 border border-border/80 rounded-lg">
                    <button
                      onClick={() => setPitchType("direct")}
                      className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md transition-all ${
                        pitchType === "direct"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Direct Pitch
                    </button>
                    <button
                      onClick={() => setPitchType("educational")}
                      className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md transition-all ${
                        pitchType === "educational"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Educational Pitch
                    </button>
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleCopy}
                    className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground active:scale-95"
                    title="Copy Pitch"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>

                <div className="rounded-lg border border-border/60 bg-secondary/15 p-3.5 text-xs text-foreground font-mono leading-relaxed whitespace-pre-wrap select-all">
                  {activePitch}
                </div>
              </div>

              {/* Thread Context Comments */}
              <div className="lg:col-span-4 flex flex-col gap-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/80 border-b border-border/40 pb-1">
                  HN Discussion Context
                </p>
                <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
                  {post.comments.map((c, i) => (
                    <div key={i} className="flex flex-col gap-0.5 bg-secondary/10 p-2 rounded-lg border border-border/30">
                      <div className="flex items-center justify-between text-[8px] font-bold text-muted-foreground">
                        <span>@{c.author}</span>
                        <span>{c.timeAgo}</span>
                      </div>
                      <p className="text-[10px] font-medium text-foreground/90 leading-normal">
                        {c.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-primary/5 border border-primary/20 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary shrink-0" />
                <span className="text-[11px] font-medium text-muted-foreground">
                  Get real-time Alerts for <strong className="text-foreground">@{post.author}</strong> and automate pitch flows.
                </span>
              </div>
              <Button asChild size="sm" className="h-7 rounded-full text-[10px] font-bold">
                <Link href="/pricing" className="flex items-center gap-1">
                  Monitor HN Alerts
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AskHnFeedClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [selectedIntent, setSelectedIntent] = useState<IntentLevel>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Pitch settings
  const [productName, setProductName] = useState("Knivik");
  const [valueProposition, setValueProposition] = useState(
    "automatically tracks social lead buying intent and drafts custom outreach in seconds"
  );
  const [cta, setCta] = useState("try our free demo at knivik.com");

  // Interactive expanded post ID (initially first is open)
  const [expandedPostId, setExpandedPostId] = useState<string | null>("hn-1");

  const handlePitchChange = (field: string, value: string) => {
    if (field === "productName") setProductName(value);
    if (field === "valueProposition") setValueProposition(value);
    if (field === "cta") setCta(value);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedIntent("all");
    setSortBy("newest");
  };

  // Intent value mapping for sort
  const intentWeight = { high: 3, medium: 2, low: 1 };

  const filteredPosts = useMemo(() => {
    return MOCK_POSTS.filter((post) => {
      const matchSearch =
        searchTerm.trim() === "" ||
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.topics.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCategory = selectedCategory === "all" || post.category === selectedCategory;
      const matchIntent = selectedIntent === "all" || post.intent === selectedIntent;

      return matchSearch && matchCategory && matchIntent;
    }).sort((a, b) => {
      if (sortBy === "newest") return 0; // maintain default list ordering
      if (sortBy === "score") return b.points - a.points;
      if (sortBy === "intent") return intentWeight[b.intent] - intentWeight[a.intent];
      return 0;
    });
  }, [searchTerm, selectedCategory, selectedIntent, sortBy]);

  return (
    <section className="relative overflow-hidden bg-background pt-28 pb-16">
      <div className="container mx-auto px-6">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground/60 mb-3">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <span>Tools</span>
          <span>/</span>
          <span className="text-primary">Ask HN Lead Feed</span>
        </div>

        <div className="flex flex-col gap-1 mb-5 pb-4 border-b border-border/40">
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Ask HN <span className="text-primary">Lead Finder Feed</span>
          </h1>
          <p className="text-sm font-medium text-muted-foreground max-w-2xl">
            Monitor real-time HackerNews discussions containing warm buying intent signals. Pitch your product using our dynamic customizable outreach templates.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sidebar pitch customizer */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <PitchCustomizer
              productName={productName}
              valueProposition={valueProposition}
              cta={cta}
              onChange={handlePitchChange}
            />

            <div className="rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-accent/5 p-4 shadow-lg flex flex-col gap-3">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-primary" /> Why HackerNews?
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Founders and tech buyers regularly use HackerNews ask threads to solicit tool choices or voice frustrations. Getting in early with highly relevant, helpful context yields high conversion rates.
              </p>
            </div>
          </div>

          {/* Main Feed panel */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {/* Filters panel */}
            <div className="bg-card border border-border/60 rounded-xl p-4 shadow-lg flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search keywords (e.g. auth, crm, mail)..."
                    className="pl-9 h-9 text-xs bg-secondary/20 border-border/70 text-foreground"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="h-9 px-3 text-xs bg-secondary/20 border border-border/70 rounded-lg text-foreground font-bold hover:bg-secondary/40 transition-colors outline-none"
                  >
                    <option value="newest" className="bg-card text-foreground">Sort: Newest</option>
                    <option value="score" className="bg-card text-foreground">Sort: HN Points</option>
                    <option value="intent" className="bg-card text-foreground">Sort: Buying Intent</option>
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

              {/* Tab Category Filters */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1">
                  <Filter className="h-3 w-3 text-primary" /> Filter Intent Category
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(["all", "recommendations", "pain-points", "hiring", "feedback"] as Category[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                        selectedCategory === cat
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground border border-border/50"
                      }`}
                    >
                      {cat.replace("-", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Intent Level Selection */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/80">
                  Intent Strength:
                </span>
                <div className="flex gap-1.5">
                  {(["all", "high", "medium", "low"] as IntentLevel[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => setSelectedIntent(level)}
                      className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${
                        selectedIntent === level
                          ? "bg-foreground text-background font-black"
                          : "text-muted-foreground hover:bg-secondary/30"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Leads list */}
            <div className="flex flex-col gap-3">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    isExpanded={expandedPostId === post.id}
                    onToggleExpand={() =>
                      setExpandedPostId(expandedPostId === post.id ? null : post.id)
                    }
                    productName={productName}
                    valueProposition={valueProposition}
                    cta={cta}
                  />
                ))
              ) : (
                <div className="rounded-xl border border-border/60 bg-card/65 p-8 text-center flex flex-col items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-secondary/30 border border-border/50 flex items-center justify-center text-muted-foreground">
                    <Search className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-black text-foreground">No matches found</p>
                    <p className="text-xs text-muted-foreground">
                      Try refining your search keyword or resetting the filter tags.
                    </p>
                  </div>
                  <Button onClick={handleResetFilters} size="sm" className="rounded-full text-xs font-bold mt-2">
                    Reset all filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
