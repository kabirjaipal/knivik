import { Metadata } from "next";
import { ComparisonData } from "../domain/comparison.model";
import { ComparisonRepository } from "../infrastructure/comparison.repository";
import { MetadataService } from "./metadata.service";
import { SchemaService } from "./schema.service";

export class ComparisonService {
  private static readonly repository = new ComparisonRepository();

  /**
   * Retrieves comparison data for a given competitor slug.
   */
  public static getComparison(slug: string): ComparisonData | undefined {
    return this.repository.getByCompetitorSlug(slug);
  }

  /**
   * Retrieves all registered competitor slugs.
   */
  public static getAllSlugs(): string[] {
    return this.repository.getAllCompetitorSlugs();
  }

  /**
   * Generates highly descriptive, SEO-optimized metadata for alternative landing pages.
   */
  public static generateMetadata(slug: string): Metadata {
    const data = this.getComparison(slug);
    
    if (!data) {
      return MetadataService.constructPageMetadata({
        title: "Alternative Comparison",
        description: "Compare Knivik to other social listening and lead generation tools.",
        path: `/alternatives/${slug}`,
        noIndex: true,
      });
    }

    const competitor = data.competitor;
    return MetadataService.constructPageMetadata({
      title: `Best ${competitor.name} Alternative in 2026 (Why Switch?)`,
      description: `Compare ${competitor.name} vs Knivik. Discover why startup founders, agencies, freelancers, and sales teams are switching to Knivik for AI-powered B2B lead generation for products and services.`,
      path: `/alternatives/${competitor.slug}`,
      keywords: [
        `${competitor.name} alternative`,
        `alternative to ${competitor.name}`,
        `${competitor.name} vs Knivik`,
        `best ${competitor.name} alternatives`,
        "Reddit monitoring tool",
        "AI lead finder",
        "social selling",
        "semantic search engine"
      ]
    });
  }

  /**
   * Generates FAQ JSON-LD schema for search engines to display rich SERP accordions.
   */
  public static generateFAQSchema(data: ComparisonData): Record<string, any> {
    return SchemaService.generateFAQSchema(data.faq);
  }

  /**
   * Generates BreadcrumbList JSON-LD schema to build explicit URL hierarchy parsing.
   */
  public static generateBreadcrumbsSchema(data: ComparisonData): Record<string, any> {
    const competitor = data.competitor;
    return SchemaService.generateBreadcrumbsSchema([
      { name: "Home", item: "/" },
      { name: "Alternatives", item: `/alternatives/${competitor.slug}` },
      { name: `${competitor.name} Alternative`, item: `/alternatives/${competitor.slug}` }
    ]);
  }
}
