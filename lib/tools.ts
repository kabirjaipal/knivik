import { 
  Sliders, 
  FolderOpen, 
  ShieldAlert, 
  Quote, 
  Rss,
  Sparkles,
  LucideIcon
} from "lucide-react";

export interface ToolItem {
  title: string;
  description: string;
  href: string;
  badge: string;
  icon: LucideIcon;
  color: string;
  buttonText: string;
}

export const toolsList: ToolItem[] = [
  {
    title: "Social Search Operator Builder",
    description: "Generate advanced search query combinations for Reddit, X (Twitter), and HackerNews in seconds to find exact buyer matches without noise.",
    href: "/tools/search-builder",
    badge: "Popular",
    icon: Sliders,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    buttonText: "Launch Builder",
  },
  {
    title: "AI Outreach Reply Generator",
    description: "Generate personalized, high-converting reply templates and DMs for Reddit, X (Twitter), and HackerNews posts in seconds.",
    href: "/tools/reply-generator",
    badge: "Free tool",
    icon: Sparkles,
    color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    buttonText: "Generate Reply",
  },
  {
    title: "Outreach Warmth & Spam Auditor",
    description: "Analyze your cold outreach email drafts and social DMs. Instantly detect spam trigger words, assess message warmth, and get improvement tips.",
    href: "/tools/warmth-auditor",
    badge: "Auditor",
    icon: ShieldAlert,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    buttonText: "Audit Message",
  },
  {
    title: "Testimonial Card Generator",
    description: "Turn Reddit comments and HackerNews posts praising your product into beautifully formatted, shareable SVG social proof cards for free.",
    href: "/tools/testimonial-generator",
    badge: "Design",
    icon: Quote,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    buttonText: "Create Quote Card",
  },
  {
    title: "Ask HN Lead Finder Feed",
    description: "Stream live HackerNews questions, debates, and queries that contain high B2B buyer intent, pre-filtered by our semantic parsing scripts.",
    href: "/tools/ask-hn-feed",
    badge: "Real-time Feed",
    icon: Rss,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    buttonText: "View Feed",
  },
  {
    title: "Subreddit Niche Lead Directory",
    description: "Discover the most active marketing, sales, and technology subreddits grouped by business niche, featuring common pain points and triggers.",
    href: "/tools/subreddit-directory",
    badge: "Directory",
    icon: FolderOpen,
    color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    buttonText: "Browse Directory",
  },
];
