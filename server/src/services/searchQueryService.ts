import { db } from '../lib/db.js';
import logger from '../lib/logger.js';
import { generateProductStrategy } from './aiService.js';

/**
 * AI-Powered Search Query Generation Service
 * 
 * This service uses the unified product strategy AI endpoint to generate both
 * competitor/subreddit details and the targeted forum search queries in ONE call.
 * 
 * This reduces AI setup calls and costs by 50% while producing higher-quality queries
 * that are fully contextualized with the discovered competitor names and subreddits.
 */
export class SearchQueryService {
  
  /**
   * Generate and save AI-powered search queries and strategy details for a product
   * Call this when creating or updating a product
   */
  static async generateAndSaveQueries(productId: string): Promise<string[]> {
    const startTime = Date.now();
    
    try {
      // Fetch product
      const product = await db.client.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        logger.error({ productId }, 'Product not found for query generation');
        return [];
      }

      // Generate queries & strategy using our merged AI function
      logger.info({ productId, productName: product.name }, '[STRATEGY] Generating unified strategy & search queries...');
      const strategy = await generateProductStrategy(
        product.name,
        product.description || '',
        product.userId
      );

      const existingAiConfig = (product.aiConfig as Record<string, any>) || {};
      const updatedAiConfig = {
        ...existingAiConfig,
        keywords: strategy.keywords,
        negativeKeywords: strategy.negativeKeywords,
        competitors: strategy.competitors,
        subreddits: strategy.subreddits,
        twitterHandles: strategy.twitterHandles,
        linkedinSearchFlags: strategy.linkedinSearchFlags,
        productHuntCommunities: strategy.productHuntCommunities,
      };

      // Save to database
      await db.client.product.update({
        where: { id: productId },
        data: {
          searchQueries: strategy.searchQueries,
          aiConfig: updatedAiConfig,
        },
      });

      const elapsed = Date.now() - startTime;
      logger.info({ 
        productId, 
        queryCount: strategy.searchQueries.length,
        timeMs: elapsed 
      }, 'AI-generated and saved search queries & strategy profile');
      
      return strategy.searchQueries;
    } catch (error: any) {
      logger.error({ error, productId }, 'Failed to generate AI search queries and strategy');
      return [];
    }
  }

  /**
   * Get stored search queries for a product
   * Returns empty array if none exist
   */
  static async getStoredQueries(productId: string): Promise<string[]> {
    try {
      const product = await db.client.product.findUnique({
        where: { id: productId },
        select: { searchQueries: true },
      });

      if (!product?.searchQueries || (Array.isArray(product.searchQueries) && product.searchQueries.length === 0)) {
        // Generate on-the-fly if missing
        return await this.generateAndSaveQueries(productId);
      }

      return product.searchQueries as string[];
    } catch (error: any) {
      logger.error({ error, productId }, 'Failed to get stored queries');
      return [];
    }
  }

  /**
   * Regenerate queries and strategies for all products
   * Useful for bulk updates when AI model improves
   */
  static async regenerateAllQueries(): Promise<{ updated: number; failed: number }> {
    const products = await db.client.product.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    let updated = 0;
    let failed = 0;

    for (const product of products) {
      try {
        await this.generateAndSaveQueries(product.id);
        updated++;
      } catch {
        failed++;
      }
    }

    logger.info({ updated, failed }, 'Bulk AI query and strategy regeneration complete');
    return { updated, failed };
  }
}
