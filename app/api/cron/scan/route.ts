import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import config from '@/lib/config';
import { BatchProcessingService } from '@/lib/services/batchProcessingService';

export const maxDuration = 60; // Max allowed execution for serverless cron

export async function GET(req: NextRequest) {
  return handleCronScan(req);
}

export async function POST(req: NextRequest) {
  return handleCronScan(req);
}

async function handleCronScan(req: NextRequest) {
  try {
    // 1. Authorize Cron trigger
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || config.CRON_SECRET;

    // Allow Vercel Cron (sends x-vercel-cron header) or external bearer token
    const isVercelCron = req.headers.get('x-vercel-cron') === '1';
    const isBearerAuthorized = authHeader === `Bearer ${cronSecret}`;

    if (process.env.NODE_ENV === 'production' && !isVercelCron && !isBearerAuthorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized cron request' }, { status: 401 });
    }

    // 2. Determine which tier to scan via `?tier=` query param:
    //    - Vercel daily cron (no param / tier=free) → FREE users only  (every 24h)
    //    - External 2-hourly cron → ?tier=pro                          (PRO users only)
    //    - Manual / admin trigger → ?tier=all                          (everyone)
    const { searchParams } = new URL(req.url);
    const tierParam = searchParams.get('tier') ?? 'free';
    const targetTier: 'FREE' | 'PRO' | 'all' =
      tierParam === 'all' ? 'all' : tierParam === 'pro' ? 'PRO' : 'FREE';

    logger.info(`🛰️ Starting cron scan cycle — tier: ${targetTier}`);

    // 3. Fetch active products scoped to the requested tier
    const activeProducts = await db.client.product.findMany({
      where: {
        isActive: true,
        ...(targetTier !== 'all' && {
          user: { plan: targetTier },
        }),
      },
      select: {
        id: true,
        userId: true,
        config: true,
        user: {
          select: { plan: true },
        },
      },
    });

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const twoHoursAgo = now - 2 * 60 * 60 * 1000;

    // 4. Skip products that were scanned recently enough for their tier's cadence
    const productsToScan = activeProducts.filter((product) => {
      const productConfig = (product.config as Record<string, unknown>) || {};
      const lastBgScan = productConfig['lastBackgroundScanAt'] as string | undefined;
      if (!lastBgScan) return true;

      const lastScanTime = new Date(lastBgScan).getTime();
      return product.user?.plan === 'PRO'
        ? lastScanTime < twoHoursAgo
        : lastScanTime < oneDayAgo;
    });

    // 5. Process up to 3 products per invocation to stay within 60s limit
    const batch = productsToScan.slice(0, 3);
    logger.info(
      `📊 Processing ${batch.length} products (${productsToScan.length} pending, tier: ${targetTier})`
    );

    const results = [];
    for (const product of batch) {
      try {
        const result = await BatchProcessingService.processProduct(product.id);
        results.push({ productId: product.id, ...result });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        logger.error({ err: message, productId: product.id }, 'Cron product scan error');
        results.push({ productId: product.id, success: false, error: message });
      }
    }

    return NextResponse.json({
      success: true,
      tier: targetTier,
      scannedCount: batch.length,
      pendingCount: Math.max(0, productsToScan.length - batch.length),
      results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error: message }, 'Cron scan handler error');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
