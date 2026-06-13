"use client";

import React, { useState } from "react";
import { 
  Sparkles, 
  Copy, 
  Check, 
  RefreshCw, 
  ArrowLeft,
  MessageSquare,
  Mail,
  Globe
} from "lucide-react";
import { FaLinkedin, FaTwitter, FaGithub } from "react-icons/fa";
import { SiBluesky } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// Helper to extract top keywords from a post
function extractKeywords(postText: string): string {
  if (!postText || postText.trim().length === 0) return "this issue";
  
  const stopWords = new Set([
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', "you're", "you've", "you'll", "you'd",
    'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', "she's", 'her', 'hers',
    'herself', 'it', "it's", 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which',
    'who', 'whom', 'this', 'that', "that'll", 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if',
    'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
    'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out',
    'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
    'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', "don't", 'should',
    "should've", 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', "aren't", 'couldn', "couldn't",
    'didn', "didn't", 'doesn', "doesn't", 'hadn', "hadn't", 'hasn', "hasn't", 'haven', "haven't", 'isn', "isn't",
    'ma', 'mightn', "mightn't", 'mustn', "mustn't", 'needn', "needn't", 'shan', "shan't", 'shouldn', "shouldn't",
    'wasn', "wasn't", 'weren', "weren't", 'won', "won't", 'wouldn', "wouldn't", 'get', 'like', 'want', 'need', 'help'
  ]);

  const clean = postText
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => {
      if (w.length <= 3) return false;
      if (stopWords.has(w)) return false;
      // Filter out URL noise / hash ids
      if (/^(?:comments|r|sub|post|thread|status|user|amp)$/i.test(w)) return false;
      if (/[0-9]/.test(w) && /[a-z]/.test(w) && w.length < 10) return false; // ID hash like 1sai8o6
      if (/^[0-9]+$/.test(w)) return false; // pure digits
      return true;
    });
  
  if (clean.length === 0) return "this problem";
  
  const unique = Array.from(new Set(clean)).slice(0, 2);
  return unique.join(" and ");
}

// Helper to sanitize product descriptions for perfect grammar
function sanitizeProductDescription(desc: string): string {
  let clean = desc.trim();
  if (!clean) return "is designed to solve this exact problem efficiently";
  
  // Remove starting "it ", "it's ", or "its " case-insensitive
  clean = clean.replace(/^it(?:'s|s)?\s+/i, "");
  
  const words = clean.split(/\s+/);
  if (words.length > 0) {
    const firstWord = words[0];
    // Lowercase first word unless it's an acronym
    if (firstWord !== firstWord.toUpperCase()) {
      words[0] = firstWord.toLowerCase();
    }
    
    // Map common base verbs to third-person singular (preceded by 'It' in templates)
    const verbMappings: Record<string, string> = {
      make: "makes",
      help: "helps",
      allow: "allows",
      give: "gives",
      track: "tracks",
      find: "finds",
      scan: "scans",
      solve: "solves",
      automate: "automates",
      create: "creates",
      build: "builds",
      provide: "provides",
      generate: "generates",
      optimize: "optimizes",
      streamline: "streamlines",
      save: "saves"
    };
    
    const mapped = verbMappings[words[0].toLowerCase()];
    if (mapped) {
      words[0] = mapped;
    }
    
    clean = words.join(" ");
  }
  
  return clean;
}

const templates: Record<string, Record<string, string[]>> = {
  reddit: {
    helpful: [
      "I was dealing with {keywords} recently too. One thing that helped was breaking it down step-by-step. I actually created {productName} to solve this exact issue. It {productDescription}. Let me know if you want to check it out—hope it helps!",
      "For {keywords}, the best practice is usually to automate the collection phase. If you're doing it manually, it takes hours. That's why I created {productName}. It basically {productDescription}. Feel free to ask if you want to know how to set it up!"
    ],
    direct: [
      "You should check out {productName}. It does exactly what you're asking for. It {productDescription}. It's built specifically to handle {keywords} and save you a ton of time. Let me know if you have any questions!",
      "I built a tool called {productName} that was designed for this. It {productDescription}. If you are looking to streamline how you deal with {keywords}, feel free to check it out."
    ],
    question: [
      "Are you currently managing {keywords} manually, or are you looking to automate the process? I ask because I faced this same issue and built {productName} to solve it. It {productDescription}. What does your current setup look like?",
      "How are you currently handling {keywords}? If you're spending too much time on it, {productName} might be worth looking into. It {productDescription}. Have you tried any other tools for this yet?"
    ],
    frustration: [
      "Totally agree with you, managing {keywords} is an absolute nightmare. I got so tired of it that I built {productName}. It {productDescription}. Let me know if you want a free login to try it out!",
      "I was running into the exact same issue with {keywords} and couldn't find a good solution. So I built {productName} to solve it. It {productDescription}. Hopefully it can save you some of the headache!"
    ]
  },
  twitter: {
    helpful: [
      "Had this exact issue with {keywords}. Focus on automating the workflow first. I built {productName} to handle this: it {productDescription}. Let me know if you want to check it out!",
      "For {keywords}, keeping things simple is key. If it helps, I created a tool called {productName} that {productDescription}. Hope this points you in the right direction!"
    ],
    direct: [
      "Check out {productName}. It's designed to solve this exact problem by doing this: {productDescription}. Great for streamlining {keywords}!",
      "I built {productName} to solve this. It {productDescription}. Perfect if you need to optimize your {keywords} workflow."
    ],
    question: [
      "Are you looking to automate {keywords} or keep it manual for now? I built {productName} to help with this. It {productDescription}. What's your current approach?",
      "How are you currently managing {keywords}? I built {productName} to help streamline it. It {productDescription}. Would love to know what you think!"
    ],
    frustration: [
      "Frustrated with {keywords}? I was too, so I built {productName}. It {productDescription}. Let me know if you want to try it out!",
      "Totally get the pain with {keywords}. I built {productName} specifically to solve this and make it painless. It {productDescription}."
    ]
  },
  hn: {
    helpful: [
      "The engineering challenge with {keywords} is usually scaling. I encountered this and wrote {productName} to address it. It {productDescription}. It's open-ended and designed to save development time. Let me know if you check it out.",
      "For {keywords}, the most efficient approach is removing manual steps. I developed {productName} to automate this. It {productDescription}. Happy to discuss the architecture if you're interested."
    ],
    direct: [
      "I created {productName} to solve this exact issue. It {productDescription}. If you're dealing with {keywords}, it might be a helpful addition to your stack. Let me know what you think.",
      "Check out {productName}. It's a tool I built that {productDescription}. It's specifically optimized for {keywords} workflows."
    ],
    question: [
      "How do you plan to scale your approach to {keywords}? I developed {productName} to help with this. It {productDescription}. I'd be curious to hear your thoughts on this setup.",
      "Are you using any particular stack to handle {keywords}? I built {productName} (it {productDescription}) to simplify this. What are your main requirements?"
    ],
    frustration: [
      "I ran into similar limitations with {keywords} and decided to build a custom solution. {productName} is the result. It {productDescription}. Hope it helps resolve the bottleneck.",
      "The friction with {keywords} is well-known. I built {productName} specifically to eliminate this pain point. It {productDescription}. Let me know if it fits your use case."
    ]
  },
  linkedin: {
    helpful: [
      "Great points. When it comes to scaling {keywords}, efficiency is everything. We developed {productName} to help teams streamline this. It {productDescription}. I'd love to share some insights on how we use it internally.",
      "Fully agree. Managing {keywords} efficiently is a key driver for growth. That's why we built {productName}—to help teams automate this. It {productDescription}. Let me know if you'd like to connect and discuss further!"
    ],
    direct: [
      "If you're looking for a solution to handle {keywords}, you should check out {productName}. It {productDescription}. It's built specifically to help companies optimize this process.",
      "We built {productName} to help businesses streamline {keywords}. It {productDescription}. Feel free to visit our page or reach out directly for a demo!"
    ],
    question: [
      "What is your team's current strategy for managing {keywords}? We built {productName} to help automate this bottleneck. It {productDescription}. Would love to hear how you are currently addressing it.",
      "Are you looking to scale your {keywords} processes this quarter? We built {productName} (it {productDescription}) to help with exactly that. What are your main goals?"
    ],
    frustration: [
      "Many businesses struggle with the manual effort required for {keywords}. We built {productName} to solve this exact pain point. It {productDescription}. Hope it can help streamline your operations!",
      "The friction in managing {keywords} manually can hold teams back. That's why we created {productName}. It {productDescription}. Let me know if you'd like to try it out."
    ]
  },
  email: {
    helpful: [
      "Hi,\n\nI saw your post regarding {keywords} and wanted to reach out. We faced similar challenges and built a tool called {productName} to address it. It {productDescription}.\n\nI thought it might be helpful for your workflow. Let me know if you'd like to check it out.\n\nBest,\n[Your Name]",
      "Hi,\n\nI wanted to share a quick resource for managing {keywords}. We built {productName} to help automate this process. It {productDescription}.\n\nHope this helps! Let me know if you have any questions.\n\nBest regards,\n[Your Name]"
    ],
    direct: [
      "Hi,\n\nI saw you are looking for a solution to handle {keywords}. We built {productName} to do exactly this. It {productDescription}.\n\nWould you be open to a quick 5-minute demo to see it in action?\n\nBest,\n[Your Name]",
      "Hi,\n\nI wanted to introduce {productName}, a tool we built to solve {keywords} challenges. It {productDescription}.\n\nLet me know if you'd like a free trial account to test it out.\n\nBest regards,\n[Your Name]"
    ],
    question: [
      "Hi,\n\nHow are you currently managing {keywords}? We built {productName} to help automate this process. It {productDescription}.\n\nWould love to know if you're open to exploring how it could fit into your workflow.\n\nBest,\n[Your Name]",
      "Hi,\n\nAre you looking to scale your {keywords} workflow this month? We built {productName} to help teams streamline this. It {productDescription}.\n\nWhat are the main bottlenecks you are facing right now?\n\nBest regards,\n[Your Name]"
    ],
    frustration: [
      "Hi,\n\nI saw your post about the frustration with managing {keywords}. We got tired of the manual process too, which is why we built {productName}. It {productDescription}.\n\nI'd love to give you free access to see if it makes your life easier.\n\nBest,\n[Your Name]",
      "Hi,\n\nDealing with the friction of {keywords} is a common challenge. We built {productName} specifically to eliminate this headache. It {productDescription}.\n\nLet me know if you'd like to check it out.\n\nBest regards,\n[Your Name]"
    ]
  },
  github: {
    helpful: [
      "I encountered a similar issue with {keywords} recently. Usually, this points to configuration limits or dependency versions. I actually built {productName} to automate this workflow—it {productDescription}. Feel free to check out the project, hope it helps!",
      "If you're dealing with {keywords}, a solid approach is to abstract the background worker or cache queries. I developed {productName} (it {productDescription}) to solve this exact bottleneck. Let me know if you'd like to check it out!"
    ],
    direct: [
      "You should check out {productName}. It does exactly what you're describing: it {productDescription}. Built specifically to streamline {keywords} for devs.",
      "I built {productName} to address this exact issue. It {productDescription}. Great if you need to optimize your {keywords} workflow."
    ],
    question: [
      "Are you handling {keywords} programmatically or via configuration file? I ask because I built {productName} to automate this workflow. It {productDescription}. What does your current setup look like?",
      "How are you currently managing {keywords} in your codebase? If it's a bottleneck, you might want to look into {productName}. It {productDescription}. Have you run into any performance issues yet?"
    ],
    frustration: [
      "Dealing with {keywords} configuration is a notorious headache. I got tired of the boilerplates, so I built {productName}. It {productDescription}. Hope it saves you some debug cycles!",
      "I was running into the exact same frustration with {keywords}. Built {productName} to handle this automatically so I could focus on other things. It {productDescription}."
    ]
  },
  bluesky: {
    helpful: [
      "I saw you're working on {keywords}. I actually built {productName} to solve this exact problem. It {productDescription}. Let me know if you want to check it out!",
      "For {keywords}, automating the workflow makes a huge difference. I created {productName} which {productDescription}. Hope this helps you out!"
    ],
    direct: [
      "Check out {productName}. It's designed to solve this exact issue: it {productDescription}. Perfect for streamlining {keywords}!",
      "I built {productName} to solve this. It {productDescription}. Super useful if you want to optimize your {keywords} workflow."
    ],
    question: [
      "Are you looking to automate {keywords} or keep it manual? I built {productName} to help with this. It {productDescription}. What's your current approach?",
      "How are you currently managing {keywords}? I built {productName} to help streamline it. It {productDescription}. Would love to know what you think!"
    ],
    frustration: [
      "Totally get the frustration with {keywords}. I was too, so I built {productName}. It {productDescription}. Let me know if you want to try it out!",
      "I got so tired of the friction with {keywords} that I built {productName} to make it painless. It {productDescription}."
    ]
  }
};

const examplesList = [
  {
    label: "Reddit (B2B Lead)",
    platform: "reddit",
    postText: "We are currently tracking our brand mentions on Reddit manually, and it takes hours of scrolling. Is there an automated tool that scans subreddits and alerts us when keywords are mentioned?",
    productName: "Knivik",
    productDescription: "monitors Reddit for B2B leads and keyword mentions 24/7",
    angle: "helpful"
  },
  {
    label: "HackerNews (Dev Tool)",
    platform: "hn",
    postText: "Is anyone else struggling with configuring telemetry in Next.js? Every time I deploy, it seems like my monitoring script hangs or reports incorrect metrics. Any recommendations for telemetry packages?",
    productName: "LogPulse",
    productDescription: "automates Next.js telemetry collection and reports clean metrics in one dashboard",
    angle: "helpful"
  },
  {
    label: "Twitter (Social Selling)",
    platform: "twitter",
    postText: "Creating social media content takes way too much time. What tools do you guys use to generate customized replies or templates for Twitter outreach?",
    productName: "Sherlock",
    productDescription: "generates personalized high-converting outreach replies for social platforms in seconds",
    angle: "direct"
  }
];

export function ReplyGeneratorClient() {
  const [postText, setPostText] = useState("");
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [platform, setPlatform] = useState("reddit");
  const [angle, setAngle] = useState("helpful");
  const [generatedReply, setGeneratedReply] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [templateIndex, setTemplateIndex] = useState(0);
  const [inputError, setInputError] = useState("");

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim() || !productName.trim()) return;

    setIsGenerating(true);

    // Simulate 600ms processing shimmer to feel like live calculation
    setTimeout(() => {
      const keywords = extractKeywords(postText);
      const desc = sanitizeProductDescription(productDescription);
      
      const matchingTemplates = templates[platform]?.[angle] || templates.reddit.helpful;
      
      // Determine index (cycle or pick templateIndex)
      const index = Math.min(templateIndex, matchingTemplates.length - 1);
      const rawTemplate = matchingTemplates[index] || matchingTemplates[0];
      
      const formatted = rawTemplate
        .replace(/{keywords}/g, keywords)
        .replace(/{productName}/g, productName)
        .replace(/{productDescription}/g, desc);
      
      setGeneratedReply(formatted);
      setIsGenerating(false);
    }, 600);
  };

  const handleCycleTemplate = () => {
    const matchingTemplates = templates[platform]?.[angle] || templates.reddit.helpful;
    const nextIndex = (templateIndex + 1) % matchingTemplates.length;
    setTemplateIndex(nextIndex);
    
    // Auto-regenerate with the new template index if we already have content
    if (postText.trim() && productName.trim()) {
      const keywords = extractKeywords(postText);
      const desc = sanitizeProductDescription(productDescription);
      const rawTemplate = matchingTemplates[nextIndex] || matchingTemplates[0];
      const formatted = rawTemplate
        .replace(/{keywords}/g, keywords)
        .replace(/{productName}/g, productName)
        .replace(/{productDescription}/g, desc);
      setGeneratedReply(formatted);
    }
  };

  const handleCopy = async () => {
    if (!generatedReply) return;
    try {
      await navigator.clipboard.writeText(generatedReply);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text", err);
    }
  };

  const platforms = [
    { id: "reddit", label: "Reddit", icon: MessageSquare },
    { id: "twitter", label: "Twitter / X", icon: FaTwitter },
    { id: "hn", label: "HackerNews", icon: Globe },
    { id: "linkedin", label: "LinkedIn", icon: FaLinkedin },
    { id: "github", label: "GitHub", icon: FaGithub },
    { id: "bluesky", label: "Bluesky", icon: SiBluesky },
    { id: "email", label: "Cold Email", icon: Mail },
  ];

  const angles = [
    { id: "helpful", label: "Value-First", desc: "Offer helpful advice first, then introduce your tool." },
    { id: "direct", label: "Direct Pitch", desc: "Pitch your product as the direct solution to their problem." },
    { id: "question", label: "Question-Based", desc: "Ask a smart question to start a warm conversation." },
    { id: "frustration", label: "Frustration-Align", desc: "Agree with their frustration and explain how you fix it." },
  ];

  return (
    <section className="pt-32 pb-16 bg-background relative overflow-hidden min-h-screen flex flex-col justify-center">
      {/* Background Decorative Layout */}
      <div className="absolute inset-0 bg-grid opacity-20 -z-10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[10%] w-[80%] h-[40%] rounded-[100%] bg-primary/10 blur-[120px]" />
      </div>

      <div className="container mx-auto px-6">
        {/* Navigation / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-border/10 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-primary font-black uppercase tracking-widest text-[8px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 inline-flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5 fill-primary" />
                Free Tool
              </span>
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-foreground">
                AI Outreach Reply Generator
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1.5">
              Paste a social post, describe your offering, and instantly compile helpful outreach response drafts.
            </p>
          </div>
          <Link href="/tools" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors group shrink-0">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Tools Suite
          </Link>
        </div>


        {/* Core Layout Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          {/* Inputs Section (Left 7 Cols) */}
          <form onSubmit={handleGenerate} className="lg:col-span-7 flex flex-col h-full">
            {/* Form Box */}
            <div className="p-6 rounded-3xl border border-border/40 bg-background/50 backdrop-blur-md flex flex-col justify-between h-full space-y-5">
              
              {/* Form Fields wrapper */}
              <div className="space-y-5 flex-grow">
              
              {/* Post Content Input */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground flex justify-between items-center">
                  <span>1. Paste Post Content (Text Only, No Links)</span>
                  <span className={postText.length > 4000 ? "text-destructive" : ""}>
                    {postText.length}/5000 chars
                  </span>
                </label>
                <textarea
                  required
                  rows={4}
                  maxLength={5000}
                  placeholder="Paste the actual text content of the social post here (e.g. 'Does anyone know of a good tool to track keywords on Reddit? I'm tired of manually searching...')"
                  value={postText}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPostText(val);
                    const isUrl = val.trim().startsWith("http://") || 
                                  val.trim().startsWith("https://") || 
                                  /^(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+(?:\/\S*)?$/.test(val.trim());
                    if (val.trim() && isUrl) {
                      setInputError("Please paste the actual post text content instead of a link URL. This tool does not fetch external links.");
                    } else {
                      setInputError("");
                    }
                  }}
                  className={`w-full p-4 rounded-2xl border bg-background/50 focus:ring-1 focus:outline-none text-sm transition-all placeholder:text-muted-foreground/50 resize-y ${
                    inputError 
                      ? "border-destructive/60 focus:border-destructive focus:ring-destructive" 
                      : "border-border/60 focus:border-primary focus:ring-primary"
                  }`}
                />
                {inputError && (
                  <p className="text-[11px] font-semibold text-destructive animate-pulse mt-1 pl-1">
                    ⚠️ {inputError}
                  </p>
                )}
              </div>

              {/* Product details */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    2. Product / Service Name
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g., Knivik"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-border/60 bg-background/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm transition-all placeholder:text-muted-foreground/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    3. What it does (pitch points)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., monitors Reddit for B2B leads 24/7"
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-border/60 bg-background/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm transition-all placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>

              {/* Platform Selector Chips */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block">
                  4. Select Platform
                </label>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((p) => {
                    const Icon = p.icon;
                    const active = platform === p.id;
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => {
                          setPlatform(p.id);
                          setTemplateIndex(0);
                        }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all duration-300 active:scale-95 ${
                          active
                            ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/10"
                            : "bg-background/40 border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reply Angle Selector */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block">
                  5. Select Reply Angle / Focus
                </label>
                <div className="flex flex-wrap gap-2">
                  {angles.map((a) => {
                    const active = angle === a.id;
                    return (
                      <button
                        type="button"
                        key={a.id}
                        onClick={() => {
                          setAngle(a.id);
                          setTemplateIndex(0);
                        }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all duration-300 active:scale-95 ${
                          active
                            ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/10"
                            : "bg-background/40 border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
                        }`}
                      >
                        {a.label}
                      </button>
                    );
                  })}
                </div>
                {angles.find((a) => a.id === angle) && (
                  <p className="text-xs text-muted-foreground/80 italic pl-1 mt-1">
                    💡 {angles.find((a) => a.id === angle)?.desc}
                  </p>
                )}
              </div>

              </div>

              {/* Action button at bottom */}
              <div className="pt-6 border-t border-border/30 mt-6">
                <Button
                  type="submit"
                  disabled={isGenerating || !postText.trim() || !productName.trim() || !!inputError}
                  className="w-full h-12 text-xs font-black rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-4 w-4 fill-primary-foreground" />
                  {isGenerating ? "Analyzing & Generating..." : "Generate Outreach Message"}
                </Button>
              </div>
            </div>
          </form>

          {/* Output Section (Right 5 Cols) */}
          <div className="lg:col-span-5 h-full">
            <div className="p-6 rounded-3xl border border-border/40 bg-background/50 backdrop-blur-md h-full flex flex-col justify-between relative overflow-hidden">
              
              {/* Static glow backing */}
              <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[80px] pointer-events-none -z-10" />

              <div className="space-y-4 flex-grow flex flex-col h-full">
                <div className="flex flex-col gap-3 pb-3 border-b border-border/10">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                      Outreach Draft
                    </span>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black uppercase tracking-wider px-2 py-0.5">
                      Local Rules Engine
                    </Badge>
                  </div>
                  
                  {/* Quick Examples Selection */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5 pl-0.5">
                      <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                      Quick Demo Fill:
                    </span>
                    {examplesList.map((ex) => (
                      <button
                        key={ex.label}
                        type="button"
                        onClick={() => {
                          setPostText(ex.postText);
                          setProductName(ex.productName);
                          setProductDescription(ex.productDescription);
                          setPlatform(ex.platform);
                          setAngle(ex.angle);
                          setInputError("");
                          setTemplateIndex(0);
                        }}
                        className="px-2.5 py-1 rounded-lg border border-border/60 bg-secondary/15 hover:bg-primary/5 hover:border-primary/30 text-[9px] font-bold text-muted-foreground hover:text-primary transition-all active:scale-95 cursor-pointer"
                      >
                        {ex.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-grow flex flex-col relative mt-2 h-full min-h-[200px]">
                  <AnimatePresence mode="wait">
                    {isGenerating ? (
                      // Loading Shimmer State
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-grow flex flex-col justify-center items-center py-12 space-y-4"
                      >
                        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                        <p className="text-xs text-muted-foreground font-black uppercase tracking-wider animate-pulse">
                          Structuring outreach copy...
                        </p>
                      </motion.div>
                    ) : generatedReply ? (
                      // Generated text block
                      <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex-grow flex flex-col"
                      >
                        <textarea
                          value={generatedReply}
                          onChange={(e) => setGeneratedReply(e.target.value)}
                          className="w-full flex-grow p-4 rounded-2xl border border-border/40 bg-background/30 focus:outline-none text-xs sm:text-sm font-medium leading-relaxed resize-none text-foreground/90 select-text"
                          rows={12}
                        />
                        <span className="text-[10px] text-muted-foreground/60 italic mt-2 text-right">
                          ✏️ Feel free to edit the draft directly in the box above.
                        </span>
                      </motion.div>
                    ) : (
                      // Empty/Prompt state
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-grow flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border/30 rounded-2xl bg-secondary/5"
                      >
                        <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-4" />
                        <h4 className="text-sm font-black text-foreground/70 mb-1">
                          No Reply Draft Yet
                        </h4>
                        <p className="text-xs text-muted-foreground/80 max-w-[240px] leading-relaxed">
                          Fill out the details on the left and click generate to build your outreach message.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Action Buttons at bottom */}
              <div className="pt-6 border-t border-border/30 mt-6 flex gap-3">
                {generatedReply && !isGenerating ? (
                  <>
                    <Button
                      onClick={handleCopy}
                      className={`flex-1 h-12 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                        isCopied 
                          ? "bg-success hover:bg-success text-success-foreground" 
                          : "bg-primary hover:bg-primary/95 text-primary-foreground shadow-lg shadow-primary/10"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied to Clipboard!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy Response Copy
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCycleTemplate}
                      title="Generate another variation"
                      className="h-12 w-12 rounded-xl border-border/60 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all shrink-0 p-0 flex items-center justify-center"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    disabled
                    className="w-full h-12 text-xs font-bold rounded-xl flex items-center justify-center gap-2 bg-muted/10 text-muted-foreground/35 border border-border/20 cursor-not-allowed"
                  >
                    <Copy className="h-4 w-4 opacity-35" />
                    Copy Response Copy
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
