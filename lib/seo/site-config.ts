export const siteConfig = {
  name: "Knivik",
  description: "Knivik is an advanced AI Lead Finder and B2B social sales intelligence platform for products and services. It scans Reddit, HackerNews, and X (Twitter) in real-time to discover warm leads with genuine buying intent.",
  url: process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://www.knivik.xyz",
  ogImage: "https://knivik.xyz/og-image.png",
  links: {
    twitter: "https://x.com/knivikai",
    github: "https://github.com/knivik",
  },
  keywords: [
    "Knivik",
    "Knivik AI",
    "knivik.xyz",
    "knvik",
    "knivik lead finder",
    "knivik b2b lead generation",
    "how to find clients on reddit",
    "how to find leads on twitter",
    "reddit lead generation tool",
    "AI lead finder",
    "B2B social lead generation tool",
    "monitor reddit for sales leads",
    "social listening for sales leads",
    "find customers on hackernews",
    "automated social selling software",
    "buying intent lead finder",
    "warm lead outreach generator",
    "social media monitoring for b2b leads",
    "reddit sales prospect finder",
    "find ready to buy leads",
    "track social media for sales leads",
    "conversational prospecting tool",
    "best AI sales agent for reddit",
    "how to get sales leads from reddit",
    "how to get sales leads from twitter",
    "free lead finder tool",
    "AI lead generation tools",
    "best AI lead generation software",
    "B2B sales prospecting tools",
    "B2B lead generation software",
    "sales intelligence platform",
    "Social Intelligence",
    "Intent Analysis",
    "Reddit Lead Generation",
    "HackerNews Monitoring",
    "Best AI tool for social selling",
    "Automate B2B lead generation",
    "Find customers on Twitter automatically",
    "Social listening tool for startups",
    "Sales Intelligence",
    "B2B Leads",
    "Warm Leads",
    "Automated Outreach",
    "Customer Discovery",
    "buying intent tools",
    "buyer intent software",
    "AI sales agent",
    "AI SDR tool",
    "find clients on Reddit",
    "track keywords on Reddit",
    "social selling software",
    "automated prospecting tools",
    "lead finder software",
    "warm lead finder",
    "real-time buyer intent signals",
    "sales tools for SaaS",
    "social media prospecting",
    "lead scraping tools",
    "F5Bot alternative",
    "Syften alternative",
    "GummySearch alternative",
    "Apollo alternative",
    "Hootsuite alternative",
    "BuzzSumo alternative",
    "Mentions alternative",
    "Brand24 alternative",
    "best Syften alternatives",
    "best GummySearch alternatives",
    "find clients for agency on reddit",
    "find freelance clients on reddit",
    "find video editing clients on reddit",
    "social lead finder for agencies",
    "lead generation for freelance services",
    "find service clients on twitter",
    "buying intent signals for agencies",
    "lead generation tool for freelancers",
    "B2B service sales tools",
    "agency client acquisition software"
  ],
  authors: [
    {
      name: "Knivik Team",
      url: "https://knivik.xyz",
    },
  ],
  creator: "Knivik",
};

const FALLBACK_URL = "https://www.knivik.xyz";

/**
 * Retrieves the absolute base URL of the site with validation.
 * Ensures trailing slashes are removed for canonical reliability.
 */
export function getBaseUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || siteConfig.url;

  if (!rawUrl) {
    return FALLBACK_URL;
  }

  try {
    return new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`).origin;
  } catch {
    return FALLBACK_URL;
  }
}

/**
 * Constructs an absolute URL for a given path.
 */
export function resolveUrl(path: string): string {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (cleanPath === "/") {
    return baseUrl;
  }
  return `${baseUrl}${cleanPath}`;
}

// Backward-compatibility class alias
export class EnvConfig {
  public static getBaseUrl(): string {
    return getBaseUrl();
  }

  public static resolveUrl(path: string): string {
    return resolveUrl(path);
  }
}
