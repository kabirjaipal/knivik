import { db } from '../lib/db.js';
import logger from '../lib/logger.js';
import { OpenAI } from 'openai';
import config from '../lib/config.js';
import { logLlmUsage } from './aiService.js';

// Initialize Groq client
const groq = new OpenAI({
  apiKey: config.GROQ_API_KEY,
  baseURL: config.GROQ_BASE_URL,
});

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  keywords: Array<{ keyword: string }>;
  competitors: Array<{ name: string }>;
}

/**
 * AI-Powered Search Query Generation Service
 * 
 * This service uses AI to generate smart, contextual search queries across the public web
 * based on product data (name, description, keywords, competitors).
 * 
 * Queries are generated once when product is created/updated and stored in DB.
 * They are reused for every scan, avoiding regeneration costs (~$0.01 per product).
 * 
 * AI approach finds implicit pain points like "support team overwhelmed" vs
 * rule-based "zendesk alternative" - resulting in 5-10x more quality leads.
 */
export class SearchQueryService {
  
  /**
   * Generate and save AI-powered search queries for a product
   * Call this when creating or updating a product
   * Cost: ~$0.01 per product (one-time)
   */
  static async generateAndSaveQueries(productId: string): Promise<string[]> {
    const startTime = Date.now();
    
    try {
      // Fetch product with all related data
      const product = await db.client.product.findUnique({
        where: { id: productId },
        include: {
          keywords: true,
          competitors: true,
        },
      });

      if (!product) {
        logger.error({ productId }, 'Product not found for query generation');
        return [];
      }

      // Generate queries using AI
      const queries = await this.generateQueriesWithAI({
        id: product.id,
        name: product.name,
        description: product.description,
        keywords: product.keywords,
        competitors: product.competitors,
      });

      // Save to database
      await db.client.product.update({
        where: { id: productId },
        data: {
          searchQueries: queries,
        },
      });

      const elapsed = Date.now() - startTime;
      logger.info({ 
        productId, 
        queryCount: queries.length,
        cost: '~$0.01',
        timeMs: elapsed 
      }, 'AI-generated and saved search queries');
      
      return queries;
    } catch (error: any) {
      logger.error({ error, productId }, 'Failed to generate AI search queries');
      return [];
    }
  }

  /**
   * Get stored search queries for a product
   * Returns empty array if none exist
   */
  static async getStoredQueries(productId: string): Promise<string[]> {
    try {
      const product = await db.client.product.findUnique({
        where: { id: productId },
        select: { searchQueries: true },
      });

      if (!product?.searchQueries) {
        // Generate on-the-fly if missing
        return await this.generateAndSaveQueries(productId);
      }

      return product.searchQueries as string[];
    } catch (error: any) {
      logger.error({ error, productId }, 'Failed to get stored queries');
      return [];
    }
  }

  /**
   * AI Query Generation - Uses LLM to create smart, contextual search queries
   * 
   * The AI understands:
   * - Implicit pain points ("drowning in support tickets")
   * - Alternative phrasings ("automate replies" instead of just "chatbot")
   * - High-intent combinations ("looking to reduce support overhead")
   * - Competitor frustration signals ("can't afford Zendesk anymore")
   */
  private static async generateQueriesWithAI(product: ProductData): Promise<string[]> {
    const startTime = Date.now();
    const keywords = product.keywords.map(k => k.keyword).join(', ');
    const competitors = product.competitors.map(c => c.name).join(', ');
    
    const prompt = `You are a B2B lead generation expert specializing in finding high-intent prospects across online forums and social platforms.

PRODUCT INFORMATION:
Name: ${product.name}
Description: ${product.description || 'N/A'}
Keywords: ${keywords}
Competitors: ${competitors}

YOUR TASK:
Generate 15-20 search queries that will find people expressing buying intent for this type of product.

QUERY STRATEGY:
1. Find implicit pain points using short keywords (e.g., "drowning support tickets", "overwhelmed emails")
2. Alternative phrasings (e.g., "automate customer replies", "support automation tool")
3. High-intent combinations (e.g., "reduce support overhead", "help customer service")
4. Competitor frustration (e.g., "Zendesk expensive", "Intercom pricing", "Freshdesk alternatives")
5. Problem-aware prospects (e.g., "support team overwhelmed", "too many tickets")

REQUIREMENTS:
- Each query must be SHORT and punchy: 2-4 words maximum.
- Do NOT use full conversational sentences. Use keyword-style phrasing optimized for Reddit/forum search bars.
- Include specific competitor names when relevant.
- Mix explicit ("zendesk alternative") and implicit ("automate support").
- Prioritize high-buying-intent phrases over generic keywords.

Return ONLY a JSON array of strings:
[
  "query 1",
  "query 2",
  "query 3",
  ...
]`;

    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant', // Fast, cheap model for this task
        messages: [
          { 
            role: 'system', 
            content: 'You are a B2B lead generation expert. You excel at finding implicit buying signals. Return only valid JSON arrays.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7, // Slightly creative for variety
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content returned from AI');
      }

      // Extract JSON from response — handle markdown code blocks and plain JSON
      let jsonText = content.trim();
      // Strip markdown fences (```json ... ``` or ``` ... ```)
      const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) jsonText = fenceMatch[1].trim();
      // Extract the first JSON array found
      const arrayStart = jsonText.indexOf('[');
      const arrayEnd = jsonText.lastIndexOf(']');
      if (arrayStart === -1 || arrayEnd === -1 || arrayEnd <= arrayStart) {
        throw new Error('No JSON array found in response');
      }
      jsonText = jsonText.slice(arrayStart, arrayEnd + 1);

      const queries: string[] = JSON.parse(jsonText);
      
      // Validate and clean
      const validQueries = queries
        .filter(q => typeof q === 'string' && q.length > 3 && q.length < 100)
        .slice(0, 20);

      // Log LLM usage
      const usage = response.usage;
      if (usage) {
        setImmediate(() => {
          logLlmUsage({
            action: 'query_generation',
            model: 'llama-3.1-8b-instant',
            inputTokens: usage.prompt_tokens || 0,
            outputTokens: usage.completion_tokens || 0,
            latencyMs: Date.now() - startTime,
          });
        });
      }

      logger.info({ 
        productId: product.id,
        queriesGenerated: validQueries.length,
        sampleQueries: validQueries.slice(0, 5)
      }, 'AI query generation complete');

      return validQueries;

    } catch (error: any) {
      logger.error({ error, productId: product.id }, 'AI query generation failed');
      // No fallback - AI queries are required for quality leads
      return [];
    }
  }

  /**
   * Regenerate queries for all products
   * Useful for bulk updates when AI model improves
   */
  static async regenerateAllQueries(): Promise<{ updated: number; failed: number }> {
    const products = await db.client.product.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    let updated = 0;
    let failed = 0;

    for (const product of products) {
      try {
        await this.generateAndSaveQueries(product.id);
        updated++;
      } catch {
        failed++;
      }
    }

    logger.info({ updated, failed }, 'Bulk AI query regeneration complete');
    return { updated, failed };
  }
}
