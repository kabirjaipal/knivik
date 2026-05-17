import { Metadata } from "next";

export const siteConfig = {
  name: "Knivik",
  description: "Advanced AI Social Intelligence tool to find high-intent buyers across Reddit, HackerNews, and the public web. Turn online conversations into warm leads automatically.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://knivik.xyz",
  ogImage: "https://knivik.xyz/og-image.png",
  links: {
    twitter: "https://twitter.com/knivik",
    github: "https://github.com/knivik",
  },
  keywords: [
    "AI Lead Finder",
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
}: {
  title?: string;
  description?: string;
  image?: string;
  icons?: string;
  noIndex?: boolean;
} = {}): Metadata {
  return {
    title,
    description,
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
