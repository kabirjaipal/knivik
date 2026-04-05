import { Platform, Keyword, ProductSource } from '@prisma/client';
import { BaseScraperEngine, ProductWithDetails } from './baseEngine.js';
import { hackerNewsProtection } from '../utils/ipProtection.js';
import logger from '../lib/logger.js';

// Business-relevant keywords for HN content filtering
const BUSINESS_KEYWORDS = [
  'tool', 'software', 'service', 'product', 'company',
  'startup', 'business', 'workflow', 'productivity',
  'saas', 'b2b', 'enterprise', 'api', 'platform'
];

// Buying signal patterns
const BUYING_SIGNALS = [
  'looking for', 'recommendation', 'suggestion', 'alternative',
  'anyone know', 'what do you use', 'how do you',
  'need a', 'searching for', 'best tool for', 'suggestions for',
  'can anyone recommend', 'what software', 'looking to buy',
  'want to purchase', 'considering', 'thinking about'
];

/**
 * Enhanced HackerNews engine with IP protection and rate limiting
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
    const url = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(keyword.keyword)}&tags=(story,comment)&hitsPerPage=25`;

    const response = await hackerNewsProtection.safeFetch(url);
    if (!response) return savedCount;

    try {
      const data = (await response.json()) as any;
      const hits = data?.hits;
      if (!hits || !Array.isArray(hits)) return savedCount;

      for (const hit of hits) {
        if (savedCount >= limit) break;
        if (!hit.objectID) continue;

        const title = hit.title || hit.story_title || 'HN Conversation Thread';
        // Strip HTML from comments
        const content = (hit.comment_text || hit.story_text || hit.title || '').replace(/<[^>]*>/gm, '');

        // Detect if this is a comment (higher buying signal)
        const isComment = !!hit.comment_text;
        
        // Detect Ask HN posts (highest buying signal)
        const isAskHN = title.startsWith('Ask HN');
        
        // Score the content
        const qualityScore = this.scoreContent(title, content, isComment, isAskHN);
        
        // Skip low-quality content
        if (qualityScore < 30) continue;

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

      // Additional delay between keywords (handled by IP protection)
      await hackerNewsProtection['sleep'](1000);
    } catch (error: any) {
      logger.error(`[HN] Error processing keyword ${keyword.keyword}: ${error.message}`);
    }

    return savedCount;
  }

  /**
   * Fetches the latest posts from HackerNews with IP protection
   */
  override async fetchRecentPosts(_source: ProductSource, limit: number, signal?: AbortSignal) {
    try {
      // Get latest stories
      const idsUrl = 'https://hacker-news.firebaseio.com/v0/newstories.json';
      const idsRes = await hackerNewsProtection.safeFetch(idsUrl);
      if (!idsRes) return [];

      const ids = (await idsRes.json()) as number[];
      const topIds = ids.slice(0, limit * 2); // Get more to filter for quality

      // Process stories in smaller batches to avoid overwhelming the API
      const batchSize = 5;
      const posts = [];
      
      for (let i = 0; i < topIds.length; i += batchSize) {
        const batch = topIds.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(
          batch.map(async (id) => {
            const res = await hackerNewsProtection.safeFetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
            if (!res) return null;
            const item = (await res.json()) as any;
            if (!item) return null;

            // Include both stories and high-quality comments
            if (item.type !== 'story' && item.type !== 'comment') return null;

            const title = item.title || (item.comment_text ? `Comment on ${item.story_title || 'HN Thread'}` : 'HN Discussion');
            const content = (item.text || item.comment_text || '').replace(/<[^>]*>/gm, '');
            const url = `https://news.ycombinator.com/item?id=${item.id}`;

            // Detect content type and signals
            const isComment = item.type === 'comment';
            const isAskHN = title.startsWith('Ask HN');
            const isShowHN = title.startsWith('Show HN');
            const isBusinessRelevant = this.isBusinessRelevant(`${title} ${content}`);

            // Skip non-business content
            if (!isBusinessRelevant && !isAskHN) return null;

            // Score the content
            const qualityScore = this.scoreContent(title, content, isComment, isAskHN);

            // Only return high-quality content
            if (qualityScore < 40) return null;

            return {
              id: String(item.id),
              title,
              content,
              url,
              author: item.by,
              postedAt: item.time ? new Date(item.time * 1000) : undefined,
              type: item.type,
              isAskHN,
              isShowHN,
              isComment,
              qualityScore,
              buyingSignals: this.detectBuyingSignals(`${title} ${content}`),
              businessRelevance: isBusinessRelevant,
              score: item.score || 0,
              commentCount: item.descendants || 0
            };
          })
        );

        // Add successful results from this batch
        const batchPosts = batchResults
          .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
          .map(r => r.value);
        
        posts.push(...batchPosts);

        // Small delay between batches
        if (i + batchSize < topIds.length) {
          await hackerNewsProtection['sleep'](500);
        }
      }

      // Sort by quality and limit to requested number
      return posts
        .sort((a, b) => b.qualityScore - a.qualityScore)
        .slice(0, limit);
        
    } catch (error: any) {
      logger.error(`[HN] Error fetching posts: ${error.message}`);
      return [];
    }
  }

  /**
   * Get comments for a specific HN post/thread with rate limiting
   */
  private async getPostComments(postId: string, limit: number = 50): Promise<any[]> {
    const url = `https://hn.algolia.com/api/v1/search_by_date?tags=comment,story_${postId}&hitsPerPage=${limit}`;
    const response = await hackerNewsProtection.safeFetch(url);
    
    if (!response) return [];

    try {
      const data = (await response.json()) as any;
      const hits = (data as any)?.hits || [];

      return hits
        .filter((hit: any) => hit.comment_text && hit.author)
        .map((hit: any) => {
          const content = hit.comment_text.replace(/<[^>]*>/gm, '');
          const qualityScore = this.scoreContent('', content, true, false);
          
          // Only return quality comments
          if (qualityScore < 25) return null;

          return {
            id: hit.objectID,
            content,
            author: hit.author,
            postedAt: new Date(hit.created_at),
            qualityScore,
            buyingSignals: this.detectBuyingSignals(content),
            score: hit.points || 0
          };
        })
        .filter(Boolean);
    } catch (error: any) {
      logger.warn(`[HN] Failed to get comments for ${postId}: ${error.message}`);
      return [];
    }
  }

  /**
   * Score content quality based on various factors
   */
  private scoreContent(title: string, content: string, isComment: boolean, isAskHN: boolean): number {
    let score = 0;

    // Type bonuses (30 points max)
    if (isAskHN) score += 30; // Ask HN posts are gold
    if (isComment) score += 15; // Comments often contain buying signals
    if (title.startsWith('Show HN')) score += 5; // Show HN can be relevant

    // Title quality (25 points max)
    const titleLower = title.toLowerCase();
    if (titleLower.includes('?')) score += 10;
    if (BUYING_SIGNALS.some(signal => titleLower.includes(signal))) score += 15;
    if (BUSINESS_KEYWORDS.some(keyword => titleLower.includes(keyword))) score += 10;

    // Content quality (25 points max)
    if (content.length > 100) score += 10;
    if (content.length > 500) score += 15;
    if (content.toLowerCase().includes('problem') || content.toLowerCase().includes('issue')) score += 10;

    // Engagement quality (20 points max)
    if (content.toLowerCase().includes('recommend')) score += 10;
    if (content.toLowerCase().includes('experience')) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Check if content is business-relevant
   */
  private isBusinessRelevant(content: string): boolean {
    const contentLower = content.toLowerCase();
    return BUSINESS_KEYWORDS.some(keyword => contentLower.includes(keyword));
  }

  /**
   * Detect buying signals in content
   */
  private detectBuyingSignals(content: string): string[] {
    const contentLower = content.toLowerCase();
    return BUYING_SIGNALS.filter(signal => contentLower.includes(signal));
  }

  /**
   * Get business keywords for filtering
   */
  static getBusinessKeywords(): string[] {
    return BUSINESS_KEYWORDS;
  }

  /**
   * Get buying signals for detection
   */
  static getBuyingSignals(): string[] {
    return BUYING_SIGNALS;
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus() {
    return hackerNewsProtection.getRateLimitStatus();
  }
}
