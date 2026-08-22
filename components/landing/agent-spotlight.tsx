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
  Flame,
  Globe2,
  Cpu,
  Layers,
  Terminal,
  MessageSquare,
} from "lucide-react";
import { FaReddit, FaHackerNews, FaTwitter } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export function AgentSpotlight() {
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);

  const demoPrompts = [
    {
      label: "Live Social Hunt",
      query: "Scan Reddit for people asking for Supabase alternatives with self-hosted support",
      tool: "liveSocialDiscovery({ topic: 'Supabase alternative self-hosted', platform: 'REDDIT' })",
      sampleResult: {
        platform: "REDDIT",
        author: "u/backend_dev_sarah",
        intentScore: 94,
        intentLevel: "BUY_NOW",
        title: "Looking for a reliable self-hosted alternative to Supabase for Postgres",
        snippet: "Need a managed auth & realtime DB setup we can deploy in our own VPC. Our cloud bill exceeded $800 last month. Any good production-ready tools?",
      },
    },
    {
      label: "Pipeline Intent Audit",
      query: "Show me my top 5 highest buying-intent leads captured this week",
      tool: "querySystemLeads({ timeRange: 'week', minIntentScore: 85 })",
      sampleResult: {
        platform: "TWITTER",
        author: "@founder_dave",
        intentScore: 91,
        intentLevel: "BUY_NOW",
        title: "Recommendation: B2B lead enrichment tool for small sales teams",
        snippet: "Apollo and ZoomInfo are way too bloated for our 3-person team. What's the best lean alternative with high email accuracy?",
      },
    },
    {
      label: "Consultative Reply",
      query: "Draft a helpful, value-first outreach angle for the Supabase Reddit discussion",
      tool: "aiLlmRunner({ action: 'draft_outreach', model: 'llama-3.3-70b-versatile' })",
      sampleResult: {
        platform: "HACKERNEWS",
        author: "Cortex AI Angle",
        intentScore: 98,
        intentLevel: "COMPARING",
        title: "Value-First Consultation Angle (0% Spam)",
        snippet: "Highlighted VPC isolation architectures, shared comparison benchmark, and offered companion self-hosted migration guide with zero hard-sell.",
      },
    },
  ];

  const activeDemo = demoPrompts[selectedPromptIndex];

  return (
    <section className="py-24 bg-gradient-to-b from-background via-secondary/20 to-background relative overflow-hidden border-y border-border/40">
      {/* Radiant ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 max-w-6xl mx-auto">
          {/* Left Column: Story & Call to Action */}
          <div className="w-full lg:w-1/2 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center rounded-full bg-primary/10 px-3.5 py-1 text-xs font-black uppercase tracking-widest text-primary border border-primary/25 shadow-xs gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Brand New Feature</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground leading-[1.15]">
              Meet <span className="text-primary">Cortex AI:</span> <br className="hidden sm:inline" />
              Your Autonomous Lead Hunting Copilot.
            </h2>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-medium">
              Don&apos;t just wait for periodic background scans. Ask Cortex to hunt live public conversations on Reddit, HackerNews, and Twitter, qualify buyer intent with deep reasoning, and draft high-converting outreach angles on demand.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-foreground/90">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span>Live On-Demand Scraper</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-foreground/90">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span>0-100 Buyer Intent Scoring</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-foreground/90">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span>1-Click Lead Saving</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-foreground/90">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span>5 Free Queries Daily</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link href="/cortex" className="w-full sm:w-auto">
                <Button size="lg" className="h-13 px-8 text-base font-black rounded-2xl w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] group cursor-pointer gap-2">
                  <span>Explore Cortex AI</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/register" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="h-13 px-6 text-sm font-bold rounded-2xl border-border/80 hover:border-primary/50 transition-all active:scale-[0.98] w-full cursor-pointer">
                  Start Free
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Live Interactive Widget Card */}
          <div className="w-full lg:w-1/2">
            <Card className="rounded-2xl border border-border/70 bg-card/90 shadow-2xl backdrop-blur-xl overflow-hidden">
              {/* Window Header */}
              <div className="bg-background/90 px-4 py-3 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 font-mono text-[11px] text-muted-foreground font-bold flex items-center gap-1">
                    <Terminal className="h-3 w-3 text-primary" />
                    cortex-agent --interactive
                  </span>
                </div>
                <Badge variant="outline" className="font-mono text-[10px] bg-primary/10 text-primary border-primary/20">
                  Ready
                </Badge>
              </div>

              {/* Prompt Picker Tabs */}
              <div className="bg-secondary/40 p-2 border-b border-border/40 flex items-center gap-1.5 overflow-x-auto">
                {demoPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPromptIndex(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedPromptIndex === idx
                        ? "bg-primary text-primary-foreground shadow-xs scale-[1.02]"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Chat Simulation Body */}
              <CardContent className="p-5 space-y-4">
                {/* User Bubble */}
                <div className="flex items-start gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-secondary border border-border flex items-center justify-center text-[10px] font-black shrink-0">
                    YOU
                  </div>
                  <div className="flex-1 bg-secondary/50 rounded-xl rounded-tl-none p-3 text-xs text-foreground font-medium border border-border/40 leading-relaxed">
                    &quot;{activeDemo.query}&quot;
                  </div>
                </div>

                {/* Agent Bubble & Output */}
                <div className="flex items-start gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-black shrink-0 shadow-xs">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 space-y-3">
                    {/* Tool Call Pill */}
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-2 font-mono text-[11px] text-primary font-semibold flex items-center gap-1.5">
                      <Zap className="h-3 w-3 fill-primary" />
                      <span>{activeDemo.tool}</span>
                    </div>

                    {/* Result Card */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={selectedPromptIndex}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="p-3.5 rounded-xl bg-background border border-border/80 space-y-2 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {activeDemo.sampleResult.platform === "REDDIT" && <FaReddit className="h-3.5 w-3.5 text-orange-500" />}
                            {activeDemo.sampleResult.platform === "TWITTER" && <FaTwitter className="h-3.5 w-3.5 text-sky-400" />}
                            {activeDemo.sampleResult.platform === "HACKERNEWS" && <FaHackerNews className="h-3.5 w-3.5 text-amber-500" />}
                            <span className="font-mono text-xs font-bold text-foreground">
                              {activeDemo.sampleResult.author}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-bold gap-1"
                          >
                            <Flame className="h-2.5 w-2.5 fill-emerald-400" />
                            {activeDemo.sampleResult.intentLevel} ({activeDemo.sampleResult.intentScore}/100)
                          </Badge>
                        </div>
                        <h4 className="text-xs font-bold text-foreground leading-snug">
                          {activeDemo.sampleResult.title}
                        </h4>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {activeDemo.sampleResult.snippet}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </CardContent>

              {/* Card Footer Link */}
              <div className="bg-secondary/30 px-5 py-3 border-t border-border/40 flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Ready to hunt live leads?</span>
                <Link
                  href="/cortex"
                  className="font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                >
                  <span>See full agent demo</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
