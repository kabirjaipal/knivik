import { Metadata } from "next";
import { MetadataOptions } from "./types";
import { siteConfig, getBaseUrl, resolveUrl } from "./site-config";

export function formatMetaTitle(rawTitle: string): string {
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
export function constructPageMetadata(options: MetadataOptions): Metadata {
  const baseUrl = getBaseUrl();
  const absoluteCanonicalUrl = resolveUrl(options.path);
  const absoluteOgImageUrl = options.ogImage 
    ? (options.ogImage.startsWith("http") ? options.ogImage : resolveUrl(options.ogImage))
    : resolveUrl("/og-image.png");

  const formattedTitle = formatMetaTitle(options.title);

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
    title: formattedTitle,
    description: options.description,
    applicationName: siteConfig.name,
    authors: siteConfig.authors,
    creator: siteConfig.creator,
    publisher: siteConfig.creator,
    keywords: options.keywords && options.keywords.length > 0 ? options.keywords : siteConfig.keywords,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: absoluteCanonicalUrl,
    },
    robots: robotsConfig,
    openGraph: {
      title: formattedTitle,
      description: options.description,
      url: absoluteCanonicalUrl,
      siteName: siteConfig.name,
      locale: "en_US",
      type: options.type || "website",
      images: [
        {
          url: absoluteOgImageUrl,
          width: 1200,
          height: 630,
          alt: `${options.title} | Knivik`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: formattedTitle,
      description: options.description,
      images: [absoluteOgImageUrl],
      creator: "@knivikai",
      site: "@knivikai",
    },
  };
}

// Backward compatibility class wrapper
export class MetadataService {
  public static constructPageMetadata(options: MetadataOptions): Metadata {
    return constructPageMetadata(options);
  }
}
