import { db } from '../db';
import logger from '../logger';
import config from '../config';
import { Platform } from '@prisma/client';
import { CollectedPost } from './batch-analysis';
import { hasCapability } from '../plans';
import { twitterProtection } from './rate-limiter';

// Define ProductWithDetails interface locally
interface ProductWithDetails {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  websiteUrl: string | null;
  isActive: boolean;
  config: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionResult {
  userId: string;
  productsWithPosts: Array<{
    product: ProductWithDetails;
    posts: CollectedPost[];
  }>;
  totalPostsCollected: number;
  collectionTime: number;
}

/**
 * Batch Collection Service - Collects posts from all platforms without AI analysis
 * Focus on gathering high-potential posts using simple filters and keyword matching
 */
export class BatchCollectionService {
  
  /**
   * Collect all potential posts for a user across all active products and platforms
   */
  static async collectUserPosts(userId: string): Promise<CollectionResult> {
    const startTime = Date.now();
    
    // Overall timeout wrapper - max 5 minutes for entire collection
    const timeoutPromise = new Promise<CollectionResult>((_, reject) => {
      setTimeout(() => reject(new Error('Collection timeout')), 5 * 60 * 1000);
    });
    
    const collectionPromise = this._collectUserPostsInternal(userId, startTime);
    
    try {
      return await Promise.race([collectionPromise, timeoutPromise]);
    } catch (error: any) {
      logger.error({ error: error.message, userId }, '[COLLECTION] Timeout or error');
      return {
        userId,
        productsWithPosts: [],
        totalPostsCollected: 0,
        collectionTime: Date.now() - startTime,
      };
    }
  }

  private static async _collectUserPostsInternal(userId: string, startTime: number): Promise<CollectionResult> {
    try {
      // Get all active products with full details
      const activeProducts = await db.client.product.findMany({
        where: {
          userId,
          isActive: true,
        },
      });

      if (activeProducts.length === 0) {
        logger.warn(`[COLLECTION] No active products for user ${userId}`);
        return {
          userId,
          productsWithPosts: [],
          totalPostsCollected: 0,
          collectionTime: Date.now() - startTime,
        };
      }

      const productsWithPosts = [];
      let totalPosts = 0;

      for (const product of activeProducts) {
        const sourceBreakdown: Record<string, number> = {};
        const productPosts = await this.collectProductPosts(product, sourceBreakdown);
        
        if (productPosts.length > 0) {
          productsWithPosts.push({
            product,
            posts: productPosts,
          });
          totalPosts += productPosts.length;
        }
      }

      return {
        userId,
        productsWithPosts,
        totalPostsCollected: totalPosts,
        collectionTime: Date.now() - startTime,
      };

    } catch (error: any) {
      logger.error({ error, userId }, '[COLLECTION] Failed');
      return {
        userId,
        productsWithPosts: [],
        totalPostsCollected: 0,
        collectionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Collect posts for a single product across all its sources
   */
  public static async collectProductPosts(
    product: any,
    sourceBreakdown: Record<string, number> = {}
  ): Promise<CollectedPost[]> {
    const allPosts: CollectedPost[] = [];
    const oneMonthAgo = new Date();
    // Check if this product already has leads (indicates previous scan with results)
    const existingLeadsCount = await db.client.lead.count({
      where: { productId: product.id }
    });

    if (existingLeadsCount === 0) {
      // First scan / new product: scan up to 30 days back to populate the dashboard
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    } else {
      // Routine scan: scan up to 3 days back for fresh leads
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 3);
    }

    const { SearchQueryService } = await import('./search-query-service');
    const searchQueries = await SearchQueryService.getStoredQueries(product.id);

    // Determine which platforms this user can access based on their plan
    const user = await db.client.user.findUnique({ where: { id: product.userId }, select: { plan: true } });
    const canUseTwitter = user ? hasCapability(user.plan as any, 'canAccessTwitter') : false;
    const platforms = canUseTwitter
      ? [Platform.REDDIT, Platform.HACKERNEWS, Platform.TWITTER]
      : [Platform.REDDIT, Platform.HACKERNEWS];

    // Collect from each platform globally
    for (const platform of platforms) {
      try {
        const sourcePosts = await this.collectFromPlatform(product, platform, oneMonthAgo, searchQueries);
        allPosts.push(...sourcePosts);
        
        const sourceKey = `${platform}:global`;
        sourceBreakdown[sourceKey] = (sourceBreakdown[sourceKey] || 0) + sourcePosts.length;
      } catch (error: any) {
        logger.warn({ errorMsg: error.message, stack: error.stack, productId: product.id, platform }, 'Failed to collect from platform');
      }
    }

    // Remove duplicates and apply final filtering
    const uniquePosts = this.deduplicateAndFilter(allPosts, product);
    
    // Filter out already processed posts in scrapeCache for this specific product to protect Groq API costs
    if (uniquePosts.length > 0) {
      try {
        const postKeys = uniquePosts.map(p => p.externalPostId);
        const alreadyScanned = await db.client.scrapeCache.findMany({
          where: {
            productId: product.id,
            externalPostId: { in: postKeys },
          },
          select: {
            externalPostId: true,
            platform: true,
          }
        });

        const scannedMap = new Set(alreadyScanned.map(s => `${s.platform}:${s.externalPostId}`));
        const filteredPosts = uniquePosts.filter(p => !scannedMap.has(`${p.platform}:${p.externalPostId}`));
        
        if (filteredPosts.length < uniquePosts.length) {
          logger.info(
            { productId: product.id, skipped: uniquePosts.length - filteredPosts.length, remaining: filteredPosts.length },
            '[COLLECTION] Skipped already processed/cached posts'
          );
        }
        
        return filteredPosts;
      } catch (err: any) {
        logger.warn({ error: err.message, productId: product.id }, '[COLLECTION] ScrapeCache lookup failed, proceeding with unique posts');
        return uniquePosts;
      }
    }

    return uniquePosts;
  }

  /**
   * Collect posts from a specific platform globally
   */
  private static async collectFromPlatform(
    product: ProductWithDetails,
    platform: Platform,
    oneMonthAgo: Date,
    searchQueries: string[] = []
  ): Promise<CollectedPost[]> {
    const posts: CollectedPost[] = [];

    switch (platform) {
      case Platform.REDDIT:
        const redditPosts = await this.collectFromReddit(product, oneMonthAgo, searchQueries);
        posts.push(...redditPosts);
        break;
      case Platform.HACKERNEWS:
        const hnPosts = await this.collectFromHackerNews(product, oneMonthAgo, searchQueries);
        posts.push(...hnPosts);
        break;
      case Platform.TWITTER:
        const twitterPosts = await this.collectFromTwitter(product, oneMonthAgo, searchQueries);
        posts.push(...twitterPosts);
        break;
      default:
        // Unsupported platform
    }

    return posts;
  }

  /**
   * Collect posts from Reddit using free public search endpoints and edge-cached RSS feeds.
   * No Reddit API credentials or Snoowrap SDK required ($0 cost).
   */
  private static async collectFromReddit(
    product: ProductWithDetails,
    oneMonthAgo: Date,
    searchQueries: string[] = []
  ): Promise<CollectedPost[]> {
    const posts: CollectedPost[] = [];
    const processedIds = new Set<string>();
    
    if (searchQueries.length === 0) {
      logger.warn(`[COLLECTION] No search queries available for Reddit scan of "${product.name}"`);
      return posts;
    }

    const priorityQueries = [...searchQueries]
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.min(5, searchQueries.length));

    for (const query of priorityQueries) {
      try {
        let fetchedQueryPosts = 0;

        // 1. Primary Strategy: Free Public Reddit JSON API
        try {
          const jsonUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=new&limit=25&t=month`;
          const response = await fetch(jsonUrl, {
            headers: {
              'User-Agent': this.getRandomUserAgent(),
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(8000),
          });

          if (response.ok) {
            const data = await response.json();
            const children = data?.data?.children || [];

            for (const child of children) {
              const item = child?.data;
              if (!item || !item.id || processedIds.has(item.id)) continue;

              const permalink = item.permalink || '';
              if (!permalink.includes('/comments/')) continue;

              const postedAt = item.created_utc ? new Date(item.created_utc * 1000) : new Date();
              if (postedAt < oneMonthAgo) continue;

              const author = item.author || 'unknown';
              const title = item.title || '';
              const content = item.selftext || '';
              const combinedText = `${title} ${content}`;

              if (!this.passesBasicFilters(combinedText, author, product)) continue;

              processedIds.add(item.id);
              fetchedQueryPosts++;
              posts.push({
                id: `reddit-${item.id}`,
                platform: 'REDDIT',
                externalPostId: item.id,
                title,
                content,
                url: `https://reddit.com${permalink}`,
                authorUsername: author,
                postedAt,
                source: item.subreddit || 'global',
                detectionMode: 'SEMANTIC',
              });
            }
          }
        } catch (jsonErr: any) {
          logger.debug(`[COLLECTION] [REDDIT] JSON search endpoint failed, trying RSS: ${jsonErr.message}`);
        }

        // 2. Fallback Strategy: Free Public Reddit RSS Feed if JSON produced low results
        if (fetchedQueryPosts < 3) {
          const rssPosts = await this.fetchRedditRss(query, oneMonthAgo, product);
          for (const post of rssPosts) {
            if (!processedIds.has(post.externalPostId)) {
              processedIds.add(post.externalPostId);
              posts.push(post);
              fetchedQueryPosts++;
            }
          }
        }

        // 3. Fallback Strategy: Search Engine SERP Scrape if Reddit blocked direct requests (429/403)
        if (fetchedQueryPosts < 3) {
          const serpPosts = await this.fetchRedditFromYahoo(query, oneMonthAgo, product);
          for (const post of serpPosts) {
            if (!processedIds.has(post.externalPostId)) {
              processedIds.add(post.externalPostId);
              posts.push(post);
            }
          }
        }

        // Polite delay between queries
        await new Promise((resolve) => setTimeout(resolve, 1200));
      } catch (err: any) {
        logger.warn({ errorMsg: err.message, query }, '[COLLECTION] [REDDIT] Query scan failed');
      }
    }

    return posts;
  }

  /**
   * Fallback for Reddit: Search using RSS feeds, which are edge-cached and highly resistant to 429 blocks
   */
  private static async fetchRedditRss(
    query: string,
    oneMonthAgo: Date,
    product: ProductWithDetails
  ): Promise<CollectedPost[]> {
    const posts: CollectedPost[] = [];
    try {
      const url = `https://www.reddit.com/search.rss?q=${encodeURIComponent(query)}&sort=new&limit=15`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'application/xml, application/rss+xml'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) return posts;

      const xml = await response.text();
      const cheerio = await import('cheerio');
      const $ = cheerio.load(xml, { xmlMode: true });

      $('entry').each((_, el) => {
        const title = $(el).find('title').text() || '';
        const link = $(el).find('link').attr('href') || '';
        const contentHtml = $(el).find('content').text() || '';
        const published = $(el).find('published').text();
        const authorRaw = $(el).find('author name').text() || '';

        // Must be a post/comment entry, not subreddit/community/user profile
        if (!link.includes('/comments/')) return;

        const postedAt = published ? new Date(published) : new Date();
        if (postedAt < oneMonthAgo) return;

        // Clean author name (/u/username -> username)
        const author = authorRaw.replace(/^\/u\//, '');

        // Clean HTML from content
        const content = contentHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        const combinedText = `${title} ${content}`;
        
        if (!this.passesBasicFilters(combinedText, author, product)) return;

        // Parse external post ID from link (e.g. comments/xyz/...)
        const match = link.match(/\/comments\/([a-z0-9]+)\//i);
        // Use stable content-based ID when no permalink match — prevents re-ingesting same post every scan
        const externalPostId = match ? match[1]! : Buffer.from(`${title.slice(0, 30)}-${author}`).toString('base64').replace(/[^a-z0-9]/gi, '').slice(0, 12);

        posts.push({
          id: `reddit-${externalPostId}`,
          platform: 'REDDIT',
          externalPostId,
          title,
          content,
          url: link || `https://reddit.com/comments/${externalPostId}`,
          authorUsername: author,
          postedAt,
          source: 'global',
          detectionMode: 'SEMANTIC'
        });
      });
    } catch (err: any) {
      logger.debug(`[COLLECTION] [REDDIT] RSS fallback failed: ${err.message}`);
    }
    return posts;
  }

  /**
   * Third Fallback for Reddit: Search using Yahoo Search SERP indexing (site:reddit.com/r/ ...)
   * Highly resistant to Reddit direct API 429/403 IP rate limit blocks
   */
  private static async fetchRedditFromYahoo(
    query: string,
    oneMonthAgo: Date,
    product: ProductWithDetails
  ): Promise<CollectedPost[]> {
    const posts: CollectedPost[] = [];
    try {
      const cheerio = await import('cheerio');
      const searchUrl = `https://search.yahoo.com/search?p=${encodeURIComponent(`site:reddit.com/r/ ${query}`)}`;
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) return posts;

      const html = await response.text();
      const $ = cheerio.load(html);

      $('.algo').each((_, el) => {
        const rawUrl = $(el).find('a').attr('href') || '';
        let targetUrl = rawUrl;
        const ruMatch = rawUrl.match(/RU=([^/&]+)/);
        if (ruMatch) {
          try { targetUrl = decodeURIComponent(ruMatch[1] ?? ''); } catch { /* ignore */ }
        }

        if (!targetUrl.includes('reddit.com/r/') || !targetUrl.includes('/comments/')) return;

        const rawText = $(el).find('.compTitle + div').text() || $(el).find('.fz-ms').text() || $(el).find('.compText').text() || $(el).text() || '';
        const title = $(el).find('h3').text() || $(el).find('.compTitle').text() || '';
        const combinedText = `${title} ${rawText}`;

        if (!this.passesBasicFilters(combinedText, null, product)) return;

        const match = targetUrl.match(/\/comments\/([a-z0-9]+)\//i);
        const externalPostId = match ? match[1]! : Buffer.from(targetUrl).toString('base64').slice(0, 12);

        posts.push({
          id: `reddit-${externalPostId}`,
          platform: 'REDDIT',
          externalPostId,
          title,
          content: rawText,
          url: targetUrl.split('?')[0] || targetUrl,
          authorUsername: 'reddit_user',
          postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          source: targetUrl.match(/reddit\.com\/r\/([^/]+)/)?.[1] || 'global',
          detectionMode: 'SEMANTIC'
        });
      });
    } catch (err: any) {
      logger.debug(`[COLLECTION] [REDDIT] SERP fallback failed: ${err.message}`);
    }
    return posts;
  }

  /**
   * Collect posts from HackerNews
   * Uses Algolia search API for keyword-based discovery + Firebase for recent stories
   */
  private static async collectFromHackerNews(
    product: ProductWithDetails,
    oneMonthAgo: Date,
    searchQueries: string[] = []
  ): Promise<CollectedPost[]> {
    const posts: CollectedPost[] = [];
    const processedIds = new Set<string>(); // Track processed posts to avoid duplicates

    // Strategy 1: Search via Algolia for keyword-based results
    if (searchQueries.length > 0) {
      // Randomize query selection to use full variety (not always first 3 which are the most generic)
      const shuffledQueries = [...searchQueries].sort(() => Math.random() - 0.5);
      const priorityQueries = shuffledQueries.slice(0, Math.min(4, shuffledQueries.length));
      
      for (const query of priorityQueries) {
        try {
          // Fetch up to 50 results; filter to engagement >= 3 at the API level to skip low-signal posts
          const algoliaUrl = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(query)}&tags=(story,comment)&hitsPerPage=50&numericFilters=points%3E%3D3`;
          
          const response = await fetch(algoliaUrl, { 
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(10000) 
          });
          
          if (!response.ok) {
            logger.warn({ status: response.status, query }, '[COLLECTION] [HACKERNEWS] Algolia query failed');
            continue;
          }

          const data = await response.json() as any;
          const hits = data?.hits || [];

          for (const hit of hits) {
            const storyId = hit.objectID;
            if (processedIds.has(storyId)) continue;
            
            const postedAt = hit.created_at_i ? new Date(hit.created_at_i * 1000) : new Date();
            if (postedAt < oneMonthAgo) continue;

            const title = hit.title || hit.story_title || '';
            let content = hit.story_text || hit.comment_text || '';

            content = content
              .replace(/<[^>]*>/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&#x27;/g, "'")
              .replace(/&#x2F;/g, '/')
              .replace(/\s+/g, ' ')
              .trim();

            const combinedText = `${title} ${content}`;
            if (!this.passesBasicFilters(combinedText, hit.author || null, product)) continue;

            processedIds.add(storyId);
            posts.push({
              id: `hn-${storyId}`,
              platform: 'HACKERNEWS',
              externalPostId: storyId,
              title,
              content,
              url: hit.url || `https://news.ycombinator.com/item?id=${storyId}`,
              authorUsername: hit.author || 'unknown',
              postedAt,
              source: hit._tags?.includes('ask_hn') ? 'ask_hn' : 'global',
              detectionMode: 'SEMANTIC'
            });
          }

          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error: any) {
          logger.warn({ errorMsg: error.message, query }, '[COLLECTION] [HACKERNEWS] Algolia query error');
        }
      }
    }

    // Strategy 2: Dedicated Ask HN query — the richest B2B lead source on HackerNews
    // "Ask HN: What do you use for X?" threads are highest-intent discovery posts on the platform
    try {
      const askHnKeyword = searchQueries[0] ?? product.name;
      const askHnUrl = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(askHnKeyword)}&tags=ask_hn&hitsPerPage=30`;
      const askHnResponse = await fetch(askHnUrl, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000)
      });

      if (askHnResponse.ok) {
        const askHnData = await askHnResponse.json() as any;
        const askHnHits = askHnData?.hits || [];

        for (const hit of askHnHits) {
          const storyId = hit.objectID;
          if (processedIds.has(storyId)) continue;

          const postedAt = hit.created_at_i ? new Date(hit.created_at_i * 1000) : new Date();
          if (postedAt < oneMonthAgo) continue;

          const title = hit.title || '';
          let content = hit.story_text || '';
          content = content
            .replace(/<[^>]*>/g, ' ')
            .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#x2F;/g, '/')
            .replace(/\s+/g, ' ').trim();

          processedIds.add(storyId);
          posts.push({
            id: `hn-${storyId}`,
            platform: 'HACKERNEWS',
            externalPostId: storyId,
            title,
            content,
            url: `https://news.ycombinator.com/item?id=${storyId}`,
            authorUsername: hit.author || 'unknown',
            postedAt,
            source: 'ask_hn',
            detectionMode: 'SEMANTIC'
          });
        }
      }
    } catch (askErr: any) {
      logger.warn({ errorMsg: askErr.message }, '[COLLECTION] [HACKERNEWS] Ask HN query failed');
    }

    return posts;
  }

  /**
   * Basic filtering to remove obvious noise before AI analysis
   */
  private static passesBasicFilters(text: string, author: string | null, product: ProductWithDetails): boolean {
    return this.passesBasicFiltersWithReason(text, author, product).passed;
  }

  /**
   * Detailed filtering with reason for deep logging
   */
  private static passesBasicFiltersWithReason(text: string, author: string | null, product: ProductWithDetails): { passed: boolean; reason?: string } {
    const lower = text.toLowerCase();

    // 1. Excluded authors check (Author Blacklist)
    const config = product.config as any;
    const excludedAuthors: string[] = Array.isArray(config?.excludedAuthors) ? config.excludedAuthors : [];
    if (author && excludedAuthors.length > 0) {
      const lowerAuthor = author.toLowerCase().trim();
      const isExcluded = excludedAuthors.some(ex => {
        if (typeof ex !== 'string') return false;
        let cleaned = ex.toLowerCase().trim();
        if (cleaned.startsWith('u/')) cleaned = cleaned.substring(2);
        if (cleaned.startsWith('@')) cleaned = cleaned.substring(1);
        return lowerAuthor === cleaned;
      });
      if (isExcluded) {
        return { passed: false, reason: `Excluded author: "${author}"` };
      }
    }

    // Bot detection
    const botPatterns = [
      /\b(i am a bot|message performed automatically|action performed automatically|feedback is automated|auto-generated message)\b/i
    ];
    for (const pattern of botPatterns) {
      if (pattern.test(text)) {
        return { passed: false, reason: 'Potential bot signature detected' };
      }
    }

    // Hard rejects - obvious non-buying content + spam/promo
    const baseHardRejects = [
      'show hn', 'tutorial', 'how to', 'guide', 'step by step',
      'breaking news', 'press release',
      'use code', 'sponsored', 'affiliate link', 'discount code',
      'automod', 'this is a bot', 'automatic reply',
      'check out my', 'just launched', 'launched my', 'my new product',
      'our new product', 'proud to share', 'proud to announce', 'project showcase'
    ];

    // For products, we also reject job/hiring posts since they are seeking people, not software tools
    // For services, we want to allow job/hiring posts, but still reject other job seekers and pitching freelancers/agencies
    const productType = product.config?.productType || 'product';
    const hardRejects = productType === 'service'
      ? [
          ...baseHardRejects,
          'looking for a job',
          'hire me',
          'for hire',
          'offering my services',
          'my portfolio',
          'portfolio website',
          'accepting new clients',
          'looking for clients',
          'accepting clients',
          'freelancer looking for',
          'my services',
          'hire us',
          'our agency',
        ]
      : [...baseHardRejects, 'we\'re hiring', 'we are hiring', 'job post', 'looking for a job'];

    for (const reject of hardRejects) {
      if (lower.includes(reject)) {
        return { passed: false, reason: `Hard-reject phrase: "${reject}"` };
      }
    }

    // AI-generated negative keywords from product strategy (free 40% noise reduction)
    const negativeKeywords: string[] = Array.isArray(config?.negativeKeywords) ? config.negativeKeywords : [];
    for (const kw of negativeKeywords) {
      if (typeof kw === 'string' && kw.length > 2 && lower.includes(kw.toLowerCase())) {
        return { passed: false, reason: `Negative keyword: "${kw}"` };
      }
    }

    // Require at least one buying-intent signal word — reject pure informational posts
    const intentSignals = [
      'recommend', 'recommendation', 'alternative', 'replace', 'switch', 'switching',
      'looking for', 'need a', 'need an', 'best ', ' vs ', 'compare', 'comparison',
      'cost', 'pricing', 'price', 'budget', 'migrate', 'migration', 'moving from',
      'frustrated with', 'tired of', 'leaving', 'dropped', 'cancelled', 'canceling',
      'what do you use', 'what are you using', 'anyone using', 'anyone tried',
      'help me choose', 'which is better', 'suggestions', 'thoughts on',
      'looking to switch', 'hate ', 'fed up',
    ];
    const hasIntentSignal = intentSignals.some(signal => lower.includes(signal));
    if (!hasIntentSignal) {
      return { passed: false, reason: 'No buying-intent signal detected' };
    }

    return { passed: true };
  }

  /**
   * Remove duplicates and apply final filtering
   */
  private static deduplicateAndFilter(posts: CollectedPost[], _product: ProductWithDetails): CollectedPost[] {
    const seen = new Set<string>();
    const unique: CollectedPost[] = [];

    for (const post of posts) {
      const key = `${post.platform}-${post.externalPostId}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(post);
      }
    }

    // Sort by potential quality (recent + competitor mentions + keyword matches)
    return unique.sort((a, b) => {
      let scoreA = 0, scoreB = 0;

      // Recent posts get higher score
      if (a.postedAt) scoreA += a.postedAt.getTime() * 0.0001;
      if (b.postedAt) scoreB += b.postedAt.getTime() * 0.0001;

      // Competitor mentions are high value
      if (a.detectionMode === 'COMPETITOR') scoreA += 1000;
      if (b.detectionMode === 'COMPETITOR') scoreB += 1000;

      // Keyword matches are good
      if (a.detectionMode === 'KEYWORD') scoreA += 500;
      if (b.detectionMode === 'KEYWORD') scoreB += 500;

      // HackerNews Ask HN threads are very high priority
      if (a.platform === 'HACKERNEWS' && a.title?.toLowerCase().includes('ask hn')) scoreA += 1000;
      if (b.platform === 'HACKERNEWS' && b.title?.toLowerCase().includes('ask hn')) scoreB += 1000;

      return scoreB - scoreA;
    });
  }

  /**
   * Fallback method using Yahoo Search crawling for Twitter statuses
   */
  private static async fetchFromYahoo(
    query: string,
    oneMonthAgo: Date
  ): Promise<CollectedPost[]> {
    const posts: CollectedPost[] = [];
    try {
      const cheerio = await import('cheerio');
      const searchUrl = `https://search.yahoo.com/search?p=${encodeURIComponent(`site:x.com ${query}`)}`;
      const response = await twitterProtection.safeFetch(searchUrl, {
        'Accept': 'text/html,application/xhtml+xml',
      }, 10000);

      if (!response) return posts;

      const html = await response.text();
      const $ = cheerio.load(html);

      $('.algo').each((_i, el) => {
        const rawUrl = $(el).find('a').attr('href') || '';
        const rawText = $(el).find('.compTitle + div').text() || $(el).find('.fz-ms').text() || $(el).find('.compText').text() || '';

        let url = rawUrl;
        const ruMatch = rawUrl.match(/RU=([^/&]+)/);
        if (ruMatch) {
          try { url = decodeURIComponent(ruMatch[1] ?? ''); } catch { /* ignore */ }
        }

        if (!(url.includes('x.com/') || url.includes('twitter.com/'))) return;
        if (!url.includes('/status/')) return;

        const idMatch = url.match(/\/status\/(\d+)/);
        if (!idMatch) return;
        const tweetId = idMatch[1] ?? '';
        if (!tweetId) return;

        const authorMatch = url.match(/(?:twitter\.com|x\.com)\/([^/]+)/);
        const author = authorMatch?.[1] ?? 'unknown';
        if (author === 'unknown' || author === 'i') return;

        // Extract date from Yahoo snippet BEFORE stripping it (format: "May 21, 2026 · ...")
        const dateMatch = rawText.match(/^((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{1,2},\s\d{4})/i);
        const parsedDate = dateMatch ? new Date(dateMatch[1]!) : null;
        // Use parsed date, or default to 7 days ago as safe pessimistic estimate — NEVER new Date()
        const postedAt = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Enforce lookback window
        if (postedAt < oneMonthAgo) return;

        const content = rawText.replace(/^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d+,\s\d{4}\s[·\-]\s*/i, '').trim();
        if (!content || content.length < 30) return;

        // Skip retweets from Yahoo results too
        if (content.startsWith('RT @') || /^retweeted by/i.test(content)) return;

        posts.push({
          id: `twitter-${tweetId}`,
          platform: 'TWITTER',
          externalPostId: tweetId,
          title: null,
          content,
          url: `https://x.com/${author}/status/${tweetId}`,
          authorUsername: author,
          postedAt,
          source: 'global',
          detectionMode: 'SEMANTIC'
        });
      });
    } catch (err: any) {
      logger.error({ err: err.message }, 'Failed Yahoo Twitter fallback search');
    }
    return posts;
  }

  /**
   * Collect posts from Twitter/X using search queries
   */
  private static async collectFromTwitter(
    product: ProductWithDetails,
    oneMonthAgo: Date,
    searchQueries: string[] = []
  ): Promise<CollectedPost[]> {
    const posts: CollectedPost[] = [];

    if (searchQueries.length === 0) {
      logger.warn(`[COLLECTION] No search queries for Twitter scan of "${product.name}"`);
      return posts;
    }

    const config = product.config as any;
    const competitors = Array.isArray(config?.competitors) ? config.competitors : [];
    const twitterHandles = Array.isArray(config?.twitterHandles) ? config.twitterHandles : [];
    
    // Clean and merge targets
    const competitorTargets = Array.from(new Set([
      ...competitors.map((c: string) => c.toLowerCase().replace(/^@/, '').trim()),
      ...twitterHandles.map((h: string) => h.toLowerCase().replace(/^@/, '').trim())
    ])).filter(t => t.length > 0);

    const finalQueries: string[] = [];

    // 1. Pick 3 random base queries for global search (was 2 — more coverage)
    const globalQueries = [...searchQueries]
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.min(3, searchQueries.length));
    finalQueries.push(...globalQueries);

    // 2. Target ALL known competitors (up to 3) not just one random pick
    // This ensures 100% competitor coverage every scan instead of 20% (1-in-5 random)
    if (competitorTargets.length > 0) {
      const topCompetitors = competitorTargets.slice(0, 3);
      for (const target of topCompetitors) {
        finalQueries.push(`@${target} alternative`);
      }
    } else if (searchQueries.length > 3) {
      // Fallback: pick additional global queries if no competitors are specified
      const unused = searchQueries.filter(q => !globalQueries.includes(q));
      finalQueries.push(...unused.sort(() => Math.random() - 0.5).slice(0, 2));
    }

    for (const query of finalQueries) {
      // Fallback to Yahoo search only
      const queryPosts = await this.fetchFromYahoo(query, oneMonthAgo);

      // Filter query posts
      const filtered = queryPosts.filter(p => this.passesBasicFilters(p.content, p.authorUsername, product));
      posts.push(...filtered);

      // Short delay between query sweeps
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return posts;
  }

  /**
   * Get random user agent for requests
   */
  private static getRandomUserAgent(): string {
    const agents: string[] = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
    ];
    return agents[Math.floor(Math.random() * agents.length)]!;
  }
}
