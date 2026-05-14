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
  public static async collectProductPosts(
    product: any,
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

    // Pre-load search queries once for the whole product to avoid redundant DB calls
    const { SearchQueryService } = await import('./searchQueryService.js');
    const searchQueries = await SearchQueryService.getStoredQueries(product.id);
    logger.info(`[COLLECTION] Starting scan for product "${product.name}" using ${searchQueries.length} pre-loaded queries across ${product.sources.length} sources.`);

    // Collect from each source
    for (const source of product.sources) {
      try {
        logger.info(`[COLLECTION] [${source.platform}] Processing source: ${source.identifier}`);
        const sourcePosts = await this.collectFromSource(product, source, oneMonthAgo, searchQueries);
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
    
    // Limit to top 25 posts per product to stay within AI token limits (Groq: 12K max)
    return uniquePosts.slice(0, 25);
  }

  /**
   * Collect posts from a specific source (platform + community)
   */
  private static async collectFromSource(
    product: ProductWithDetails,
    source: any,
    oneMonthAgo: Date,
    searchQueries: string[] = []
  ): Promise<CollectedPost[]> {
    const posts: CollectedPost[] = [];

    switch (source.platform) {
      case Platform.REDDIT:
        const redditPosts = await this.collectFromReddit(product, source, oneMonthAgo, searchQueries);
        posts.push(...redditPosts);
        break;
      case Platform.HACKERNEWS:
        const hnPosts = await this.collectFromHackerNews(product, source, oneMonthAgo, searchQueries);
        posts.push(...hnPosts);
        break;
      case Platform.TWITTER:
        const twitterPosts = await this.collectFromTwitter(product, source, oneMonthAgo);
        posts.push(...twitterPosts);
        break;
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
    oneMonthAgo: Date,
    searchQueries: string[] = []
  ): Promise<CollectedPost[]> {
    const posts: CollectedPost[] = [];
    
    // ALWAYS use global Reddit search for broader coverage
    // Subreddit-specific search is too limiting - we want to find leads anywhere on Reddit
    const isGlobal = true;

    if (searchQueries.length === 0) {
      logger.warn(`[COLLECTION] No search queries available for Reddit scan of "${product.name}"`);
      return posts;
    }

    // To respect Reddit's strict 10 requests/minute unauthenticated limit, we randomly pick
    // 5 queries per cycle for better coverage. Since the job runs repeatedly, all queries will eventually be covered.
    const cycleQueries = [...searchQueries]
      .map(q => ({ q, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .slice(0, 5)
      .map(({ q }) => q);
    
    // Strategy 1: Advanced query-based collection
    for (const query of cycleQueries) { 
      try {
        const searchQuery = query;

        // Always search globally across all of Reddit for maximum lead discovery
        const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(searchQuery)}&sort=new&limit=15&type=link,comment`;

        logger.info(`[DEEP-LOG] [REDDIT] Searching: "${query}" | URL: ${url}`);

        const response = await fetch(url, {
          headers: {
            'User-Agent': this.getRandomUserAgent(),
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(10000)
        });

        if (response.status === 429) {
          logger.warn(`[DEEP-LOG] [REDDIT] 🚨 Rate limit hit (429)! Reddit restricts to 10 req/minute. Sleeping for 30s...`);
          await new Promise(resolve => setTimeout(resolve, 30000));
          continue;
        }

        if (response.status === 404) {
          logger.warn(`[DEEP-LOG] [REDDIT] Search endpoint not found (404). Retrying...`);
          // Fallback to global search with same query
          try {
            const globalUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=new&limit=15&type=link,comment`;
            const globalResponse = await fetch(globalUrl, {
              headers: {
                'User-Agent': this.getRandomUserAgent(),
                'Accept': 'application/json',
              },
              signal: AbortSignal.timeout(10000)
            });
            if (globalResponse.ok) {
              const globalData = (await globalResponse.json()) as any;
              const globalChildren = globalData?.data?.children;
              if (Array.isArray(globalChildren) && globalChildren.length > 0) {
                logger.info(`[DEEP-LOG] [REDDIT] Global search fallback succeeded for: "${query}"`);
                // Process global results (simplified - reuse same logic below)
                for (const child of globalChildren) {
                  const postData = child.data;
                  if (!postData?.id) continue;
                  const postedAt = new Date(postData.created_utc * 1000);
                  if (postedAt < oneMonthAgo) continue;
                  const title = postData.title || (postData.link_title ? `Comment on: ${postData.link_title}` : '');
                  const content = postData.body || postData.selftext || '';
                  const combinedText = `${title} ${content}`;
                  if (!this.passesBasicFilters(combinedText, product)) continue;
                  let detectionMode: 'KEYWORD' | 'SEMANTIC' | 'COMPETITOR' = 'KEYWORD';
                  let verifiedKeywordMatch: string | undefined;
                  let verifiedCompetitorMatch: string | undefined;
                  for (const competitor of product.competitors) {
                    if (combinedText.toLowerCase().includes(competitor.name.toLowerCase())) {
                      detectionMode = 'COMPETITOR';
                      verifiedCompetitorMatch = competitor.name;
                      break;
                    }
                  }
                  if (!verifiedCompetitorMatch) {
                    for (const keyword of product.keywords) {
                      if (combinedText.toLowerCase().includes(keyword.keyword.toLowerCase())) {
                        detectionMode = 'KEYWORD';
                        verifiedKeywordMatch = keyword.keyword;
                        break;
                      }
                    }
                  }
                  if (!verifiedCompetitorMatch && !verifiedKeywordMatch) {
                    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
                    const containsAllQueryWords = queryWords.length > 0 && queryWords.every(w => combinedText.toLowerCase().includes(w));
                    if (!containsAllQueryWords) continue;
                  }
                  posts.push({
                    id: `reddit-${postData.id}`,
                    platform: 'REDDIT',
                    externalPostId: postData.id,
                    title,
                    content,
                    url: `https://reddit.com${postData.permalink}`,
                    authorUsername: postData.author,
                    postedAt,
                    source: 'global',
                    detectionMode,
                    keywordMatch: verifiedKeywordMatch,
                    competitorMatch: verifiedCompetitorMatch
                  });
                }
              }
            }
          } catch (fallbackError: any) {
            logger.debug(`[DEEP-LOG] [REDDIT] Global fallback also failed: ${fallbackError.message}`);
          }
          continue;
        }

        if (!response.ok) {
          logger.warn(`[DEEP-LOG] [REDDIT] Fetch failed (${response.status} ${response.statusText}) for query: ${query}`);
          continue;
        }

        const data = (await response.json()) as any;
        const children = data?.data?.children;
        if (!Array.isArray(children)) {
          logger.debug(`[DEEP-LOG] [REDDIT] No children array in response for query: ${query}`);
          continue;
        }

        logger.debug(`[DEEP-LOG] [REDDIT] Found ${children.length} raw items for query: "${query}"`);

        let queryMatches = 0;
        for (const child of children) {
          const postData = child.data;
          if (!postData?.id) continue;

          const postedAt = new Date(postData.created_utc * 1000);
          if (postedAt < oneMonthAgo) {
            logger.debug(`[DEEP-LOG] [REDDIT] Skipping post ${postData.id}: Too old (${postedAt.toISOString()})`);
            continue;
          }

          const title = postData.title || (postData.link_title ? `Comment on: ${postData.link_title}` : '');
          const content = postData.body || postData.selftext || '';
          const combinedText = `${title} ${content}`;

          const filterResult = this.passesBasicFiltersWithReason(combinedText, product);
          if (!filterResult.passed) {
            logger.debug(`[DEEP-LOG] [REDDIT] Filter rejected ${postData.id}: ${filterResult.reason}`);
            continue;
          }

          // Local Verification: Because Reddit's search API is very loose when unquoted,
          // we securely verify that the text ACTUALLY contains a match.
          let detectionMode: 'KEYWORD' | 'SEMANTIC' | 'COMPETITOR' = 'KEYWORD';
          let verifiedKeywordMatch: string | undefined;
          let verifiedCompetitorMatch: string | undefined;
          let isQueryPresent = false;

          for (const competitor of product.competitors) {
            if (combinedText.toLowerCase().includes(competitor.name.toLowerCase())) {
              detectionMode = 'COMPETITOR';
              verifiedCompetitorMatch = competitor.name;
              break;
            }
          }

          if (!verifiedCompetitorMatch) {
            for (const keyword of product.keywords) {
              if (combinedText.toLowerCase().includes(keyword.keyword.toLowerCase())) {
                detectionMode = 'KEYWORD';
                verifiedKeywordMatch = keyword.keyword;
                break;
              }
            }
          }

          if (!verifiedCompetitorMatch && !verifiedKeywordMatch) {
            // Do a 'Loose AND' check - verify significant words in the query exist in the text
            const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
            const containsQueryWords = queryWords.length > 0 && queryWords.some(w => combinedText.toLowerCase().includes(w));
            
            if (containsQueryWords) {
              detectionMode = 'SEMANTIC'; // Mark as semantic - needs AI verification
              isQueryPresent = true;
            }
          }

          // RELAXED: Allow posts through if they pass basic filters and have some relevance
          // The AI analysis phase will filter out false positives
          if (!verifiedCompetitorMatch && !verifiedKeywordMatch && !isQueryPresent) {
             logger.debug(`[DEEP-LOG] [REDDIT] Post ${postData.id}: No strong keyword match, but passing for AI semantic check`);
             // Still allow through as SEMANTIC detection for AI to evaluate
             detectionMode = 'SEMANTIC';
          }

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
            detectionMode,
            keywordMatch: verifiedKeywordMatch || (isQueryPresent ? query : undefined),
            competitorMatch: verifiedCompetitorMatch
          });
          queryMatches++;
        }
        
        if (queryMatches > 0) {
          logger.info(`[DEEP-LOG] [REDDIT] Query "${query}" yielded ${queryMatches} valid potential leads.`);
        }

        // Rate limiting: Relax to ~2.5 seconds between requests (critical for unauthenticated limits)
        await new Promise(resolve => setTimeout(resolve, 2500));

      } catch (error: any) {
        logger.warn(`[DEEP-LOG] [REDDIT] Query "${query}" error: ${error.message}`);
      }
    }

    // Strategy 2: Recent posts collection (for semantic/competitor detection)
    try {
      // Always use global Reddit feed for broader discovery
      const recentUrl = `https://www.reddit.com/new.json?limit=50`;

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
   * Uses Algolia search API for keyword-based discovery + Firebase for recent stories
   */
  private static async collectFromHackerNews(
    product: ProductWithDetails,
    _source: any,
    oneMonthAgo: Date,
    searchQueries: string[] = []
  ): Promise<CollectedPost[]> {
    const posts: CollectedPost[] = [];
    const processedIds = new Set<string>(); // Track processed posts to avoid duplicates

    // Strategy 1: Search via Algolia for keyword-based results
    if (searchQueries.length > 0) {
      // Use top 3 queries to avoid hitting Algolia limits
      const priorityQueries = searchQueries.slice(0, 3);
      
      for (const query of priorityQueries) {
        try {
          const algoliaUrl = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(query)}&tags=(story,comment)&hitsPerPage=20`;
          
          logger.info(`[DEEP-LOG] [HACKERNEWS] Searching Algolia: "${query}"`);
          
          const response = await fetch(algoliaUrl, { 
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(10000) 
          });
          
          if (!response.ok) {
            logger.warn(`[DEEP-LOG] [HACKERNEWS] Algolia search failed: ${response.status}`);
            continue;
          }

          const data = await response.json() as any;
          const hits = data?.hits || [];

          for (const hit of hits) {
            const storyId = hit.objectID;
            if (processedIds.has(storyId)) continue; // Skip duplicates
            
            const postedAt = hit.created_at_i ? new Date(hit.created_at_i * 1000) : new Date();
            if (postedAt < oneMonthAgo) continue;

            const title = hit.title || hit.story_title || '';
            const content = hit.story_text || hit.comment_text || '';
            const combinedText = `${title} ${content}`;

            if (!this.passesBasicFilters(combinedText, product)) continue;

            // Check for matches
            let detectionMode: 'KEYWORD' | 'SEMANTIC' | 'COMPETITOR' = 'SEMANTIC';
            let keywordMatch: string | undefined;
            let competitorMatch: string | undefined;
            
            for (const competitor of product.competitors) {
              if (combinedText.toLowerCase().includes(competitor.name.toLowerCase())) {
                detectionMode = 'COMPETITOR';
                competitorMatch = competitor.name;
                break;
              }
            }

            if (!competitorMatch) {
              for (const keyword of product.keywords) {
                if (combinedText.toLowerCase().includes(keyword.keyword.toLowerCase())) {
                  detectionMode = 'KEYWORD';
                  keywordMatch = keyword.keyword;
                  break;
                }
              }
            }

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
              source: 'global',
              detectionMode,
              ...(keywordMatch && { keywordMatch }),
              ...(competitorMatch && { competitorMatch })
            });
          }

          if (hits.length > 0) {
            logger.info(`[DEEP-LOG] [HACKERNEWS] Query "${query}" found ${hits.length} results`);
          }

          // Rate limiting: be nice to Algolia
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error: any) {
          logger.warn(`[DEEP-LOG] [HACKERNEWS] Algolia search error for "${query}": ${error.message}`);
        }
      }
    }

    // Strategy 2: Also fetch recent stories from Firebase API
    try {
      const storiesUrl = 'https://hacker-news.firebaseio.com/v0/newstories.json';
      const response = await fetch(storiesUrl, { signal: AbortSignal.timeout(10000) });
      
      if (!response.ok) return posts;

      const storyIds = (await response.json()) as number[];
      const recentStoryIds = storyIds.slice(0, 30); // Reduced to 30 to save time

      for (const storyId of recentStoryIds) {
        try {
          const storyUrl = `https://hacker-news.firebaseio.com/v0/item/${storyId}.json`;
          const storyResponse = await fetch(storyUrl, { signal: AbortSignal.timeout(5000) });
          
          if (!storyResponse.ok) continue;

          const story = (await storyResponse.json()) as any;
          if (!story || !story.id || !story.title) continue;

          const storyIdStr = story.id.toString();
          if (processedIds.has(storyIdStr)) continue; // Skip duplicates from Algolia

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
          
          // Check for competitor mentions first (high priority)
          for (const competitor of product.competitors) {
            if (combinedText.toLowerCase().includes(competitor.name.toLowerCase())) {
              detectionMode = 'COMPETITOR';
              competitorMatch = competitor.name;
              break;
            }
          }

          // Then check for keyword matches
          if (!competitorMatch) {
            for (const keyword of product.keywords) {
              if (combinedText.toLowerCase().includes(keyword.keyword.toLowerCase())) {
                detectionMode = 'KEYWORD';
                keywordMatch = keyword.keyword;
                break;
              }
            }
          }

          // Strict filtering: Skip if no keyword or competitor match found
          // (This prevents sending unrelated 'stupid things' from HN to the AI)
          if (!keywordMatch && !competitorMatch) continue;

          processedIds.add(storyIdStr);
          posts.push({
            id: `hn-${storyIdStr}`,
            platform: 'HACKERNEWS',
            externalPostId: storyIdStr,
            title,
            content: text,
            url: story.url || `https://news.ycombinator.com/item?id=${storyIdStr}`,
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

    logger.info(`[COLLECTION] [HACKERNEWS] Total posts collected: ${posts.length}`);
    return posts;
  }

  /**
   * Basic filtering to remove obvious noise before AI analysis
   */
  private static passesBasicFilters(text: string, product: ProductWithDetails): boolean {
    return this.passesBasicFiltersWithReason(text, product).passed;
  }

  /**
   * Detailed filtering with reason for deep logging
   */
  private static passesBasicFiltersWithReason(text: string, product: ProductWithDetails): { passed: boolean; reason?: string } {
    const lower = text.toLowerCase();

    // Minimum content length
    if (text.trim().length < 50) {
      return { passed: false, reason: 'Content too short (< 50 chars)' };
    }

    // Bot detection
    if (lower.includes('bot')) {
      return { passed: false, reason: 'Potential bot detected (contains "bot")' };
    }

    // Negative keywords
    for (const negKeyword of product.negativeKeywords) {
      if (lower.includes(negKeyword.keyword.toLowerCase())) {
        return { passed: false, reason: `Negative keyword match: "${negKeyword.keyword}"` };
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
      if (lower.includes(reject)) {
        return { passed: false, reason: `Hard-reject phrase: "${reject}"` };
      }
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

      return scoreB - scoreA;
    });
  }

  /**
   * Collect posts from Twitter/X using search queries
   */
  private static async collectFromTwitter(
    product: ProductWithDetails,
    source: any,
    oneMonthAgo: Date
  ): Promise<CollectedPost[]> {
    const posts: CollectedPost[] = [];

    // Load pre-generated search queries
    const { SearchQueryService } = await import('./searchQueryService.js');
    const allQueries = await SearchQueryService.getStoredQueries(product.id);
    if (allQueries.length === 0) {
      logger.warn(`[COLLECTION] No search queries for Twitter scan of "${product.name}"`);
      return posts;
    }

    // Pick 3 random queries per cycle
    const cycleQueries = [...allQueries]
      .map(q => ({ q, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .slice(0, 3)
      .map(({ q }) => q);

    const cheerio = await import('cheerio');

    for (const query of cycleQueries) {
      try {
        // Yahoo Search: site:x.com query — no auth, no API key needed
        const searchUrl = `https://search.yahoo.com/search?p=${encodeURIComponent(`site:x.com ${query}`)}`;

        logger.info(`[DEEP-LOG] [TWITTER] Yahoo search: "${query}"`);

        const response = await fetch(searchUrl, {
          headers: {
            'User-Agent': this.getRandomUserAgent(),
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml',
          },
          signal: AbortSignal.timeout(12000)
        });

        if (!response.ok) {
          logger.warn(`[DEEP-LOG] [TWITTER] Yahoo returned ${response.status} for query: ${query}`);
          continue;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        let queryMatches = 0;
        $('.algo').each((_i, el) => {
          if (posts.length >= 25) return false;

          const rawUrl = $(el).find('a').attr('href') || '';
          const rawText = $(el).find('.compTitle + div').text() || $(el).find('.fz-ms').text() || $(el).find('.compText').text() || '';

          // Unwrap Yahoo redirect (RU=https%3A%2F%2Fx.com%2F...)
          let url = rawUrl;
          const ruMatch = rawUrl.match(/RU=([^/&]+)/);
          if (ruMatch) {
            try { url = decodeURIComponent(ruMatch[1]); } catch { /* ignore */ }
          }

          if (!(url.includes('x.com/') || url.includes('twitter.com/'))) return;
          if (!url.includes('/status/')) return;

          const idMatch = url.match(/\/status\/(\d+)/);
          if (!idMatch) return;
          const tweetId = idMatch[1];

          const authorMatch = url.match(/(?:twitter\.com|x\.com)\/([^/]+)/);
          const author = authorMatch ? authorMatch[1] : 'unknown';
          if (author === 'unknown' || author === 'i') return;

          // Remove the date prefix Yahoo sometimes prepends
          const content = rawText.replace(/^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d+,\s\d{4}\s[·\-]\s*/i, '').trim();

          if (!content || content.length < 30) return;
          if (!this.passesBasicFilters(content, product)) return;

          // Detect mode
          let detectionMode: 'KEYWORD' | 'SEMANTIC' | 'COMPETITOR' = 'SEMANTIC';
          let keywordMatch: string | undefined;
          let competitorMatch: string | undefined;

          for (const competitor of product.competitors) {
            if (content.toLowerCase().includes(competitor.name.toLowerCase())) {
              detectionMode = 'COMPETITOR';
              competitorMatch = competitor.name;
              break;
            }
          }
          if (!competitorMatch) {
            for (const keyword of product.keywords) {
              if (content.toLowerCase().includes(keyword.keyword.toLowerCase())) {
                detectionMode = 'KEYWORD';
                keywordMatch = keyword.keyword;
                break;
              }
            }
          }

          posts.push({
            id: `twitter-${tweetId}`,
            platform: 'TWITTER',
            externalPostId: tweetId,
            title: null,
            content,
            url: `https://x.com/${author}/status/${tweetId}`,
            authorUsername: author,
            postedAt: new Date(), // Yahoo does not provide exact timestamp
            source: source.identifier,
            detectionMode,
            ...(keywordMatch && { keywordMatch }),
            ...(competitorMatch && { competitorMatch })
          });
          queryMatches++;
        });

        if (queryMatches > 0) {
          logger.info(`[DEEP-LOG] [TWITTER] Query "${query}" yielded ${queryMatches} potential leads`);
        }

        // Rate limiting: 4 seconds between Yahoo requests
        await new Promise(resolve => setTimeout(resolve, 4000));

      } catch (error: any) {
        logger.warn(`[DEEP-LOG] [TWITTER] Query "${query}" error: ${error.message}`);
      }
    }

    return posts;
  }

  /**
   * Strip HTML tags from text
   */
  private static stripHtml(html: string): string {
    return html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
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
