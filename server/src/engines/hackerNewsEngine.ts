import { Platform, Keyword, ProductSource } from '@prisma/client';
import { BaseScraperEngine, ProductWithDetails } from './baseEngine.js';
import logger from '../lib/logger.js';

/**
 * HackerNews engine using the Algolia Search API.
 * This is the standard, documented way to search HN programmatically.
 */
export class HackerNewsEngine extends BaseScraperEngine {
  platform = Platform.HACKERNEWS;

  protected async scrapeKeyword(
    product: ProductWithDetails,
    _source: ProductSource,
    keyword: Keyword,
    limit: number
  ): Promise<number> {
    let savedCount = 0;
    
    // Algolia Search API: search_by_date for latest results
    // We search both stories and comments
    const url = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(keyword.keyword)}&tags=(story,comment)&hitsPerPage=10`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        logger.warn(`HN Algolia API returned ${response.status} for URL: ${url}`);
        return savedCount;
      }

      const data = (await response.json()) as any;
      const hits = data?.hits;

      if (!hits || !Array.isArray(hits)) {
        return savedCount;
      }

      for (const hit of hits) {
        if (savedCount >= limit) break;

        const objectId = hit.objectID;
        if (!objectId) continue;

        // Content logic: HN API 'comment_text' for comments, 'story_text' or 'title' for stories
        const title = hit.title || hit.story_title || 'HN Conversation Thread';
        const content = hit.comment_text || hit.story_text || hit.title || '';
        
        // Clean up HN HTML tags if any (basic strip)
        const cleanContent = content.replace(/<[^>]*>?/gm, '');

        const isNew = await this.processPotentialLead(
          product,
          objectId,
          title,
          cleanContent,
          `https://news.ycombinator.com/item?id=${objectId}`,
          hit.author,
          new Date(hit.created_at)
        );

        if (isNew) {
          savedCount++;
        }
      }
      
      // Small sleep to avoid hammering
      await this.sleep(1000);
      
    } catch (error) {
      logger.error({ error }, `Error fetching HackerNews data for ${keyword.keyword}`);
    }
    
    return savedCount;
  }
}
