import { streamText, tool, isStepCount } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import config from '@/lib/config';
import logger from '@/lib/logger';
import { agentTools } from '@/lib/agent/tools';
import { logLlmUsage, resolveModelId, MODELS } from '@/lib/ai-runner';
import { db } from '@/lib/db';
import { PLANS } from '@/lib/plans';
import { cortexSystemPrompt } from '@/lib/prompts/cortexAgent';

// Initialize Groq provider
const groq = createGroq({
  apiKey: config.GROQ_API_KEY,
  baseURL: config.GROQ_BASE_URL,
});

export const maxDuration = 60; // 60 seconds max execution for agent loops

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in to use Cortex AI.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check user plan & daily limit
    const user = await db.client.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });
    const userPlan = (user?.plan || 'FREE') as keyof typeof PLANS;
    const planConfig = PLANS[userPlan] || PLANS.FREE;
    const planLimit = planConfig.limits.agentQueriesPerDay;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const dailyUsage = await db.client.llmUsageLog.count({
      where: {
        userId,
        action: 'agent_chat_stream',
        createdAt: { gte: startOfDay },
        status: 'success',
      },
    });

    if (dailyUsage >= planLimit) {
      const isFree = userPlan === 'FREE';
      const errorMessage = isFree
        ? `You have reached your daily Free limit (${planLimit} queries/day). Upgrade to Pro for 50 daily queries (10x Free), live social discovery, and instant outreach drafting!`
        : `You have reached your daily Pro limit of ${planLimit} Cortex AI queries. Your quota resets at midnight.`;

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          upgradeRequired: isFree,
          dailyUsage,
          dailyLimit: planLimit,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { messages, enableThinking = true } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    // Keep only the last 6 messages to prevent token accumulation and Groq TPM rate limits
    const prunedMessages = messages.slice(-6).map((m: any) => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content.slice(0, 1500) : m.content,
    }));

    const modelId = await resolveModelId(MODELS.VERSATILE).catch(() => 'openai/gpt-oss-20b');

    const result = streamText({
      model: groq(modelId),
      system: cortexSystemPrompt,
      messages: prunedMessages,
      stopWhen: isStepCount(8),
      temperature: 0.3,
      providerOptions: {
        groq: {
          reasoningFormat: enableThinking ? 'parsed' : 'hidden',
        },
      },
      tools: {
        createProduct: tool({
          description: agentTools.createProduct.description,
          inputSchema: agentTools.createProduct.parameters,
          execute: async (args) => {
            return await agentTools.createProduct.execute(args, userId);
          },
        }),
        addLeadToProduct: tool({
          description: agentTools.addLeadToProduct.description,
          inputSchema: agentTools.addLeadToProduct.parameters,
          execute: async (args) => {
            return await agentTools.addLeadToProduct.execute(args, userId);
          },
        }),
        querySystemLeads: tool({
          description: agentTools.querySystemLeads.description,
          inputSchema: agentTools.querySystemLeads.parameters,
          execute: async (args) => {
            return await agentTools.querySystemLeads.execute(args, userId);
          },
        }),
        liveSocialDiscovery: tool({
          description: agentTools.liveSocialDiscovery.description,
          inputSchema: agentTools.liveSocialDiscovery.parameters,
          execute: async (args) => {
            return await agentTools.liveSocialDiscovery.execute(args, userId);
          },
        }),
        getProductsAndServices: tool({
          description: agentTools.getProductsAndServices.description,
          inputSchema: agentTools.getProductsAndServices.parameters,
          execute: async (args) => {
            return await agentTools.getProductsAndServices.execute(args, userId);
          },
        }),
        getWorkspaceStats: tool({
          description: agentTools.getWorkspaceStats.description,
          inputSchema: agentTools.getWorkspaceStats.parameters,
          execute: async (args) => {
            return await agentTools.getWorkspaceStats.execute(args, userId);
          },
        }),
      },
      onFinish: (event) => {
        const latencyMs = Date.now() - startTime;
        const usage = event.usage as any;
        const inputTokens = usage?.inputTokens || usage?.promptTokens || 0;
        const outputTokens = usage?.outputTokens || usage?.completionTokens || 0;
        logLlmUsage({
          action: 'agent_chat_stream',
          model: modelId,
          userId,
          inputTokens,
          outputTokens,
          latencyMs,
          status: 'success',
        }).catch((err) => logger.warn({ err }, 'Failed logging agent usage'));
      },
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let isClosed = false;

        const safeEnqueue = (text: string) => {
          if (isClosed) return;
          try {
            controller.enqueue(encoder.encode(text));
          } catch (_) {
            isClosed = true;
          }
        };

        try {
          for await (const part of result.fullStream) {
            if (isClosed) break;
            // If thinking mode is toggled off by user, skip streaming reasoning chunks
            if (!enableThinking && (part.type === 'reasoning-delta' || part.type === 'reasoning-start' || part.type === 'reasoning-end')) {
              continue;
            }
            safeEnqueue(JSON.stringify(part) + '\n');
          }
        } catch (err: any) {
          logger.error({ error: err.message }, '[API] Agent stream processing error');
          const errorMsg = typeof err === 'string' ? err : err.message || 'Stream processing error';
          safeEnqueue(JSON.stringify({ type: 'error', error: errorMsg }) + '\n');
        } finally {
          if (!isClosed) {
            try {
              controller.close();
            } catch (_) {}
            isClosed = true;
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    logger.error({ error: error.message }, '[API] /api/agent/chat execution error');
    const errorMsg = typeof error === 'string' ? error : error.message || 'Agent processing failed';
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
