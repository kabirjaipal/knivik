import { Platform, Keyword, ProductSource } from '@prisma/client';
import { BaseScraperEngine, ProductWithDetails } from './baseEngine.js';
import logger from '../lib/logger.js';

// Nitter is a privacy-oriented Twitter front-end. It allows scanning public tweets without an API key.
// In a production MVP, rotating these is needed or using a dedicated proxy.
const NITTER_HOSTS = [
  'nitter.net',
  'nitter.cz',
  'nitter.privacydev.net',
  'nitter.sethforprivacy.com'
];

export class TwitterEngine extends BaseScraperEngine {
  platform = Platform.TWITTER;



  protected async scrapeKeyword(
    product: ProductWithDetails,
    _source: ProductSource,
    keyword: Keyword,
    limit: number,
    signal?: AbortSignal
  ): Promise<number> {
    let savedCount = 0;
    const shuffledHosts = [...NITTER_HOSTS].sort(() => Math.random() - 0.5);

    for (const host of shuffledHosts) {
      if (savedCount >= limit) break;
      const url = `https://${host}/search/rss?f=tweets&q=${encodeURIComponent(keyword.keyword)}`;

      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': this.getRandomUserAgent() },
          signal: signal as any
        });

        if (!response.ok) {
          logger.warn(`[TWITTER] RSS Gateway returned ${response.status} from ${host}. Retrying with next host...`);
          continue; 
        }

        const xml = await response.text();
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        
        while ((match = itemRegex.exec(xml)) !== null && savedCount < limit) {
          const itemXml = match[1] || '';
          const titleMatch = /<title>([\s\S]*?)<\/title>/.exec(itemXml);
          const descMatch = /<description>([\s\S]*?)<\/description>/.exec(itemXml);
          const linkMatch = /<link>([\s\S]*?)<\/link>/.exec(itemXml);
          const creatorMatch = /<dc:creator>([\s\S]*?)<\/dc:creator>/.exec(itemXml);
          const dateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(itemXml);
          
          let link = (linkMatch && linkMatch[1]) ? linkMatch[1] : '';
          link = link.replace(`https://${host}`, 'https://twitter.com');
          
          const titleText = (titleMatch && titleMatch[1]) ? titleMatch[1] : '';
          if (titleText.startsWith('RT by')) continue;

          let content = (descMatch && descMatch[1]) ? descMatch[1].replace(/<[^>]*>/g, '').trim() : '';
          const author = (creatorMatch && creatorMatch[1]) ? creatorMatch[1].replace('@', '') : 'anonymous';
          const dateStr = (dateMatch && dateMatch[1]) ? dateMatch[1] : null;
          
          const tweetIdMatch = /\/status\/(\d+)/.exec(link);
          const tweetId = (tweetIdMatch && tweetIdMatch[1]) ? tweetIdMatch[1] : `tw_${Date.now()}_${Math.random()}`;

          if (!content) continue;

          const isNew = await this.processPotentialLead(
            product,
            tweetId,
            null,
            content,
            link,
            author,
            dateStr ? new Date(dateStr) : new Date()
          );
          
          if (isNew) savedCount++;
        }

        break; // Success with current host, exit host loop
      } catch (error: any) {
        logger.warn(`[TWITTER] Failed to fetch from ${host}: ${error.message || error}. Retrying...`);
      }
    }

    await this.sleep(1500);
    return savedCount;
  }

  override async fetchRecentPosts(source: ProductSource, limit: number, signal?: AbortSignal) {
    const isGlobal = source.identifier.toLowerCase() === 'global' || !source.identifier;
    const searchParam = isGlobal ? 'saas problem' : source.identifier;
    const shuffledHosts = [...NITTER_HOSTS].sort(() => Math.random() - 0.5);

    for (const host of shuffledHosts) {
      const url = `https://${host}/search/rss?f=tweets&q=${encodeURIComponent(searchParam)}`;

      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': this.getRandomUserAgent() },
          signal: signal as any
        });
        if (!response.ok) continue;

        const xml = await response.text();
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        const posts = [];
        let match;
        
        while ((match = itemRegex.exec(xml)) !== null && posts.length < limit) {
          const itemXml = match[1] || '';
          const descMatch = /<description>([\s\S]*?)<\/description>/.exec(itemXml);
          const linkMatch = /<link>([\s\S]*?)<\/link>/.exec(itemXml);
          const creatorMatch = /<dc:creator>([\s\S]*?)<\/dc:creator>/.exec(itemXml);
          const dateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(itemXml);
          
          let link = (linkMatch && linkMatch[1]) ? linkMatch[1] : '';
          link = link.replace(`https://${host}`, 'https://twitter.com');
          const content = (descMatch && descMatch[1]) ? descMatch[1].replace(/<[^>]*>/g, '').trim() : '';
          const author = (creatorMatch && creatorMatch[1]) ? creatorMatch[1].replace('@', '') : 'anonymous';
          const tweetIdMatch = /\/status\/(\d+)/.exec(link);
          const tweetId = (tweetIdMatch && tweetIdMatch[1]) ? tweetIdMatch[1] : `tw_${Date.now()}`;
          const dateStr = (dateMatch && dateMatch[1]) ? dateMatch[1] : null;

          if (content) {
            posts.push({
              id: tweetId,
              title: null,
              content: content,
              url: link,
              author: author,
              postedAt: dateStr ? new Date(dateStr) : new Date(),
            });
          }
        }

        return posts; // Return results once a host succeeds
      } catch {
        continue;
      }
    }
    return [];
  }
}
