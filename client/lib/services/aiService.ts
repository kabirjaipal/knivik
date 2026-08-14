import { z } from 'zod';
import config from '../config';
import logger from '../logger';
import * as outreachReplyPrompt from '../prompts/outreachReply';
import * as productStrategyPrompt from '../prompts/productStrategy';
import { aiLlmRunner, MODELS } from '../aiRunner';

export { logLlmUsage } from '../aiRunner';

/**
 * Generates a helpful, non-spammy reply to a prospect.
 * Reasoning task: Contextual writing and personalization.
 * Model: llama-3.3-70b-versatile
 */
export const generateReply = async (
  postText: string,
  productInfo: { id?: string; userId?: string; name: string; description?: string; config?: any },
  tone: string = 'helpful, detailed, and naturally engaging'
): Promise<string> => {
  const customPersona = productInfo.config?.customPersona;
  const productType = productInfo.config?.productType || 'product';
  
  const systemPrompt = outreachReplyPrompt.systemPrompt;
  const userPrompt = outreachReplyPrompt.getUserPrompt({
    productName: productInfo.name,
    productDescription: productInfo.description || (productType === 'service' ? 'A professional service.' : 'A software tool.'),
    tone,
    customPersona,
    postText,
    productType,
  });

  try {
    const text = await aiLlmRunner({
      action: 'generate_reply',
      model: MODELS.VERSATILE,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
      userId: productInfo.userId,
      productId: productInfo.id,
      responseFormat: 'text'
    });
    return text;
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to generate outreach reply');
    return 'Hi! Based on your post, our tool might be exactly what you need. Would love to chat more if you are interested.';
  }
};

// ─────────────────────────────────────────────
// PRODUCT STRATEGY GENERATOR
// Takes a simple Name + Description and generates:
// - Positive keywords for scanning
// - Negative keywords for filtering noise
// - Competitor names for poaching
// ─────────────────────────────────────────────
export interface ProductStrategyResult {
  keywords: string[];
  negativeKeywords: string[];
  competitors: string[];
  subreddits: string[];
  twitterHandles: string[];
  linkedinSearchFlags: string[];
  productHuntCommunities: string[];
  searchQueries: string[];
}

const strategyResponseSchema = z.object({
  keywords: z.array(z.string()),
  negativeKeywords: z.array(z.string()),
  competitors: z.array(z.string()),
  subreddits: z.array(z.string()),
  twitterHandles: z.array(z.string()),
  linkedinSearchFlags: z.array(z.string()),
  productHuntCommunities: z.array(z.string()),
  searchQueries: z.array(z.string()),
});

export const generateProductStrategy = async (
  name: string,
  description: string,
  userId?: string,
  productId?: string,
  productType?: 'product' | 'service'
): Promise<ProductStrategyResult> => {
  const systemPrompt = productStrategyPrompt.systemPrompt;
  const userPrompt = productStrategyPrompt.getUserPrompt({
    projectName: config.PROJECT_NAME,
    productName: name,
    productDescription: description,
    productType,
  });

  try {
    const parsed = await aiLlmRunner<ProductStrategyResult>({
      action: 'generate_strategy',
      model: MODELS.VERSATILE,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.2,
      userId,
      productId,
      responseFormat: 'json',
      schema: strategyResponseSchema,
    });

    // Filter suggestions to ensure they are valid strings, preserving casing and length from the AI
    const rawSubreddits = Array.isArray(parsed.subreddits) ? parsed.subreddits : [];
    const rawTwitterHandles = Array.isArray(parsed.twitterHandles) ? parsed.twitterHandles : [];
    
    const validSubreddits = rawSubreddits
      .filter((sub: any) => typeof sub === 'string' && sub.trim().length > 0);

    const validTwitterHandles = rawTwitterHandles
      .filter((h: any) => typeof h === 'string' && h.trim().length > 0);

    logger.info({ 
      rawSubreddits: rawSubreddits.length, 
      rawTwitter: rawTwitterHandles.length 
    }, 'Processed AI-generated communities');

    // Clean generated search queries
    const searchQueries: string[] = Array.isArray(parsed.searchQueries) ? parsed.searchQueries : [];
    const validSearchQueries = searchQueries
      .filter((q: any) => typeof q === 'string' && q.trim().length > 0);

    return {
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      negativeKeywords: Array.isArray(parsed.negativeKeywords) ? parsed.negativeKeywords : [],
      competitors: Array.isArray(parsed.competitors) ? parsed.competitors : [],
      subreddits: validSubreddits,
      twitterHandles: validTwitterHandles,
      linkedinSearchFlags: Array.isArray(parsed.linkedinSearchFlags) ? parsed.linkedinSearchFlags : [],
      productHuntCommunities: Array.isArray(parsed.productHuntCommunities) ? parsed.productHuntCommunities : [],
      searchQueries: validSearchQueries
    };
  } catch (error: any) {
    logger.error({ message: error.message }, 'Failed to generate product strategy:');
    
    return { 
      keywords: [], 
      negativeKeywords: [], 
      competitors: [], 
      subreddits: [], 
      twitterHandles: [], 
      linkedinSearchFlags: [], 
      productHuntCommunities: [],
      searchQueries: []
    };
  }
};
