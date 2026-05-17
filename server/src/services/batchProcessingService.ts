import { db } from '../lib/db.js';
import logger from '../lib/logger.js';
import { IntentLevel, LeadStatus } from '@prisma/client';
import { BatchCollectionService } from './batchCollectionService.js';
import { analyzeUserPostsBatch } from './batchAnalysisService.js';

import { enrichLead } from './enrichmentService.js';
import { sendLeadAlert } from './alertService.js';
import { emitScanStatus } from '../lib/socket.js';

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
    let userId: string | undefined;
    
    try {
      // Get the product with its settings
      const product = await db.client.product.findUnique({
        where: { id: productId, isActive: true },
      });

      if (!product) {
        throw new Error('Product not found or inactive');
      }

      userId = product.userId;

      // Set scanning status
      await db.client.user.update({
        where: { id: userId },
        data: { isScanning: true }
      });
      emitScanStatus(userId, productId, true, 'STARTED');

      // Step 1: Collect posts for this product
      const sourceBreakdown: Record<string, number> = {};
      const posts = await BatchCollectionService.collectProductPosts(product, sourceBreakdown);
      
      if (posts.length === 0) {
        
        // Reset scanning status
        await db.client.user.update({
          where: { id: userId },
          data: { isScanning: false, lastScanStatus: 'SUCCESS' }
        });
        emitScanStatus(userId, productId, false, 'SUCCESS');

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

      const analysisResult = await analyzeUserPostsBatch(userId, analysisInput);

      // Step 3: Save results
      let leadsGenerated = 0;
      for (const result of analysisResult.results) {
        if (result.leads.length > 0) {
          for (const lead of result.leads) {
            const saved = await this.saveBestLead({ ...lead, product }, userId);
            if (saved) leadsGenerated++;
          }
        }
      }

      // Reset scanning status
      await db.client.user.update({
        where: { id: userId },
        data: { isScanning: false, lastScanStatus: 'SUCCESS' }
      });
      emitScanStatus(userId, productId, false, 'SUCCESS');

      // Finalize
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        postsCollected: posts.length,
        leadsGenerated,
        processingTime,
      };

    } catch (error: any) {
      logger.error({ error, productId }, 'Product processing failed');
      
      if (userId) {
        await db.client.user.update({
          where: { id: userId },
          data: { isScanning: false, lastScanStatus: 'FAILED' }
        });
        emitScanStatus(userId, productId, false, 'FAILED');
      }

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
      // Step 1: Collect all posts for the user
      const collectionResult = await BatchCollectionService.collectUserPosts(userId);
      
      if (collectionResult.totalPostsCollected === 0) {
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
            }
          }
        }
      }

      const processingTime = Date.now() - startTime;

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
        return false;
      }

      // Check lead limit quota
      const { checkLeadQuota, incrementLeadUsage } = await import('../lib/plans.js');
      const user = await db.client.user.findUnique({ where: { id: userId } });
      
      if (!user || !(await checkLeadQuota(userId, user.plan as any))) {
        logger.warn({ userId, productId: bestLead.product.id }, 'Lead limit reached. Skipping save.');
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

      // Increment usage
      await incrementLeadUsage(userId);



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

    return deleted.count;
  }
}
