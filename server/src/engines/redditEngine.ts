import { Platform, Keyword, ProductSource } from '@prisma/client';
import { BaseScraperEngine, ProductWithDetails } from './baseEngine.js';
import logger from '../lib/logger.js';

const USER_AGENT = 'IntentRadar/1.0.0 (Node.js Bot; contact: me@intentradar.io)';

export class RedditEngine extends BaseScraperEngine {
  platform = Platform.REDDIT;

  protected async scrapeKeyword(
    product: ProductWithDetails,
    source: ProductSource,
    keyword: Keyword,
    limit: number
  ): Promise<number> {
    let savedCount = 0;
    const isGlobal = source.identifier.toLowerCase() === 'global';
    // Search both Posts and Comments (Much smarter)
    let url = `https://www.reddit.com/search.json?q=${encodeURIComponent(keyword.keyword)}&sort=new&limit=10&type=link,comment`;
    
    if (!isGlobal) {
      url = `https://www.reddit.com/r/${source.identifier}/search.json?q=${encodeURIComponent(keyword.keyword)}&restrict_sr=1&sort=new&limit=10&type=link,comment`;
    }

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
        },
      });

      if (!response.ok) {
        logger.warn(`Reddit API returned ${response.status} for URL: ${url}`);
        return savedCount;
      }

      const data = (await response.json()) as any;
      const children = data?.data?.children;

      if (!children || !Array.isArray(children)) {
        return savedCount;
      }

      for (const child of children) {
        if (savedCount >= limit) break;

        const postData = child.data;
        if (!postData || !postData.id) continue;

        // Is it a comment or a post? 
        // Comments have 'body' instead of 'selftext' and often don't have a 'title'
        const title = postData.title || (postData.link_title ? `Comment on: ${postData.link_title}` : '');
        const content = postData.body || postData.selftext || '';
        const link = postData.permalink ? `https://reddit.com${postData.permalink}` : `https://reddit.com${postData.context}`;

        const isNew = await this.processPotentialLead(
          product,
          postData.id,
          title,
          content,
          link,
          postData.author,
          new Date(postData.created_utc * 1000)
        );

        if (isNew) {
          savedCount++;
        }
      }
      
      // Small sleep between keywords to be nice
      await this.sleep(500);
      
    } catch (error) {
      logger.error({ error }, `Error fetching Reddit data for ${keyword.keyword}`);
    }
    
    return savedCount;
  }
}
