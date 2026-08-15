import { Metadata } from "next";
import { MetadataOptions } from "../domain/seo.types";
import { EnvConfig } from "../infrastructure/env.config";
import { siteConfig } from "../../seo";

export class MetadataService {
  private static readonly defaultKeywords = siteConfig.keywords;
  private static readonly defaultOgImage = "/og-image.png";

  private static formatTitle(rawTitle: string): string {
    const clean = rawTitle.trim();
    if (clean.toLowerCase().endsWith("| knivik")) {
      return clean;
    }
    if (clean.toLowerCase().endsWith("- knivik")) {
      return clean;
    }
    if (clean.toLowerCase() === "knivik") {
      return "Knivik | AI Lead Finder & B2B Social Lead Generation Tool";
    }
    return `${clean} | Knivik`;
  }

  /**
   * Builds a production-grade, highly structured Next.js Metadata object.
   * Auto-resolves canonical URLs, absolute titles, and search-optimal robot configurations.
   */
  public static constructPageMetadata(options: MetadataOptions): Metadata {
    const baseUrl = EnvConfig.getBaseUrl();
    const absoluteCanonicalUrl = EnvConfig.resolveUrl(options.path);
    const absoluteOgImageUrl = options.ogImage 
      ? (options.ogImage.startsWith("http") ? options.ogImage : EnvConfig.resolveUrl(options.ogImage))
      : EnvConfig.resolveUrl(this.defaultOgImage);

    const formattedTitle = this.formatTitle(options.title);

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
      title: {
        absolute: formattedTitle,
      },
      description: options.description,
      keywords: options.keywords || this.defaultKeywords,
      metadataBase: new URL(baseUrl),
      alternates: {
        canonical: absoluteCanonicalUrl,
      },
      robots: robotsConfig,
      openGraph: {
        title: formattedTitle,
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
            alt: `${options.title} - Knivik`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: formattedTitle,
        description: options.description,
        images: [absoluteOgImageUrl],
        site: "@knivikai",
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
