import OpenAI from 'openai';
import config from '../lib/config.js';
import { IntentLevel } from '@prisma/client';
import logger from '../lib/logger.js';
import { db } from '../lib/db.js';

// Centralized model registry
const MODELS = {
  FAST: 'llama-3.1-8b-instant',
  VERSATILE: 'llama-3.3-70b-versatile',
};

// Pre-seed known pricing (adjust as needed for accurate dashboard projection later)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  [MODELS.FAST]: { input: 0.05, output: 0.08 },
  [MODELS.VERSATILE]: { input: 0.50, output: 0.80 },
};

async function logLlmUsage(params: {
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
    await db.client.llmModel.upsert({
      where: { id: modelId },
      update: {}, 
      create: { 
        id: modelId, 
        inputPrice: rates.input, 
        outputPrice: rates.output,
        modelOptions: { 
          source: 'groq', 
          reasoning_tokens_supported: modelId.includes('llama-3.3') 
        } 
      }
    });

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
  } catch (error) {
    logger.error({ error, action }, 'Failed to write LLM telemetry');
  }
}

// Initialize Groq client (Groq is OpenAI-compatible)
const groq = new OpenAI({
  apiKey: config.GROQ_API_KEY,
  baseURL: config.GROQ_BASE_URL,
});

export interface IntentAnalysisResult {
  intentLevel: IntentLevel;
  intentScore: number;
}

/**
 * Uses LLM to determine the buying intent of a give post text.
 * Simple task: Classification and Scoring.
 * Model: llama-3.1-8b-instant
 */
export const analyzeIntent = async (
  postText: string,
  userId?: string,
  productId?: string
): Promise<IntentAnalysisResult> => {
  const startTime = Date.now();
  const prompt = `
Analyze the buying intent of the following post with expert-level precision.
Categories:
- BUY_NOW: High intent. The user is actively seeking a product, requesting a demo, or asking for pricing/alternatives to buy immediately.
- RESEARCHING: Medium intent. The user is asking "what is the best...", comparing features, or seeking advice on what's available.
- COMPARING: The user has a shortlist of products and is asking for pros/cons to make a final choice.
- LOW_INTENT: Passive mentions, complaining without wanting a solution, or general news/discussion without intent to purchase.

Score: 0-100 (Where 90+ is a hot lead).

Post Content:
"""
${postText}
"""

Return your analysis strictly as a JSON object with this schema:
{
  "reasoning": "A brief explanation of why you chose this level and score",
  "intentLevel": "BUY_NOW" | "RESEARCHING" | "COMPARING" | "LOW_INTENT",
  "intentScore": number
}
`;

  try {
    const response = await groq.chat.completions.create({
      model: MODELS.FAST, 
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from LLM');
    }

    const parsed = JSON.parse(content);

    // Validate enum
    const validLevels = ['BUY_NOW', 'RESEARCHING', 'COMPARING', 'LOW_INTENT'];
    const assignedLevel = validLevels.includes(parsed.intentLevel)
      ? (parsed.intentLevel as IntentLevel)
      : 'LOW_INTENT';
      
    const assignedScore = typeof parsed.intentScore === 'number' ? parsed.intentScore : 0;

    const elapsed = Date.now() - startTime;
    const usage = response.usage;
    
    // Fire and forget telemetry
    setImmediate(() => {
      logLlmUsage({
        action: 'analyze_intent',
        model: MODELS.FAST,
        userId,
        productId,
        inputTokens: usage?.prompt_tokens || 0,
        outputTokens: usage?.completion_tokens || 0,
        latencyMs: elapsed
      });
    });

    return {
      intentLevel: assignedLevel,
      intentScore: Math.min(Math.max(assignedScore, 0), 100),
    };
  } catch (error: any) {
    logger.error({ error }, 'Failed to analyze intent:');
    
    setImmediate(() => {
      logLlmUsage({
        action: 'analyze_intent',
        model: MODELS.FAST,
        userId,
        productId,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: Date.now() - startTime,
        status: 'error',
        errorMessage: error?.message || 'Unknown error'
      });
    });

    // Fallback if LLM fails
    return {
      intentLevel: 'LOW_INTENT',
      intentScore: 0,
    };
  }
};

/**
 * Generates a helpful, non-spammy reply to a prospect.
 * Reasoning task: Contextual writing and personalization.
 * Model: llama-3.3-70b-versatile
 */
export const generateReply = async (
  postText: string,
  productInfo: { id?: string; userId?: string; name: string; description?: string; aiConfig?: any },
  tone: string = 'helpful and highly concise'
): Promise<string> => {
  const startTime = Date.now();
  const prompt = `
You are representing a product called "${productInfo.name}".
Product description: ${productInfo.description || 'A software tool.'}
Additional guidelines (if any): ${JSON.stringify(productInfo.aiConfig || {})}

Write a helpful response to this person's post.
Goal: Suggest our product naturally as a solution. Provide genuine value, don't sound like a spam bot.
Tone: ${tone}

Post:
"""
${postText}
"""
`;

  try {
    const response = await groq.chat.completions.create({
      model: MODELS.VERSATILE,
      messages: [
        { role: 'system', content: 'You are an authentic, helpful founder replying to online threads.' },
        { role: 'user', content: prompt }
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
    logger.error({ error }, 'Failed to generate reply:');
    
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
// COMPETITOR VENTING DETECTOR
// Fast classifier: did this person express frustration with a specific competitor?
// Model: llama-3.1-8b-instant (fast, cheap)
// ─────────────────────────────────────────────
export interface CompetitorSignalResult {
  detected: boolean;
  competitor: string | null;
  confidence: number; // 0-100
}

export const detectCompetitorSignal = async (
  postText: string,
  competitors: string[],
  userId?: string,
  productId?: string
): Promise<CompetitorSignalResult> => {
  if (!competitors.length) return { detected: false, competitor: null, confidence: 0 };
  const startTime = Date.now();

  const prompt = `
You are analyzing an online post to check if the author is frustrated with, leaving, or comparing against a competitor tool.

Competitors to check: ${competitors.join(', ')}

Post:
"""
${postText}
"""

Does the author express frustration, dissatisfaction, or an intent to switch away from one of these competitors?

Return ONLY a JSON object:
{
  "detected": true | false,
  "competitor": "name of the competitor mentioned, or null",
  "confidence": number (0-100, how confident you are that this is a frustration/switch signal)
}
`;

  try {
    const response = await groq.chat.completions.create({
      model: MODELS.FAST,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No content');

    const elapsed = Date.now() - startTime;
    const usage = response.usage;
    
    setImmediate(() => {
      logLlmUsage({
        action: 'detect_competitor',
        model: MODELS.FAST,
        userId,
        productId,
        inputTokens: usage?.prompt_tokens || 0,
        outputTokens: usage?.completion_tokens || 0,
        latencyMs: elapsed
      });
    });

    const parsed = JSON.parse(content);
    return {
      detected: Boolean(parsed.detected),
      competitor: parsed.competitor || null,
      confidence: typeof parsed.confidence === 'number' ? Math.min(Math.max(parsed.confidence, 0), 100) : 0,
    };
  } catch (error: any) {
    logger.error({ error }, 'Failed to detect competitor signal:');
    
    setImmediate(() => {
      logLlmUsage({
        action: 'detect_competitor',
        model: MODELS.FAST,
        userId,
        productId,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: Date.now() - startTime,
        status: 'error',
        errorMessage: error?.message || 'Unknown error'
      });
    });

    return { detected: false, competitor: null, confidence: 0 };
  }
};

// ─────────────────────────────────────────────
// SEMANTIC BATCH SCANNER
// Sends a batch of raw posts and finds implicit problem-fits.
// No keywords required — pure AI reasoning.
// Model: llama-3.1-8b-instant (context-window optimized)
// ─────────────────────────────────────────────
export interface SemanticScanPost {
  id: string;
  text: string;
}

export interface SemanticScanResult {
  id: string;
  isMatch: boolean;
  intentScore: number;
  reasoning: string;
}

export const semanticScan = async (
  posts: SemanticScanPost[],
  productDescription: string,
  userId?: string,
  productId?: string
): Promise<SemanticScanResult[]> => {
  if (!posts.length) return [];
  const startTime = Date.now();

  const postsJson = posts.map(p => `ID: ${p.id}\nText: "${p.text.substring(0, 500)}"`).join('\n\n---\n\n');

  const prompt = `
You are an expert at detecting whether an online post implicitly describes a problem that a specific product can solve.

Product Description:
"${productDescription}"

Below are ${posts.length} posts. For EACH post, determine:
1. Does the author describe a problem or pain point that this product solves? (even if they don't mention the product by name or use specific keywords)
2. How strong is their purchase intent for a product like this? (0-100)

Posts:
${postsJson}

Return a JSON object with a single key "results", containing an array of exactly ${posts.length} objects:
{
  "results": [
    {
      "id": "the post ID exactly as given",
      "isMatch": true | false,
      "intentScore": number (0-100),
      "reasoning": "one sentence explanation"
    }
  ]
}
`;

  try {
    const response = await groq.chat.completions.create({
      model: MODELS.FAST,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No content');

    const elapsed = Date.now() - startTime;
    const usage = response.usage;
    
    setImmediate(() => {
      logLlmUsage({
        action: 'semantic_scan',
        model: MODELS.FAST,
        userId,
        productId,
        inputTokens: usage?.prompt_tokens || 0,
        outputTokens: usage?.completion_tokens || 0,
        latencyMs: elapsed
      });
    });

    const parsed = JSON.parse(content);
    const results = Array.isArray(parsed.results) ? parsed.results : [];

    return results.map((r: any) => ({
      id: String(r.id),
      isMatch: Boolean(r.isMatch),
      intentScore: typeof r.intentScore === 'number' ? Math.min(Math.max(r.intentScore, 0), 100) : 0,
      reasoning: r.reasoning || '',
    }));
  } catch (error: any) {
    logger.error({ error }, 'Semantic scan failed:');
    
    setImmediate(() => {
      logLlmUsage({
        action: 'semantic_scan',
        model: MODELS.FAST,
        userId,
        productId,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: Date.now() - startTime,
        status: 'error',
        errorMessage: error?.message || 'Unknown error'
      });
    });

    return [];
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
}

export const generateProductStrategy = async (
  name: string,
  description: string,
  userId?: string
): Promise<ProductStrategyResult> => {
  const startTime = Date.now();
  const prompt = `
You are a Senior Growth Marketer and Social Listening Expert with a background in B2B and consumer SaaS.
Your goal is to build a high-conversion social listening strategy for a product on "${config.PROJECT_NAME}".

Product Profile:
- Name: "${name}"
- Core Value Prop: "${description}"

Generate a 4-pillar strategy to capture high-intent leads on Reddit and HackerNews.

PILLAR 1: INTENT-SPECIFIC KEYWORDS (Generate 12-15)
Focus on:
- "Alternative Seekers": (e.g., "alternative to [competitor]", "[competitor] too expensive", "switch from [competitor]")
- "Problem State": (e.g., "how to solve [problem]", "trouble with [task]", "tool for [use case]")
- "Recommendation Requests": (e.g., "best tool for", "any recommendations for", "software like")
- "Budget Hunting": (e.g., "affordable [product type]", "free version of [competitor]")

PILLAR 2: NOISE REDUCTION (Negative Keywords) (Generate 10-12)
Focus on filtering out:
- Career/Education related (e.g., "hiring", "job", "salary", "internship", "course", "resume")
- Generic News/Casual (e.g., "article", "news", "meme", "funny")
- Irrelevant contexts (e.g., "video" if the product is about "video editing software" not "movies")

PILLAR 3: COMPETITIVE LANDSCAPE (Generate 5-6)
Include:
- Direct competitors (the big players)
- Indirect competitors (alternative ways users solve the problem today)

PILLAR 4: TARGET COMMUNITIES (Generate 6-8 Subreddits)
Focus on:
- Primary industry subs (e.g., "SaaS", "startups")
- Niche user-group subs (e.g., "freelance", "contentcreation", "smallbusiness")
- "Ask" subreddits where people seek advice.

Return your strategy strictly as a JSON object:
{
  "keywords": ["intent phrase 1", "intent phrase 2", ...],
  "negativeKeywords": ["negative term 1", "negative term 2", ...],
  "competitors": ["competitor 1", "competitor 2", ...],
  "subreddits": ["subreddit1", "subreddit2", ...]
}
`;

  try {
    const response = await groq.chat.completions.create({
      model: MODELS.FAST, // Fast and effective for this
      messages: [{ role: 'user', content: prompt }],
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
        model: MODELS.FAST,
        userId,
        inputTokens: usage?.prompt_tokens || 0,
        outputTokens: usage?.completion_tokens || 0,
        latencyMs: elapsed
      });
    });

    const parsed = JSON.parse(content);
    return {
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      negativeKeywords: Array.isArray(parsed.negativeKeywords) ? parsed.negativeKeywords : [],
      competitors: Array.isArray(parsed.competitors) ? parsed.competitors : [],
      subreddits: Array.isArray(parsed.subreddits) ? parsed.subreddits : [],
    };
  } catch (error: any) {
    logger.error({ error }, 'Failed to generate product strategy:');
    
    setImmediate(() => {
      logLlmUsage({
        action: 'generate_strategy',
        model: MODELS.FAST,
        userId,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: Date.now() - startTime,
        status: 'error',
        errorMessage: error?.message || 'Unknown error'
      });
    });

    return { keywords: [], negativeKeywords: [], competitors: [], subreddits: [] };
  }
};
