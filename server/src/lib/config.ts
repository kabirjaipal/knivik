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
  BETTER_AUTH_SECRET: z.string(),
  BETTER_AUTH_URL: z.string().optional(),
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
  REDIS_URL: z.string().optional(),
  LOG_DB_MAX_BODY_LENGTH: z.coerce.number().default(2000),
  // Prisma logging controls
  PRISMA_LOG_QUERIES: envBool(false),
  // Database Pool Tuning & Logging
  DB_POOL_MAX: z.coerce.number().default(process.env.NODE_ENV === 'production' ? 12 : 10),
  DB_POOL_MIN: z.coerce.number().default(process.env.NODE_ENV === 'production' ? 2 : 1),
  DB_POOL_IDLE_TIMEOUT_MS: z.coerce.number().default(30000),
  DB_POOL_CONNECTION_TIMEOUT_MS: z.coerce.number().default(5000),
  // Email settings (Resend API)
  SMTP_FROM: z.string().default('no-reply@knivik.xyz'),
  RESEND_API_KEY: z.string().min(1),
  // Add:
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().default('http://localhost:3001/api/auth/callback/google'),
  // OpenAI / Groq controls
  GROQ_API_KEY: z.string().min(1),
  GROQ_BASE_URL: z.string().default('https://api.groq.com/openai/v1'),
  // Scraper controls
  SCRAPER_INTERVAL_MS: z.coerce.number().default(3600000), // Default 1 hour
  PROJECT_NAME: z.string().default('Knivik'),
  // Queue configuration
  ENABLE_QUEUE: envBool(true),
  SCRAPER_CONCURRENCY: z.coerce.number().default(5),
  // Dodo Payments configuration
  DODO_PAYMENTS_API_KEY: z.string().optional(),
  DODO_PAYMENTS_WEBHOOK_KEY: z.string().optional(),
  DODO_PAYMENTS_PRO_MONTHLY_PRODUCT_ID: z.string().optional(),
  DODO_PAYMENTS_PRO_YEARLY_PRODUCT_ID: z.string().optional(),
  // Reddit API credentials
  REDDIT_CLIENT_ID: z.string().optional(),
  REDDIT_CLIENT_SECRET: z.string().optional(),
  REDDIT_USERNAME: z.string().optional(),
  REDDIT_PASSWORD: z.string().optional(),
  REDDIT_USER_AGENT: z.string().default('node:knivik:v1.0.0 (by /u/username)'),
});

const configResult = configSchema.safeParse(process.env);

if (!configResult.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(configResult.error.format());
  process.exit(1);
}

export const config = configResult.data;

export default config;
