import { db } from '../lib/db.js';
import logger from '../lib/logger.js';
import {
  analyzeIntent,
  detectCompetitorSignal,
  semanticScan,
  SemanticScanPost,
} from '../services/aiService.js';
import { Platform, IntentLevel, Product, Keyword, NegativeKeyword, ProductSource, Competitor } from '@prisma/client';
import { sendLeadAlert } from '../services/alertService.js';
import { emitToUser } from '../lib/socket.js';
import { enrichLead } from '../services/enrichmentService.js';

export type ProductWithDetails = Product & {
  keywords: Keyword[];
  negativeKeywords: NegativeKeyword[];
  sources: ProductSource[];
  competitors: Competitor[];
};

// Detection mode for how a lead was found
export type DetectionMode = 'KEYWORD' | 'SEMANTIC' | 'COMPETITOR';

export abstract class BaseScraperEngine {
  abstract platform: Platform;

  protected abstract scrapeKeyword(
    product: ProductWithDetails,
    source: ProductSource,
    keyword: Keyword,
    limit: number,
    signal?: AbortSignal
  ): Promise<number>;

  /**
   * Fetches raw recent posts from a given source — used for semantic scanning.
   * Subclasses may override this to provide platform-specific fetching.
   */
  protected async fetchRecentPosts(
    _source: ProductSource,
    _limit: number
  ): Promise<Array<{ id: string; title: string | null; content: string; url: string; author?: string; postedAt?: Date }>> {
    return [];
  }

  /**
   * Main entry point. Runs keyword scan + semantic scan + competitor scan.
   */
  async runAll(userId?: string, signal?: AbortSignal): Promise<void> {
    logger.info(`[${this.platform}] Engine starting${userId ? ` for User: ${userId}` : ''}...`);

    try {
      signal?.throwIfAborted();
      const activeProducts = await db.client.product.findMany({
        where: {
          isActive: true,
          ...(userId ? { userId } : {}),
        },
        include: {
          keywords: { where: { isActive: true } },
          sources: { where: { isActive: true, platform: this.platform } },
          negativeKeywords: true,
          competitors: true,
        },
      });

      if (activeProducts.length === 0) {
        logger.info(`[${this.platform}] No active products.`);
        return;
      }

      for (const product of activeProducts) {
        signal?.throwIfAborted();
        if (product.sources.length === 0) {
          // Graceful fallback for legacy products without sources configured
          product.sources = [{
            id: 'auto-injected-fallback',
            productId: product.id,
            platform: this.platform,
            // Reddit requires a subreddit; others can just search globally
            identifier: this.platform === 'REDDIT' ? 'startups' : 'global',
            isActive: true,
            createdAt: new Date()
          }];
        }

        logger.info(`[${this.platform}] Processing product: ${product.name}`);
        const MAX = 5;
        let found = 0;

        // Pass 1: Keyword scan (existing behaviour)
        if (product.keywords.length > 0) {
          for (const source of product.sources) {
            signal?.throwIfAborted();
            if (found >= MAX) break;
            for (const keyword of product.keywords) {
              signal?.throwIfAborted();
              if (found >= MAX) break;
              found += await this.scrapeKeyword(product as ProductWithDetails, source, keyword, MAX - found, signal);
            }
          }
        }

        // Pass 2: Semantic scan (no-keyword detection)
        if (product.description) {
          found += await this.runSemanticPass(product as ProductWithDetails, MAX - found);
        }

        // Pass 3: Competitor venting scan
        if (product.competitors.length > 0) {
          found += await this.runCompetitorPass(product as ProductWithDetails, MAX - found);
        }

        logger.info(`[${this.platform}] Done with ${product.name}. Found ${found} leads this cycle.`);
      }
    } catch (error) {
      logger.error({ error, platform: this.platform }, 'Fatal error in engine cycle:');
    }
  }

  /**
   * Semantic pass: fetches recent posts from each source, batches them to the AI
   * to find implicit problem-fits, even without keyword matches.
   */
  private async runSemanticPass(product: ProductWithDetails, limit: number): Promise<number> {
    if (limit <= 0) return 0;
    let found = 0;

    for (const source of product.sources) {
      if (found >= limit) break;

      const rawPosts = await this.fetchRecentPosts(source, 15);
      if (!rawPosts.length) continue;

      const postsForScan: SemanticScanPost[] = rawPosts.map(p => ({
        id: p.id,
        text: `${p.title || ''}\n${p.content}`.trim(),
      }));

      const results = await semanticScan(
        postsForScan,
        product.description || product.name,
        product.userId,
        product.id
      );

      for (const result of results) {
        if (found >= limit) break;
        if (!result.isMatch || result.intentScore < 55) continue;

        const rawPost = rawPosts.find(p => p.id === result.id);
        if (!rawPost) continue;

        const intentLevel: IntentLevel = result.intentScore >= 80 ? 'BUY_NOW'
          : result.intentScore >= 60 ? 'RESEARCHING'
          : 'LOW_INTENT';

        const saved = await this.saveLead(
          product,
          rawPost.id,
          rawPost.title,
          rawPost.content,
          rawPost.url,
          rawPost.author,
          rawPost.postedAt,
          intentLevel,
          result.intentScore,
          'SEMANTIC'
        );
        if (saved) found++;
      }
    }

    return found;
  }

  /**
   * Competitor pass: fetches recent posts from each source and checks for
   * explicit frustration or switching intent from configured competitors.
   */
  private async runCompetitorPass(product: ProductWithDetails, limit: number): Promise<number> {
    if (limit <= 0 || !product.competitors.length) return 0;
    let found = 0;

    const competitorNames = product.competitors.map(c => c.name);

    for (const source of product.sources) {
      if (found >= limit) break;

      const rawPosts = await this.fetchRecentPosts(source, 15);
      if (!rawPosts.length) continue;

      for (const rawPost of rawPosts) {
        if (found >= limit) break;

        const text = `${rawPost.title || ''}\n${rawPost.content}`.trim();
        const signal = await detectCompetitorSignal(text, competitorNames, product.userId, product.id);

        if (!signal.detected || signal.confidence < 60) continue;

        // Competitor venting is treated as high-intent — they are actively looking to switch
        const intentScore = Math.max(signal.confidence, 70);
        const saved = await this.saveLead(
          product,
          rawPost.id,
          rawPost.title,
          rawPost.content,
          rawPost.url,
          rawPost.author,
          rawPost.postedAt,
          'BUY_NOW' as IntentLevel,
          intentScore,
          'COMPETITOR'
        );
        if (saved) found++;
      }
    }

    return found;
  }

  /**
   * processPotentialLead: Used by keyword scan (Pass 1) with all smart pre-filters.
   */
  protected async processPotentialLead(
    product: ProductWithDetails,
    externalPostId: string,
    title: string | null,
    content: string,
    url: string,
    authorUsername?: string,
    postedAt?: Date
  ): Promise<boolean> {
    // 1. Cache check
    const cached = await db.client.scrapeCache.findUnique({
      where: { platform_externalPostId: { platform: this.platform, externalPostId } },
    });
    if (cached) return false;

    // 2. Mark as processed immediately
    await db.client.scrapeCache.create({
      data: { platform: this.platform, externalPostId },
    });

    const combinedText = `${title || ''}\n\n${content}`;

    // 3. Minimum content length
    if (combinedText.trim().length < 20) return false;

    // 4. Bot detection
    if (authorUsername?.toLowerCase().includes('bot')) return false;

    // 5. Smart regex negative keywords
    const hasNegative = product.negativeKeywords.some((nk: NegativeKeyword) => {
      const regex = new RegExp(`\\b${nk.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(combinedText);
    });
    if (hasNegative) return false;

    // 6. LLM intent analysis
    const scoreResult = await analyzeIntent(
      combinedText,
      product.name,
      product.description || '',
      product.userId,
      product.id
    );
    if (scoreResult.intentScore < 50) return false;

    return this.saveLead(
      product,
      externalPostId,
      title,
      content,
      url,
      authorUsername,
      postedAt,
      scoreResult.intentLevel,
      scoreResult.intentScore,
      'KEYWORD'
    );
  }

  /**
   * Central lead persistence + notification layer.
   */
  private async saveLead(
    product: ProductWithDetails,
    externalPostId: string,
    title: string | null,
    content: string,
    url: string,
    authorUsername: string | undefined,
    postedAt: Date | undefined,
    intentLevel: IntentLevel,
    intentScore: number,
    detectedBy: DetectionMode
  ): Promise<boolean> {
    try {
      const newLead = await db.client.lead.create({
        data: {
          productId: product.id,
          platform: this.platform,
          externalPostId,
          title: title?.substring(0, 255) ?? null,
          content: content.substring(0, 5000),
          url,
          authorUsername: authorUsername ?? null,
          intentLevel,
          intentScore,
          postedAt: postedAt ?? null,
          detectedBy,
        },
      });

      logger.info(
        `[${this.platform}] New ${detectedBy} lead saved for ${product.name} (Score: ${intentScore})`
      );

      // Emit to dashboard in real-time
      if (product.userId) {
        emitToUser(product.userId, 'new-lead', {
          ...newLead,
          product: { name: product.name },
        });
      }

      // Fire enrichment and alerts asynchronously (non-blocking)
      if (authorUsername) {
        setImmediate(() => enrichLead(newLead.id, authorUsername, this.platform));
      }
      setImmediate(() => sendLeadAlert(newLead.id));

      return true;
    } catch (err: any) {
      if (err.code !== 'P2002') {
        logger.error({ error: err }, 'Failed to save lead:');
      }
      return false;
    }
  }

  /**
   * Automatically adds a 20-30% random time jitter to any sleep call.
   * This is a crucial stealth technique so requests don't look like an automated 
   * CRON job hitting exact intervals.
   */
  protected async sleep(baseMs: number) {
    const jitter = baseMs * 0.30; 
    const fuzz = Math.random() * (jitter * 2) - jitter; // ±30%
    const finalMs = Math.max(250, baseMs + fuzz); // never sleep less than 250ms
    return new Promise((resolve) => setTimeout(resolve, finalMs));
  }

  /**
   * Randomly selects a highly-common browser User-Agent so our "stealth" engines 
   * (DuckDuckGo, Nitter) think we are a standard human browsing on a Mac/PC/iPhone.
   */
  protected getRandomUserAgent(): string {
    const agents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    ];
    return agents[Math.floor(Math.random() * agents.length)] as string;
  }
}
