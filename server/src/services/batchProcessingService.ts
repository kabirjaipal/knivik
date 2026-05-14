import { db } from '../lib/db.js';
import logger from '../lib/logger.js';
import { IntentLevel, LeadStatus } from '@prisma/client';
import { BatchCollectionService } from './batchCollectionService.js';
import { analyzeUserPostsBatch } from './batchAnalysisService.js';

import { enrichLead } from './enrichmentService.js';
import { sendLeadAlert } from './alertService.js';

/**
 * Main Batch Processing Service
 * 
 * This replaces the real-time AI calls approach with:
 * 1. Collect posts from last month (no AI)
 * 2. Batch analyze all posts with 1 AI call per user
 * 3. Save only the best lead per product
 */
export class BatchProcessingService {

  /**
   * Process a single product - collect posts and analyze in batch
   */
  static async processProduct(productId: string): Promise<{
    success: boolean;
    postsCollected: number;
    leadsGenerated: number;
    processingTime: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      // Get the product with its settings
      const product = await db.client.product.findUnique({
        where: { id: productId, isActive: true },
      });

      if (!product) {
        throw new Error('Product not found or inactive');
      }

      const userId = product.userId;
      logger.info(`[BATCH] Starting pipeline for product "${product.name}" (User: ${userId})`);

      // Step 1: Collect posts for this product
      const sourceBreakdown: Record<string, number> = {};
      const posts = await BatchCollectionService.collectProductPosts(product, sourceBreakdown);
      
      if (posts.length === 0) {
        logger.info(`[BATCH] No posts collected for product "${product.name}"`);
        return {
          success: true,
          postsCollected: 0,
          leadsGenerated: 0,
          processingTime: Date.now() - startTime,
        };
      }

      // Step 2: Analyze in batch (using our batch analyzer for just this 1 product)
      const analysisInput = [{
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
        },
        posts
      }];

      logger.info(`[DEEP-LOG] [AI-STAGE] Starting AI analysis for product "${product.name}" with ${posts.length} candidate posts.`);
      const analysisResult = await analyzeUserPostsBatch(userId, analysisInput);

      // Step 3: Save results
      let leadsGenerated = 0;
      for (const result of analysisResult.results) {
        if (result.leads.length > 0) {
          for (const lead of result.leads) {
            logger.info(`[DEEP-LOG] [AI-STAGE] AI found a high-quality lead for "${product.name}"! Score: ${lead.intentScore}`);
            // Still using saveBestLead function name, but we pass each lead independently
            const saved = await this.saveBestLead({ ...lead, product }, userId);
            if (saved) leadsGenerated++;
          }
        }
      }

      if (leadsGenerated === 0) {
        // Find the summary to explain WHY the AI rejected these posts
        const summary = analysisResult.results[0]?.analysisSummary || "No reasoning provided by AI.";
        logger.info(`[DEEP-LOG] [AI-STAGE] AI finished analysis for "${product.name}" but did not find any lead meeting the quality threshold.`);
        logger.info(`[DEEP-LOG] [AI-STAGE] 🧠 AI Reasoning for Rejection: "${summary}"`);
      }

      // Finalize
      const processingTime = Date.now() - startTime;
      logger.info(`[BATCH] Product "${product.name}" complete: ${posts.length} posts → ${leadsGenerated} lead in ${processingTime}ms`);

      return {
        success: true,
        postsCollected: posts.length,
        leadsGenerated,
        processingTime,
      };

    } catch (error: any) {
      logger.error({ error, productId }, 'Product processing failed');
      return {
        success: false,
        postsCollected: 0,
        leadsGenerated: 0,
        processingTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * Process a single user - collect posts and analyze in batch
   */
  static async processUser(userId: string): Promise<{
    success: boolean;
    postsCollected: number;
    leadsGenerated: number;
    processingTime: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      logger.info(`[BATCH] Starting batch processing for user ${userId}`);

      // Step 1: Collect all posts for the user
      const collectionResult = await BatchCollectionService.collectUserPosts(userId);
      
      if (collectionResult.totalPostsCollected === 0) {
        logger.info(`[BATCH] No posts collected for user ${userId}`);
        return {
          success: true,
          postsCollected: 0,
          leadsGenerated: 0,
          processingTime: Date.now() - startTime,
        };
      }

      // Step 2: Analyze posts in batch with AI
      const analysisInput = collectionResult.productsWithPosts.map(({ product, posts }) => ({
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
        },
        posts
      }));

      const analysisResult = await analyzeUserPostsBatch(userId, analysisInput);

      // Step 3: Save the best leads
      let leadsGenerated = 0;
      
      for (const result of analysisResult.results) {
        if (result.leads.length > 0) {
          // Find the matching product from our collection input
          const matchingInput = analysisInput.find(input => input.product.id === result.productId);
          const product = matchingInput?.product;

          // Save each qualified lead found
          for (const lead of result.leads) {
            const saved = await this.saveBestLead({ ...lead, product }, userId);
            if (saved) {
              leadsGenerated++;
              logger.info(`[BATCH] Saved high-quality lead for product: ${result.productName} (Score: ${lead.intentScore})`);
            }
          }
        } else {
          logger.info(`[BATCH] No quality lead found for product: ${result.productName}`);
        }
      }

      const processingTime = Date.now() - startTime;
      
      logger.info(`[BATCH] User ${userId} completed: ${collectionResult.totalPostsCollected} posts → ${leadsGenerated} leads in ${processingTime}ms`);

      // Update user's scanning status
      await db.client.user.update({
        where: { id: userId },
        data: { 
          isScanning: false,
          lastScanStatus: 'SUCCESS'
        }
      });



      return {
        success: true,
        postsCollected: collectionResult.totalPostsCollected,
        leadsGenerated,
        processingTime,
      };

    } catch (error: any) {
      logger.error({ error, userId }, 'Batch processing failed');

      // Update user's scanning status with error
      await db.client.user.update({
        where: { id: userId },
        data: { 
          isScanning: false,
          lastScanStatus: 'FAILED'
        }
      });



      return {
        success: false,
        postsCollected: 0,
        leadsGenerated: 0,
        processingTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * Save the best lead for a product
   */
  private static async saveBestLead(bestLead: any, userId: string): Promise<boolean> {
    try {
      const { post, intentLevel, intentScore, reasoning } = bestLead;

      // Check if this lead already exists
      const existing = await db.client.lead.findUnique({
        where: {
          platform_externalPostId_productId: {
            platform: post.platform as any,
            externalPostId: post.externalPostId,
            productId: bestLead.product.id
          }
        }
      });

      if (existing) {
        logger.debug(`[BATCH] Lead already exists: ${post.externalPostId}`);
        return false;
      }

      // Create the lead
      const newLead = await db.client.lead.create({
        data: {
          productId: bestLead.product.id,
          platform: post.platform as any,
          externalPostId: post.externalPostId,
          title: post.title?.substring(0, 255) ?? null,
          content: post.content.substring(0, 5000),
          url: post.url,
          authorUsername: post.authorUsername ?? null,
          intentLevel: intentLevel as IntentLevel,
          intentScore: Math.min(Math.max(intentScore, 0), 100),
          postedAt: post.postedAt ?? null,
          status: LeadStatus.NEW,
          detectedBy: post.detectionMode,
          metadata: { 
            qualificationReasoning: reasoning,
            batchProcessed: true,
            processingTime: new Date().toISOString()
          }
        }
      });

      logger.info(`[BATCH] New lead saved: ${newLead.id} (Score: ${intentScore})`);



      // Integrated Pipeline: Run enrichment and alerts immediately in the same process
      if (post.authorUsername) {
        // Run in background (don't wait for enrichment to continue scan)
        enrichLead(newLead.id, post.authorUsername, post.platform as any).catch(() => {});
      }
      
      // Fire alert (don't wait)
      sendLeadAlert(newLead.id).catch(() => {});

      return true;

    } catch (error: any) {
      if (error.code !== 'P2002') {
        logger.error({ error }, 'Failed to save best lead');
      }
      return false;
    }
  }

  /**
   * Get batch processing statistics for a user
   */
  static async getUserBatchStats(userId: string) {
    const stats = await db.client.lead.groupBy({
      by: ['detectedBy'],
      where: {
        product: { userId },
        metadata: {
          path: ['batchProcessed'],
          equals: true
        }
      },
      _count: { id: true }
    });

    const totalBatchLeads = stats.reduce((sum, stat) => sum + stat._count.id, 0);

    return {
      totalBatchLeads,
      breakdown: stats.map(stat => ({
        detectionMode: stat.detectedBy,
        count: stat._count.id
      }))
    };
  }

  /**
   * Clean up old batch-processed leads (optional maintenance)
   */
  static async cleanupOldBatchLeads(userId: string, daysToKeep: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const deleted = await db.client.lead.deleteMany({
      where: {
        product: { userId },
        metadata: {
          path: ['batchProcessed'],
          equals: true
        },
        createdAt: { lt: cutoffDate },
        status: LeadStatus.DISMISSED
      }
    });

    logger.info(`[BATCH] Cleaned up ${deleted.count} old batch leads for user ${userId}`);
    return deleted.count;
  }
}
