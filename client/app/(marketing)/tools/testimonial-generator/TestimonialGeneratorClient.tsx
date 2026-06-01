"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Copy,
  Download,
  ExternalLink,
  Link2,
  Palette,
  Quote,
  RotateCcw,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Platform = "Reddit" | "HackerNews";
type Preset = "minimal" | "social-proof" | "bold";

interface PresetOption {
  id: Preset;
  name: string;
  description: string;
}

interface SampleOption {
  id: string;
  title: string;
  quote: string;
  authorHandle: string;
  platform: Platform;
  sourceLink: string;
  productTag: string;
  preset: Preset;
}

const PLATFORM_OPTIONS: Platform[] = ["Reddit", "HackerNews"];

const PRESET_OPTIONS: PresetOption[] = [
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean layout with light emphasis on the quote.",
  },
  {
    id: "social-proof",
    name: "Social Proof",
    description: "Adds stronger trust framing and platform details.",
  },
  {
    id: "bold",
    name: "Bold",
    description: "High-contrast layout for launch pages and posts.",
  },
];

const SAMPLE_OPTIONS: SampleOption[] = [
  {
    id: "reddit-social-proof",
    title: "Reddit social proof",
    quote:
      "We tried three tools before this one, and this was the first that made lead capture feel genuinely simple.",
    authorHandle: "@sam_builds",
    platform: "Reddit",
    sourceLink: "https://www.reddit.com/r/SaaS/comments/example",
    productTag: "B2B lead capture",
    preset: "social-proof",
  },
  {
    id: "hn-clean-launch",
    title: "HN launch quote",
    quote: "The interface is so clear that our team adopted it without a demo.",
    authorHandle: "pg",
    platform: "HackerNews",
    sourceLink: "https://news.ycombinator.com/item?id=123456",
    productTag: "Product launch",
    preset: "minimal",
  },
  {
    id: "bold-customer-win",
    title: "Bold customer win",
    quote:
      "This is the first workflow tool that actually reduced the back-and-forth in our team.",
    authorHandle: "@lauraops",
    platform: "Reddit",
    sourceLink: "https://www.reddit.com/r/entrepreneur/comments/example",
    productTag: "Workflow automation",
    preset: "bold",
  },
];

const DEFAULT_SAMPLE = SAMPLE_OPTIONS[0]!;

function normalizeHandle(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "@anonymous";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

function getSourceLabel(platform: Platform, sourceLink: string) {
  if (!sourceLink.trim()) return platform;

  try {
    const url = new URL(sourceLink);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return platform;
  }
}

function escapeSvg(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function wrapText(text: string, maxChars: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }

    if (current) lines.push(current);
    current = word;
  }

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [text];
}

function buildCardCopy({
  quote,
  authorHandle,
  platform,
  sourceLink,
  productTag,
}: {
  quote: string;
  authorHandle: string;
  platform: Platform;
  sourceLink: string;
  productTag: string;
}) {
  const handle = normalizeHandle(authorHandle);
  const parts = [`"${quote.trim()}"`, `— ${handle} on ${platform}`];

  if (productTag.trim()) {
    parts.push(`Product tag: ${productTag.trim()}`);
  }
  if (sourceLink.trim()) {
    parts.push(`Source: ${sourceLink.trim()}`);
  }

  return parts.join("\n");
}

function buildCaption({
  quote,
  authorHandle,
  platform,
  productTag,
}: {
  quote: string;
  authorHandle: string;
  platform: Platform;
  productTag: string;
}) {
  const handle = normalizeHandle(authorHandle);
  const tagLine = productTag.trim()
    ? `\n\n${productTag.trim()} wins are the best wins.`
    : "";

  return [
    `Turned a great ${platform} quote into a shareable testimonial card.`,
    "",
    `\"${quote.trim()}\"`,
    "",
    `— ${handle}`,
    tagLine,
    "",
    "Built with Knivik.",
  ]
    .join("\n")
    .trim();
}

function buildSvg({
  quote,
  authorHandle,
  platform,
  sourceLink,
  productTag,
  preset,
  colors,
}: {
  quote: string;
  authorHandle: string;
  platform: Platform;
  sourceLink: string;
  productTag: string;
  preset: Preset;
  colors: Record<string, string>;
}) {
  const width = 1200;
  const height = 675;
  const sourceLabel = getSourceLabel(platform, sourceLink);
  const tag = productTag.trim();
  const lines = wrapText(quote.trim(), preset === "bold" ? 46 : 54);
  const quoteY = preset === "bold" ? 230 : 245;
  const lineHeight = preset === "bold" ? 54 : 48;
  const quoteSize = preset === "bold" ? 44 : 38;
  const handle = normalizeHandle(authorHandle);
  const fill = preset === "bold" ? colors.background : colors.foreground;
  const muted =
    preset === "bold" ? colors.background : colors["muted-foreground"];
  const surface = preset === "bold" ? colors.foreground : `hsl(${colors.card})`;
  const border =
    preset === "bold" ? `rgba(255,255,255,0.18)` : `hsl(${colors.border})`;

  return `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" rx="40" fill="${surface}" />
    <rect x="36" y="36" width="1128" height="603" rx="32" fill="${preset === "bold" ? colors.foreground : `hsl(${colors.background})`}" stroke="${border}" />
    <rect x="64" y="64" width="194" height="44" rx="22" fill="${preset === "bold" ? `rgba(255,255,255,0.14)` : `hsl(${colors.primary})/0.12`}" />
    <text x="92" y="92" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" fill="${fill}">${escapeSvg(platform)} testimonial</text>
    <text x="64" y="176" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700" fill="${muted}">${escapeSvg(sourceLabel)}</text>
    ${lines
      .map(
        (line, index) =>
          `<text x="64" y="${quoteY + index * lineHeight}" font-family="Inter, Arial, sans-serif" font-size="${quoteSize}" font-weight="800" fill="${fill}">${escapeSvg(line)}</text>`,
      )
      .join("\n    ")}
    <text x="64" y="560" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="800" fill="${fill}">${escapeSvg(handle)}</text>
    ${
      tag
        ? `<rect x="64" y="582" width="${Math.min(360, 18 * tag.length + 44)}" height="48" rx="24" fill="${preset === "bold" ? `rgba(255,255,255,0.14)` : `hsl(${colors.accent})/0.12`}" />
    <text x="88" y="614" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" fill="${fill}">${escapeSvg(tag)}</text>`
        : ""
    }
    <text x="1006" y="610" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" fill="${muted}">Made with Knivik</text>
  </svg>`;
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70">
          {label}
        </Label>
        {hint ? (
          <span className="text-[10px] text-muted-foreground">{hint}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function TestimonialGeneratorClient() {
  const [quote, setQuote] = useState(DEFAULT_SAMPLE.quote);
  const [authorHandle, setAuthorHandle] = useState(DEFAULT_SAMPLE.authorHandle);
  const [platform, setPlatform] = useState<Platform>(DEFAULT_SAMPLE.platform);
  const [sourceLink, setSourceLink] = useState(DEFAULT_SAMPLE.sourceLink);
  const [productTag, setProductTag] = useState(DEFAULT_SAMPLE.productTag);
  const [preset, setPreset] = useState<Preset>(DEFAULT_SAMPLE.preset);
  const [copied, setCopied] = useState<"card" | "caption" | null>(null);

  const preview = useMemo(() => {
    const cleanQuote = quote.trim();
    const cleanHandle = normalizeHandle(authorHandle);
    const cleanTag = productTag.trim();
    const quoteLength = cleanQuote.length;
    const wordCount = cleanQuote.split(/\s+/).filter(Boolean).length;
    const sourceLabel = getSourceLabel(platform, sourceLink);

    return {
      quote: cleanQuote,
      handle: cleanHandle,
      tag: cleanTag,
      sourceLabel,
      cardCopy: buildCardCopy({
        quote: cleanQuote,
        authorHandle: cleanHandle,
        platform,
        sourceLink,
        productTag: cleanTag,
      }),
      caption: buildCaption({
        quote: cleanQuote,
        authorHandle: cleanHandle,
        platform,
        productTag: cleanTag,
      }),
      quoteLength,
      wordCount,
      hasLink: sourceLink.trim().length > 0,
    };
  }, [authorHandle, platform, productTag, quote, sourceLink]);

  const loadSample = (sample: SampleOption) => {
    setQuote(sample.quote);
    setAuthorHandle(sample.authorHandle);
    setPlatform(sample.platform);
    setSourceLink(sample.sourceLink);
    setProductTag(sample.productTag);
    setPreset(sample.preset);
  };

  const reset = () => {
    loadSample(DEFAULT_SAMPLE);
  };

  const handleCopy = async (type: "card" | "caption") => {
    const text = type === "card" ? preview.cardCopy : preview.caption;
    await navigator.clipboard.writeText(text);
    setCopied(type);
    window.setTimeout(() => setCopied(null), 1600);
  };

  const handleDownload = () => {
    const doc = document.documentElement;
    const computed = window.getComputedStyle(doc);
    const colors = {
      background: computed.getPropertyValue("--background").trim(),
      foreground: computed.getPropertyValue("--foreground").trim(),
      card: computed.getPropertyValue("--card").trim(),
      border: computed.getPropertyValue("--border").trim(),
      primary: computed.getPropertyValue("--primary").trim(),
      accent: computed.getPropertyValue("--accent").trim(),
      "muted-foreground": computed
        .getPropertyValue("--muted-foreground")
        .trim(),
    };

    const svg = buildSvg({
      quote: preview.quote,
      authorHandle: preview.handle,
      platform,
      sourceLink,
      productTag: preview.tag,
      preset,
      colors,
    });

    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `testimonial-card-${platform.toLowerCase()}.svg`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const isBold = preset === "bold";
  const presetStyle = isBold
    ? "bg-foreground text-background border-foreground/10"
    : preset === "social-proof"
      ? "bg-gradient-to-br from-primary/10 via-card to-accent/10 border-primary/20"
      : "bg-card border-border/60";

  return (
    <section className="relative overflow-hidden bg-background pt-28 pb-12">
      <div className="container mx-auto px-6">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground/60 mb-3">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <span>Tools</span>
          <span>/</span>
          <span className="text-primary">Testimonial Generator</span>
        </div>

        <div className="flex flex-col gap-1 mb-5 pb-4 border-b border-border/40">
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Reddit & HackerNews{" "}
            <span className="text-primary">Testimonial Card Generator</span>
          </h1>
          <p className="text-sm font-medium text-muted-foreground max-w-2xl">
            Turn community quotes into polished testimonial cards with live
            preview, copyable text, and a downloadable SVG image.
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-border/60 bg-card/80 p-4 shadow-lg">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">
            <WandSparkles className="h-3.5 w-3.5 text-primary" />
            Quick starts
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_OPTIONS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => loadSample(sample)}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-foreground/80 transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              >
                {sample.title}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Start from a realistic quote, then just tweak the words and export.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="bg-card border border-border/60 rounded-xl p-4 shadow-lg flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <h2 className="text-xs font-black text-foreground flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-primary" />
                  Build your card
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={reset}
                  className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                  title="Reset fields"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="rounded-lg border border-border/60 bg-secondary/10 p-3 text-xs text-muted-foreground leading-relaxed">
                Paste a quote, choose a source, and export a polished
                testimonial card in a few clicks.
              </div>

              <Field label="Quote" hint={`${preview.wordCount} words`}>
                <Textarea
                  value={quote}
                  onChange={(event) => setQuote(event.target.value)}
                  placeholder="Paste the testimonial quote here..."
                  className="min-h-40 text-sm font-medium bg-secondary/20 border-border/70"
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Field label="Author handle">
                  <Input
                    value={authorHandle}
                    onChange={(event) => setAuthorHandle(event.target.value)}
                    placeholder="@author"
                    className="h-9 text-sm bg-secondary/20 border-border/70"
                  />
                </Field>
                <Field label="Source platform">
                  <Select
                    value={platform}
                    onValueChange={(value) => setPlatform(value as Platform)}
                  >
                    <SelectTrigger className="h-9 w-full bg-secondary/20 border-border/70 text-sm">
                      <SelectValue placeholder="Platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORM_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field
                label="Source link"
                hint={preview.hasLink ? preview.sourceLabel : "Optional"}
              >
                <Input
                  value={sourceLink}
                  onChange={(event) => setSourceLink(event.target.value)}
                  placeholder="https://reddit.com/..."
                  className="h-9 text-sm bg-secondary/20 border-border/70"
                />
              </Field>

              <Field label="Product or niche tag" hint="Optional">
                <Input
                  value={productTag}
                  onChange={(event) => setProductTag(event.target.value)}
                  placeholder="AI lead gen"
                  className="h-9 text-sm bg-secondary/20 border-border/70"
                />
              </Field>

              <Field label="Preset style">
                <div className="grid grid-cols-3 gap-1.5 bg-secondary/30 p-1 border border-border/80 rounded-lg">
                  {PRESET_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setPreset(option.id)}
                      className={`rounded-md px-2 py-1.5 text-[10px] font-black text-center transition-all ${
                        preset === option.id
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                      }`}
                      title={option.description}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border border-border/60 rounded-xl p-3.5 shadow-lg flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <h3 className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Copyable outputs
                  </h3>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="rounded-xl border border-border/60 bg-secondary/10 p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        Card text
                      </p>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleCopy("card")}
                        title="Copy card text"
                      >
                        {copied === "card" ? (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed">
                      {preview.cardCopy ||
                        "Add content to generate the testimonial text."}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-secondary/10 p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        Social caption
                      </p>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleCopy("caption")}
                        title="Copy caption"
                      >
                        {copied === "caption" ? (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed">
                      {preview.caption ||
                        "Add content to generate the social caption."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border/60 rounded-xl p-3.5 shadow-lg flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <h3 className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <Download className="h-3.5 w-3.5 text-primary" />
                    Export & share
                  </h3>
                </div>

                <div className="rounded-xl border border-border/60 bg-secondary/10 p-3 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        Source link
                      </p>
                      {sourceLink.trim() ? (
                        <a
                          href={sourceLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                        >
                          {preview.sourceLabel}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Add a link to make the card more credible.
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={handleDownload}
                      title="Download SVG card"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-md border border-border/60 bg-background/60 p-2">
                      <p className="font-bold text-muted-foreground mb-0.5">
                        Preset
                      </p>
                      <p className="font-black text-foreground capitalize">
                        {preset}
                      </p>
                    </div>
                    <div className="rounded-md border border-border/60 bg-background/60 p-2">
                      <p className="font-bold text-muted-foreground mb-0.5">
                        Platform
                      </p>
                      <p className="font-black text-foreground">{platform}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Use the SVG in landing pages, social posts, or pitch decks.
                    It stays crisp at any size.
                  </p>
                  <Button asChild className="rounded-full text-xs font-bold">
                    <Link href="/pricing" className="flex items-center gap-1.5">
                      Automate with Knivik
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col gap-6">
            <div
              className={`rounded-xl border p-4 shadow-lg flex flex-col gap-4 h-full ${presetStyle}`}
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <div className="flex items-center gap-1.5">
                  <Quote className="h-3.5 w-3.5 text-primary" />
                  <h2 className="text-xs font-black">Card preview</h2>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  {preset} preset
                </span>
              </div>

              <div
                className={`relative overflow-hidden rounded-3xl border p-4 sm:p-5 flex flex-col gap-4 min-h-90 ${isBold ? "border-border/40 bg-background shadow-[0_24px_60px_-28px_rgba(0,0,0,0.65)]" : "border-border/60 bg-background/70"}`}
              >
                <div
                  className={`absolute inset-x-0 top-0 h-28 pointer-events-none ${isBold ? "bg-linear-to-r from-primary/20 via-transparent to-accent/20" : "bg-linear-to-r from-primary/10 via-transparent to-accent/10"}`}
                />
                <div className="relative flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                      <BadgeCheck className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-border/60 bg-secondary/30 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider">
                          {platform}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {preview.sourceLabel}
                        </span>
                      </div>
                      <p className="text-[10px] font-medium text-muted-foreground">
                        Ready-to-share social proof card
                      </p>
                    </div>
                  </div>
                  {preview.tag ? (
                    <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                      {preview.tag}
                    </span>
                  ) : null}
                </div>

                <div className="relative flex flex-1 flex-col justify-center gap-4 py-2">
                  <div className="grid gap-4 lg:grid-cols-[56px_minmax(0,1fr)] lg:items-start">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl border border-border/60 bg-foreground text-background shadow-sm">
                      <Quote className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col gap-3">
                      <p className="text-xl sm:text-2xl font-black leading-tight tracking-tight text-foreground">
                        “
                        {preview.quote ||
                          "Your testimonial quote appears here."}
                        ”
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-border/60 bg-secondary/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/80">
                          From {preview.handle}
                        </span>
                        <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                          {preview.quoteLength} chars
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-secondary/15 p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[10px] font-black text-primary">
                        {preview.handle.slice(1, 3).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm font-bold text-foreground">
                          {preview.handle}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Source: {preview.sourceLabel || "Add a source link"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      <Link2 className="h-3.5 w-3.5 text-primary" />
                      Clean layout
                    </div>
                  </div>
                </div>

                <div className="relative flex flex-col gap-3 border-t border-border/40 pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground max-w-xl">
                    The layout is tuned for landing pages, social posts, and
                    launch threads. SVG download keeps the card crisp at any
                    size.
                  </p>
                  <Button
                    asChild
                    variant="outline-primary"
                    size="sm"
                    className="rounded-full text-xs font-bold"
                  >
                    <Link href="/pricing" className="flex items-center gap-1.5">
                      Add Knivik CTA
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
