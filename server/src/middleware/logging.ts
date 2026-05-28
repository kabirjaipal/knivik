import { Request, Response, NextFunction } from 'express';
import pinoHttp from 'pino-http';
import { Prisma } from '@prisma/client';
import { db } from '../lib/db.js';
import logger from '../lib/logger.js';
import { parseJson } from '../utils/json.js';

// Define minimal factory and middleware types to avoid using 'any'
type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
type HttpMiddleware = (req: Request, res: Response, next: NextFunction) => void;
type PinoHttpOptions = {
  logger: import('pino').Logger;
  customLogLevel?: (req: Request, res: Response, err?: Error) => LogLevel;
  customSuccessMessage?: (req: Request, res: Response, responseTime: number) => string;
  customErrorMessage?: (req: Request, res: Response, err: Error) => string;
  serializers?: {
    req?: (req: Request) => unknown;
    res?: (res: Response) => unknown;
  };
};
const pinoHttpFactory = pinoHttp as unknown as (opts: PinoHttpOptions) => HttpMiddleware;
const pinoHttpLogger = pinoHttpFactory({
  logger,
  serializers: {
    req: () => undefined,
    res: () => undefined,
  },
  customLogLevel: (_req: Request, res: Response, err: Error | undefined) => {
    if (res.statusCode >= 400 && res.statusCode < 500) return 'warn';
    if (res.statusCode >= 500 || err) return 'error';
    return 'info';
  },
  customSuccessMessage: (req: Request, res: Response, responseTime: number) => {
    let timeFormatted = `${responseTime}ms`;
    if (responseTime >= 3600000) timeFormatted = `${(responseTime / 3600000).toFixed(2)}h`;
    else if (responseTime >= 60000) timeFormatted = `${(responseTime / 60000).toFixed(2)}m`;
    else if (responseTime >= 1000) timeFormatted = `${(responseTime / 1000).toFixed(2)}s`;
    
    return `${req.method} ${req.url} - ${res.statusCode} (${timeFormatted})`;
  },
  customErrorMessage: (req: Request, res: Response, err: Error) => {
    return `${req.method} ${req.url} - ${res.statusCode} - ${err?.message}`;
  },
});

export const httpLogger = pinoHttpLogger;

const IGNORED_PATHS = [
  '/api/health',
];

export const dbLogger = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const url = req.originalUrl || req.url;
  const pathName = url.split('?')[0];
  
  // Only log API routes and the root status page (e.g. filter out probe scanner requests like .env, key.json, etc.)
  const isApiRoute = pathName.startsWith('/api/') || pathName === '/api';
  const isRootRoute = pathName === '/';
  
  if (!isApiRoute && !isRootRoute) {
    return next();
  }

  // Skip logging for ignored endpoints
  if (IGNORED_PATHS.includes(pathName)) {
    return next();
  }

  const originalSend = res.send;
  let responseBody: unknown;
  
  res.send = function(body: unknown) {
    responseBody = body;
    return originalSend.call(this, body);
  };

  res.on('finish', async () => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || req.socket.remoteAddress || null;
    
    try {
      await db.client.requestLog.create({
        data: {
          requestId: req.requestId,
          method: req.method,
          url,
          ip,
          userId: req.user?.id || null,
          statusCode: res.statusCode,
          requestBody: req.body as Prisma.InputJsonValue,
          responseBody: parseJson(responseBody) as Prisma.InputJsonValue,
          headers: req.headers as Prisma.InputJsonValue,
          query: req.query as Prisma.InputJsonValue,
          params: req.params as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      logger.error({ error, requestId: req.requestId }, 'Failed to log request to database');
    }
  });

  next();
};
