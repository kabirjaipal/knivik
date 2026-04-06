import { Platform, Keyword, ProductSource } from '@prisma/client';
import { BaseScraperEngine, ProductWithDetails } from './baseEngine.js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as UserAgent from 'user-agents';
import logger from '../lib/logger.js';

// Nitter instances (privacy-focused Twitter front-ends) - 2026 working list
const NITTER_INSTANCES = [
  'nitter.net',
  'nitter.cz', 
  'nitter.privacydev.net',
  'nitter.sethforprivacy.com',
  'nitter.ktachibana.party',
  'nitter.unixfox.eu',
  'nitter.exonip.de',
  'nitter.dcs0.hu'
];

// Buying signal patterns
const BUYING_SIGNALS = [
  'looking for', 'recommendation', 'suggestion', 'alternative',
  'anyone know', 'what do you use', 'how do you',
  'need a', 'searching for', 'best tool for', 'suggestions for',
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

export class TwitterEngine extends BaseScraperEngine {
  platform = Platform.TWITTER;

  private getRandomDelay(): number {
    // Random delay between 3-6 seconds for Twitter
    return 3000 + Math.random() * 3000;
  }

  override getRandomUserAgent(): string {
    return (UserAgent as any).random();
  }

  private getRandomNitterInstance(): string {
    const shuffled = [...NITTER_INSTANCES].sort(() => Math.random() - 0.5);
    return shuffled[0] || 'nitter.net';
  }

  private async scrapeNitterSearch(query: string, limit: number): Promise<TwitterPost[]> {
    const instance = this.getRandomNitterInstance();
    const url = `https://${instance}/search?f=tweets&q=${encodeURIComponent(query)}&lang=en`;

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive'
        },
        timeout: 20000
      });

      const $ = cheerio.load(response.data);
      const posts: TwitterPost[] = [];

      // Nitter's tweet structure
      $('.timeline-item').each((index, element) => {
        if (posts.length >= limit) return false;

        try {
          const tweetEl = $(element);
          
          // Skip retweets
          if (tweetEl.find('.retweet-header').length > 0) return true;
          
          // Extract content
          const contentEl = tweetEl.find('.tweet-content');
          const content = contentEl.text().trim();
          
          if (!content) return true;
          
          // Extract author
          const authorEl = tweetEl.find('.username');
          const author = authorEl.text().trim().replace('@', '') || 'unknown';
          
          // Extract tweet URL
          const linkEl = tweetEl.find('.tweet-link a');
          const tweetUrl = linkEl.attr('href') || '';
          const fullUrl = tweetUrl ? `https://twitter.com${tweetUrl}` : `https://twitter.com/unknown`;
          
          // Extract tweet ID from URL
          const idMatch = tweetUrl.match(/\/status\/(\d+)/);
          const tweetId = idMatch ? idMatch[1] : `tw_${Date.now()}_${index}`;
          
          // Extract timestamp
          const postedAt = new Date(); // Nitter doesn't always provide exact dates
          
          if (content && tweetId) {
            posts.push({
              id: tweetId,
              content,
              url: fullUrl,
              author,
              postedAt,
              externalPostId: tweetId
            });
          }
        } catch (error) {
          // Skip malformed tweets
          return true;
        }
        
        return true;
      });

      return posts;
    } catch (error: any) {
      logger.error(`[TWITTER] Nitter instance ${instance} failed: ${error.message}`);
      return [];
    }
  }

  private containsBuyingIntent(text: string): boolean {
    const lowerText = text.toLowerCase();
    return BUYING_SIGNALS.some(signal => lowerText.includes(signal));
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
      // Build search query with buying intent signals
      const searchQuery = `${keyword.keyword} (${BUYING_SIGNALS.slice(0, 3).join(' OR ')})`;
      
      const posts = await this.scrapeNitterSearch(searchQuery, limit);
      
      // Filter posts with strong buying intent
      const matchingPosts = posts.filter(post => {
        if (signal?.aborted) return false;
        return this.containsBuyingIntent(post.content);
      });

      // Process matching posts
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
          logger.info(`[TWITTER] Found lead: ${post.content.substring(0, 50)}...`);
        }
      }

      logger.info(`[TWITTER] Processed ${savedCount} leads for keyword: ${keyword.keyword}`);
    } catch (error: any) {
      logger.error(`[TWITTER] Error scraping keyword ${keyword.keyword}: ${error.message}`);
    }

    // Polite delay before next request
    await this.sleep(this.getRandomDelay());
    return savedCount;
  }

  override async fetchRecentPosts(source: ProductSource, limit: number, _signal?: AbortSignal) {
    const isGlobal = source.identifier.toLowerCase() === 'global' || !source.identifier;
    const searchQuery = isGlobal ? 'saas OR software OR tool' : source.identifier;

    try {
      const posts = await this.scrapeNitterSearch(searchQuery, limit);
      
      return posts.map(post => ({
        id: post.externalPostId,
        title: null,
        content: post.content,
        url: post.url,
        author: post.author,
        postedAt: post.postedAt
      }));
    } catch (error: any) {
      logger.error(`[TWITTER] Error fetching recent posts: ${error.message}`);
      return [];
    }
  }
}
