import { generateText, Output } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { z } from 'zod';
import config from './config';
import logger from './logger';
import { db } from './db';

// Centralized model registry aliases
export const MODELS = {
  LITE: 'lite',
  VERSATILE: 'versatile',
};

// Initialize Groq provider via Vercel AI SDK
const groq = createGroq({
  apiKey: config.GROQ_API_KEY,
  baseURL: config.GROQ_BASE_URL,
});

// Resolve model ID dynamically from systemConfig, with robust fallbacks
async function resolveModelId(modelInput: string): Promise<string> {
  const defaultModels: Record<string, string> = {
    lite: 'llama-3.1-8b-instant',
    versatile: 'llama-3.3-70b-versatile',
  };

  const configKey = {
    lite: 'aiModelLite',
    versatile: 'aiModelVersatile',
  }[modelInput];

  if (!configKey) {
    return modelInput;
  }

  try {
    const sysConfig = await db.client.systemConfig.findUnique({
      where: { key: configKey }
    });

    if (sysConfig && typeof sysConfig.value === 'string' && sysConfig.value.trim().length > 0) {
      return sysConfig.value;
    }
  } catch (err) {
    logger.warn({ err, configKey }, 'Could not read dynamic model from systemConfig; using default.');
  }

  return defaultModels[modelInput] || 'llama-3.3-70b-versatile';
}

export async function logLlmUsage(params: {
  action: string;
  model: string;
  userId?: string | null;
  productId?: string | null;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  status?: string;
  errorMessage?: string;
}) {
  const { action, model: modelId, userId, productId, inputTokens, outputTokens, latencyMs, status = 'success', errorMessage } = params;
  const totalTokens = inputTokens + outputTokens;

  try {
    const existingModel = await db.client.llmModel.findUnique({
      where: { id: modelId },
      select: { id: true }
    });

    if (!existingModel) {
      await db.client.llmModel.upsert({
        where: { id: modelId },
        update: {},
        create: {
          id: modelId,
          inputPrice: 0.05,
          outputPrice: 0.08,
          isActive: true
        }
      }).catch(() => {});
    }

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

interface RunnerTextParams {
  action: string;
  model: string;
  system: string;
  prompt: string;
  temperature?: number;
  userId?: string | null;
  productId?: string | null;
  responseFormat?: 'text';
}

interface RunnerObjectParams<T> {
  action: string;
  model: string;
  system: string;
  prompt: string;
  temperature?: number;
  userId?: string | null;
  productId?: string | null;
  responseFormat: 'json';
  schema: z.Schema<T>;
}

export async function aiLlmRunner(params: RunnerTextParams): Promise<string>;
export async function aiLlmRunner<T>(params: RunnerObjectParams<T>): Promise<T>;
export async function aiLlmRunner<T = any>(
  params: RunnerTextParams | RunnerObjectParams<T>
): Promise<string | T> {
  const startTime = Date.now();
  const { action, model: modelInput, system, prompt, temperature = 0.7, userId, productId, responseFormat = 'text' } = params;

  // Resolve dynamic model ID from system config or fallback
  const modelId = await resolveModelId(modelInput);

  let result: string | T;
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    if (responseFormat === 'json') {
      const jsonParams = params as RunnerObjectParams<T>;
      const { output, usage } = await generateText({
        model: groq(modelId),
        system,
        prompt,
        temperature,
        output: Output.object({
          schema: jsonParams.schema,
        }),
        providerOptions: {
          groq: {
            structuredOutputs: false,
          },
        },
      });
      result = output as T;
      inputTokens = usage.inputTokens || 0;
      outputTokens = usage.outputTokens || 0;
    } else {
      const { text, usage } = await generateText({
        model: groq(modelId),
        system,
        prompt,
        temperature,
      });
      result = text;
      inputTokens = usage.inputTokens || 0;
      outputTokens = usage.outputTokens || 0;
    }

    const latencyMs = Date.now() - startTime;
    setImmediate(() => {
      logLlmUsage({
        action,
        model: modelId,
        userId,
        productId,
        inputTokens,
        outputTokens,
        latencyMs,
        status: 'success'
      });
    });

    return result;
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    logger.error({ error: error.message, action, modelId }, 'AI execution failed');

    setImmediate(() => {
      logLlmUsage({
        action,
        model: modelId,
        userId,
        productId,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs,
        status: 'error',
        errorMessage: error.message || 'Unknown error'
      });
    });

    throw error;
  }
}
