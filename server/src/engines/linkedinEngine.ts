import { Platform, Keyword, ProductSource } from '@prisma/client';
import { BaseScraperEngine, ProductWithDetails } from './baseEngine.js';
import logger from '../lib/logger.js';

export class LinkedInEngine extends BaseScraperEngine {
  platform = Platform.LINKEDIN;

  protected async scrapeKeyword(
    product: ProductWithDetails,
    _source: ProductSource, // identifier is usually "global" for LinkedIn search
    keyword: Keyword,
    limit: number,
    signal?: AbortSignal
  ): Promise<number> {
    let savedCount = 0;

    // We use DuckDuckGo HTML search for public LinkedIn posts
    // Dorking: site:linkedin.com/posts "keyword"
    const dork = `site:linkedin.com/posts "${keyword.keyword}"`;
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(dork)}`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: signal as any
      });

      if (!response.ok) {
         logger.warn(`[LINKEDIN] DuckDuckGo SERP returned ${response.status}`);
         return savedCount;
      }

      const html = await response.text();

      // Basic regex to pull out Search Results from DDG HTML
      const resultRegex = /<a class="result__url" href="([^"]+)".*?>.*?<\/a>.*?<a class="result__snippet[^>]*>(.*?)<\/a>/g;
      
      let match;
      while ((match = resultRegex.exec(html)) !== null && savedCount < limit) {
        let link = match[1] || '';
        if (link.startsWith('//duckduckgo.com/l/?uddg=')) {
          link = decodeURIComponent(link.replace('//duckduckgo.com/l/?uddg=', '').split('&')[0] || '');
        }
        
        if (!link.includes('linkedin.com/posts')) continue;

        let snippet = (match[2] || '').replace(/<[^>]*>/g, '').trim();

        const isNew = await this.processPotentialLead(
          product,
          link,
          null,
          snippet,
          link,
          'linkedin_user',
          new Date()
        );

        if (isNew) savedCount++;
      }

      await this.sleep(2000);
    } catch (error) {
      logger.error({ error }, `[LINKEDIN] Error fetching for keyword: ${keyword.keyword}`);
    }

    return savedCount;
  }

  override async fetchRecentPosts(_source: ProductSource, _limit: number, _signal?: AbortSignal) {
    return [];
  }
}
