import dotenv from 'dotenv';
import { z } from 'zod';
import os from 'os';

dotenv.config();

const envBool = (defaultValue: boolean) =>
  z.preprocess(
    (val) => (val === undefined ? defaultValue : val === 'true' || val === '1' || val === true),
    z.boolean()
  );

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  BASIC_AUTH_USERNAME: z.string().optional(),
  BASIC_AUTH_PASSWORD: z.string().optional(),
  CORS_ORIGIN: z.string().default('*'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  LOG_PRETTY: envBool(false),
  // Scalability & infra toggles
  ENABLE_CLUSTER: envBool(true),
  WORKER_COUNT: z.coerce.number().default(os.cpus().length),
  TRUST_PROXY: envBool(true),
  REQUEST_BODY_LIMIT: z.string().default('1mb'),
  // Rate limit store (memory or redis)
  RATE_LIMIT_STORE: z.enum(['memory', 'redis']).default('memory'),
  REDIS_URL: z.string().optional(),
  // DB request logging controls
  LOG_REQUESTS_TO_DB: envBool(false),
  LOG_DB_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
  LOG_DB_MAX_BODY_LENGTH: z.coerce.number().default(2000),
  // Prisma logging controls
  PRISMA_LOG_QUERIES: envBool(false),
  // SMTP credentials (for Nodemailer)
  SMTP_HOST: z.string().default('smtp.ethereal.email'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default('noreply@knivik.com'),
  // Add:
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  // OpenAI / OpenRouter controls
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_BASE_URL: z.string().default('https://openrouter.ai/api/v1'),
  GROQ_API_KEY: z.string().min(1),
  GROQ_BASE_URL: z.string().default('https://api.groq.com/openai/v1'),
  // Cache controls
  ENABLE_CACHE: envBool(true),
  CACHE_TTL_SECONDS: z.coerce.number().default(60),
  // Scraper controls
  SCRAPER_INTERVAL_MS: z.coerce.number().default(3600000), // Default 1 hour
  PROJECT_NAME: z.string().default('Knivik'),
  // Queue configuration
  ENABLE_QUEUE: envBool(true),
  QUEUE_REDIS_URL: z.string().optional(),
  SCRAPER_CONCURRENCY: z.coerce.number().default(5),
});

const configResult = configSchema.safeParse(process.env);

if (!configResult.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(configResult.error.format());
  process.exit(1);
}

export const config = configResult.data;

export default config;
