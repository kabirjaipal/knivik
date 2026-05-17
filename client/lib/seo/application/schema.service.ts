import { FAQItem, BreadcrumbItem, ProductPriceOptions } from "../domain/seo.types";
import { EnvConfig } from "../infrastructure/env.config";

export class SchemaService {
  /**
   * Generates Schema.org SoftwareApplication JSON-LD object.
   * Perfect for primary SaaS index pages to get rich search cards.
   */
  public static generateSoftwareApplicationSchema(options?: {
    pricing?: ProductPriceOptions;
    features?: string[];
  }): Record<string, any> {
    const baseUrl = EnvConfig.getBaseUrl();
    
    return {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Knivik",
      "description": "Advanced AI Social Intelligence tool to find high-intent buyers across Reddit, HackerNews, and X (Twitter) in real-time.",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "url": baseUrl,
      "author": {
        "@type": "Organization",
        "name": "Knivik",
        "url": baseUrl,
        "logo": `${baseUrl}/favicon.svg`
      },
      "offers": {
        "@type": "Offer",
        "price": options?.pricing?.price || "0.00",
        "priceCurrency": options?.pricing?.priceCurrency || "USD",
        "priceValidUntil": options?.pricing?.priceValidUntil || "2027-12-31",
        "availability": options?.pricing?.availability || "https://schema.org/InStock",
      },
      "featureList": options?.features || [
        "Real-time Reddit monitoring",
        "HackerNews intent analysis",
        "X (Twitter) customer discovery",
        "AI-powered Reply Angles",
        "Slack and Email alerts",
        "Zapier and Make integration"
      ]
    };
  }

  /**
   * Generates Schema.org FAQPage JSON-LD object.
   * Promotes accordion rich snippets directly in Google SERPs.
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
