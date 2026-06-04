import { z } from 'zod';
import { IntentLevel } from '@prisma/client';
import { db } from '../lib/db.js';
import logger from '../lib/logger.js';
import { aiLlmRunner, MODELS } from '../lib/aiRunner.js';
import * as batchAnalysisPrompt from '../prompts/batchAnalysis.js';

export interface CollectedPost {
  id: string;
  platform: string;
  externalPostId: string;
  title: string | null;
  content: string;
  url: string;
  authorUsername: string | null;
  postedAt?: Date;
  source: string; // subreddit, community, etc.
  detectionMode: 'KEYWORD' | 'SEMANTIC' | 'COMPETITOR';
}

export interface ProductAnalysisResult {
  productId: string;
  productName: string;
  leads: Array<{
    post: CollectedPost;
    intentLevel: IntentLevel;
    intentScore: number;
    reasoning: string;
  }>;
  analysisSummary: string;
}

export interface BatchAnalysisResult {
  userId: string;
  results: ProductAnalysisResult[];
  totalPostsAnalyzed: number;
  processingTime: number;
}

interface BatchAnalysisOutput {
  results: Array<{
    productId: string;
    qualifiedLeads: Array<{
      postId: string;
      intentLevel: 'BUY_NOW';
      intentScore: number;
      reasoning: string;
    }>;
    analysisSummary: string;
  }>;
  overallSummary: string;
}

const batchAnalysisSchema = z.object({
  results: z.array(
    z.object({
      productId: z.string(),
      qualifiedLeads: z.array(
        z.object({
          postId: z.string(),
          intentLevel: z.enum(['BUY_NOW']),
          intentScore: z.number().int().min(0).max(100),
          reasoning: z.string(),
        })
      ),
      analysisSummary: z.string(),
    })
  ),
  overallSummary: z.string(),
});

/**
 * Batch AI Analysis - Processes all collected posts for a user in a single AI call
 * to find the highest quality lead per product.
 */
export const analyzeUserPostsBatch = async (
  userId: string,
  collectedPostsByProduct: Array<{
    product: {
      id: string;
      name: string;
      description: string | null;
      productType?: 'product' | 'service';
    };
    posts: CollectedPost[];
  }>
): Promise<BatchAnalysisResult> => {
  const startTime = Date.now();
  
  if (collectedPostsByProduct.length === 0) {
    logger.info(`[ANALYSIS] No posts to analyze for user ${userId}`);
    return {
      userId,
      results: [],
      totalPostsAnalyzed: 0,
      processingTime: Date.now() - startTime,
    };
  }

  const totalPosts = collectedPostsByProduct.reduce((sum, p) => sum + p.posts.length, 0);
  logger.info(`[ANALYSIS] Starting AI analysis for user ${userId}: ${totalPosts} posts across ${collectedPostsByProduct.length} products`);

  // Debug: Log all posts being analyzed
  for (const { product, posts } of collectedPostsByProduct) {
    logger.info(`[ANALYSIS] Product "${product.name}" posts to analyze:`);
    posts.forEach((post, i) => {
      logger.info(`[ANALYSIS]  ${i + 1}. [${post.platform}] ${post.title?.substring(0, 80) || 'No title'}... (${post.detectionMode})`);
      logger.info(`[ANALYSIS]     Content: ${post.content?.substring(0, 150) || 'No content'}...`);
    });
  }

  // Build comprehensive context for AI
  const productsContext = collectedPostsByProduct.map(({ product, posts }) => ({
    productId: product.id,
    productName: product.name,
    productDescription: product.description || '',
    productType: product.productType || 'product',
    postCount: posts.length,
    posts: posts.map(post => ({
      id: post.id,
      platform: post.platform,
      source: post.source,
      title: post.title,
      content: post.content.substring(0, 600), // 600 chars captures budget/urgency signals missed at 350
      author: post.authorUsername,
      postedAt: post.postedAt?.toISOString(),
      detectionMode: post.detectionMode,
      url: post.url
    }))
  }));

  const systemPrompt = batchAnalysisPrompt.systemPrompt;
  const userPrompt = batchAnalysisPrompt.getUserPrompt(productsContext);

  logger.info(`[ANALYSIS] System prompt size: ${systemPrompt.length} chars, User prompt size: ${userPrompt.length} chars, sending to AI...`);

  // If we only analyzed one product, link this log to it
  const singleProductId = collectedPostsByProduct.length === 1 
    ? collectedPostsByProduct[0].product.id 
    : null;

  try {
    const parsed = await aiLlmRunner<BatchAnalysisOutput>({
      action: 'batch_analysis',
      model: MODELS.VERSATILE,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.1,
      userId,
      productId: singleProductId,
      responseFormat: 'json',
      schema: batchAnalysisSchema,
    });

    // Fetch user's alert setting to get their minIntentScore (Scan Sensitivity Threshold)
    const alertSetting = await db.client.alertSetting.findUnique({
      where: { userId }
    });
    const threshold = alertSetting?.minIntentScore ?? 85;
    logger.info(`[ANALYSIS] Using Scan Sensitivity Threshold of ${threshold}% for user ${userId}`);

    // Convert AI response to our format
    const results: ProductAnalysisResult[] = [];
    let leadsFound = 0;

    for (const productCtx of productsContext) {
      const aiResult = parsed.results.find((r: any) => r.productId === productCtx.productId);
      
      if (aiResult?.qualifiedLeads && Array.isArray(aiResult.qualifiedLeads) && aiResult.qualifiedLeads.length > 0) {
        // Collect all qualified leads for this product
        const originalProductData = collectedPostsByProduct.find(p => p.product.id === productCtx.productId);
        const validLeads = [];
        
        for (const aiLead of aiResult.qualifiedLeads) {
          // Only allow BUY_NOW intent level
          if (aiLead.intentLevel !== 'BUY_NOW') {
            continue;
          }

          // Hard-enforce score threshold based on Scan Sensitivity Threshold
          const score = aiLead.intentScore || 0;
          if (score < threshold) {
            logger.debug({ postId: aiLead.postId, score, threshold }, '[ANALYSIS] BUY_NOW lead below Scan Sensitivity Threshold — dropped');
            continue;
          }

          const rawId = String(aiLead.postId).trim();
          // Exact match first — prevents mismatches between e.g. "reddit-abc" and "reddit-recent-abc"
          const originalPost = originalProductData?.posts.find(p => p.id === rawId)
            ?? originalProductData?.posts.find(p => p.id.endsWith(rawId) || rawId.endsWith(p.externalPostId));
          
          if (originalPost) {
            validLeads.push({
              post: originalPost,
              intentLevel: aiLead.intentLevel as IntentLevel,
              intentScore: Math.min(Math.max(aiLead.intentScore || 0, 0), 100),
              reasoning: aiLead.reasoning || 'No reasoning provided'
            });
            leadsFound++;
          }
        }
        
        results.push({
          productId: productCtx.productId,
          productName: productCtx.productName,
          leads: validLeads,
          analysisSummary: aiResult.analysisSummary || 'Analysis completed'
        });
      } else {
        // No quality lead found for this product
        results.push({
          productId: productCtx.productId,
          productName: productCtx.productName,
          leads: [],
          analysisSummary: aiResult?.analysisSummary || parsed.overallSummary || 'No quality leads found (AI returned empty results)'
        });
      }
    }

    logger.info(`[ANALYSIS] Complete: ${leadsFound}/${collectedPostsByProduct.length} products have leads (found ${leadsFound} total valid leads)`);

    return {
      userId,
      results,
      totalPostsAnalyzed: totalPosts,
      processingTime: Date.now() - startTime,
    };

  } catch (error: any) {
    logger.error({ 
      message: error.message, 
      userId,
      totalPosts
    }, 'Batch analysis failed:');

    // Fallback: return empty results
    return {
      userId,
      results: collectedPostsByProduct.map(({ product }) => ({
        productId: product.id,
        productName: product.name,
        leads: [],
        analysisSummary: 'Analysis failed due to AI error'
      })),
      totalPostsAnalyzed: totalPosts,
      processingTime: Date.now() - startTime,
    };
  }
};
