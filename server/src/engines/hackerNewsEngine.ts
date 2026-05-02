import { Platform, Keyword, ProductSource } from '@prisma/client';
import { BaseScraperEngine, ProductWithDetails } from './baseEngine.js';
import httpClient from '../lib/httpClient.js';
import logger from '../lib/logger.js';

// Buying signal patterns
const BUYING_SIGNALS = [
  'looking for', 'recommendation', 'suggestion', 'alternative',
  'anyone know', 'what do you use', 'how do you',
  'need a', 'searching for', 'best tool for', 'suggestions for',
  'can anyone recommend', 'what software', 'looking to buy',
  'want to purchase', 'considering', 'thinking about'
];

// Business-relevant keywords for HN filtering
const BUSINESS_KEYWORDS = [
  'tool', 'software', 'service', 'product', 'company',
  'startup', 'business', 'workflow', 'productivity',
  'saas', 'b2b', 'enterprise', 'api', 'platform'
];

interface HNPost {
  id: string;
  title: string;
  url: string;
  content: string;
  author: string;
  postedAt: Date;
  externalPostId: string;
  score: number;
}

/**
 * HackerNews engine using the official Firebase API — 100% free, no auth, no rate limits.
 * Primary: https://hacker-news.firebaseio.com/v0/
 * Secondary: Algolia HN Search API for keyword-based queries.
 */
export class HackerNewsEngine extends BaseScraperEngine {
  platform = Platform.HACKERNEWS;

  private readonly HN_BASE = 'https://hacker-news.firebaseio.com/v0';

  /**
   * Keyword search via Algolia HN Search API (fastest for targeted queries).
   * https://hn.algolia.com/api/v1/search_by_date?query=...&tags=story
   */
  private async searchAlgolia(query: string): Promise<HNPost[]> {
    const url = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(query)}&tags=(story,comment)&hitsPerPage=30&typoTolerance=false`;

    try {
      const response = await httpClient.get(url, {
        headers: { 'Accept': 'application/json' },
      });

      const hits = (response.data as any)?.hits || [];

      return hits.map((hit: any) => ({
        id: hit.objectID,
        title: hit.title || hit.story_title || '',
        url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
        content: hit.story_text || hit.comment_text || hit.title || '',
        author: hit.author || 'unknown',
        postedAt: hit.created_at_i ? new Date(hit.created_at_i * 1000) : new Date(),
        externalPostId: hit.objectID,
        score: hit.points || 0,
      } as HNPost)).filter((p: HNPost) => p.title || p.content);
    } catch (error: any) {
      logger.error(`[HACKERNEWS] Algolia search failed for "${query}": ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch latest story IDs and resolve them via official HN Firebase API.
   * This is the most stable method — official, no auth, no blocking.
   */
  private async fetchLatestViaFirebase(count: number = 30): Promise<HNPost[]> {
    try {
      // Step 1: Get list of newest story IDs
      const idsRes = await httpClient.get(`${this.HN_BASE}/newstories.json`, {
        headers: { 'Accept': 'application/json' },
      });

      const ids: number[] = ((idsRes.data as any) || []).slice(0, count);
      if (!ids.length) return [];

      // Step 2: Fetch each story's details in parallel
      const posts = await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await httpClient.get(`${this.HN_BASE}/item/${id}.json`, {
              headers: { 'Accept': 'application/json' },
            });
            const item = res.data as any;
            if (!item || item.deleted || item.dead) return null;
            if (item.type !== 'story') return null;

            return {
              id: String(item.id),
              title: item.title || '',
              url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
              content: item.text || item.title || '',
              author: item.by || 'unknown',
              postedAt: item.time ? new Date(item.time * 1000) : new Date(),
              externalPostId: String(item.id),
              score: item.score || 0,
            } as HNPost;
          } catch {
            return null;
          }
        })
      );

      return posts.filter((p): p is HNPost => p !== null);
    } catch (error: any) {
      logger.error(`[HACKERNEWS] Firebase API failed: ${error.message}`);
      return [];
    }
  }

  private containsBuyingIntent(text: string): boolean {
    const lowerText = text.toLowerCase();
    return BUYING_SIGNALS.some(signal => lowerText.includes(signal));
  }

  private isBusinessRelevant(text: string): boolean {
    const lowerText = text.toLowerCase();
    return BUSINESS_KEYWORDS.some(keyword => lowerText.includes(keyword));
  }

  protected async scrapeKeyword(
    product: ProductWithDetails,
    _source: ProductSource,
    keyword: Keyword,
    limit: number,
    signal?: AbortSignal
  ): Promise<number> {
    let savedCount = 0;

    try {
      // Primary: Algolia search for keyword-targeted results
      let posts = await this.searchAlgolia(keyword.keyword);

      // Fallback: Firebase latest stories if Algolia fails
      if (!posts.length) {
        logger.warn('[HACKERNEWS] Algolia returned no results, falling back to Firebase latest');
        posts = await this.fetchLatestViaFirebase(50);
      }

      // Filter for keyword + buying intent
      const matchingPosts = posts.filter(post => {
        if (signal?.aborted) return false;
        const searchText = `${post.title} ${post.content}`.toLowerCase();
        const hasKeyword = keyword.keyword.toLowerCase().split(' ').every(
          word => searchText.includes(word)
        );
        const hasBuyingIntent = this.containsBuyingIntent(searchText);
        const isBusiness = this.isBusinessRelevant(searchText);
        return hasKeyword && (hasBuyingIntent || isBusiness);
      });

      for (const post of matchingPosts.slice(0, limit)) {
        if (signal?.aborted) break;

        const isNew = await this.processPotentialLead(
          product,
          post.externalPostId,
          post.title,
          post.content,
          post.url,
          post.author,
          post.postedAt
        );

        if (isNew) {
          savedCount++;
          logger.info(`[HACKERNEWS] New lead: ${post.title.substring(0, 60)}...`);
        }
      }

      logger.info(`[HACKERNEWS] ${savedCount} leads found for keyword: "${keyword.keyword}"`);
    } catch (error: any) {
      logger.error(`[HACKERNEWS] Error scraping keyword "${keyword.keyword}": ${error.message}`);
    }

    return savedCount;
  }

  override async fetchRecentPosts(source: ProductSource, limit: number, _signal?: AbortSignal) {
    try {
      const isGlobal = source.identifier.toLowerCase() === 'global' || !source.identifier;

      let posts: HNPost[];

      if (isGlobal) {
        // Firebase API for global feed — most stable
        posts = await this.fetchLatestViaFirebase(limit + 10);
      } else {
        // For a specific search term, use Algolia
        posts = await this.searchAlgolia(source.identifier);
      }

      return posts.slice(0, limit).map(post => ({
        id: post.externalPostId,
        title: post.title,
        content: post.content,
        url: post.url,
        author: post.author,
        postedAt: post.postedAt,
      }));
    } catch (error: any) {
      logger.error(`[HACKERNEWS] Error fetching recent posts: ${error.message}`);
      return [];
    }
  }
}
