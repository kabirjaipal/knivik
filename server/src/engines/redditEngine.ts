import { Platform, Keyword, ProductSource } from '@prisma/client';
import { BaseScraperEngine, ProductWithDetails } from './baseEngine.js';
import { redditProtection } from '../utils/ipProtection.js';
import logger from '../lib/logger.js';

// High-value subreddits for business discussions
const HIGH_VALUE_SUBREDDITS = [
  'startups', 'SaaS', 'smallbusiness', 'entrepreneur',
  'sysadmin', 'webdev', 'programming', 'software',
  'productivity', 'tools', 'recommendations', 'ask',
  'government', 'procurement', 'contracting', 'b2b'
];

// Buying signal patterns
const BUYING_SIGNALS = [
  'looking for', 'recommendation', 'suggestion', 'alternative',
  'anyone know', 'what do you use', 'how do you',
  'need a', 'searching for', 'best tool for', 'suggestions for',
  'can anyone recommend', 'what software', 'looking to buy',
  'want to purchase', 'considering', 'thinking about'
];

export class RedditEngine extends BaseScraperEngine {
  platform = Platform.REDDIT;

  protected async scrapeKeyword(
    product: ProductWithDetails,
    source: ProductSource,
    keyword: Keyword,
    limit: number,
    signal?: AbortSignal
  ): Promise<number> {
    let savedCount = 0;
    const isGlobal = source.identifier.toLowerCase() === 'global';

    // Enforce exact phrase match for multi-word queries
    const searchQuery = keyword.keyword.includes(' ') && !keyword.keyword.includes('"')
      ? `"${keyword.keyword}"`
      : keyword.keyword;

    const subreddit = source.identifier.startsWith('r/') ? source.identifier.substring(2) : source.identifier;
    
    let url = `https://www.reddit.com/search.json?q=${encodeURIComponent(searchQuery)}&sort=new&limit=25&type=link,comment`;
    if (!isGlobal) {
      url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(searchQuery)}&restrict_sr=1&sort=new&limit=25&type=link,comment`;
    }

    const response = await redditProtection.safeFetch(url);
    if (!response) return savedCount;

    try {
      const data = (await response.json()) as any;
      const children = data?.data?.children;
      if (!children || !Array.isArray(children)) return savedCount;

      for (const child of children) {
        if (savedCount >= limit) break;
        const postData = child.data;
        if (!postData?.id) continue;

        const title = postData.title || (postData.link_title ? `Comment on: ${postData.link_title}` : '');
        const content = postData.body || postData.selftext || '';
        const link = postData.permalink
          ? `https://reddit.com${postData.permalink}`
          : postData.context
          ? `https://reddit.com${postData.context}`
          : url;

        const isNew = await this.processPotentialLead(
          product,
          postData.id,
          title,
          content,
          link,
          postData.author,
          new Date(postData.created_utc * 1000)
        );
        if (isNew) savedCount++;
      }

      // Additional delay between keywords (handled by IP protection)
      await redditProtection['sleep'](2000);
    } catch (error: any) {
      logger.error(`[REDDIT] Error processing keyword ${keyword.keyword}: ${error.message}`);
    }

    return savedCount;
  }

  /**
   * Fetches the latest posts with IP protection
   */
  override async fetchRecentPosts(source: ProductSource, limit: number, signal?: AbortSignal) {
    const isGlobal = source.identifier.toLowerCase() === 'global';
    const subreddit = source.identifier.startsWith('r/') ? source.identifier.substring(2) : source.identifier;
    const url = isGlobal
      ? `https://www.reddit.com/new.json?limit=${limit}`
      : `https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}`;

    const response = await redditProtection.safeFetch(url);
    if (!response) return [];

    try {
      const data = (await response.json()) as any;
      const children = data?.data?.children || [];

      const posts = await Promise.all(
        children.slice(0, limit).map(async (child: any) => {
          const postData = child.data;
          if (!postData?.id) return null;

          const title = postData.title || '';
          const content = postData.selftext || '';
          const postedAt = new Date(postData.created_utc * 1000);

          // Score content quality
          const qualityScore = this.scoreContent(title, content, postData.num_comments || 0);
          
          // Only process high-quality posts
          if (qualityScore < 30) return null;

          // Get comments for high-value posts (with rate limiting)
          let comments: any[] = [];
          if (postData.num_comments > 5 && qualityScore > 50) {
            comments = await this.getPostComments(postData.id, 10);
          }

          return {
            id: postData.id,
            title,
            content,
            url: `https://reddit.com${postData.permalink}`,
            author: postData.author,
            postedAt,
            numComments: postData.num_comments || 0,
            qualityScore,
            buyingSignals: this.detectBuyingSignals(`${title} ${content}`),
            comments: comments.slice(0, 3),
            hasHighValueComments: comments.some(c => c.qualityScore > 40)
          };
        })
      );

      return posts.filter(Boolean);
    } catch (error: any) {
      logger.error(`[REDDIT] Error fetching posts: ${error.message}`);
      return [];
    }
  }

  /**
   * Get comments with careful rate limiting
   */
  private async getPostComments(postId: string, limit: number = 50): Promise<any[]> {
    const url = `https://www.reddit.com/comments/${postId}.json?limit=${limit}`;
    const response = await redditProtection.safeFetch(url);
    
    if (!response) return [];

    try {
      const data = (await response.json()) as any;
      const comments = (data as any)[1]?.data?.children || [];

      return comments
        .filter((comment: any) => comment.data.body && comment.data.author)
        .map((comment: any) => {
          const content = comment.data.body || '';
          return {
            id: comment.data.id,
            content,
            author: comment.data.author,
            postedAt: new Date(comment.data.created_utc * 1000),
            depth: comment.data.depth || 0,
            score: comment.data.score || 0,
            qualityScore: this.scoreContent('', content, 0),
            buyingSignals: this.detectBuyingSignals(content)
          };
        })
        .filter((comment: any) => comment.qualityScore > 20);
    } catch (error: any) {
      logger.warn(`[REDDIT] Failed to get comments for ${postId}: ${error.message}`);
      return [];
    }
  }

  /**
   * Score content quality based on various factors
   */
  private scoreContent(title: string, content: string, numComments: number): number {
    let score = 0;

    // Title quality (30 points max)
    const titleLower = title.toLowerCase();
    if (titleLower.includes('?')) score += 10;
    if (BUYING_SIGNALS.some(signal => titleLower.includes(signal))) score += 20;
    if (titleLower.length > 50) score += 5;

    // Content quality (30 points max)
    if (content.length > 100) score += 10;
    if (content.length > 500) score += 10;
    if (content.toLowerCase().includes('problem') || content.toLowerCase().includes('issue')) score += 10;

    // Engagement quality (20 points max)
    if (numComments > 10) score += 10;
    if (numComments > 50) score += 10;

    // Length quality (20 points max)
    const totalLength = title.length + content.length;
    if (totalLength > 200) score += 10;
    if (totalLength > 500) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Detect buying signals in content
   */
  private detectBuyingSignals(content: string): string[] {
    const contentLower = content.toLowerCase();
    return BUYING_SIGNALS.filter(signal => contentLower.includes(signal));
  }

  /**
   * Get high-value subreddits
   */
  static getHighValueSubreddits(): string[] {
    return HIGH_VALUE_SUBREDDITS;
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus() {
    return redditProtection.getRateLimitStatus();
  }
}
