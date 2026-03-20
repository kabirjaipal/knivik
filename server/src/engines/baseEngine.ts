import { db } from '../lib/db.js';
import logger from '../lib/logger.js';
import { analyzeIntent } from '../services/aiService.js';
import { Platform, Product, Keyword, NegativeKeyword, ProductSource } from '@prisma/client';
import { sendLeadAlert } from '../services/alertService.js';
import { emitToUser } from '../lib/socket.js';

export type ProductWithDetails = Product & {
  keywords: Keyword[];
  negativeKeywords: NegativeKeyword[];
  sources: ProductSource[];
};

export abstract class BaseScraperEngine {
  abstract platform: Platform;
  
  protected abstract scrapeKeyword(
    product: ProductWithDetails,
    source: ProductSource,
    keyword: Keyword,
    limit: number
  ): Promise<number>;

  /**
   * Main entry point for the engine for all active products 
   * (or a specific user's products).
   */
  async runAll(userId?: string): Promise<void> {
    logger.info(`Starting engine for platform: ${this.platform}${userId ? ` for User: ${userId}` : ''}`);
    
    try {
      const activeProducts = await db.client.product.findMany({
        where: { 
          isActive: true,
          ...(userId ? { userId } : {})
        },
        include: {
          keywords: { where: { isActive: true } },
          sources: { where: { isActive: true, platform: this.platform } },
          negativeKeywords: true,
        },
      });

      if (activeProducts.length === 0) {
        logger.info(`No active products for ${this.platform}.`);
        return;
      }

      const MAX_LEADS_PER_PRODUCT = 5;

      for (const product of activeProducts) {
        if (product.sources.length === 0 || product.keywords.length === 0) {
          continue;
        }

        logger.info(`Processing ${this.platform} for product: ${product.name}`);
        let foundInThisCycle = 0;

        for (const source of product.sources) {
          if (foundInThisCycle >= MAX_LEADS_PER_PRODUCT) break;

          for (const keyword of product.keywords) {
            if (foundInThisCycle >= MAX_LEADS_PER_PRODUCT) break;

            const savedCount = await this.scrapeKeyword(
              product as ProductWithDetails, 
              source, 
              keyword, 
              MAX_LEADS_PER_PRODUCT - foundInThisCycle
            );
            foundInThisCycle += savedCount;
          }
        }
        logger.info(`Finished product ${product.name} on ${this.platform}. Found ${foundInThisCycle} leads.`);
      }
    } catch (error) {
      logger.error({ error, platform: this.platform }, 'Fatal error in scraper cycle:');
    }
  }

  /**
   * Shared helper to analyze text and save if it meets the intent threshold.
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
    // 1. Check cache first
    const cached = await db.client.scrapeCache.findUnique({
      where: {
        platform_externalPostId: {
          platform: this.platform,
          externalPostId,
        },
      },
    });

    if (cached) return false;

    // 2. Mark as processed globally
    await db.client.scrapeCache.create({
      data: {
        platform: this.platform,
        externalPostId,
      },
    });

    const combinedText = `${title || ''}\n\n${content}`;

    // 3. AI Pre-Filter: Negative keywords (Smart Regex)
    const hasNegative = product.negativeKeywords.some((nk: NegativeKeyword) => {
      const regex = new RegExp(`\\b${nk.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(combinedText);
    });

    if (hasNegative) return false;

    // 4. Content sanity check
    if (combinedText.length < 20) return false; // Too short to have real intent
    
    // 5. Basic Bot Detection (Case insensitive)
    if (authorUsername?.toLowerCase().includes('bot')) return false;

    // 6. LLM Intent Analysis
    const scoreResult = await analyzeIntent(combinedText);

    // 5. Save if threshold met
    if (scoreResult.intentScore >= 50) {
      try {
        const newLead = await db.client.lead.create({
          data: {
            productId: product.id,
            platform: this.platform,
            externalPostId,
            title: title?.substring(0, 255) || null,
            content: content.substring(0, 5000),
            url,
            authorUsername: authorUsername ?? null,
            intentLevel: scoreResult.intentLevel,
            intentScore: scoreResult.intentScore,
            postedAt: postedAt ?? null,
          },
        });

        // 6. Notify user via sockets and alerts
        if (product.userId) {
          emitToUser(product.userId, 'new-lead', {
            ...newLead,
            product: { name: product.name }
          });
          await sendLeadAlert(newLead.id);
        }
        
        return true;
      } catch (err: any) {
        if (err.code !== 'P2002') {
          logger.error({ error: err }, 'Failed to save lead:');
        }
      }
    }

    return false;
  }
  
  protected async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
