import { Platform } from '@prisma/client';
import { BaseScraperEngine, ProductWithDetails } from './baseEngine.js';
import httpClient from '../lib/httpClient.js';
import logger from '../lib/logger.js';

// High-value subreddits for business discussions
const HIGH_VALUE_SUBREDDITS = [
  'startups', 'SaaS', 'smallbusiness', 'entrepreneur',
  'sysadmin', 'webdev', 'programming', 'software',
  'productivity', 'tools', 'recommendations', 'b2b'
];

// Buying signal patterns
const BUYING_SIGNALS = [
  'looking for', 'recommendation', 'suggestion', 'alternative',
  'anyone know', 'what do you use', 'how do you',
  'need a', 'searching for', 'best tool for', 'suggestions for',
  'can anyone recommend', 'what software', 'looking to buy',
  'want to purchase', 'considering', 'thinking about'
];

interface RedditPost {
  id: string;
  title: string;
  content: string;
  url: string;
  author: string;
  score: number;
  subreddit: string;
  postedAt: Date;
  externalPostId: string;
}

/**
 * Reddit engine using public JSON API endpoints (no auth needed, stable).
 * Much more reliable than HTML cheerio scraping.
 */
export class RedditEngine extends BaseScraperEngine {
  platform = Platform.REDDIT;

  private getRandomDelay(): number {
    return 2000 + Math.random() * 2000;
  }

  /**
   * Search Reddit using the public JSON search endpoint.
   * e.g. https://www.reddit.com/search.json?q=need+tool&sort=new&limit=25
   */
  private async searchReddit(query: string, subreddit?: string): Promise<RedditPost[]> {
    const baseUrl = subreddit
      ? `https://www.reddit.com/r/${subreddit}/search.json`
      : 'https://www.reddit.com/search.json';

    const params = new URLSearchParams({
      q: query,
      sort: 'new',
      limit: '25',
      ...(subreddit ? { restrict_sr: 'true' } : {}),
    });

    const url = `${baseUrl}?${params.toString()}`;

    try {
      const response = await httpClient.get(url, {
        headers: {
          // Reddit JSON API requires a proper User-Agent, or it returns 429
          'User-Agent': 'Knivik-LeadFinder/1.0 (Intent detection pipeline; contact@knivik.xyz)',
          'Accept': 'application/json',
        },
      });

      const data = response.data as any;
      const children = data?.data?.children || [];

      return children.map((child: any) => {
        const p = child.data;
        return {
          id: p.id,
          title: p.title || '',
          content: p.selftext || p.title || '',
          url: `https://www.reddit.com${p.permalink}`,
          author: p.author || 'unknown',
          score: p.score || 0,
          subreddit: p.subreddit || 'unknown',
          postedAt: p.created_utc ? new Date(p.created_utc * 1000) : new Date(),
          externalPostId: p.id,
        } as RedditPost;
      }).filter((p: RedditPost) => p.title || p.content);
    } catch (error: any) {
      logger.error(`[REDDIT] JSON API failed for query "${query}" on ${url}: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch new posts from a specific subreddit using JSON API.
   * e.g. https://www.reddit.com/r/startups/new.json
   */
  private async fetchSubredditNew(subreddit: string): Promise<RedditPost[]> {
    const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=25`;

    try {
      const response = await httpClient.get(url, {
        headers: {
          'User-Agent': 'Knivik-LeadFinder/1.0 (Intent detection pipeline; contact@knivik.xyz)',
          'Accept': 'application/json',
        },
      });

      const data = response.data as any;
      const children = data?.data?.children || [];

      return children.map((child: any) => {
        const p = child.data;
        return {
          id: p.id,
          title: p.title || '',
          content: p.selftext || p.title || '',
          url: `https://www.reddit.com${p.permalink}`,
          author: p.author || 'unknown',
          score: p.score || 0,
          subreddit: p.subreddit || subreddit,
          postedAt: p.created_utc ? new Date(p.created_utc * 1000) : new Date(),
          externalPostId: p.id,
        } as RedditPost;
      }).filter((p: RedditPost) => p.title || p.content);
    } catch (error: any) {
      logger.error(`[REDDIT] Failed fetching /r/${subreddit}/new.json: ${error.message}`);
      return [];
    }
  }

  private containsBuyingIntent(text: string): boolean {
    const lowerText = text.toLowerCase();
    return BUYING_SIGNALS.some(signal => lowerText.includes(signal));
  }

  protected async scrapeQuery(
    product: ProductWithDetails,
    query: string,
    limit: number,
    signal?: AbortSignal
  ): Promise<number> {
    let savedCount = 0;

    try {
      // Global search across all of Reddit for the AI-generated query
      const posts = await this.searchReddit(query);

      // Filter posts that contain buying intent
      const matchingPosts = posts.filter(post => {
        if (signal?.aborted) return false;
        const searchText = `${post.title} ${post.content}`.toLowerCase();
        return this.containsBuyingIntent(searchText);
      });

      // Process matching posts
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
          logger.info(`[REDDIT] New lead: ${post.title.substring(0, 60)}...`);
        }
      }

      logger.info(`[REDDIT] ${savedCount} leads found for query: "${query}"`);
    } catch (error: any) {
      logger.error(`[REDDIT] Error scraping query "${query}": ${error.message}`);
    }

    await this.sleep(this.getRandomDelay());
    return savedCount;
  }

  override async fetchRecentPosts(_product: ProductWithDetails, limit: number, _signal?: AbortSignal) {
    try {
      // Pull new posts from multiple high-value subreddits to find implicit leads
      const results = await Promise.all(
        HIGH_VALUE_SUBREDDITS.slice(0, 6).map(s => this.fetchSubredditNew(s))
      );
      const posts = results.flat();

      return posts.slice(0, limit).map(post => ({
        id: post.externalPostId,
        title: post.title,
        content: post.content,
        url: post.url,
        author: post.author,
        postedAt: post.postedAt,
      }));
    } catch (error: any) {
      logger.error(`[REDDIT] Error fetching recent posts: ${error.message}`);
      return [];
    }
  }
}
