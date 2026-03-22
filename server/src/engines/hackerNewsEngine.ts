import { Platform, Keyword, ProductSource } from '@prisma/client';
import { BaseScraperEngine, ProductWithDetails } from './baseEngine.js';
import logger from '../lib/logger.js';

/**
 * HackerNews engine using the Algolia Search API for keyword scanning
 * and the HN Firebase API for recent posts (semantic/competitor passes).
 */
export class HackerNewsEngine extends BaseScraperEngine {
  platform = Platform.HACKERNEWS;

  protected async scrapeKeyword(
    product: ProductWithDetails,
    _source: ProductSource,
    keyword: Keyword,
    limit: number,
    signal?: AbortSignal
  ): Promise<number> {
    let savedCount = 0;

    // Algolia HN Search API — best-in-class for HN search
    const url = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(keyword.keyword)}&tags=(story,comment)&hitsPerPage=10`;

    try {
      const response = await fetch(url, { signal: signal as any });
      if (!response.ok) {
        logger.warn(`[HN] Algolia API returned ${response.status}`);
        return savedCount;
      }

      const data = (await response.json()) as any;
      const hits = data?.hits;
      if (!hits || !Array.isArray(hits)) return savedCount;

      for (const hit of hits) {
        if (savedCount >= limit) break;
        if (!hit.objectID) continue;

        const title = hit.title || hit.story_title || 'HN Conversation Thread';
        // Strip HTML from comments
        const content = (hit.comment_text || hit.story_text || hit.title || '').replace(/<[^>]*>/gm, '');

        const isNew = await this.processPotentialLead(
          product,
          hit.objectID,
          title,
          content,
          `https://news.ycombinator.com/item?id=${hit.objectID}`,
          hit.author,
          new Date(hit.created_at)
        );
        if (isNew) savedCount++;
      }

      await this.sleep(1000);
    } catch (error) {
      logger.error({ error }, `[HN] Error fetching for keyword: ${keyword.keyword}`);
    }

    return savedCount;
  }

  /**
   * Fetches the latest HN stories for semantic + competitor passes.
   * Uses the official HN Firebase API (newstories endpoint).
   */
  override async fetchRecentPosts(_source: ProductSource, limit: number) {
    try {
      const idsRes = await fetch(`https://hacker-news.firebaseio.com/v0/newstories.json`);
      if (!idsRes.ok) return [];

      const ids = (await idsRes.json()) as number[];
      const topIds = ids.slice(0, limit);

      const posts = await Promise.allSettled(
        topIds.map(async (id) => {
          const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
          if (!res.ok) return null;
          const item = (await res.json()) as any;
          if (!item || item.type !== 'story') return null;

          return {
            id: String(item.id),
            title: item.title || null,
            content: (item.text || '').replace(/<[^>]*>/gm, ''),
            url: `https://news.ycombinator.com/item?id=${item.id}`,
            author: item.by,
            postedAt: item.time ? new Date(item.time * 1000) : undefined,
          };
        })
      );

      return posts
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
        .map(r => r.value);
    } catch {
      return [];
    }
  }
}
