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
      url: post.url
    }))
  }));

  const systemPrompt = `
You are an elite B2B lead qualification specialist. Your task is to analyze a batch of collected posts across multiple products and identify ALL high-quality leads for each product.

EXPECTED INPUT FORMAT:
You will receive a JSON array representing products and their candidate posts to analyze:
[
  {
    "productId": "string",
    "productName": "string",
    "productDescription": "string",
    "posts": [
      {
        "id": "string (The post ID)",
        "platform": "string (e.g. REDDIT, HACKERNEWS, TWITTER)",
        "source": "string (e.g. subreddit or community)",
        "title": "string",
        "content": "string (The post body)",
        "author": "string",
        "postedAt": "string (ISO Date)",
        "detectionMode": "string (e.g. SEMANTIC, KEYWORD)",
        "url": "string"
      }
    ]
  }
]

ANALYSIS CRITERIA:
1. BUYING INTENT STRENGTH: Look for explicit "looking for", "need", "recommendations", "alternative to".
2. PROBLEM-FIT: The post must express a problem that the specific product solves.
3. URGENCY: Recent posts, time-sensitive language, budget mentions.
4. QUALITY FILTERS: Strictly reject self-promotion, job posts, tutorials, general discussion, and spam.
5. COMPETITOR FRUSTRATION: Posts complaining about competitors are GOLD (highest priority).

SELECTION RULES:
- Choose ANY post that meets the criteria. You may select multiple leads per product if they are all qualified.
- Score 85+ for explicit buying intent, 70+ for strong research intent, and 50+ for pain-point discussions.
- Provide detailed, blunt explanation reasoning for each qualified lead.

EXPECTED OUTPUT FORMAT:
You must strictly return ONLY a valid, minified JSON object matching this structure:
{
  "results": [
    {
      "productId": "The exact Product ID from the input",
      "qualifiedLeads": [
        {
          "postId": "The exact Post ID string from the input (without platform prefix, match the input id exactly)",
          "intentLevel": "BUY_NOW" | "RESEARCHING" | "COMPARING" | "LOW_INTENT",
          "intentScore": number (50-100),
          "reasoning": "Detailed explanation of why this is a good lead or competitor poaching opportunity."
        }
      ],
      "analysisSummary": "Brief summary of why you rejected posts or why the chosen leads are valid. Be highly specific."
    }
  ],
  "overallSummary": "Summary of the entire batch analysis."
}

CONSTRAINTS:
- Return strictly ONLY JSON. Do not include markdown code block fences (e.g. \`\`\`json), trailing commas, or explaining notes.
- Be highly selective. Reject noise.
`;

  const userPrompt = JSON.stringify(productsContext);

  logger.info(`[ANALYSIS] System prompt size: ${systemPrompt.length} chars, User prompt size: ${userPrompt.length} chars, sending to AI...`);

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
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
