import { FAQItem, BreadcrumbItem, ProductPriceOptions } from "../domain/seo.types";
import { EnvConfig } from "../infrastructure/env.config";

export class SchemaService {
  /**
   * Generates Schema.org SoftwareApplication JSON-LD object.
   * Provides rich search cards and AI entity definition.
   */
  public static generateSoftwareApplicationSchema(options?: {
    pricing?: ProductPriceOptions;
    features?: string[];
  }): Record<string, any> {
    const baseUrl = EnvConfig.getBaseUrl();
    
    return {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "@id": `${baseUrl}/#software`,
      "name": "Knivik",
      "description": "Knivik is an AI Lead Finder and B2B social sales intelligence platform. It autonomously monitors Reddit, HackerNews, X (Twitter), GitHub, and Bluesky in real-time to discover high-intent buying signals and suggest warm outreach replies.",
      "applicationCategory": "BusinessApplication",
      "applicationSubCategory": "Sales & Marketing Intelligence",
      "operatingSystem": "Web, Cloud",
      "url": baseUrl,
      "screenshot": `${baseUrl}/og-image.png`,
      "author": {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        "name": "Knivik",
        "url": baseUrl,
        "logo": `${baseUrl}/favicon.svg`,
        "sameAs": [
          "https://x.com/knivikai",
          "https://github.com/knivik",
          "https://instagram.com/knivikai"
        ]
      },
      "offers": {
        "@type": "Offer",
        "price": options?.pricing?.price || "0.00",
        "priceCurrency": options?.pricing?.priceCurrency || "USD",
        "priceValidUntil": options?.pricing?.priceValidUntil || "2027-12-31",
        "availability": options?.pricing?.availability || "https://schema.org/InStock",
      },
      "featureList": options?.features || [
        "Real-time Reddit buying intent monitoring",
        "HackerNews discussion and recommendation analysis",
        "X (Twitter) conversational prospecting",
        "GitHub issues and discussions lead detection",
        "Bluesky social listening & lead generation",
        "AI-powered Warm Outreach Reply angles",
        "Semantic buying intent scoring and classification",
        "Slack, Email, Zapier, and Make CRM webhooks"
      ]
    };
  }

  /**
   * Generates Schema.org Organization JSON-LD object.
   * Establishes the authoritative brand entity and social channels for E-E-A-T.
   */
  public static generateOrganizationSchema(): Record<string, any> {
    const baseUrl = EnvConfig.getBaseUrl();
    
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      "name": "Knivik",
      "alternateName": ["Knivik AI", "knvik", "Knivik Lead Finder", "knivik.xyz"],
      "url": baseUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/favicon.svg`,
        "width": "512",
        "height": "512"
      },
      "sameAs": [
        "https://x.com/knivikai",
        "https://github.com/knivik",
        "https://instagram.com/knivikai"
      ],
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "contactType": "customer support",
          "url": `${baseUrl}/contact`
        }
      ]
    };
  }

  /**
   * Generates Schema.org WebSite JSON-LD object.
   * Promotes brand entity visibility and Google Sitelinks Searchbox.
   */
  public static generateWebSiteSchema(): Record<string, any> {
    const baseUrl = EnvConfig.getBaseUrl();
    
    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      "name": "Knivik",
      "alternateName": ["Knivik AI", "knvik", "Knivik Lead Finder", "knivik.xyz"],
      "url": baseUrl,
      "description": "Advanced AI Lead Finder and B2B social sales intelligence platform for products and services.",
      "publisher": {
        "@id": `${baseUrl}/#organization`
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${baseUrl}/tools/search-builder?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    };
  }

  /**
   * Generates WebApplication schema for interactive utility tools.
   */
  public static generateWebApplicationSchema(tool: {
    name: string;
    description: string;
    path: string;
  }): Record<string, any> {
    const baseUrl = EnvConfig.getBaseUrl();
    const toolUrl = EnvConfig.resolveUrl(tool.path);

    return {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": tool.name,
      "description": tool.description,
      "url": toolUrl,
      "applicationCategory": "UtilityApplication",
      "operatingSystem": "Web",
      "browserRequirements": "Requires JavaScript. Requires HTML5.",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
      },
      "provider": {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        "name": "Knivik",
        "url": baseUrl
      }
    };
  }

  /**
   * Generates Schema.org CollectionPage JSON-LD object for index directories.
   */
  public static generateCollectionPageSchema(options: {
    name: string;
    description: string;
    path: string;
  }): Record<string, any> {
    const baseUrl = EnvConfig.getBaseUrl();
    const url = EnvConfig.resolveUrl(options.path);

    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": options.name,
      "description": options.description,
      "url": url,
      "isPartOf": {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`
      }
    };
  }

  /**
   * Generates Schema.org FAQPage JSON-LD object.
   * Promotes accordion rich snippets directly in Google and AI search results.
   */
  public static generateFAQSchema(faqs: FAQItem[]): Record<string, any> {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map((faq) => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer,
        },
      })),
    };
  }

  /**
   * Generates Schema.org BreadcrumbList JSON-LD object.
   * Helps crawlers and AI search platforms parse the page hierarchy.
   */
  public static generateBreadcrumbsSchema(items: BreadcrumbItem[]): Record<string, any> {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": item.item.startsWith("http") ? item.item : EnvConfig.resolveUrl(item.item),
      })),
    };
  }
}
