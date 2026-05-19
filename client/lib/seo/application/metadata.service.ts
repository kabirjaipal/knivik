import { Metadata } from "next";
import { MetadataOptions } from "../domain/seo.types";
import { EnvConfig } from "../infrastructure/env.config";

export class MetadataService {
  private static readonly defaultKeywords = [
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
  ];

  private static readonly defaultOgImage = "/og-image.png";

  /**
   * Builds a production-grade, highly structured Next.js Metadata object.
   * Auto-resolves canonical URLs and sets up search-optimal robot configurations.
   */
  public static constructPageMetadata(options: MetadataOptions): Metadata {
    const baseUrl = EnvConfig.getBaseUrl();
    const absoluteCanonicalUrl = EnvConfig.resolveUrl(options.path);
    const absoluteOgImageUrl = options.ogImage 
      ? (options.ogImage.startsWith("http") ? options.ogImage : EnvConfig.resolveUrl(options.ogImage))
      : EnvConfig.resolveUrl(this.defaultOgImage);

    const titleTemplate = {
      default: `${options.title} | Knivik`,
      template: `%s | Knivik`,
    };

    // Construct robots settings based on indexing requirements
    const robotsConfig = options.noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            "max-video-preview": -1,
            "max-image-preview": "none" as const,
            "max-snippet": -1,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large" as const,
            "max-snippet": -1,
          },
        };

    return {
      title: titleTemplate,
      description: options.description,
      keywords: options.keywords || this.defaultKeywords,
      metadataBase: new URL(baseUrl),
      alternates: {
        canonical: absoluteCanonicalUrl,
      },
      robots: robotsConfig,
      openGraph: {
        title: `${options.title} | Knivik`,
        description: options.description,
        url: absoluteCanonicalUrl,
        siteName: "Knivik",
        locale: "en_US",
        type: options.type || "website",
        images: [
          {
            url: absoluteOgImageUrl,
            width: 1200,
            height: 630,
            alt: `${options.title} Social Share Card`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${options.title} | Knivik`,
        description: options.description,
        images: [absoluteOgImageUrl],
        creator: "@knivikai",
      },
      icons: {
        icon: "/favicon.svg",
        shortcut: "/favicon.svg",
        apple: "/favicon.svg",
      },
    };
  }
}
