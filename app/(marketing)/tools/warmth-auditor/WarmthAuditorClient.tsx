"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Copy,
  Check,
  Sparkles,
  ShieldAlert,
  HeartHandshake,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ToneFlag {
  label: string;
  level: "good" | "warn" | "risk";
}

const SAMPLE_MESSAGE =
  "Hey! Saw your post about switching CRMs. If it helps, we built a lightweight CRM for small teams that migrate fast. Happy to share a short teardown if useful?";

const HARD_SELL_WORDS = [
  "buy now",
  "limited time",
  "guaranteed",
  "best price",
  "act now",
  "exclusive deal",
  "don't miss",
  "once in a lifetime",
  "instant results",
];
const URGENCY_WORDS = [
  "urgent",
  "asap",
  "today",
  "now",
  "immediately",
  "hurry",
];
const EMPATHY_WORDS = [
  "noticed",
  "saw",
  "understand",
  "happy to",
  "if helpful",
  "if useful",
  "no pressure",
  "totally get",
];
const GENERIC_OPENERS = [
  "just reaching out",
  "checking in",
  "quick question",
  "wanted to connect",
];
const CTA_WORDS = [
  "would you",
  "open to",
  "want me to",
  "can i send",
  "worth sharing",
];
const STOP_WORDS = new Set([
  "i",
  "we",
  "you",
  "your",
  "the",
  "a",
  "an",
  "and",
  "or",
  "to",
  "for",
  "about",
  "with",
  "this",
  "that",
  "is",
  "are",
  "it",
  "on",
  "of",
  "in",
  "my",
  "our",
  "just",
  "hey",
  "hi",
  "hello",
]);

const clamp = (value: number) => Math.max(0, Math.min(100, value));

function getTopicPhrase(text: string): string {
  const cleaned = text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));

  const unique: string[] = [];
  for (const word of cleaned) {
    if (!unique.includes(word)) unique.push(word);
    if (unique.length >= 4) break;
  }

  if (unique.length === 0) return "your current workflow";
  return unique.join(" ");
}

export function WarmthAuditorClient() {
  const [message, setMessage] = useState(SAMPLE_MESSAGE);
  const [copied, setCopied] = useState(false);

  const analysis = useMemo(() => {
    const text = message.trim();

    if (!text) {
      return {
        warmthScore: 0,
        spamScore: 0,
        flags: [] as ToneFlag[],
        suggestions: ["Start with a short message draft to analyze tone."],
        rewrite: "",
      };
    }

    const lower = text.toLowerCase();
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const linkCount = (text.match(/https?:\/\//g) || []).length;
    const exclamationCount = (text.match(/!/g) || []).length;
    const hasQuestion = text.includes("?");
    const hasGreeting = /^(hey|hi|hello)\b/i.test(text);
    const hasPersonalization =
      /(you|your|team|post|thread|saw your|noticed your)/i.test(text);
    const hasEmpathy = EMPATHY_WORDS.some((term) => lower.includes(term));
    const hasGenericOpener = GENERIC_OPENERS.some((term) =>
      lower.includes(term),
    );
    const hasSoftCta =
      CTA_WORDS.some((term) => lower.includes(term)) || hasQuestion;
    const hardSellHits = HARD_SELL_WORDS.filter((term) =>
      lower.includes(term),
    ).length;
    const urgencyHits = URGENCY_WORDS.filter((term) =>
      lower.includes(term),
    ).length;
    const capsWords = words.filter(
      (word) => word.length > 3 && word === word.toUpperCase(),
    ).length;
    const sentenceParts = text
      .split(/[.!?]+/)
      .map((part) => part.trim())
      .filter(Boolean);
    const sentenceCount = sentenceParts.length;
    const avgWordsPerSentence =
      sentenceCount > 0 ? wordCount / sentenceCount : wordCount;

    let warmth = 42;
    if (hasGreeting) warmth += 6;
    if (hasPersonalization) warmth += 14;
    if (hasEmpathy) warmth += 12;
    if (hasSoftCta) warmth += 8;
    if (wordCount >= 20 && wordCount <= 55) warmth += 12;
    if (avgWordsPerSentence > 8 && avgWordsPerSentence < 22) warmth += 6;
    if (wordCount > 75) warmth -= 12;
    if (hasGenericOpener) warmth -= 6;
    warmth -= hardSellHits * 10;
    warmth -= urgencyHits * 7;

    let spam = 20;
    spam += hardSellHits * 14;
    spam += urgencyHits * 9;
    spam += linkCount * 12;
    if (exclamationCount >= 2) spam += 8;
    if (capsWords >= 2) spam += 10;
    if (wordCount > 90) spam += 8;
    if (!hasPersonalization) spam += 7;
    if (hasGenericOpener) spam += 6;
    if (hasEmpathy) spam -= 6;
    if (hasSoftCta) spam -= 5;

    const flags: ToneFlag[] = [];
    flags.push({
      label: hasPersonalization
        ? "Personalized context"
        : "Missing personalization",
      level: hasPersonalization ? "good" : "warn",
    });
    flags.push({
      label: hasEmpathy ? "Empathetic tone" : "Needs warmer language",
      level: hasEmpathy ? "good" : "warn",
    });
    flags.push({
      label: hasSoftCta ? "Soft CTA present" : "No soft CTA",
      level: hasSoftCta ? "good" : "warn",
    });
    if (hasGenericOpener) {
      flags.push({ label: "Generic opener detected", level: "warn" });
    }
    if (hardSellHits > 0) {
      flags.push({ label: "Hard-sell phrases detected", level: "risk" });
    }
    if (linkCount > 1) {
      flags.push({ label: "Too many links", level: "risk" });
    }

    const suggestions: string[] = [];
    if (!hasGreeting)
      suggestions.push("Start with a short human opener (Hey/Hi + context).");
    if (!hasPersonalization)
      suggestions.push(
        "Reference their post, team, or use-case to avoid sounding generic.",
      );
    if (!hasEmpathy)
      suggestions.push(
        "Add empathy phrases like ‘noticed’, ‘if helpful’, or ‘happy to share’.",
      );
    if (!hasSoftCta)
      suggestions.push("End with one low-pressure question (single CTA). ");
    if (hasGenericOpener)
      suggestions.push(
        "Replace generic intros (‘just checking in’) with specific context.",
      );
    if (hardSellHits > 0)
      suggestions.push(
        "Remove hype words like ‘limited time’ or ‘guaranteed’.",
      );
    if (linkCount > 1)
      suggestions.push("Use at most one link in the first message.");
    if (wordCount > 70)
      suggestions.push(
        "Trim the message to 25–50 words for better response rates.",
      );
    if (avgWordsPerSentence > 24)
      suggestions.push("Shorten long sentences for better clarity and trust.");

    const topic = getTopicPhrase(text);
    const rewrite = [
      "Hey — saw your note and wanted to reach out.",
      `Looks like you’re working through ${topic}.`,
      "If helpful, I can share a short 3-point breakdown tailored to your situation.",
      "No pressure — want me to send it?",
    ].join(" ");

    return {
      warmthScore: clamp(warmth),
      spamScore: clamp(spam),
      flags,
      suggestions:
        suggestions.length > 0
          ? suggestions
          : [
              "Message quality looks strong. Consider A/B testing two CTA variants.",
            ],
      rewrite,
    };
  }, [message]);

  const handleCopyRewrite = async () => {
    if (!analysis.rewrite) return;
    await navigator.clipboard.writeText(analysis.rewrite);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section className="pt-28 pb-12 relative overflow-hidden bg-background">
      <div className="container mx-auto px-6">
        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground/60 mb-3 uppercase tracking-wider">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <span>Tools</span>
          <span>/</span>
          <span className="text-primary">Warmth Auditor</span>
        </div>

        <div className="flex flex-col gap-1 mb-6 pb-4 border-b border-border/40">
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Outreach Message{" "}
            <span className="text-primary">Warmth & Spam Auditor</span>
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Score your message instantly, reduce spam risk, and rewrite for
            better reply rates.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-6 bg-card border border-border/60 rounded-xl p-4 shadow-lg flex flex-col gap-3 h-full">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <h2 className="text-xs font-black text-foreground flex items-center gap-1.5">
                <HeartHandshake className="h-3.5 w-3.5 text-primary" />
                Message Input
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMessage("")}
                className="h-7 w-7 rounded-full"
                title="Clear"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>

            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Paste your outreach message here..."
              className="min-h-60 text-sm font-medium bg-secondary/20 border-border/70"
            />

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                className="text-xs font-bold"
                onClick={() => setMessage(SAMPLE_MESSAGE)}
              >
                Load sample
              </Button>
              <p className="text-xs text-muted-foreground">
                Tip: keep first outreach under 50 words.
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 bg-card border border-border/60 rounded-xl p-4 shadow-lg flex flex-col gap-3 h-full">
            <div className="flex items-center gap-2 border-b border-border/40 pb-2">
              <h2 className="text-xs font-black text-foreground flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-primary" />
                Audit Result
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border/60 bg-secondary/20 p-3">
                <p className="text-xs font-bold text-muted-foreground mb-1">
                  Warmth Score
                </p>
                <p className="text-xl font-black text-foreground">
                  {analysis.warmthScore}/100
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-secondary/20 p-3">
                <p className="text-xs font-bold text-muted-foreground mb-1">
                  Spam Risk
                </p>
                <p className="text-xl font-black text-foreground">
                  {analysis.spamScore}/100
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-secondary/10 p-3">
              <p className="text-xs font-bold text-muted-foreground mb-2">
                Tone Flags
              </p>
              <div className="flex flex-wrap gap-2">
                {analysis.flags.map((flag) => (
                  <span
                    key={flag.label}
                    className={`text-xs font-bold px-2 py-1 rounded-md border ${
                      flag.level === "good"
                        ? "bg-primary/10 text-primary border-primary/20"
                        : flag.level === "warn"
                          ? "bg-accent/10 text-accent border-accent/20"
                          : "bg-destructive/10 text-destructive border-destructive/20"
                    }`}
                  >
                    {flag.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-secondary/10 p-3">
              <p className="text-xs font-bold text-muted-foreground mb-2">
                What to improve
              </p>
              <ul className="list-disc list-inside text-xs text-foreground/90 space-y-1">
                {analysis.suggestions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Suggested Rewrite
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleCopyRewrite}
                  title="Copy rewrite"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed">
                {analysis.rewrite || "Enter a message to generate a rewrite."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs font-medium text-muted-foreground max-w-2xl">
            Want this automated? Knivik can score and prioritize high-intent
            conversations automatically.
          </p>
          <Button asChild className="text-xs font-bold rounded-full">
            <Link href="/pricing" className="flex items-center gap-1.5">
              Automate With Knivik
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
