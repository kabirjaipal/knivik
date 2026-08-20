import { z } from 'zod';
import { IntentLevel } from '@prisma/client';
import { db } from '../db';
import logger from '../logger';
import { aiLlmRunner, MODELS } from '../ai-runner';
import * as batchAnalysisPrompt from '../prompts/batchAnalysis';

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

import { batchAnalysisSchema, BatchAnalysisOutput } from '../prompts/batchAnalysis';

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
    return {
      userId,
      results: [],
      totalPostsAnalyzed: 0,
      processingTime: Date.now() - startTime,
    };
  }

  const totalPosts = collectedPostsByProduct.reduce((sum, p) => sum + p.posts.length, 0);

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
          const score = aiLead.intentScore || 0;
          const isBuyNow = aiLead.intentLevel === 'BUY_NOW';
          const meetsThreshold = score >= threshold;

          // Only allow BUY_NOW intent level
          if (!isBuyNow) {
            continue;
          }

          // Hard-enforce score threshold based on Scan Sensitivity Threshold
          if (!meetsThreshold) {
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
