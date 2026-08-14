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
    
    // Allow Vercel Cron (sends CRON_SECRET or specific Vercel header) or bearer token
    const isVercelCron = req.headers.get('x-vercel-cron') === '1';
    const isBearerAuthorized = authHeader === `Bearer ${cronSecret}`;
    
    if (process.env.NODE_ENV === 'production' && !isVercelCron && !isBearerAuthorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized cron request' }, { status: 401 });
    }

    logger.info('🛰️ Starting automated serverless cron scan cycle...');

    // 2. Find active products to scan
    const activeProducts = await db.client.product.findMany({
      where: { isActive: true },
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

    // Filter products: PRO scanned every 2 hours; FREE scanned every 24 hours
    const productsToScan = activeProducts.filter((product) => {
      const productConfig = (product.config as Record<string, any>) || {};
      const lastBgScan = productConfig['lastBackgroundScanAt'];
      if (!lastBgScan) return true;

      const lastScanTime = new Date(lastBgScan).getTime();
      if (product.user?.plan === 'PRO') {
        return lastScanTime < twoHoursAgo;
      }
      return lastScanTime < oneDayAgo;
    });

    // Limit to 3 products per cron run to guarantee execution under 60 seconds
    const batch = productsToScan.slice(0, 3);
    logger.info(`📊 Processing ${batch.length} products in this cron invocation (${productsToScan.length} pending total)`);

    const results = [];
    for (const product of batch) {
      try {
        const result = await BatchProcessingService.processProduct(product.id);
        results.push({ productId: product.id, ...result });
      } catch (err: any) {
        logger.error({ err: err.message, productId: product.id }, 'Cron product scan error');
        results.push({ productId: product.id, success: false, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      scannedCount: batch.length,
      pendingCount: Math.max(0, productsToScan.length - batch.length),
      results,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Cron scan handler error');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
