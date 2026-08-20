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

    // Collect from each platform in parallel for maximum throughput
    const platformResults = await Promise.allSettled(
      platforms.map(async (platform) => {
        const sourcePosts = await this.collectFromPlatform(product, platform, oneMonthAgo, searchQueries);
        return { platform, posts: sourcePosts };
      })
    );

    for (const res of platformResults) {
      if (res.status === 'fulfilled') {
        const { platform, posts: sourcePosts } = res.value;
        allPosts.push(...sourcePosts);
        const sourceKey = `${platform}:global`;
        sourceBreakdown[sourceKey] = (sourceBreakdown[sourceKey] || 0) + sourcePosts.length;
      } else {
        logger.warn({ errorMsg: res.reason?.message, stack: res.reason?.stack, productId: product.id }, 'Failed to collect from platform');
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
        return await this.collectFromReddit(product, oneMonthAgo, searchQueries);
      case Platform.HACKERNEWS:
        return await this.collectFromHackerNews(product, oneMonthAgo, searchQueries);
      case Platform.TWITTER:
        return await this.collectFromTwitter(product, oneMonthAgo, searchQueries);
      default:
        return posts;
    }
  }

  /**
   * Collect posts from Reddit using free public search endpoints and edge-cached RSS feeds.
   * Hardened with micro-staggering (120ms jitter to prevent 429s), compound query expansion, and adaptive fallbacks.
   */
  private static async collectFromReddit(
    product: ProductWithDetails,
    oneMonthAgo: Date,
    searchQueries: string[] = []
  ): Promise<CollectedPost[]> {
    if (searchQueries.length === 0) {
      logger.warn(`[COLLECTION] No search queries available for Reddit scan of "${product.name}"`);
      return [];
    }

    // Build high-coverage query list from available search queries
    const distinctQueries = [...new Set(searchQueries)].sort(() => 0.5 - Math.random());
    const compoundQueries: string[] = [];
    
    for (let i = 0; i < distinctQueries.length && compoundQueries.length < 3; i += 2) {
      if (i + 1 < distinctQueries.length) {
        // Group pairs using OR without parentheses for Reddit search engine compatibility
        compoundQueries.push(`${distinctQueries[i]} OR ${distinctQueries[i + 1]}`);
      } else {
        compoundQueries.push(distinctQueries[i]!);
      }
    }

    const queryTasks = compoundQueries.map(async (query, idx) => {
      // Micro-stagger (120ms) between concurrent queries to prevent burst-pattern 429 IP flags
      if (idx > 0) {
        await new Promise((resolve) => setTimeout(resolve, idx * 120));
      }

      const queryPosts: CollectedPost[] = [];
      let jsonSucceeded = false;

      // 1. Primary Strategy: Free Public Reddit JSON API (with old.reddit fallback and compliant headers)
      try {
        const jsonUrls = [
          `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=new&limit=25&t=month`,
          `https://old.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=new&limit=25&t=month`
        ];

        let response: Response | null = null;
        for (const jsonUrl of jsonUrls) {
          try {
            const res = await fetch(jsonUrl, {
              headers: {
                'User-Agent': this.getRedditUserAgent(),
                'Accept': 'application/json',
              },
              signal: AbortSignal.timeout(3500),
            });
            if (res.ok) {
              response = res;
              break;
            }
          } catch (_) {}
        }

        if (response && response.ok) {
          const data = await response.json();
          const children = data?.data?.children || [];

          for (const child of children) {
            const item = child?.data;
            if (!item || !item.id) continue;

            const permalink = item.permalink || '';
            if (!permalink.includes('/comments/')) continue;

            const postedAt = item.created_utc ? new Date(item.created_utc * 1000) : new Date();
            if (postedAt < oneMonthAgo) continue;

            const author = item.author || 'unknown';
            const title = item.title || '';
            const content = item.selftext || '';
            const combinedText = `${title} ${content}`;

            if (!this.passesBasicFilters(combinedText, author, product)) continue;

            queryPosts.push({
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
          jsonSucceeded = true;
        } else {
          logger.debug({ query }, '[COLLECTION] [REDDIT] JSON search unready or throttled, switching to RSS fallback immediately');
        }
      } catch (jsonErr: any) {
        logger.debug(`[COLLECTION] [REDDIT] JSON search failed for "${query}", switching to RSS: ${jsonErr.message}`);
      }

      // 2. Adaptive Fallback: Edge-cached RSS Feed if JSON failed, was rate-limited, or yielded 0 leads
      if (!jsonSucceeded || queryPosts.length === 0) {
        // Strip nested parentheses if querying RSS for cleaner XML parsing
        const cleanQuery = query.replace(/[()]/g, '');
        const rssPosts = await this.fetchRedditRss(cleanQuery, oneMonthAgo, product);
        queryPosts.push(...rssPosts);
      }

      return queryPosts;
    });

    const results = await Promise.allSettled(queryTasks);
    const posts: CollectedPost[] = [];
    const processedIds = new Set<string>();

    for (const res of results) {
      if (res.status === 'fulfilled') {
        for (const post of res.value) {
          if (!processedIds.has(post.externalPostId)) {
            processedIds.add(post.externalPostId);
            posts.push(post);
          }
        }
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
    const rssUrls = [
      `https://www.reddit.com/search.rss?q=${encodeURIComponent(query)}&sort=new&limit=15`,
      `https://www.reddit.com/r/all/search.rss?q=${encodeURIComponent(query)}&sort=new&limit=15`,
      `https://old.reddit.com/search.rss?q=${encodeURIComponent(query)}&sort=new&limit=15`
    ];

    for (const url of rssUrls) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': this.getRedditUserAgent(),
            'Accept': 'application/xml, application/rss+xml, text/xml'
          },
          signal: AbortSignal.timeout(3500)
        });

        if (!response.ok) continue;

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

        if (posts.length > 0) break;
      } catch (err: any) {
        logger.debug(`[COLLECTION] [REDDIT] RSS fallback url ${url} failed: ${err.message}`);
      }
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
        signal: AbortSignal.timeout(4000)
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
   * Uses Algolia search API for keyword-based discovery + Ask HN queries in parallel.
   * High performance, compound query coverage, and zero artificial blocking sleeps.
   */
  private static async collectFromHackerNews(
    product: ProductWithDetails,
    oneMonthAgo: Date,
    searchQueries: string[] = []
  ): Promise<CollectedPost[]> {
    const processedIds = new Set<string>();
    const tasks: Promise<CollectedPost[]>[] = [];

    // Strategy 1: Keyword-based queries on Algolia
    if (searchQueries.length > 0) {
      const distinctQueries = [...new Set(searchQueries)].sort(() => Math.random() - 0.5);
      const compoundQueries: string[] = [];

      for (let i = 0; i < distinctQueries.length && compoundQueries.length < 3; i += 2) {
        if (i + 1 < distinctQueries.length) {
          compoundQueries.push(`"${distinctQueries[i]}" OR "${distinctQueries[i + 1]}"`);
        } else {
          compoundQueries.push(distinctQueries[i]!);
        }
      }

      for (let idx = 0; idx < compoundQueries.length; idx++) {
        const query = compoundQueries[idx]!;
        tasks.push((async () => {
          if (idx > 0) {
            await new Promise((resolve) => setTimeout(resolve, idx * 60));
          }

          const queryPosts: CollectedPost[] = [];
          try {
            const algoliaUrl = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(query)}&tags=(story,comment)&hitsPerPage=50&numericFilters=points%3E%3D3`;
            const response = await fetch(algoliaUrl, {
              headers: { 'Accept': 'application/json' },
              signal: AbortSignal.timeout(3500),
            });

            if (!response.ok) return queryPosts;

            const data = await response.json() as any;
            const hits = data?.hits || [];

            for (const hit of hits) {
              const storyId = hit.objectID;
              if (!storyId) continue;

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

              queryPosts.push({
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
          } catch (error: any) {
            logger.warn({ errorMsg: error.message, query }, '[COLLECTION] [HACKERNEWS] Algolia query error');
          }
          return queryPosts;
        })());
      }
    }

    // Strategy 2: Dedicated Ask HN query (concurrent)
    tasks.push((async () => {
      const askHnPosts: CollectedPost[] = [];
      try {
        const askHnKeyword = searchQueries[0] ?? product.name;
        const askHnUrl = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(askHnKeyword)}&tags=ask_hn&hitsPerPage=30`;
        const askHnResponse = await fetch(askHnUrl, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(3500)
        });

        if (askHnResponse.ok) {
          const askHnData = await askHnResponse.json() as any;
          const askHnHits = askHnData?.hits || [];

          for (const hit of askHnHits) {
            const storyId = hit.objectID;
            if (!storyId) continue;

            const postedAt = hit.created_at_i ? new Date(hit.created_at_i * 1000) : new Date();
            if (postedAt < oneMonthAgo) continue;

            const title = hit.title || '';
            let content = hit.story_text || '';
            content = content
              .replace(/<[^>]*>/g, ' ')
              .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#x2F;/g, '/')
              .replace(/\s+/g, ' ').trim();

            const combinedText = `${title} ${content}`;
            if (!this.passesBasicFilters(combinedText, hit.author || null, product)) continue;

            askHnPosts.push({
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
      return askHnPosts;
    })());

    const results = await Promise.allSettled(tasks);
    const posts: CollectedPost[] = [];

    for (const res of results) {
      if (res.status === 'fulfilled') {
        for (const post of res.value) {
          if (!processedIds.has(post.externalPostId)) {
            processedIds.add(post.externalPostId);
            posts.push(post);
          }
        }
      }
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

    const twitterTasks = finalQueries.map(async (query, idx) => {
      if (idx > 0) {
        await new Promise(resolve => setTimeout(resolve, idx * 120));
      }
      try {
        const queryPosts = await this.fetchFromYahoo(query, oneMonthAgo);
        return queryPosts.filter(p => this.passesBasicFilters(p.content, p.authorUsername, product));
      } catch (_) {
        return [];
      }
    });

    const results = await Promise.allSettled(twitterTasks);
    for (const res of results) {
      if (res.status === 'fulfilled') {
        posts.push(...res.value);
      }
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

  private static getRedditUserAgent(): string {
    const versions = ['1.0.1', '1.1.0', '1.2.0'];
    const v = versions[Math.floor(Math.random() * versions.length)];
    return `web:knivik-leadfinder:${v} (by /u/knivik_scanner)`;
  }
}
