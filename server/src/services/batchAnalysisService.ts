import OpenAI from 'openai';
import config from '../lib/config.js';
import { IntentLevel } from '@prisma/client';
import logger from '../lib/logger.js';
import { logLlmUsage } from './aiService.js';

// Initialize Groq client
const groq = new OpenAI({
  apiKey: config.GROQ_API_KEY,
  baseURL: config.GROQ_BASE_URL,
});

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
  keywordMatch?: string;
  competitorMatch?: string;
}

export interface ProductAnalysisResult {
  productId: string;
  productName: string;
  bestLead: {
    post: CollectedPost;
    intentLevel: IntentLevel;
    intentScore: number;
    reasoning: string;
  } | null;
  analysisSummary: string;
}

export interface BatchAnalysisResult {
  userId: string;
  results: ProductAnalysisResult[];
  totalPostsAnalyzed: number;
  processingTime: number;
}

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
      keywords: Array<{ keyword: string }>;
      competitors: Array<{ name: string }>;
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
    keywords: product.keywords.map(k => k.keyword),
    competitors: product.competitors.map(c => c.name),
    postCount: posts.length,
    posts: posts.map(post => ({
      id: post.id,
      platform: post.platform,
      source: post.source,
      title: post.title,
      content: post.content.substring(0, 500), // Limit content length (reduced from 1000)
      author: post.authorUsername,
      postedAt: post.postedAt?.toISOString(),
      detectionMode: post.detectionMode,
      keywordMatch: post.keywordMatch,
      competitorMatch: post.competitorMatch,
      url: post.url
    }))
  }));

  const prompt = `
You are an elite B2B lead qualification specialist. Your task is to analyze ${totalPosts} collected posts across ${collectedPostsByProduct.length} products and identify the SINGLE BEST lead for each product.

PRODUCTS TO ANALYZE:
${productsContext.map((ctx, i) => `
PRODUCT ${i + 1}: "${ctx.productName}"
Description: ${ctx.productDescription}
Target Keywords: ${ctx.keywords.join(', ')}
Competitors: ${ctx.competitors.join(', ')}
Posts to analyze: ${ctx.postCount}

POSTS:
${ctx.posts.map((post, j) => `
Post ${j + 1}:
Platform: ${post.platform}
Source: ${post.source}
Title: "${post.title}"
Content: "${post.content}"
Author: ${post.author}
Posted: ${post.postedAt}
Detection: ${post.detectionMode}${post.keywordMatch ? ` (Keyword: ${post.keywordMatch})` : ''}${post.competitorMatch ? ` (Competitor: ${post.competitorMatch})` : ''}
URL: ${post.url}
`).join('\n---\n')}
`).join('\n\n===\n\n')}

ANALYSIS CRITERIA:
1. BUYING INTENT STRENGTH: Look for explicit "looking for", "need", "recommendations", "alternative to"
2. PROBLEM-FIT: The post must express a problem that THIS SPECIFIC PRODUCT solves
3. URGENCY: Recent posts, time-sensitive language, budget mentions
4. QUALITY FILTERS: Reject self-promotion, job posts, tutorials, general discussion
5. COMPETITOR FRUSTRATION: Posts complaining about competitors are GOLD (high priority)

SELECTION RULES:
- Choose ONLY 1 best lead per product (or none if no quality leads exist)
- Prioritize posts with explicit buying signals for the specific product category
- Score 85+ for explicit buying intent, 70+ for strong research intent
- Provide detailed reasoning for your selection

Return your analysis as JSON:
{
  "results": [
    {
      "productId": "product_id",
      "bestLead": {
        "postId": "post_id",
        "intentLevel": "BUY_NOW" | "RESEARCHING" | "COMPARING" | "LOW_INTENT",
        "intentScore": number (0-100),
        "reasoning": "Detailed explanation of why this is the best lead for this specific product"
      },
      "analysisSummary": "Brief summary of analysis for this product"
    }
  ],
  "overallSummary": "Summary of the batch analysis"
}`;

  logger.info(`[ANALYSIS] Prompt size: ${prompt.length} chars, sending to AI...`);

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { 
          role: 'system', 
          content: 'You are a precision lead qualification expert. You excel at identifying genuine buying signals in online conversations. You are conservative and prefer quality over quantity.' 
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from batch analysis');
    }

    const parsed = JSON.parse(content);
    const elapsed = Date.now() - startTime;
    const usage = response.usage;

    // Log LLM usage
    setImmediate(() => {
      logLlmUsage({
        action: 'batch_analysis',
        model: 'llama-3.3-70b-versatile',
        userId,
        inputTokens: usage?.prompt_tokens || 0,
        outputTokens: usage?.completion_tokens || 0,
        latencyMs: elapsed
      });
    });

    // Convert AI response to our format
    const results: ProductAnalysisResult[] = [];
    let leadsFound = 0;

    for (const productCtx of productsContext) {
      const aiResult = parsed.results.find((r: any) => r.productId === productCtx.productId);
      
      if (aiResult?.bestLead) {
        // Find original post from collectedPostsByProduct, not from productsContext
        const originalProductData = collectedPostsByProduct.find(p => p.product.id === productCtx.productId);
        const originalPost = originalProductData?.posts.find(p => p.id === aiResult.bestLead.postId);
        if (originalPost) {
          results.push({
            productId: productCtx.productId,
            productName: productCtx.productName,
            bestLead: {
              post: originalPost,
              intentLevel: aiResult.bestLead.intentLevel as IntentLevel,
              intentScore: Math.min(Math.max(aiResult.bestLead.intentScore || 0, 0), 100),
              reasoning: aiResult.bestLead.reasoning || 'No reasoning provided'
            },
            analysisSummary: aiResult.analysisSummary || 'Analysis completed'
          });
          leadsFound++;
        }
      } else {
        // No quality lead found for this product
        results.push({
          productId: productCtx.productId,
          productName: productCtx.productName,
          bestLead: null,
          analysisSummary: aiResult?.analysisSummary || 'No quality leads found'
        });
      }
    }

    logger.info(`[ANALYSIS] Complete: ${leadsFound}/${collectedPostsByProduct.length} products have leads (score: ${results.filter(r => r.bestLead).map(r => r.bestLead?.intentScore).join(', ') || 'none'})`);

    return {
      userId,
      results,
      totalPostsAnalyzed: totalPosts,
      processingTime: elapsed,
    };

  } catch (error: any) {
    logger.error({ 
      message: error.message, 
      status: error.status,
      userId,
      totalPosts
    }, 'Batch analysis failed:');

    // Fallback: return empty results
    return {
      userId,
      results: collectedPostsByProduct.map(({ product }) => ({
        productId: product.id,
        productName: product.name,
        bestLead: null,
        analysisSummary: 'Analysis failed due to AI error'
      })),
      totalPostsAnalyzed: totalPosts,
      processingTime: Date.now() - startTime,
    };
  }
};
