"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Search,
  Bot,
  Zap,
  CheckCircle2,
  ShieldCheck,
  LineChart,
  MessageSquare,
  Terminal,
  Layers,
  ChevronRight,
  Copy,
  Check,
  Flame,
  Globe2,
  Cpu,
  Database,
  Send,
  ExternalLink,
} from "lucide-react";
import { FaReddit, FaHackerNews, FaTwitter } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";
import { toast } from "sonner";

interface CortexLandingClientProps {
  user: any;
}

interface DemoScenario {
  id: string;
  tabLabel: string;
  icon: any;
  prompt: string;
  toolCall: string;
  thoughtProcess: string;
  resultType: "leads" | "reply" | "analytics";
  leads?: Array<{
    platform: "REDDIT" | "HACKERNEWS" | "TWITTER";
    author: string;
    intentScore: number;
    intentLevel: "BUY_NOW" | "COMPARING";
    title: string;
    content: string;
    reasoning: string;
  }>;
  replyData?: {
    leadTitle: string;
    leadContext: string;
    generatedReply: string;
    strategyAngle: string;
  };
  analyticsData?: {
    totalLeads: number;
    highIntentRatio: string;
    topPlatform: string;
    conversionInsight: string;
  };
}

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "live-discovery",
    tabLabel: "Live Social Discovery",
    icon: Search,
    prompt: "Scan Reddit and Twitter for anyone actively looking for alternatives to Loom with video editing capabilities.",
    toolCall: "liveSocialDiscovery({ topic: 'Loom alternative video editing', platform: 'ALL', limit: 3 })",
    thoughtProcess: "Queried live subreddits (r/SaaS, r/videography, r/startups) and Twitter discussions in real-time. Extracted 8 candidates, scored buying intent with deep reasoning, and filtered for users with immediate purchasing timeline.",
    resultType: "leads",
    leads: [
      {
        platform: "REDDIT",
        author: "u/growth_lead_99",
        intentScore: 96,
        intentLevel: "BUY_NOW",
        title: "Loom's new pricing is insane. Need a self-hosted or affordable alternative ASAP",
        content: "Our team just got billed $250/mo for basic screen recording. We need a modern screen recorder that has built-in AI trimming and fast link sharing. Any recommendations with team workspaces?",
        reasoning: "Expresses severe pricing dissatisfaction, mentions exact team budget, and specifies urgency ('ASAP') with concrete feature requirements.",
      },
      {
        platform: "TWITTER",
        author: "@sarah_builds",
        intentScore: 88,
        intentLevel: "BUY_NOW",
        title: "Recommendation request: Video messaging for remote agencies",
        content: "What is everyone using instead of Loom in 2026? Need fast cloud uploads, 4K rendering, and custom domain branding. Willing to pay annual plan.",
        reasoning: "Explicit buyer signal ('willing to pay annual plan') looking for immediate software replacement for client agency work.",
      },
    ],
  },
  {
    id: "outreach-reply",
    tabLabel: "Instant Warm Reply Drafter",
    icon: MessageSquare,
    prompt: "Draft a consultative, non-salesy response for the Reddit lead complaining about Loom's team pricing.",
    toolCall: "aiLlmRunner({ action: 'draft_outreach', model: 'llama-3.3-70b-versatile', tone: 'helpful' })",
    thoughtProcess: "Analyzing author's explicit frustration points: team workspace costs, AI trimming, and link speed. Formulating a value-first comment that validates their pain point without sounding like a pushy bot.",
    resultType: "reply",
    replyData: {
      leadTitle: "Loom's new pricing is insane. Need an alternative ASAP",
      leadContext: "Author frustrated by unexpected $250/mo bill, wants team sharing + AI trimming.",
      strategyAngle: "Value-First Consultative Angle (0% spam, 100% helpful advice)",
      generatedReply: "Hey u/growth_lead_99 — totally hear you on the per-seat pricing trap with screen recording tools. A lot of teams run into that exact tier cliff once they pass 10 seats.\n\nIf AI trimming and fast link sharing are your core requirements, make sure whichever tool you evaluate supports background encoding so your team isn't waiting on video uploads. Also check whether they bill per active creator vs per viewer.\n\nWe built Knivik's companion recorder with fixed workspace pricing specifically to solve this. Happy to send over an extended trial link if you'd like to test team permissions!",
    },
  },
  {
    id: "workspace-memory",
    tabLabel: "Workspace Analytics & Lead Audit",
    icon: Database,
    prompt: "Audit my captured pipeline for the last 7 days and highlight my highest conversion channels.",
    toolCall: "getWorkspaceStats() + querySystemLeads({ timeRange: 'week', minIntentScore: 80 })",
    thoughtProcess: "Aggregating 142 captured leads across 3 active workspace offerings. Segmenting intent levels, calculating channel velocity, and identifying high-intent clusters.",
    resultType: "analytics",
    analyticsData: {
      totalLeads: 142,
      highIntentRatio: "68% BUY_NOW / COMPARING",
      topPlatform: "Reddit (54%) > HackerNews (31%) > Twitter (15%)",
      conversionInsight: "r/SaaS and r/startups threads mentioning 'switching from' or 'cancel subscription' showed a 4.2x higher reply engagement rate than generic keyword alerts. 38 leads ready for outreach.",
    },
  },
];

const CAPABILITIES = [
  {
    icon: Globe2,
    title: "Live Social Discovery Radar",
    description: "Cortex scans Reddit, HackerNews, and Twitter on demand in real-time. Find high-intent prospects within seconds without waiting for daily cron batches.",
    badge: "Real-Time Scraper",
  },
  {
    icon: Cpu,
    title: "Deep Intent Scoring Engine",
    description: "Evaluates nuanced context, budget indicators, and urgency using state-of-the-art LLMs with Zod schema validation. Cuts 95% of social media noise.",
    badge: "0-100 Precision",
  },
  {
    icon: Layers,
    title: "1-Click Pipeline Ingestion",
    description: "Attaches discovered leads directly into your product funnels. Tags, categorizes, and organizes leads with complete audit trails automatically.",
    badge: "Zero Manual Entry",
  },
  {
    icon: Terminal,
    title: "Natural Language Lead Search",
    description: "Query your workspace leads with conversational English: 'Show me high-intent Reddit leads from yesterday who asked about pricing.'",
    badge: "Contextual Memory",
  },
  {
    icon: MessageSquare,
    title: "Consultative Outreach Drafter",
    description: "Generates authentic, value-first response drafts tailored to each discussion's specific problem. Avoids spam filters and sparks genuine conversations.",
    badge: "High Conversion",
  },
  {
    icon: ShieldCheck,
    title: "Anti-Detection & Safe Crawling",
    description: "Built with realistic browser header rotation, jitter delays, and decoupled proxy fallbacks to ensure reliable public discussion ingestion.",
    badge: "Enterprise Resilient",
  },
];

const COMPARISON_ROWS = [
  {
    feature: "Discovery Speed",
    cortex: "Instant (< 3s real-time live scan)",
    manual: "Hours of manual browsing & searching",
    legacyAlerts: "Delayed email batch (12-24h lag)",
  },
  {
    feature: "Intent Qualification",
    cortex: "Deep LLM reasoning (BUY_NOW, budget, urgency)",
    manual: "Subjective, prone to fatigue",
    legacyAlerts: "Dumb regex keyword match (90% noise)",
  },
  {
    feature: "Outreach Generation",
    cortex: "Contextual, consultative angle tailored to post",
    manual: "Manual copywriting from scratch",
    legacyAlerts: "None (Raw notification only)",
  },
  {
    feature: "Multi-Platform Coverage",
    cortex: "Reddit + HackerNews + Twitter in single call",
    manual: "Tabbing between multiple apps",
    legacyAlerts: "Single platform or expensive add-ons",
  },
  {
    feature: "Workspace Ingestion",
    cortex: "Autonomous 1-click database sync",
    manual: "Copy-pasting into spreadsheets",
    legacyAlerts: "Manual data entry",
  },
];

const FAQS = [
  {
    question: "What is Cortex AI and how does it find buying leads?",
    answer:
      "Cortex AI is Knivik's autonomous conversational growth agent. It combines real-time social scrapers (for Reddit, HackerNews, and Twitter) with advanced LLM reasoning. When you prompt Cortex, it searches live public discussions, evaluates buying intent scores (0-100), filters out noise, and drafts personalized outreach angles to help you close warm leads.",
  },
  {
    question: "How is Cortex AI different from background automated scans?",
    answer:
      "Knivik's background scans run automatically every 2 to 24 hours to populate your product funnels. Cortex AI gives you on-demand, interactive copilot powers: you can ask it to hunt for new niches in real time, analyze existing pipeline leads, register new products, and draft custom replies on the fly.",
  },
  {
    question: "Is Cortex AI included in the Free tier?",
    answer:
      "Yes! Every free Knivik account receives 5 free Cortex AI queries every single day with no credit card required. Pro tier subscribers unlock 50 queries per day (10x Free) along with priority LLM reasoning and real-time Twitter scanning.",
  },
  {
    question: "Does Cortex AI spam social media accounts on my behalf?",
    answer:
      "No. Knivik believes in authentic, relationship-driven social selling. Cortex AI drafts high-converting, value-first comments and angles that solve the prospect's problem, allowing you to review, personalize, and publish replies authentically.",
  },
  {
    question: "Can Cortex AI interact with my existing workspace data?",
    answer:
      "Absolutely. Cortex has secure, multi-tenant access to your workspace tools: it can inspect your registered products, search historical leads by intent score, audit lead conversion statistics, and create new monitored offerings directly via chat.",
  },
];

export function CortexLandingClient({ user }: CortexLandingClientProps) {
  const [activeScenarioId, setActiveScenarioId] = useState<string>("live-discovery");
  const [copiedReply, setCopiedReply] = useState(false);

  const activeScenario =
    DEMO_SCENARIOS.find((s) => s.id === activeScenarioId) || DEMO_SCENARIOS[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedReply(true);
    toast.success("Outreach reply copied to clipboard!");
    setTimeout(() => setCopiedReply(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* 1. HERO SECTION */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute inset-0 bg-grid opacity-15 -z-10 pointer-events-none select-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10 overflow-hidden select-none">
          <motion.div
            animate={{ opacity: [0.12, 0.22, 0.12], scale: [1, 1.05, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-10%] left-[15%] w-[70%] h-[45%] rounded-[100%] bg-primary/25 blur-[130px] transform-gpu will-change-transform"
          />
          <motion.div
            animate={{ opacity: [0.06, 0.12, 0.06] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[5%] right-[10%] w-[50%] h-[35%] rounded-[100%] bg-purple-500/15 blur-[120px] transform-gpu will-change-transform"
          />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
            {/* Live Indicator Pill */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-primary mb-8 border border-primary/25 shadow-md shadow-primary/10 backdrop-blur-md gap-2"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <Sparkles className="h-3.5 w-3.5" />
              <span>Introducing Cortex AI Copilot</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-foreground mb-6 leading-[1.1]"
            >
              Your Autonomous AI Agent for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-primary">
                Live Social Lead Prospecting.
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg lg:text-xl text-muted-foreground mb-10 leading-relaxed max-w-3xl font-medium"
            >
              Stop manually hunting subreddits, HackerNews threads, and X feeds. Cortex AI executes multi-platform live social discovery, scores buyer intent in real-time, and drafts high-converting outreach angles directly via natural language.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-14"
            >
              <Link href={user ? "/dashboard/cortex" : "/register"} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="h-14 px-9 text-base font-black rounded-2xl w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98] group cursor-pointer gap-2"
                >
                  <Sparkles className="h-5 w-5 fill-primary-foreground/20" />
                  {user ? "Open Cortex Copilot" : "Try Cortex AI Free"}
                  <ArrowRight className="ml-1 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#interactive-simulator" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 text-base font-black rounded-2xl border-2 border-border/80 hover:border-primary/50 hover:bg-secondary/50 transition-all active:scale-[0.98] w-full cursor-pointer gap-2"
                >
                  <Terminal className="h-4 w-4 text-primary" />
                  Try Live Simulator
                </Button>
              </Link>
            </motion.div>

            {/* Stat Callouts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl pt-6 border-t border-border/40"
            >
              <div className="flex flex-col items-center p-3 rounded-xl bg-card/40 border border-border/30 backdrop-blur-sm">
                <span className="text-2xl font-black text-foreground tracking-tight">&lt; 3s</span>
                <span className="text-xs text-muted-foreground font-semibold">Live Multi-Channel Scan</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-xl bg-card/40 border border-border/30 backdrop-blur-sm">
                <span className="text-2xl font-black text-primary tracking-tight">96%</span>
                <span className="text-xs text-muted-foreground font-semibold">Buyer Intent Precision</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-xl bg-card/40 border border-border/30 backdrop-blur-sm">
                <span className="text-2xl font-black text-foreground tracking-tight">3 Platforms</span>
                <span className="text-xs text-muted-foreground font-semibold">Reddit + HN + Twitter</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-xl bg-card/40 border border-border/30 backdrop-blur-sm">
                <span className="text-2xl font-black text-emerald-400 tracking-tight">100% Free</span>
                <span className="text-xs text-muted-foreground font-semibold">5 Queries Daily on Free Plan</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE LIVE SIMULATOR */}
      <section id="interactive-simulator" className="py-20 bg-secondary/30 relative border-y border-border/40">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary border-primary/25 font-black uppercase text-[10px] tracking-widest px-3 py-1 mb-3"
            >
              Interactive Playground
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground mb-4">
              Experience Cortex AI in Action
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground font-medium">
              Select a real-world scenario below to test how Cortex coordinates autonomous tool executions, filters noise, and produces qualified sales opportunities.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto mb-8">
            {DEMO_SCENARIOS.map((scenario) => {
              const Icon = scenario.icon;
              const isSelected = activeScenarioId === scenario.id;
              return (
                <button
                  key={scenario.id}
                  onClick={() => setActiveScenarioId(scenario.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                      : "bg-card/70 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-card"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{scenario.tabLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Agent Terminal Mockup */}
          <div className="max-w-4xl mx-auto">
            <Card className="rounded-2xl border border-border/60 bg-card/90 shadow-2xl backdrop-blur-xl overflow-hidden">
              {/* Window Header */}
              <div className="bg-background/90 px-4 py-3 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 font-mono text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Cortex Agent Engine v2.0
                  </span>
                </div>
                <Badge variant="outline" className="font-mono text-[10px] bg-primary/10 text-primary border-primary/20">
                  llama-3.3-70b-versatile
                </Badge>
              </div>

              {/* Chat Simulation Area */}
              <CardContent className="p-6 space-y-6">
                {/* User Prompt */}
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-secondary border border-border/60 flex items-center justify-center text-xs font-black text-foreground shrink-0">
                    YOU
                  </div>
                  <div className="flex-1 bg-secondary/60 rounded-2xl rounded-tl-none p-4 text-sm text-foreground font-medium border border-border/40">
                    {activeScenario.prompt}
                  </div>
                </div>

                {/* Agent Tool & Reasoning Loop */}
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-black shrink-0 shadow-md shadow-primary/20">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-4">
                    {/* Tool Call Tag */}
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex flex-col gap-1.5 font-mono text-xs">
                      <div className="flex items-center gap-2 text-primary font-bold">
                        <Zap className="h-3.5 w-3.5 fill-primary" />
                        <span>Autonomous Tool Executed:</span>
                      </div>
                      <code className="text-foreground/90 bg-background/60 p-2 rounded-lg break-all">
                        {activeScenario.toolCall}
                      </code>
                    </div>

                    {/* Agent Thought Process */}
                    <div className="text-xs text-muted-foreground italic bg-secondary/40 p-3 rounded-xl border border-border/30 flex items-start gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{activeScenario.thoughtProcess}</span>
                    </div>

                    {/* Scenario Specific Results */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeScenario.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* 1. Leads Grid Result */}
                        {activeScenario.resultType === "leads" && activeScenario.leads && (
                          <div className="space-y-3">
                            <div className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                              Scored & Qualified Live Leads ({activeScenario.leads.length})
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                              {activeScenario.leads.map((lead, i) => (
                                <div
                                  key={i}
                                  className="p-4 rounded-xl bg-card border border-border/70 hover:border-primary/50 transition-all space-y-2 shadow-xs"
                                >
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                      {lead.platform === "REDDIT" && <FaReddit className="h-4 w-4 text-orange-500" />}
                                      {lead.platform === "TWITTER" && <FaTwitter className="h-4 w-4 text-sky-400" />}
                                      {lead.platform === "HACKERNEWS" && <FaHackerNews className="h-4 w-4 text-amber-500" />}
                                      <span className="font-mono text-xs font-bold text-foreground">
                                        {lead.author}
                                      </span>
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs font-bold gap-1"
                                    >
                                      <Flame className="h-3 w-3 fill-emerald-400" />
                                      {lead.intentLevel} ({lead.intentScore}/100)
                                    </Badge>
                                  </div>
                                  <h4 className="text-sm font-bold text-foreground">{lead.title}</h4>
                                  <p className="text-xs text-muted-foreground leading-relaxed">{lead.content}</p>
                                  <div className="pt-2 border-t border-border/40 text-[11px] text-primary font-medium flex items-center gap-1.5">
                                    <Sparkles className="h-3 w-3 shrink-0" />
                                    <span>{lead.reasoning}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 2. Reply Generation Result */}
                        {activeScenario.resultType === "reply" && activeScenario.replyData && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge className="bg-primary/15 text-primary border-primary/30 text-xs font-bold">
                                {activeScenario.replyData.strategyAngle}
                              </Badge>
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => handleCopy(activeScenario.replyData!.generatedReply)}
                                className="h-7 text-xs gap-1.5 cursor-pointer active:scale-95"
                              >
                                {copiedReply ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                                {copiedReply ? "Copied!" : "Copy Reply"}
                              </Button>
                            </div>
                            <div className="p-4 rounded-xl bg-background/80 border border-border/80 text-xs sm:text-sm text-foreground/90 whitespace-pre-line leading-relaxed font-sans shadow-inner">
                              {activeScenario.replyData.generatedReply}
                            </div>
                          </div>
                        )}

                        {/* 3. Analytics Result */}
                        {activeScenario.resultType === "analytics" && activeScenario.analyticsData && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="p-3 rounded-xl bg-background/80 border border-border/50">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Captured Leads</span>
                                <div className="text-xl font-black text-foreground">{activeScenario.analyticsData.totalLeads}</div>
                              </div>
                              <div className="p-3 rounded-xl bg-background/80 border border-border/50">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Intent Ratio</span>
                                <div className="text-xl font-black text-primary">{activeScenario.analyticsData.highIntentRatio}</div>
                              </div>
                              <div className="p-3 rounded-xl bg-background/80 border border-border/50">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Top Channel</span>
                                <div className="text-xl font-black text-foreground">{activeScenario.analyticsData.topPlatform.split(" ")[0]}</div>
                              </div>
                            </div>
                            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-xs text-foreground/90 leading-relaxed font-medium">
                              <strong>💡 AI Opportunity Insight:</strong> {activeScenario.analyticsData.conversionInsight}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </CardContent>

              {/* Bottom Quick Bar */}
              <div className="bg-secondary/40 p-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground font-medium">
                  Want to execute custom live searches across your specific niche?
                </span>
                <Link href={user ? "/dashboard/cortex" : "/register"}>
                  <Button size="sm" className="font-bold gap-1.5 cursor-pointer">
                    <span>Launch Cortex AI</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 3. CORE AGENT CAPABILITIES */}
      <section className="py-24 bg-background relative">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary border-primary/25 font-black uppercase text-[10px] tracking-widest px-3 py-1 mb-3"
            >
              Engine Architecture
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground mb-4">
              Autonomous Growth Engineering at Scale
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground font-medium">
              Cortex AI acts as your tireless SDR and social scout, handling discovery, deep filtering, and outreach drafting round-the-clock.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {CAPABILITIES.map((cap, i) => {
              const Icon = cap.icon;
              return (
                <Card
                  key={i}
                  className="rounded-2xl border border-border/50 bg-card/60 hover:border-primary/40 hover:bg-card/90 transition-all duration-300 p-6 flex flex-col justify-between shadow-xs hover:shadow-xl hover:shadow-primary/5 group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Icon className="h-6 w-6" />
                      </div>
                      <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground bg-secondary/50">
                        {cap.badge}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">{cap.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                      {cap.description}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. COMPARISON MATRIX */}
      <section className="py-20 bg-secondary/20 border-t border-border/40">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-3">
              Why Teams Choose Cortex AI
            </h2>
            <p className="text-base text-muted-foreground font-medium">
              Compare autonomous AI prospecting against manual scrolling and basic keyword alert tools.
            </p>
          </div>

          <div className="max-w-4xl mx-auto rounded-2xl border border-border/60 bg-card/80 overflow-hidden shadow-xl backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/50 bg-secondary/50">
                    <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground w-1/4">Feature</th>
                    <th className="p-4 text-xs font-black uppercase tracking-wider text-primary w-2/5 bg-primary/10">
                      ⚡ Cortex AI Copilot
                    </th>
                    <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground w-1/4">Manual Hunting</th>
                    <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground w-1/4">Legacy Keyword Trackers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-xs sm:text-sm">
                  {COMPARISON_ROWS.map((row, i) => (
                    <tr key={i} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-4 font-bold text-foreground">{row.feature}</td>
                      <td className="p-4 font-bold text-primary bg-primary/5 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        <span>{row.cortex}</span>
                      </td>
                      <td className="p-4 text-muted-foreground">{row.manual}</td>
                      <td className="p-4 text-muted-foreground">{row.legacyAlerts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQ SECTION */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-14">
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary border-primary/25 font-black uppercase text-[10px] tracking-widest px-3 py-1 mb-3"
            >
              Got Questions?
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-base text-muted-foreground font-medium">
              Everything you need to know about Cortex AI and social lead generation.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            {FAQS.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="border border-border/60 rounded-2xl bg-card/60 px-5 shadow-xs data-[state=open]:border-primary/40 data-[state=open]:bg-card/90 transition-all"
              >
                <AccordionTrigger className="text-left font-bold text-base hover:text-primary transition-colors py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4 pt-1 font-medium">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* 6. FINAL CTA SECTION */}
      <section className="py-20 bg-gradient-to-b from-background to-secondary/30 relative border-t border-border/40">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <div className="p-8 sm:p-12 rounded-3xl bg-card border border-primary/30 shadow-2xl shadow-primary/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/15 rounded-full blur-3xl -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground mb-4 leading-tight">
              Ready to automate your social pipeline with Cortex AI?
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 font-medium">
              Get started with 5 free daily queries. No credit card required. Discover your next customer before your competitors do.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={user ? "/dashboard/cortex" : "/register"} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="h-14 px-10 text-base font-black rounded-2xl w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] group cursor-pointer gap-2"
                >
                  <Sparkles className="h-5 w-5 fill-primary-foreground/20" />
                  {user ? "Go to Cortex AI Copilot" : "Get 5 Free Daily Queries"}
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/pricing" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 text-base font-black rounded-2xl border-2 border-border/80 hover:border-primary/50 hover:bg-secondary/50 transition-all active:scale-[0.98] w-full cursor-pointer"
                >
                  View Plan Limits
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
