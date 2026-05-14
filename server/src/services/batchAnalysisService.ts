import { OpenAI } from 'openai';
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
      content: post.content.substring(0, 350), // Limit content length (was 1000, then 500, now 350 for token limit)
      author: post.authorUsername,
      postedAt: post.postedAt?.toISOString(),
      detectionMode: post.detectionMode,
      keywordMatch: post.keywordMatch,
      competitorMatch: post.competitorMatch,
      url: post.url
    }))
  }));

  const prompt = `
You are an elite B2B lead qualification specialist. Your task is to analyze ${totalPosts} collected posts across ${collectedPostsByProduct.length} products and identify ALL high-quality leads for each product.

PRODUCTS TO ANALYZE:
${productsContext.map((ctx, i) => `
PRODUCT ${i + 1} (Product ID: ${ctx.productId})
Name: "${ctx.productName}"
Description: ${ctx.productDescription}
Target Keywords: ${ctx.keywords.join(', ')}
Competitors: ${ctx.competitors.join(', ')}
Posts to analyze: ${ctx.postCount}

POSTS:
${ctx.posts.map((post, j) => `
Post ID: ${post.id}
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
- Choose ANY post that meets the criteria. You may select multiple leads if they are all good.
- Prioritize posts with explicit buying signals for the specific product category.
- Score 85+ for explicit buying intent, 70+ for strong research intent, and 50+ for pain-point discussions.
- Provide detailed reasoning for each selection.

Return your analysis as JSON:
{
  "results": [
    {
      "productId": "The exact Product ID from the prompt",
      "qualifiedLeads": [
        {
          "postId": "The exact 'Post ID' string provided in the prompt for this post (without prefix)",
          "intentLevel": "BUY_NOW" | "RESEARCHING" | "COMPARING" | "LOW_INTENT",
          "intentScore": number (50-100),
          "reasoning": "Detailed explanation of why this is a good lead."
        }
      ],
      "analysisSummary": "Brief summary of why you rejected posts or why the chosen leads are valid. Be highly specific."
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
    
    // DEBUG: Print exactly what JSON structure the AI returned
    logger.info(`[AI-DEBUG] RAW JSON: ${content}`);

    const parsed = JSON.parse(content);
    const elapsed = Date.now() - startTime;
    const usage = response.usage;

    // Log LLM usage
    setImmediate(() => {
      // If we only analyzed one product, link this log to it
      const singleProductId = collectedPostsByProduct.length === 1 
        ? collectedPostsByProduct[0].product.id 
        : null;

      logLlmUsage({
        action: 'batch_analysis',
        model: 'llama-3.3-70b-versatile',
        userId,
        productId: singleProductId,
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
      
      if (aiResult?.qualifiedLeads && Array.isArray(aiResult.qualifiedLeads) && aiResult.qualifiedLeads.length > 0) {
        // Collect all qualified leads for this product
        const originalProductData = collectedPostsByProduct.find(p => p.product.id === productCtx.productId);
        const validLeads = [];
        
        for (const aiLead of aiResult.qualifiedLeads) {
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
        leads: [],
        analysisSummary: 'Analysis failed due to AI error'
      })),
      totalPostsAnalyzed: totalPosts,
      processingTime: Date.now() - startTime,
    };
  }
};
