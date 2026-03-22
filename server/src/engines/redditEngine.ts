import { Platform, Keyword, ProductSource } from '@prisma/client';
import { BaseScraperEngine, ProductWithDetails } from './baseEngine.js';
import config from '../lib/config.js';
import logger from '../lib/logger.js';

const USER_AGENT = `${config.PROJECT_NAME}/1.0.0 (Node.js Bot; contact: support@${config.PROJECT_NAME.toLowerCase()}.io)`;

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

    // Enforce exact phrase match for multi-word queries to prevent loose/broad matches on Reddit
    const searchQuery = keyword.keyword.includes(' ') && !keyword.keyword.includes('"')
      ? `"${keyword.keyword}"`
      : keyword.keyword;

    // Search both Posts and Comments
    let url = `https://www.reddit.com/search.json?q=${encodeURIComponent(searchQuery)}&sort=new&limit=10&type=link,comment`;
    if (!isGlobal) {
      url = `https://www.reddit.com/r/${source.identifier}/search.json?q=${encodeURIComponent(searchQuery)}&restrict_sr=1&sort=new&limit=10&type=link,comment`;
    }

    try {
      const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: signal as any });
      if (!response.ok) {
        logger.warn(`[REDDIT] API returned ${response.status} for ${url}`);
        return savedCount;
      }

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

      await this.sleep(500);
    } catch (error: any) {
      logger.error(`[REDDIT] Error fetching for keyword: ${keyword.keyword}: ${error.message || error}`);
    }

    return savedCount;
  }

  /**
   * Fetches the latest posts from a subreddit (or global Reddit) for semantic + competitor passes.
   */
  override async fetchRecentPosts(source: ProductSource, limit: number, signal?: AbortSignal) {
    const isGlobal = source.identifier.toLowerCase() === 'global';
    const url = isGlobal
      ? `https://www.reddit.com/new.json?limit=${limit}`
      : `https://www.reddit.com/r/${source.identifier}/new.json?limit=${limit}`;

    try {
      const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: signal as any });
      if (!response.ok) return [];

      const data = (await response.json()) as any;
      const children = data?.data?.children || [];

      return children.map((child: any) => ({
        id: child.data.id,
        title: child.data.title || null,
        content: child.data.selftext || '',
        url: `https://reddit.com${child.data.permalink}`,
        author: child.data.author,
        postedAt: new Date(child.data.created_utc * 1000),
      }));
    } catch {
      return [];
    }
  }
}
