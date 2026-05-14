import { Platform, Keyword, ProductSource } from '@prisma/client';
import { BaseScraperEngine, ProductWithDetails } from './baseEngine.js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from '../lib/logger.js';

// Buying signal patterns
const BUYING_SIGNALS = [
  'looking for', 'recommendation', 'suggest', 'alternative',
  'anyone know', 'what do you use', 'how do you',
  'need a', 'searching for', 'best tool for',
  'can anyone recommend', 'what software', 'looking to buy',
  'want to purchase', 'considering', 'thinking about'
];

interface TwitterPost {
  id: string;
  content: string;
  url: string;
  author: string;
  postedAt: Date;
  externalPostId: string;
}

/**
 * Twitter/X engine using Yahoo Search as a proxy to bypass Twitter's auth wall.
 * This is 100x faster than Playwright and completely free, requiring no keys or tokens.
 */
export class TwitterEngine extends BaseScraperEngine {
  platform = Platform.TWITTER;

  private getRandomDelay(): number {
    return 2000 + Math.random() * 3000;
  }

  private containsBuyingIntent(text: string): boolean {
    const lowerText = text.toLowerCase();
    return BUYING_SIGNALS.some(signal => lowerText.includes(signal));
  }

  private async scrapeYahooSearch(query: string, limit: number): Promise<TwitterPost[]> {
    const posts: TwitterPost[] = [];
    const searchUrl = `https://search.yahoo.com/search?p=${encodeURIComponent(`site:x.com ${query}`)}`;

    try {
      logger.debug(`[TWITTER via YAHOO] Fetching: ${searchUrl}`);
      const res = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(res.data);

      $('.algo').each((_i, el) => {
        if (posts.length >= limit) return false; // Stop if limit reached

        const rawUrl = $(el).find('a').attr('href') || '';
        const content = $(el).find('.compTitle + div').text() || $(el).find('.fz-ms').text() || $(el).find('.compText').text() || '';

        // Extract real URL from Yahoo redirect wrapper
        let url = rawUrl;
        const ruMatch = rawUrl.match(/RU=([^/]+)/);
        if (ruMatch) {
          try {
            url = decodeURIComponent(ruMatch[1]);
          } catch {
            // ignore
          }
        }

        if ((url.includes('twitter.com/') || url.includes('x.com/')) && url.includes('/status/')) {
          const idMatch = url.match(/\/status\/(\d+)/);
          const tweetId = idMatch ? idMatch[1] : `tw_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
          
          const authorMatch = url.match(/(?:twitter\.com|x\.com)\/([^/]+)/);
          const author = authorMatch ? authorMatch[1] : 'unknown';

          // Basic cleanup to remove date prefix if exists (e.g. "May 3, 2026 · ")
          const cleanContent = content.replace(/^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d+,\s\d{4}\s·\s*/i, '').trim();

          posts.push({
            id: tweetId,
            content: cleanContent,
            url,
            author,
            postedAt: new Date(),
            externalPostId: tweetId,
          });
        }
      });

      logger.debug(`[TWITTER via YAHOO] Scraped ${posts.length} tweets for query "${query}"`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`[TWITTER via YAHOO] Search failed: ${message}`);
    }

    return posts;
  }

  async closeBrowser(): Promise<void> {
    // No-op since we dropped Playwright
    return Promise.resolve();
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
      // Create a search query targeting buying intent
      const intentQuery = `"${keyword.keyword}" ("${BUYING_SIGNALS.slice(0, 4).join('" OR "')}")`;
      const posts = await this.scrapeYahooSearch(intentQuery, limit);

      const matchingPosts = posts.filter(post => {
        if (signal?.aborted) return false;
        return this.containsBuyingIntent(post.content);
      });

      for (const post of matchingPosts) {
        if (signal?.aborted) break;

        const isNew = await this.processPotentialLead(
          product,
          post.externalPostId,
          null,
          post.content,
          post.url,
          post.author,
          post.postedAt
        );

        if (isNew) {
          savedCount++;
          logger.info(`[TWITTER] New lead: ${post.content.substring(0, 60)}...`);
        }
      }

      logger.info(`[TWITTER] ${savedCount} leads for keyword: "${keyword.keyword}"`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`[TWITTER] Error scraping keyword "${keyword.keyword}": ${message}`);
    }

    await this.sleep(this.getRandomDelay());
    return savedCount;
  }

  override async fetchRecentPosts(source: ProductSource, limit: number, _signal?: AbortSignal): Promise<Array<{ id: string; title: string | null; content: string; url: string; author?: string; postedAt?: Date }>> {
    const searchQuery = (source.identifier.toLowerCase() === 'global' || !source.identifier)
      ? 'saas OR "software tool" OR recommendation'
      : source.identifier;

    try {
      const posts = await this.scrapeYahooSearch(searchQuery, limit);

      return posts.map(post => ({
        id: post.externalPostId,
        title: null,
        content: post.content,
        url: post.url,
        author: post.author,
        postedAt: post.postedAt,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`[TWITTER] Error fetching recent posts: ${message}`);
      return [];
    }
  }
}
