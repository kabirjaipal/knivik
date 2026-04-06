import { Platform, Keyword, ProductSource } from '@prisma/client';
import { BaseScraperEngine, ProductWithDetails } from './baseEngine.js';
import { hackerNewsProtection } from '../utils/ipProtection.js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as UserAgent from 'user-agents';
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

interface HNPost {
  id: string;
  title: string;
  url: string;
  content: string;
  author: string;
  postedAt: Date;
  externalPostId: string;
  score?: number;
}

/**
 * Enhanced HackerNews engine with IP protection and rate limiting
 */
export class HackerNewsEngine extends BaseScraperEngine {
  platform = Platform.HACKERNEWS;

  override getRandomUserAgent(): string {
    return (UserAgent as any).random();
  }

  private async scrapeHNWithCheerio(): Promise<HNPost[]> {
    try {
      const response = await axios.get('https://news.ycombinator.com', {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      const posts: HNPost[] = [];

      $('.athing').each((index, element) => {
        const storyEl = $(element);
        const titleEl = storyEl.find('.titleline a');
        const title = titleEl.text().trim();
        const url = titleEl.attr('href') || '';
        const scoreEl = $(`#score_${storyEl.attr('id')}`);
        const scoreText = scoreEl.text().trim();
        const score = parseInt(scoreText) || 0;

        if (title && url) {
          posts.push({
            id: storyEl.attr('id') || `hn_${index}`,
            title,
            url,
            content: title, // HN doesn't have content, use title
            author: 'unknown',
            postedAt: new Date(),
            externalPostId: storyEl.attr('id') || `hn_${index}`,
            score
          });
        }
      });

      return posts;
    } catch (error: any) {
      logger.error(`[HACKERNEWS] Cheerio backup failed: ${error.message}`);
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
      // Try Algolia API first (primary method)
      const url = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(keyword.keyword)}&tags=(story,comment)&hitsPerPage=25`;

      const response = await hackerNewsProtection.safeFetch(url);
      if (!response) {
        // Fallback to Cheerio scraping
        logger.warn('[HACKERNEWS] Algolia API failed, trying Cheerio backup');
        const posts = await this.scrapeHNWithCheerio();
        return this.processHNPosts(posts, product, keyword, limit, signal, savedCount);
      }

      const data = (await response.json()) as any;
      const hits = data?.hits;
      if (!hits || !Array.isArray(hits)) return savedCount;

      const posts: HNPost[] = hits.map((hit: any) => ({
        id: hit.objectID || `hn_${Date.now()}_${Math.random()}`,
        title: hit.title || hit.story_text?.substring(0, 100) || 'No title',
        url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
        content: hit.story_text || hit.title || '',
        author: hit.author || 'unknown',
        postedAt: new Date(hit.created_at_i * 1000) || new Date(),
        externalPostId: hit.objectID,
        score: hit.points || 0
      }));

      return this.processHNPosts(posts, product, keyword, limit, signal, savedCount);
    } catch (error: any) {
      logger.error(`[HACKERNEWS] Error with Algolia API, trying Cheerio: ${error.message}`);
      
      // Fallback to Cheerio scraping
      const posts = await this.scrapeHNWithCheerio();
      return this.processHNPosts(posts, product, keyword, limit, signal, savedCount);
    }
  }

  private async processHNPosts(
    posts: HNPost[],
    product: ProductWithDetails,
    keyword: Keyword,
    limit: number,
    signal?: AbortSignal,
    savedCount: number = 0
  ): Promise<number> {
    let count = savedCount;

    // Filter posts that contain the keyword and have buying intent
    const matchingPosts = posts.filter(post => {
      if (signal?.aborted) return false;
      
      const searchText = `${post.title} ${post.content}`.toLowerCase();
      const hasKeyword = keyword.keyword.toLowerCase().split(' ').every(word => 
        searchText.includes(word.toLowerCase())
      );
      const hasBuyingIntent = this.containsBuyingIntent(searchText);
      const isBusiness = this.isBusinessRelevant(searchText);
      
      return hasKeyword && (hasBuyingIntent || isBusiness);
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
        count++;
        logger.info(`[HACKERNEWS] Found lead: ${post.title.substring(0, 50)}...`);
      }
    }

    logger.info(`[HACKERNEWS] Processed ${count} leads for keyword: ${keyword.keyword}`);
    return count;
  }

  override async fetchRecentPosts(source: ProductSource, limit: number, _signal?: AbortSignal) {
    const isGlobal = source.identifier.toLowerCase() === 'global' || !source.identifier;

    try {
      if (isGlobal) {
        // Try Algolia API first
        const url = `https://hn.algolia.com/api/v1/search_by_date?tags=story&hitsPerPage=${limit}`;
        const response = await hackerNewsProtection.safeFetch(url);
        
        if (response) {
          const data = (await response.json()) as any;
          const hits = data?.hits || [];
          
          return hits.slice(0, limit).map((hit: any) => ({
            id: hit.objectID,
            title: hit.title || 'No title',
            content: hit.story_text || hit.title || '',
            url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
            author: hit.author || 'unknown',
            postedAt: new Date(hit.created_at_i * 1000) || new Date()
          }));
        }
      }

      // Fallback to Cheerio scraping
      const posts = await this.scrapeHNWithCheerio();
      return posts.slice(0, limit).map(post => ({
        id: post.externalPostId,
        title: post.title,
        content: post.content,
        url: post.url,
        author: post.author,
        postedAt: post.postedAt
      }));
    } catch (error: any) {
      logger.error(`[HACKERNEWS] Error fetching recent posts: ${error.message}`);
      return [];
    }
  }
}
