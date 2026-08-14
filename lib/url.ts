import type { NextRequest } from 'next/server';
import { config } from './config';

/**
 * Dynamically resolves the canonical frontend URL from a comma-separated list
 * in config.FRONTEND_URL, matching the incoming request origin/referer.
 * Fallbacks to the first configured URL if no match is found.
 */
export function getFrontendUrl(req?: Request | NextRequest): string {
  const urls = config.FRONTEND_URL.split(',').map((url) => url.trim());
  if (urls.length === 0) {
    return 'http://localhost:3000';
  }

  if (!req) {
    return urls[0];
  }

  // Check origin header first
  const origin = req.headers?.get ? req.headers.get('origin') : (req as any).get?.('origin');
  if (origin) {
    const matched = urls.find((url) => origin.startsWith(url));
    if (matched) {
      return matched;
    }
  }

  // Fallback to referer header
  const referer = req.headers?.get ? req.headers.get('referer') : (req as any).get?.('referer');
  if (referer) {
    const matched = urls.find((url) => referer.startsWith(url));
    if (matched) {
      return matched;
    }
  }

  // Fallback to the first URL in the list
  return urls[0];
}
