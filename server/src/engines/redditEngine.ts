import { Platform, Keyword, ProductSource } from '@prisma/client';
import { BaseScraperEngine, ProductWithDetails } from './baseEngine.js';
import httpClient from '../lib/httpClient.js';
import * as cheerio from 'cheerio';
import * as UserAgent from 'user-agents';
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

export class RedditEngine extends BaseScraperEngine {
  platform = Platform.REDDIT;

  private getRandomDelay(): number {
    // Random delay between 2-4 seconds to mimic human behavior
    return 2000 + Math.random() * 2000;
  }

  override getRandomUserAgent(): string {
    return (UserAgent as any).random();
  }

  private async scrapeRedditPage(url: string): Promise<RedditPost[]> {
    try {
      const response = await httpClient.get(url, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });

      const $ = cheerio.load(response.data);
      const posts: RedditPost[] = [];

      // Reddit's current post structure (2026)
      $('div[data-testid="post-container"], shreddit-post, .Post').each((index, element) => {
        if (posts.length >= 25) return false; 

        try {
          const postEl = $(element);
          
          // TITLE FALLBACKS
          const titleEl = postEl.find('h3[data-testid="post-content-title"] a, h3 a, a[slot="title"], .title');
          const title = titleEl.first().text().trim() || postEl.attr('post-title') || '';
          
          // URL FALLBACKS
          let postUrl = titleEl.attr('href') || postEl.attr('permalink') || '';
          if (!postUrl && postEl.find('a').length > 0) {
            postUrl = postEl.find('a').first().attr('href') || '';
          }
          
          // Full URL if relative
          const fullUrl = postUrl && !postUrl.startsWith('http') ? `https://www.reddit.com${postUrl}` : postUrl;
          
          // POST ID FALLBACKS
          const postIdMatch = postUrl.match(/\/comments\/([a-z0-9]+)\//);
          const postId = postIdMatch ? postIdMatch[1] : (postEl.attr('id') || postEl.attr('data-post-id') || `post_${index}`);
          const finalPostId = postId?.replace('t3_', '') || `post_${index}`;
          
          // CONTENT FALLBACKS
          const contentEl = postEl.find('div[data-testid="post-content"] p, div p, slot[name="text-body"] p, .post-text');
          const content = contentEl.first().text().trim() || title;
          
          // AUTHOR FALLBACKS
          const authorEl = postEl.find('a[data-testid="post-author-link"], [slot="authorName"], .author');
          const author = authorEl.first().text().trim() || postEl.attr('author') || 'unknown';
          
          // SCORE FALLBACKS
          const scoreEl = postEl.find('div[data-testid="post-vote-score"], [slot="score"], .score');
          const scoreText = scoreEl.first().text().trim() || postEl.attr('score') || '0';
          const score = parseInt(scoreText.replace(/[^0-9]/g, '')) || 0;
          
          // SUBREDDIT FALLBACKS
          const subredditEl = postEl.find('a[data-testid="subreddit-name"], [slot="subredditName"], .subreddit');
          const subreddit = subredditEl.first().text().trim() || postEl.attr('subreddit-prefixed') || 'unknown';
          
          const postedAt = new Date();
          
          if ((title || content) && fullUrl) {
            posts.push({
              id: finalPostId,
              title,
              content,
              url: fullUrl,
              author,
              score,
              subreddit,
              postedAt,
              externalPostId: finalPostId
            });
          }
        } catch (error) {
          return true;
        }
        
        return true;
      });

      return posts;
    } catch (error: any) {
      logger.error(`[REDDIT] Error scraping page ${url}: ${error.message}`);
      return [];
    }
  }

  private containsBuyingIntent(text: string): boolean {
    const lowerText = text.toLowerCase();
    return BUYING_SIGNALS.some(signal => lowerText.includes(signal));
  }

  protected async scrapeKeyword(
    product: ProductWithDetails,
    source: ProductSource,
    keyword: Keyword,
    limit: number,
    signal?: AbortSignal
  ): Promise<number> {
    let savedCount = 0;
    const isGlobal = source.identifier.toLowerCase() === 'global';

    try {
      let posts: RedditPost[] = [];

      if (isGlobal) {
        // Search across multiple high-value subreddits
        const searchPromises = HIGH_VALUE_SUBREDDITS.slice(0, 5).map(async (subreddit) => {
          const url = `https://www.reddit.com/r/${subreddit}/new/`;
          return this.scrapeRedditPage(url);
        });
        
        const results = await Promise.all(searchPromises);
        posts = results.flat();
      } else {
        // Scrape specific subreddit
        const subreddit = source.identifier.startsWith('r/') ? source.identifier.substring(2) : source.identifier;
        const url = `https://www.reddit.com/r/${subreddit}/new/`;
        posts = await this.scrapeRedditPage(url);
      }

      // Filter posts that contain the keyword and buying intent
      const matchingPosts = posts.filter(post => {
        if (signal?.aborted) return false;
        
        const searchText = `${post.title} ${post.content}`.toLowerCase();
        const hasKeyword = keyword.keyword.toLowerCase().split(' ').every(word => 
          searchText.includes(word.toLowerCase())
        );
        const hasBuyingIntent = this.containsBuyingIntent(searchText);
        
        return hasKeyword && hasBuyingIntent;
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
          logger.info(`[REDDIT] Found lead: ${post.title.substring(0, 50)}...`);
        }
      }

      logger.info(`[REDDIT] Processed ${savedCount} leads for keyword: ${keyword.keyword}`);
    } catch (error: any) {
      logger.error(`[REDDIT] Error scraping keyword ${keyword.keyword}: ${error.message}`);
    }

    // Polite delay before next request
    await this.sleep(this.getRandomDelay());
    return savedCount;
  }

  override async fetchRecentPosts(source: ProductSource, limit: number, _signal?: AbortSignal) {
    const isGlobal = source.identifier.toLowerCase() === 'global' || !source.identifier;
    
    try {
      if (isGlobal) {
        // Get recent posts from high-value subreddits
        const url = `https://www.reddit.com/r/startups/new/`;
        const posts = await this.scrapeRedditPage(url);
        
        return posts.slice(0, limit).map(post => ({
          id: post.externalPostId,
          title: post.title,
          content: post.content,
          url: post.url,
          author: post.author,
          postedAt: post.postedAt
        }));
      } else {
        const subreddit = source.identifier.startsWith('r/') ? source.identifier.substring(2) : source.identifier;
        const url = `https://www.reddit.com/r/${subreddit}/new/`;
        const posts = await this.scrapeRedditPage(url);
        
        return posts.slice(0, limit).map(post => ({
          id: post.externalPostId,
          title: post.title,
          content: post.content,
          url: post.url,
          author: post.author,
          postedAt: post.postedAt
        }));
      }
    } catch (error: any) {
      logger.error(`[REDDIT] Error fetching recent posts: ${error.message}`);
      return [];
    }
  }
}
