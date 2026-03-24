import { Platform, Keyword, ProductSource } from '@prisma/client';
import { BaseScraperEngine, ProductWithDetails } from './baseEngine.js';
import logger from '../lib/logger.js';

export class ProductHuntEngine extends BaseScraperEngine {
  platform = Platform.PRODUCTHUNT;

  protected async scrapeKeyword(
    product: ProductWithDetails,
    _source: ProductSource, 
    keyword: Keyword,
    limit: number,
    signal?: AbortSignal
  ): Promise<number> {
    let savedCount = 0;

    // We use DuckDuckGo HTML search for public ProductHunt Discussions
    // Dorking: site:producthunt.com/discussions "keyword"
    const dork = `site:producthunt.com/discussions "${keyword.keyword}"`;
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
         logger.warn(`[PRODUCTHUNT] DuckDuckGo SERP returned ${response.status}`);
         return savedCount;
      }

      const html = await response.text();

      // Extract search results
      const resultRegex = /<a class="result__url" href="([^"]+)".*?>.*?<\/a>.*?<a class="result__snippet[^>]*>(.*?)<\/a>/g;
      
      let match;
      while ((match = resultRegex.exec(html)) !== null && savedCount < limit) {
        let link = match[1] || '';
        if (link.startsWith('//duckduckgo.com/l/?uddg=')) {
          link = decodeURIComponent(link.replace('//duckduckgo.com/l/?uddg=', '').split('&')[0] || '');
        }
        
        // Ensure it's a ProductHunt discussion thread
        if (!link.includes('producthunt.com/discussions')) continue;

        let snippet = (match[2] || '').replace(/<[^>]*>/g, '').trim();
        logger.info(`[PRODUCTHUNT] Raw sample: ${snippet.substring(0, 100)}...`);

        const isNew = await this.processPotentialLead(
          product,
          link,
          null, 
          snippet,
          link,
          'producthunt_user',
          new Date()
        );

        if (isNew) savedCount++;
      }

      await this.sleep(2000); 
    } catch (error: any) {
      logger.error(`[PRODUCTHUNT] Error fetching for keyword: ${keyword.keyword}: ${error.message || error}`);
    }

    return savedCount;
  }

  override async fetchRecentPosts(_source: ProductSource, _limit: number, _signal?: AbortSignal) {
    return [];
  }
}
