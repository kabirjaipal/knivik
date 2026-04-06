import { db } from '../lib/db.js';
import logger from '../lib/logger.js';
import { Platform } from '@prisma/client';
import { CollectedPost } from './batchAnalysisService.js';

// Define ProductWithDetails interface locally
interface ProductWithDetails {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  websiteUrl: string | null;
  isActive: boolean;
  aiConfig: any;
  createdAt: Date;
  updatedAt: Date;
  keywords: Array<{ id: string; productId: string; keyword: string; isActive: boolean; createdAt: Date }>;
  sources: Array<{ id: string; productId: string; platform: Platform; identifier: string; isActive: boolean; createdAt: Date }>;
  negativeKeywords: Array<{ id: string; productId: string; keyword: string; createdAt: Date }>;
  competitors: Array<{ id: string; productId: string; name: string; createdAt: Date }>;
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
    
    logger.info(`[COLLECTION] Starting collection for user ${userId}`);
    
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
        include: {
          keywords: { where: { isActive: true } },
          sources: { where: { isActive: true } },
          negativeKeywords: true,
          competitors: true,
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

      logger.info(`[COLLECTION] Found ${activeProducts.length} active products for user ${userId}`);
      
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
          
          // Log per-product summary with source breakdown
          const sourceSummary = Object.entries(sourceBreakdown)
            .map(([source, count]) => `${source}:${count}`)
            .join(', ');
          logger.info(`[COLLECTION] Product "${product.name}": ${productPosts.length} posts (${sourceSummary})`);
        } else {
          logger.warn(`[COLLECTION] Product "${product.name}": 0 posts collected`);
        }
      }

      logger.info(`[COLLECTION] User ${userId}: ${totalPosts} total posts across ${productsWithPosts.length} products in ${Date.now() - startTime}ms`);

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
  private static async collectProductPosts(
    product: ProductWithDetails,
    sourceBreakdown: Record<string, number> = {}
  ): Promise<CollectedPost[]> {
    const allPosts: CollectedPost[] = [];
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Ensure product has sources
    if (product.sources.length === 0) {
      product.sources = [{
        id: 'auto-injected-fallback',
        productId: product.id,
        platform: Platform.REDDIT,
        identifier: 'startups',
        isActive: true,
        createdAt: new Date()
      }];
    }

    // Collect from each source
    for (const source of product.sources) {
      try {
        const sourcePosts = await this.collectFromSource(product, source, oneMonthAgo);
        allPosts.push(...sourcePosts);
        
        // Track posts per source for reporting
        const sourceKey = `${source.platform}:${source.identifier}`;
        sourceBreakdown[sourceKey] = (sourceBreakdown[sourceKey] || 0) + sourcePosts.length;
      } catch (error: any) {
        logger.warn({ error, productId: product.id, source: source.identifier }, 'Failed to collect from source');
      }
    }

    // Remove duplicates and apply final filtering
    const uniquePosts = this.deduplicateAndFilter(allPosts, product);
    
    // Limit to top 25 posts per product to control AI token usage (was 50)
    return uniquePosts.slice(0, 25);
  }

  /**
   * Collect posts from a specific source (platform + community)
   */
  private static async collectFromSource(
    product: ProductWithDetails,
    source: any,
    oneMonthAgo: Date
  ): Promise<CollectedPost[]> {
    const posts: CollectedPost[] = [];

    switch (source.platform) {
      case Platform.REDDIT:
        const redditPosts = await this.collectFromReddit(product, source, oneMonthAgo);
        posts.push(...redditPosts);
        break;
      case Platform.HACKERNEWS:
        const hnPosts = await this.collectFromHackerNews(product, source, oneMonthAgo);
        posts.push(...hnPosts);
        break;
      // Add other platforms as needed
      default:
        logger.warn(`[BATCH] Unsupported platform: ${source.platform}`);
    }

    return posts;
  }

  /**
   * Generate advanced search queries from product data
   * This creates multiple query variations to find more leads
   */
  public static generateSearchQueries(product: ProductWithDetails): string[] {
    const queries: string[] = [];
    const keywords = product.keywords.map(k => k.keyword);
    const competitors = product.competitors.map(c => c.name);
    const description = product.description?.toLowerCase() || '';
    
    // 1. Direct keyword searches (exact matches)
    keywords.forEach(keyword => {
      queries.push(keyword);
    });
    
    // 2. Competitor + "alternative/frustrated" combinations (high intent)
    competitors.forEach(competitor => {
      queries.push(`${competitor} alternative`);
      queries.push(`tired of ${competitor}`);
      queries.push(`frustrated with ${competitor}`);
      queries.push(`${competitor} too expensive`);
      queries.push(`moving away from ${competitor}`);
      queries.push(`looking for ${competitor} alternative`);
    });
    
    // 3. Solution + intent phrases
    const solutionTerms = this.extractKeyTerms(description);
    solutionTerms.forEach(term => {
      queries.push(`need ${term}`);
      queries.push(`looking for ${term}`);
      queries.push(`best ${term}`);
      queries.push(`${term} recommendation`);
    });
    
    // 4. Problem + "help/solution" combinations
    keywords.forEach(keyword => {
      const parts = keyword.split(' ');
      if (parts.length > 1) {
        // Take first 2 words as core concept
        const coreTerm = parts.slice(0, 2).join(' ');
        queries.push(`need help with ${coreTerm}`);
        queries.push(`struggling with ${coreTerm}`);
        queries.push(`${coreTerm} solution`);
      }
    });
    
    // 5. Boolean-style combined queries (OR operators)
    if (competitors.length >= 2) {
      queries.push(`(${competitors.slice(0, 3).join(' OR ')}) AND (alternative OR switch OR migrate)`);
    }
    
    // Deduplicate and limit
    return [...new Set(queries)].slice(0, 20);
  }
  
  /**
   * Extract key solution terms from product description
   */
  private static extractKeyTerms(description: string): string[] {
    if (!description) return [];
    
    // Common solution indicators
    const patterns = [
      /(\w+\s+tool)/g,
      /(\w+\s+platform)/g,
      /(\w+\s+software)/g,
      /(\w+\s+service)/g,
      /(\w+\s+chatbot)/g,
      /(\w+\s+analytics?)/g,
    ];
    
    const terms: string[] = [];
    patterns.forEach(pattern => {
      const matches = description.match(pattern);
      if (matches) {
        matches.forEach(match => {
          if (match.length > 5 && !terms.includes(match)) {
            terms.push(match);
          }
        });
      }
    });
    
    // Also extract nouns that follow "provides" or "offers"
    const provideMatches = description.match(/provides?\s+(\w+(?:\s+\w+){0,2})/g);
    if (provideMatches) {
      provideMatches.forEach(match => {
        const term = match.replace(/provides?\s+/, '');
        if (term.length > 3 && !terms.includes(term)) {
          terms.push(term);
        }
      });
    }
    
    return terms.slice(0, 5);
  }

  /**
   * Collect posts from Reddit using keyword search and recent posts
   */
  private static async collectFromReddit(
    product: ProductWithDetails,
    source: any,
    oneMonthAgo: Date
  ): Promise<CollectedPost[]> {
    const posts: CollectedPost[] = [];
    const isGlobal = source.identifier.toLowerCase() === 'global';
    const subreddit = source.identifier.startsWith('r/') ? source.identifier.substring(2) : source.identifier;

    // Generate advanced search queries from product data
    // Use stored queries if available, otherwise generate on-the-fly
    const { SearchQueryService } = await import('./searchQueryService.js');
    const searchQueries = await SearchQueryService.getStoredQueries(product.id);
    
    if (searchQueries.length === 0) {
      logger.warn(`[COLLECTION] No search queries available for product "${product.name}"`);
      return posts;
    }
    
    logger.info(`[COLLECTION] Using ${searchQueries.length} stored search queries for product "${product.name}"`);

    // Strategy 1: Advanced query-based collection
    for (const query of searchQueries.slice(0, 8)) { // Limit to top 8 queries per source
      try {
        const searchQuery = query.includes(' ') && !query.includes('"') && !query.includes('(')
          ? `"${query}"`
          : query;

        const url = isGlobal
          ? `https://www.reddit.com/search.json?q=${encodeURIComponent(searchQuery)}&sort=new&limit=15&type=link,comment`
          : `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(searchQuery)}&restrict_sr=1&sort=new&limit=15&type=link,comment`;

        logger.debug(`[COLLECTION] Searching Reddit: ${query.substring(0, 50)}...`);

        const response = await fetch(url, {
          headers: { 'User-Agent': this.getRandomUserAgent() },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        if (!response.ok) {
          logger.warn({ 
            status: response.status, 
            statusText: response.statusText,
            query: query.substring(0, 50),
            url: url.substring(0, 100)
          }, 'Reddit search API failed');
          continue;
        }

        const data = (await response.json()) as any;
        const children = data?.data?.children;
        if (!Array.isArray(children)) continue;

        for (const child of children) {
          const postData = child.data;
          if (!postData?.id) continue;

          const postedAt = new Date(postData.created_utc * 1000);
          if (postedAt < oneMonthAgo) continue;

          const title = postData.title || (postData.link_title ? `Comment on: ${postData.link_title}` : '');
          const content = postData.body || postData.selftext || '';
          const combinedText = `${title} ${content}`;

          if (!this.passesBasicFilters(combinedText, product)) continue;

        posts.push({
            id: `reddit-${postData.id}`,
            platform: 'REDDIT',
            externalPostId: postData.id,
            title,
            content,
            url: `https://reddit.com${postData.permalink}`,
            authorUsername: postData.author,
            postedAt,
            source: source.identifier,
            detectionMode: 'KEYWORD',
            keywordMatch: query
          });
        }

        // Rate limiting - reduced to 500ms to prevent job stalls
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: any) {
        logger.warn({ error, query: query.substring(0, 50) }, 'Reddit query search failed');
      }
    }

    // Strategy 2: Recent posts collection (for semantic/competitor detection)
    try {
      const recentUrl = isGlobal
        ? `https://www.reddit.com/new.json?limit=50`
        : `https://www.reddit.com/r/${subreddit}/new.json?limit=50`;

      const response = await fetch(recentUrl, {
        headers: { 'User-Agent': this.getRandomUserAgent() },
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        const children = data?.data?.children;

        if (Array.isArray(children)) {
          for (const child of children) {
            const postData = child.data;
            if (!postData?.id) continue;

            const postedAt = new Date(postData.created_utc * 1000);
            if (postedAt < oneMonthAgo) continue;

            const title = postData.title || '';
            const content = postData.body || postData.selftext || '';
            const combinedText = `${title} ${content}`;

            if (!this.passesBasicFilters(combinedText, product)) continue;

            // Check for keyword matches in the content (not just competitor mentions)
            let detectionMode: 'KEYWORD' | 'SEMANTIC' | 'COMPETITOR' = 'SEMANTIC';
            let keywordMatch: string | undefined;
            let competitorMatch: string | undefined;
            
            // First check for competitor mentions (high priority)
            for (const competitor of product.competitors) {
              if (combinedText.toLowerCase().includes(competitor.name.toLowerCase())) {
                detectionMode = 'COMPETITOR';
                competitorMatch = competitor.name;
                break;
              }
            }
            
            // Then check for keyword matches (only if not already a competitor match)
            if (!competitorMatch) {
              for (const keyword of product.keywords) {
                if (combinedText.toLowerCase().includes(keyword.keyword.toLowerCase())) {
                  detectionMode = 'KEYWORD';
                  keywordMatch = keyword.keyword;
                  break;
                }
              }
            }
            
            // Skip if no keyword or competitor match found
            if (!keywordMatch && !competitorMatch) continue;

            posts.push({
              id: `reddit-recent-${postData.id}`,
              platform: 'REDDIT',
              externalPostId: postData.id,
              title,
              content,
              url: `https://reddit.com${postData.permalink}`,
              authorUsername: postData.author,
              postedAt,
              source: source.identifier,
              detectionMode,
              ...(keywordMatch && { keywordMatch }),
              ...(competitorMatch && { competitorMatch })
            });
          }
        }
      }
    } catch (error: any) {
      logger.warn({ error, sourceIdentifier: source.identifier }, 'Reddit recent posts failed');
    }

    return posts;
  }

  /**
   * Collect posts from HackerNews
   */
  private static async collectFromHackerNews(
    product: ProductWithDetails,
    _source: any,
    oneMonthAgo: Date
  ): Promise<CollectedPost[]> {
    const posts: CollectedPost[] = [];

    try {
      // Get recent stories
      const storiesUrl = 'https://hacker-news.firebaseio.com/v0/newstories.json';
      const response = await fetch(storiesUrl, { signal: AbortSignal.timeout(10000) });
      
      if (!response.ok) return posts;

      const storyIds = (await response.json()) as number[];
      const recentStoryIds = storyIds.slice(0, 50); // Limit to recent 50 (reduced from 100)

      for (const storyId of recentStoryIds) {
        try {
          const storyUrl = `https://hacker-news.firebaseio.com/v0/item/${storyId}.json`;
          const storyResponse = await fetch(storyUrl, { signal: AbortSignal.timeout(5000) });
          
          if (!storyResponse.ok) continue;

          const story = (await storyResponse.json()) as any;
          if (!story || !story.id || !story.title) continue;

          const postedAt = new Date(story.time * 1000);
          if (postedAt < oneMonthAgo) continue;

          const title = story.title || '';
          const text = story.text || '';
          const combinedText = `${title} ${text}`;

          if (!this.passesBasicFilters(combinedText, product)) continue;

          // Check for keyword matches
          let detectionMode: 'KEYWORD' | 'SEMANTIC' | 'COMPETITOR' = 'SEMANTIC';
          let keywordMatch: string | undefined;
          let competitorMatch: string | undefined;

          for (const keyword of product.keywords) {
            if (combinedText.toLowerCase().includes(keyword.keyword.toLowerCase())) {
              detectionMode = 'KEYWORD';
              keywordMatch = keyword.keyword;
              break;
            }
          }

          for (const competitor of product.competitors) {
            if (combinedText.toLowerCase().includes(competitor.name.toLowerCase())) {
              detectionMode = 'COMPETITOR';
              competitorMatch = competitor.name;
              break;
            }
          }

          posts.push({
            id: `hn-${story.id}`,
            platform: 'HACKERNEWS',
            externalPostId: story.id.toString(),
            title,
            content: text,
            url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
            authorUsername: story.by,
            postedAt,
            source: 'global',
            detectionMode,
            ...(keywordMatch && { keywordMatch }),
            ...(competitorMatch && { competitorMatch })
          });

        } catch (error: any) {
          logger.warn({ error, storyId }, 'Failed to fetch HN story');
        }
      }

    } catch (error: any) {
      logger.warn({ error }, 'HackerNews collection failed');
    }

    return posts;
  }

  /**
   * Basic filtering to remove obvious noise before AI analysis
   */
  private static passesBasicFilters(text: string, _product: ProductWithDetails): boolean {
    const lower = text.toLowerCase();

    // Minimum content length
    if (text.trim().length < 50) return false;

    // Bot detection
    if (lower.includes('bot')) return false;

    // Negative keywords
    for (const negKeyword of _product.negativeKeywords) {
      if (lower.includes(negKeyword.keyword.toLowerCase())) {
        return false;
      }
    }

    // Hard rejects - obvious non-buying content
    const hardRejects = [
      'show hn', 'i built', 'we built', 'just launched', 'check out my',
      'we\'re hiring', 'we are hiring', 'job post', 'looking for a job',
      'tutorial', 'how to', 'guide', 'step by step',
      'breaking news', 'press release'
    ];

    for (const reject of hardRejects) {
      if (lower.includes(reject)) return false;
    }

    return true;
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

      return scoreB - scoreA;
    });
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
