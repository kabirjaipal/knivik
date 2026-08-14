import { z } from 'zod';

const envBool = (defaultValue: boolean) =>
  z.preprocess(
    (val) => (val === undefined ? defaultValue : val === 'true' || val === '1' || val === true),
    z.boolean()
  );

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().optional().default(process.env.DATABASE_URL || ''),
  BETTER_AUTH_SECRET: z.string().optional().default(process.env.BETTER_AUTH_SECRET || 'dev-secret-key-min-32-chars-long-12345'),
  BETTER_AUTH_URL: z.string().optional().default(process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  FRONTEND_URL: z.string().default(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  LOG_PRETTY: envBool(false),
  // Prisma logging controls
  PRISMA_LOG_QUERIES: envBool(false),
  // Database Pool Tuning & Logging
  DB_POOL_MAX: z.coerce.number().default(process.env.NODE_ENV === 'production' ? 12 : 10),
  DB_POOL_MIN: z.coerce.number().default(process.env.NODE_ENV === 'production' ? 2 : 1),
  DB_POOL_IDLE_TIMEOUT_MS: z.coerce.number().default(30000),
  DB_POOL_CONNECTION_TIMEOUT_MS: z.coerce.number().default(5000),
  // Email settings (Resend API)
  SMTP_FROM: z.string().default(process.env.SMTP_FROM || 'no-reply@knivik.xyz'),
  RESEND_API_KEY: z.string().optional().default(process.env.RESEND_API_KEY || ''),
  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional().default(process.env.GOOGLE_CLIENT_ID || ''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(process.env.GOOGLE_CLIENT_SECRET || ''),
  GOOGLE_REDIRECT_URI: z.string().default(process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google'),
  // OpenAI / Groq controls
  GROQ_API_KEY: z.string().optional().default(process.env.GROQ_API_KEY || ''),
  GROQ_BASE_URL: z.string().default(process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1'),
  // Scraper controls
  SCRAPER_INTERVAL_MS: z.coerce.number().default(3600000),
  PROJECT_NAME: z.string().default('Knivik'),
  // Dodo Payments configuration
  DODO_PAYMENTS_API_KEY: z.string().optional().default(process.env.DODO_PAYMENTS_API_KEY || ''),
  DODO_PAYMENTS_WEBHOOK_KEY: z.string().optional().default(process.env.DODO_PAYMENTS_WEBHOOK_KEY || ''),
  DODO_PAYMENTS_PRO_MONTHLY_PRODUCT_ID: z.string().optional().default(process.env.DODO_PAYMENTS_PRO_MONTHLY_PRODUCT_ID || process.env.NEXT_PUBLIC_DODO_PAYMENTS_PRO_MONTHLY_PRODUCT_ID || ''),
  DODO_PAYMENTS_PRO_YEARLY_PRODUCT_ID: z.string().optional().default(process.env.DODO_PAYMENTS_PRO_YEARLY_PRODUCT_ID || process.env.NEXT_PUBLIC_DODO_PAYMENTS_PRO_YEARLY_PRODUCT_ID || ''),
  // Reddit API credentials
  REDDIT_CLIENT_ID: z.string().optional().default(process.env.REDDIT_CLIENT_ID || ''),
  REDDIT_CLIENT_SECRET: z.string().optional().default(process.env.REDDIT_CLIENT_SECRET || ''),
  REDDIT_USERNAME: z.string().optional().default(process.env.REDDIT_USERNAME || ''),
  REDDIT_PASSWORD: z.string().optional().default(process.env.REDDIT_PASSWORD || ''),
  REDDIT_USER_AGENT: z.string().default(process.env.REDDIT_USER_AGENT || 'node:knivik:v1.0.0 (by /u/username)'),
  // Secret for securing serverless cron triggers
  CRON_SECRET: z.string().optional().default(process.env.CRON_SECRET || 'knivik-cron-secret-12345'),
});

const configResult = configSchema.safeParse(process.env);

export const config = configResult.success ? configResult.data : (configSchema.parse({}) as any);

export default config;
