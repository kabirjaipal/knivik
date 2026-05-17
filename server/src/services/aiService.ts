import { OpenAI } from 'openai';
import config from '../lib/config.js';
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
  
  const systemPrompt = `
You are representing a product called "${productInfo.name}".
Product description: ${productInfo.description || 'A software tool.'}

EXPECTED INPUT FORMAT:
You will receive the prospect's social post content in the User Prompt.

YOUR TASK:
Write a helpful response to this post.
Goal: Suggest our product naturally as a solution. Provide genuine value, don't sound like a spam bot.
Tone Constraint: ${tone}
${customPersona ? `STRICTLY FOLLOW THIS CUSTOM PERSONA: ${customPersona}` : `Role: You are an authentic, helpful founder replying to online threads.`}

CONSTRAINTS:
- Keep the response clean and natural.
- Avoid obvious sales pitch phrasing. Be a helpful human first.
`;

  const userPrompt = `Prospect Post:\n"""\n${postText}\n"""`;

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
  const systemPrompt = `
You are a Senior Growth Marketer and Social Listening Expert with a background in B2B and consumer SaaS. 
Your goal is to build a high-conversion social listening strategy for a product on "${config.PROJECT_NAME}".

EXPECTED INPUT FORMAT:
You will receive a JSON object containing:
- productName: The name of the product.
- productDescription: Core description and value proposition of the product.

YOUR TASK:
Generate a comprehensive strategy to capture high-intent leads across Reddit, HackerNews, Twitter, LinkedIn, and ProductHunt, including exact search queries.

Pillars to map:
PILLAR 1: INTENT-SPECIFIC KEYWORDS (Generate 15-20 positive keywords/intent phrases).
PILLAR 2: NOISE REDUCTION (Negative Keywords) (Generate 20-25 terms to filter out).
PILLAR 3: COMPETITIVE LANDSCAPE (Generate 5-8 direct and indirect competitor names).
PILLAR 4: TARGET COMMUNITIES (Reddit & ProductHunt) (6-8 relevant subreddits, 3-4 PH discussion topics).
PILLAR 5: SOCIAL RADAR (Twitter & LinkedIn) (5-6 target handles, 5-6 LinkedIn problem-phrases).
PILLAR 6: FORUM SEARCH QUERIES (Generate 15-20 short 2-4 word queries optimized for social search bars).

EXPECTED OUTPUT FORMAT:
You must strictly return ONLY a valid, minified JSON object matching this structure:
{
  "keywords": ["intent phrase 1", "intent phrase 2", ...],
  "negativeKeywords": ["negative term 1", "negative term 2", ...],
  "competitors": ["competitor 1", "competitor 2", ...],
  "subreddits": ["subreddit1", "subreddit2", ...],
  "twitterHandles": ["@handle1", "@handle2", ...],
  "linkedinSearchFlags": ["flag 1", "flag 2", ...],
  "productHuntCommunities": ["topic 1", "topic 2", ...],
  "searchQueries": ["query 1", "query 2", ...]
}

CONSTRAINTS:
- Return strictly ONLY JSON. Do not include markdown code block fences (e.g. \`\`\`json), trailing commas, or explaining notes.
- Focus on high-buying-intent, specific terms.
`;

  const userPrompt = JSON.stringify({
    productName: name,
    productDescription: description
  });

  try {
    const response = await groq.chat.completions.create({
      model: MODELS.LITE,
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

    // Clean generated search queries
    const searchQueries: string[] = Array.isArray(parsed.searchQueries) ? parsed.searchQueries : [];
    const validSearchQueries = searchQueries
      .filter(q => typeof q === 'string' && q.length > 3 && q.length < 100)
      .slice(0, 20);

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
      productHuntCommunities: [],
      searchQueries: []
    };
  }
};
