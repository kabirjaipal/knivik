import { OpenAI } from 'openai';
import config from '../lib/config.js';
import { IntentLevel } from '@prisma/client';
import logger from '../lib/logger.js';
import { db } from '../lib/db.js';

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

export interface IntentAnalysisResult {
  intentLevel: IntentLevel;
  intentScore: number;
  reasoning: string;
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

Target Product Profile:
- Name: "${productName}"
- Core Solution: "${productDescription}"

---
STEP 1: IDENTITY & ROLE (STRICT FILTER)
Is the author a "Seeker" or a "Provider"?
- PROVIDERS (Score 0): founders selling their own tool ("Show HN", "I built X"), experts giving advice ("10 tips for Y"), or storytellers sharing growth hacks ("How I hit 10k MRR").
- SEEKERS (Potential Lead): people asking for recommendations, complaining about a current tool's cost/difficulty, or expressing a specific pain point that "${productName}" fixes.

STEP 2: AUTO-REJECTION PATTERNS (CRITICAL - SCORE 0)
If the post fits ANY of these, it is NOISE. Give it 0:
- "Look what I made": Posts titled "Show HN", "I built", "Check out my tool".
- "I'm a Mentor": "Here is how to...", "My lessons after 5 years...", "The definitive guide to...".
- "Hiring/Job Search": "Looking for a dev...", "I need a job", "Hiring for X".
- "Generic News": "The new OpenAI update is crazy...", "Is Twitter dying?".
- "Meta/Community": "How does everyone handle taxes?", "What's the best chair for devs?".

STEP 3: INTENT CLASSIFICATION
1. BUY_NOW (90-100): Direct "I'm looking for a tool that does X right now", "Which [Competitor] alternative should I use?", "I have $X and need a solution".
2. RESEARCHING (70-89): "My biggest pain right now is [problem solved by ${productName}]", "How do you guys handle [specific task] without spending hours?".
3. COMPARING (60-69): "Is [Competitor A] better than [Competitor B] for [Task]?", "Why is [Competitor] so expensive lately?".
4. LOW_INTENT (0): Relevant topic but NO GAP or PAIN EXPRESSED.

---
STRICTNESS RULE: 
- 90% of your results should likely be 0. We only want the TOP 1% OF SIGNAL.
- If the post is 99% relevant but is a STORY or ADVICE, you MUST give it 0.
- If the user is SHARING A SUCCESS, they are NOT a lead today. Give them 0.

Post Content:
"""
${postText}
"""

Return your analysis strictly as a JSON object:
{
  "reasoning": "A blunt explanation: why is this a REAL buyer vs just another noisy founder post?",
  "intentLevel": "BUY_NOW" | "RESEARCHING" | "COMPARING" | "LOW_INTENT",
  "intentScore": number
}
`;

  try {
    const response = await groq.chat.completions.create({
      model: MODELS.LITE, 
      messages: [
        { 
          role: 'system', 
          content: 'You are an elite Lead Qualification Agent. Your job is to separate "Buying Signal" from "Community Noise". You have a zero-tolerance policy for noise.' 
        },
        { role: 'user', content: prompt }
      ],
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
        model: MODELS.LITE,
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
      reasoning: parsed.reasoning || 'No reasoning provided.',
    };
  } catch (error: any) {
    logger.error({ 
      message: error.message, 
      status: error.status,
      body: error.error // Groq sometimes puts details here
    }, 'Failed to analyze intent:');
    
    setImmediate(() => {
      logLlmUsage({
        action: 'analyze_intent',
        model: MODELS.LITE,
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
      reasoning: 'Error during intent analysis.'
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
  const customPersona = productInfo.aiConfig?.customPersona;
  
  const prompt = `
You are representing a product called "${productInfo.name}".
Product description: ${productInfo.description || 'A software tool.'}

Write a helpful response to this person's post.
Goal: Suggest our product naturally as a solution. Provide genuine value, don't sound like a spam bot.
Tone: ${tone}

Post:
"""
${postText}
"""
`;

  const systemContent = customPersona 
    ? `You are an authentic, helpful founder replying to online threads. STRICTLY FOLLOW THIS CUSTOM PERSONA: ${customPersona}`
    : `You are an authentic, helpful founder replying to online threads.`;

  try {
    const response = await groq.chat.completions.create({
      model: MODELS.VERSATILE,
      messages: [
        { role: 'system', content: systemContent },
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
  reasoning: string;
}

export const detectCompetitorSignal = async (
  postText: string,
  competitors: string[],
  userId?: string,
  productId?: string
): Promise<CompetitorSignalResult> => {
  if (!competitors.length) return { detected: false, competitor: null, confidence: 0, reasoning: 'No competitors for this product.' };
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
  "confidence": number (0-100, how confident you are that this is a frustration/switch signal),
  "reasoning": "What was the signal or lack of?"
}
`;

  try {
    const response = await groq.chat.completions.create({
      model: MODELS.VERSATILE,
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
        model: MODELS.VERSATILE,
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
      reasoning: parsed.reasoning || '',
    };
  } catch (error: any) {
    logger.error({ message: error.message, status: error.status }, 'Failed to detect competitor signal:');
    
    setImmediate(() => {
      logLlmUsage({
        action: 'detect_competitor',
        model: MODELS.VERSATILE,
        userId,
        productId,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: Date.now() - startTime,
        status: 'error',
        errorMessage: error?.message || 'Unknown error'
      });
    });

    return { detected: false, competitor: null, confidence: 0, reasoning: 'Error during competitor detection.' };
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
You are a Lead Qualification Specialist. Your goal is to identify HIGH-INTENT buyer signals and reject 100% of community noise.

Target Product Description:
"${productDescription}"

4. "STRICT RELEVANCE": The post must express a need for THE SPECIFIC SOLUTION describe above. If the product is a "Video Editor" and the post is about "Marketing Strategy" or "Onboarding", it is a REJECT, even if the person is a SaaS founder.
5. "BE SKEPTICAL": Most posts are founders talking to founders. They are NOT leads. Only find the 1% who are actually struggling and looking for THE SPECIFIC TOOL category.

Check these ${posts.length} posts:
${postsJson}

Return a JSON object with a single key "results", containing an array:
{
  "results": [
    {
      "id": "post id",
      "isMatch": boolean,
      "intentScore": number (85+ for direct pain/need for THIS solution, 0 otherwise),
      "reasoning": "A blunt reality check: why does THIS product specifically solve THIS person's actual problem? Or why is it irrelevant noise?"
    }
  ]
}
`;

  try {
    const response = await groq.chat.completions.create({
      model: MODELS.VERSATILE,
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
        model: MODELS.VERSATILE,
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
        model: MODELS.VERSATILE,
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
  twitterHandles: string[];
  linkedinSearchFlags: string[];
  productHuntCommunities: string[];
}

/**
 * Validate subreddit names by checking if they exist on Reddit
 * Uses Reddit's JSON API to verify subreddit exists
 */
async function validateSubreddits(subreddits: string[]): Promise<string[]> {
  const valid: string[] = [];
  const maxToCheck = 25; // Check more subreddits to ensure we get at least 10 valid ones
  
  for (const sub of subreddits.slice(0, maxToCheck)) {
    // Stop early if we already have 10 valid subreddits
    if (valid.length >= 10) break;
    
    // Strict alphanumeric sanitization to prevent path traversal or SSRF via malicious handles
    const cleanSub = sub.toLowerCase().replace(/^r\//, '').replace(/[^a-z0-9_]/g, '');
    if (!cleanSub || cleanSub.length < 2) continue;

    
    try {
      const url = `https://www.reddit.com/r/${cleanSub}/about.json`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Knivik-Validator/1.0 (Product Strategy Validation)',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(3000) // Reduced timeout from 5s to 3s
      });
      
      if (response.ok) {
        const data = await response.json() as any;
        // Check if it's a real subreddit with subscribers
        if (data?.data?.subscribers && data.data.subscribers > 100) {
          valid.push(cleanSub);
          logger.debug(`[VALIDATE] Subreddit r/${cleanSub} exists (${data.data.subscribers} subscribers)`);
        } else if (data?.data) {
          valid.push(cleanSub); // Exists even if small
        }
      } else if (response.status === 404) {
        logger.debug(`[VALIDATE] Subreddit r/${cleanSub} does not exist (404)`);
      }
    } catch (err: any) {
      logger.debug(`[VALIDATE] Failed to check r/${cleanSub}: ${err.message}`);
    }
    
    // Minimal delay to avoid rate limits - 50ms instead of 300ms
    await new Promise(r => setTimeout(r, 50));
  }
  
  return valid;
}

/**
 * Validate Twitter handles by checking if they exist
 * Uses Nitter as a lightweight check (no auth needed)
 */
async function validateTwitterHandles(handles: string[]): Promise<string[]> {
  const valid: string[] = [];
  const nitterInstances = ['nitter.privacydev.net', 'nitter.net', 'nitter.cz'];
  const maxToCheck = 15; // Check more handles to get at least 6 valid ones
  
  for (const handle of handles.slice(0, maxToCheck)) {
    // Stop early if we already have 6 valid handles
    if (valid.length >= 6) break;
    
    // Strict alphanumeric sanitization for Twitter handles
    const cleanHandle = handle.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanHandle || cleanHandle.length < 2) continue;

    
    let isValid = false;
    
    for (const instance of nitterInstances) {
      try {
        const url = `https://${instance}/${cleanHandle}`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.0.36',
            'Accept': 'text/html',
          },
          signal: AbortSignal.timeout(3000), // Reduced from 5s to 3s
          redirect: 'manual'
        });
        
        // If we get a 200 or redirect (not 404), the user likely exists
        if (response.status === 200 || response.status === 302 || response.status === 301) {
          isValid = true;
          logger.debug(`[VALIDATE] Twitter handle @${cleanHandle} exists`);
          break;
        } else if (response.status === 404) {
          logger.debug(`[VALIDATE] Twitter handle @${cleanHandle} not found on ${instance}`);
        }
      } catch (err: any) {
        continue; // Try next instance
      }
    }
    
    if (isValid) {
      valid.push(cleanHandle);
    }
    
    // Minimal delay - 100ms instead of 500ms
    await new Promise(r => setTimeout(r, 100));
  }
  
  return valid;
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

Generate a 5-pillar strategy to capture high-intent leads across Reddit, HackerNews, Twitter, LinkedIn, and ProductHunt.

PILLAR 1: INTENT-SPECIFIC KEYWORDS (Generate 15-20)
Focus on:
- "Alternative Seekers": (e.g., "alternative to [competitor]", "[competitor] too expensive", "switch from [competitor]")
- "Problem State": (e.g., "how to solve [problem]", "trouble with [task]", "tool for [use case]")
- "Recommendation Requests": (e.g., "best tool for", "any recommendations for", "software like")
- "Budget Hunting": (e.g., "affordable [product type]", "free version of [competitor]")

PILLAR 2: NOISE REDUCTION (Negative Keywords) (Generate 20-25)
Filter out: hiring, job, salary, article, blog, news, career, intern, and category-specific noise.

PILLAR 3: COMPETITIVE LANDSCAPE (Generate 5-8)
Include direct and indirect competitors.

PILLAR 4: TARGET COMMUNITIES (Reddit & PH)
- 6-8 relevant subreddits (e.g. "SaaS", "startups", niche industry subs).
- 3-4 ProductHunt discussion topics (e.g. "Productivity", "Marketing Tech").

PILLAR 5: SOCIAL RADAR (Twitter & LinkedIn)
- 5-6 Twitter handles of industry influencers, competitors, or niche accounts to monitor.
- 5-6 Specific LinkedIn "search flags" or problem-phrases uniquely common on LinkedIn (e.g. "LinkedIn ad alternative", "Sales Navigator tips").

Return your strategy strictly as a JSON object:
{
  "keywords": ["intent phrase 1", "intent phrase 2", ...],
  "negativeKeywords": ["negative term 1", "negative term 2", ...],
  "competitors": ["competitor 1", "competitor 2", ...],
  "subreddits": ["subreddit1", "subreddit2", ...],
  "twitterHandles": ["@handle1", "@handle2", ...],
  "linkedinSearchFlags": ["flag 1", "flag 2", ...],
  "productHuntCommunities": ["topic 1", "topic 2", ...]
}
`;

  try {
    const response = await groq.chat.completions.create({
      model: MODELS.LITE,
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
        model: MODELS.LITE,
        userId,
        inputTokens: usage?.prompt_tokens || 0,
        outputTokens: usage?.completion_tokens || 0,
        latencyMs: elapsed
      });
    });

    const parsed = JSON.parse(content);
    
    // Validate AI-generated suggestions to ensure they exist
    const rawSubreddits = Array.isArray(parsed.subreddits) ? parsed.subreddits : [];
    const rawTwitterHandles = Array.isArray(parsed.twitterHandles) ? parsed.twitterHandles : [];
    
    // Validate subreddits and Twitter handles in parallel
    const [validSubreddits, validTwitterHandles] = await Promise.all([
      validateSubreddits(rawSubreddits),
      validateTwitterHandles(rawTwitterHandles)
    ]);
    
    logger.info({ 
      rawSubreddits: rawSubreddits.length, 
      validSubreddits: validSubreddits.length,
      rawTwitter: rawTwitterHandles.length,
      validTwitter: validTwitterHandles.length 
    }, 'Validated AI-generated communities');

    return {
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      negativeKeywords: Array.isArray(parsed.negativeKeywords) ? parsed.negativeKeywords : [],
      competitors: Array.isArray(parsed.competitors) ? parsed.competitors : [],
      subreddits: validSubreddits,
      twitterHandles: validTwitterHandles,
      linkedinSearchFlags: Array.isArray(parsed.linkedinSearchFlags) ? parsed.linkedinSearchFlags : [],
      productHuntCommunities: Array.isArray(parsed.productHuntCommunities) ? parsed.productHuntCommunities : [],
    };
  } catch (error: any) {
    logger.error({ message: error.message, status: error.status }, 'Failed to generate product strategy:');
    
    setImmediate(() => {
      logLlmUsage({
        action: 'generate_strategy',
        model: MODELS.LITE,
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
      productHuntCommunities: [] 
    };
  }
};
