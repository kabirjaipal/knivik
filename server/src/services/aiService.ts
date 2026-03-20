import OpenAI from 'openai';
import config from '../lib/config.js';
import { IntentLevel } from '@prisma/client';
import logger from '../lib/logger.js';

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
export const analyzeIntent = async (postText: string): Promise<IntentAnalysisResult> => {
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
      model: 'llama-3.1-8b-instant', 
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

    return {
      intentLevel: assignedLevel,
      intentScore: Math.min(Math.max(assignedScore, 0), 100),
    };
  } catch (error) {
    logger.error({ error }, 'Failed to analyze intent:');
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
  productInfo: { name: string; description?: string; aiConfig?: any },
  tone: string = 'helpful and highly concise'
): Promise<string> => {
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
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are an authentic, helpful founder replying to online threads.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    logger.error({ error }, 'Failed to generate reply:');
    return 'Hi! Based on your post, our tool might be exactly what you need. Would love to chat more if you are interested.';
  }
};
