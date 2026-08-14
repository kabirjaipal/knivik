import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { requireAuth } from '@/lib/auth-server';
import { getPlanLimits } from '@/lib/plans';
import { BatchProcessingService } from '@/lib/services/batchProcessingService';

export const maxDuration = 60; // Max allowed serverless duration

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const { id: productId } = await params;
    const userId = session.user.id;

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Missing product ID' }, { status: 400 });
    }

    const existing = await db.client.product.findUnique({ where: { id: productId } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const user = await db.client.user.findUnique({ where: { id: userId } });
    const maxScans = user ? getPlanLimits(user.plan).manualScansPerDay : 0;

    if (maxScans <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Manual force scanning is a Pro feature. Your product is automatically scanned globally for free.',
        },
        { status: 403 }
      );
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const productConfig = (existing.config as Record<string, any>) || {};
    const lastScanDate = productConfig['lastManualScanDate'];
    let scansToday = productConfig['manualScansToday'] || 0;

    if (lastScanDate === todayStr) {
      if (scansToday >= maxScans) {
        const errorMsg =
          user && user.plan === 'PRO'
            ? `Daily manual scan quota reached (${maxScans}/${maxScans}) for this product.`
            : `Daily manual scan quota reached (1/1) on Free tier. Upgrade to Pro to unlock 10 manual scans/day + 2-hour automated background scans!`;
        return NextResponse.json({ success: false, error: errorMsg }, { status: 429 });
      }
      scansToday++;
    } else {
      scansToday = 1;
    }

    await db.client.product.update({
      where: { id: productId },
      data: {
        config: {
          ...productConfig,
          lastManualScanDate: todayStr,
          manualScansToday: scansToday,
        },
      },
    });

    await db.client.user.update({
      where: { id: userId },
      data: { isScanning: true },
    });

    // Run scanning in background
    BatchProcessingService.processProduct(productId).catch((error) => {
      logger.error({ error, productId }, 'Manual scan failed in background execution');
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Scan started in background. Connecting to stream...',
      },
      { status: 202 }
    );
  } catch (error: any) {
    logger.error({ error: error.message }, 'Scan Product error');
    return NextResponse.json({ success: false, error: error.message || 'Manual scan failed' }, { status: 500 });
  }
}
