import { OpenAI } from 'openai';
import config from '../lib/config.js';
import logger from '../lib/logger.js';
import { db } from '../lib/db.js';
import * as outreachReplyPrompt from '../prompts/outreachReply.js';
import * as productStrategyPrompt from '../prompts/productStrategy.js';

// Centralized model registry (Optimized for 2026 Profitability)
const MODELS = {
  LITE: 'llama-3.1-8b-instant',      // Ultra-cheap scoring ($0.05)
  VERSATILE: 'llama-3.3-70b-versatile', // High-reasoning replies ($0.59)
};

// Pricing per 1M tokens (USD) - Groq 2026 Rates
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  [MODELS.LITE]: { input: 0.05, output: 0.08 },
  [MODELS.VERSATILE]: { input: 0.59, output: 0.79 },
};

export async function logLlmUsage(params: {
  action: string;
  model: string;
  userId?: string | null | undefined;
  productId?: string | null | undefined;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  status?: string | undefined;
  errorMessage?: string | undefined;
}) {
  const { action, model: modelId, userId, productId, inputTokens, outputTokens, latencyMs, status = 'success', errorMessage } = params;
  const totalTokens = inputTokens + outputTokens;

  try {
    // 1. Ensure the pricing model exists in the database (safeguard)
    const rates = MODEL_PRICING[modelId as keyof typeof MODEL_PRICING] || { input: 0, output: 0 };
    try {
      // Check if the model already exists first to avoid triggering Prisma's global error logger
      const existingModel = await db.client.llmModel.findUnique({
        where: { id: modelId },
        select: { id: true }
      });

      if (!existingModel) {
        await db.client.llmModel.create({
          data: { 
            id: modelId, 
            inputPrice: rates.input, 
            outputPrice: rates.output,
            modelOptions: { 
              source: 'groq', 
              reasoning_tokens_supported: modelId.includes('llama-3.3') 
            } 
          }
        });
      }
    } catch (createError: any) {
      // In case of a race condition between the check and the create, 
      // we still catch P2002 but it's much less likely to happen.
      if (createError.code !== 'P2002') {
        throw createError;
      }
    }

    // 2. Log exactly how many tokens were used
    await db.client.llmUsageLog.create({
      data: {
        action,
        modelId,
        userId: userId || null,
        productId: productId || null,
        inputTokens,
        outputTokens,
        totalTokens,
        latencyMs,
        status,
        errorMessage: errorMessage || null,
      }
    });
  } catch (error: any) {
    logger.error({ message: error.message, action }, 'Failed to write LLM telemetry');
  }
}

// Initialize Groq client (Groq is OpenAI-compatible)
const groq = new OpenAI({
  apiKey: config.GROQ_API_KEY,
  baseURL: config.GROQ_BASE_URL,
});

/**
 * Generates a helpful, non-spammy reply to a prospect.
 * Reasoning task: Contextual writing and personalization.
 * Model: llama-3.3-70b-versatile
 */
export const generateReply = async (
  postText: string,
  productInfo: { id?: string; userId?: string; name: string; description?: string; aiConfig?: any },
  tone: string = 'helpful, detailed, and naturally engaging'
): Promise<string> => {
  const startTime = Date.now();
  const customPersona = productInfo.aiConfig?.customPersona;
  
  const systemPrompt = outreachReplyPrompt.systemPrompt;
  const userPrompt = outreachReplyPrompt.getUserPrompt({
    productName: productInfo.name,
    productDescription: productInfo.description || 'A software tool.',
    tone,
    customPersona,
    postText,
  });

  try {
    const response = await groq.chat.completions.create({
      model: MODELS.VERSATILE,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
    });

    const elapsed = Date.now() - startTime;
    const usage = response.usage;
    
    setImmediate(() => {
      logLlmUsage({
        action: 'generate_reply',
        model: MODELS.VERSATILE,
        userId: productInfo.userId,
        productId: productInfo.id,
        inputTokens: usage?.prompt_tokens || 0,
        outputTokens: usage?.completion_tokens || 0,
        latencyMs: elapsed
      });
    });

    return response.choices[0]?.message?.content || '';
  } catch (error: any) {
    logger.error({ message: error.message, status: error.status }, 'Failed to generate reply:');
    
    setImmediate(() => {
      logLlmUsage({
        action: 'generate_reply',
        model: MODELS.VERSATILE,
        userId: productInfo.userId,
        productId: productInfo.id,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: Date.now() - startTime,
        status: 'error',
        errorMessage: error?.message || 'Unknown error'
      });
    });

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

export const generateProductStrategy = async (
  name: string,
  description: string,
  userId?: string
): Promise<ProductStrategyResult> => {
  const startTime = Date.now();
  const systemPrompt = productStrategyPrompt.systemPrompt;
  const userPrompt = productStrategyPrompt.getUserPrompt({
    projectName: config.PROJECT_NAME,
    productName: name,
    productDescription: description,
  });

  try {
    const response = await groq.chat.completions.create({
      model: MODELS.VERSATILE, // 70b model produces dramatically better, more specific strategy queries
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No content');

    const elapsed = Date.now() - startTime;
    const usage = response.usage;
    
    setImmediate(() => {
      logLlmUsage({
        action: 'generate_strategy',
        model: MODELS.VERSATILE,
        userId,
        inputTokens: usage?.prompt_tokens || 0,
        outputTokens: usage?.completion_tokens || 0,
        latencyMs: elapsed
      });
    });

    const parsed = JSON.parse(content);
    
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
    logger.error({ message: error.message, status: error.status }, 'Failed to generate product strategy:');
    
    setImmediate(() => {
      logLlmUsage({
        action: 'generate_strategy',
        model: MODELS.VERSATILE,
        userId,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: Date.now() - startTime,
        status: 'error',
        errorMessage: error?.message || 'Unknown error'
      });
    });

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
