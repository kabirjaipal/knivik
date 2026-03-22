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
  } catch (error: any) {
    logger.error({ message: error.message, action }, 'Failed to write LLM telemetry');
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
  productName: string,
  productDescription: string,
  userId?: string,
  productId?: string
): Promise<IntentAnalysisResult> => {
  const startTime = Date.now();
  const prompt = `
Analyze the buying intent of the following post relative to the product "${productName}".

Product Profile:
- Name: "${productName}"
- Description: "${productDescription}"

Intent Classification Criteria (Strict):
1. BUY_NOW (90-100): The user is explicitly asking for a tool recommendation, asking for pricing, or stating they are ready to switch from a competitor.
2. RESEARCHING (70-89): The user is asking "how do I solve [X]" where X is the core problem your product solves. They are looking for advice/tools.
3. COMPARING (60-69): The user is comparing specific competitors (e.g. "CapCut vs Descript") and needs a tie-breaker.
4. LOW_INTENT (0-59): Generic news, philosophical discussions, career advice, or "Show HN" posts that aren't asking for a solution.

CRITICAL QUALITY RULES:
- If the post is an advertisement, a "Show HN" (unless it's a competitor you can poach from), or a generic industry update → LOW_INTENT.
- If the post is a founder "venting" about their day-to-day without asking for a specific tool → LOW_INTENT.
- If the post is about a different domain (e.g. Medical, Crypto, Real Estate) even if it uses similar words → LOW_INTENT / Score 0.
- Quality over Quantity: It is better to give a 0 to a mediocre post than a 60. We only want "Signal", not "Noise".

Post Content:
"""
${postText}
"""

Return your analysis strictly as a JSON object:
{
  "reasoning": "A brief explanation focusing on why this is or IS NOT a high-quality lead for this specific product category",
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
    logger.error({ message: error.message, status: error.status }, 'Failed to analyze intent:');
    
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
    logger.error({ message: error.message, status: error.status }, 'Failed to detect competitor signal:');
    
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
You are a lead qualification expert. Your goal is to identify posts where the author is facing a SPECIFIC problem that can be solved by the target product.

Target Product Description:
"${productDescription}"

Below are ${posts.length} posts. For EACH post, determine if it represents a REAL OPPORTUNITY or just NOISE.

STRICT FILTERING RULES:
1. Is this a real person with a real problem? (Skip if: bot, ad, meta-discussion, or "I'm building X").
2. Does the problem align with the Target Product? (Skip if: generic SaaS advice, hiring posts, or unrelated tools).
3. "Quality over Quantity": If you are unsure, err on the side of "isMatch: false". We only want the top 10% of posts.

Posts:
${postsJson}

Return a JSON object with a single key "results", containing an array:
{
  "results": [
    {
      "id": "post id",
      "isMatch": boolean,
      "intentScore": number (70+ for matches, 0 for noise),
      "reasoning": "Briefly state the specific pain point that matches, or why it was rejected as noise."
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
    logger.error({ message: error.message, status: error.status }, 'Semantic scan failed:');
    
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

PILLAR 2: NOISE REDUCTION (Negative Keywords & Disqualifiers) (Generate 15-20)
Very important to filter out:
- Career/Education: hiring, job, salary, internship, course, resume, career, interview, bootcamp.
- Generic News/Casual: article, news, meme, funny, blog post, video essay, documentary.
- Irrelevant User States: "I built", "Check out my", "I'm looking for a job", "I'm a student".
- Category Noise: (e.g. if the product is a "Video Editor for SaaS", negative keywords should include "gaming video", "wedding video", "hollywood", "netflix").

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
    logger.error({ message: error.message, status: error.status }, 'Failed to generate product strategy:');
    
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
