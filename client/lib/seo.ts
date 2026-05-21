import { Metadata } from "next";

export const siteConfig = {
  name: "Knivik",
  description: "Advanced AI Social Intelligence tool to find high-intent buyers across Reddit, HackerNews, and the public web. Turn online conversations into warm leads automatically.",
  url: process.env.NEXT_PUBLIC_SITE_URL as string,
  ogImage: "https://knivik.xyz/og-image.png",
  links: {
    twitter: "https://x.com/knivikai",
    github: "https://github.com/knivik",
  },
  keywords: [
    "AI Lead Finder",
    "AI lead generation tools",
    "best AI lead generation software",
    "B2B sales prospecting tools",
    "B2B lead generation software",
    "sales intelligence platform",
    "Social Intelligence",
    "Intent Analysis",
    "Reddit Lead Generation",
    "HackerNews Monitoring",
    "How to find leads on Reddit",
    "Best AI tool for social selling",
    "Automate B2B lead generation",
    "Find customers on Twitter automatically",
    "Social listening tool for startups",
    "Sales Intelligence",
    "B2B Leads",
    "Warm Leads",
    "Automated Outreach",
    "Customer Discovery",
    "Market Leads",
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
  ],
  authors: [
    {
      name: "Knivik Team",
      url: "https://knivik.xyz",
    },
  ],
  creator: "Knivik",
};

export type SiteConfig = typeof siteConfig;

export function constructMetadata({
  title = siteConfig.name,
  description = siteConfig.description,
  image = siteConfig.ogImage,
  icons = "/favicon.ico",
  noIndex = false,
  keywords = siteConfig.keywords,
}: {
  title?: string;
  description?: string;
  image?: string;
  icons?: string;
  noIndex?: boolean;
  keywords?: string[];
} = {}): Metadata {
  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      images: [
        {
          url: image,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "@knivik",
    },
    icons,
    metadataBase: new URL(siteConfig.url),
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}
