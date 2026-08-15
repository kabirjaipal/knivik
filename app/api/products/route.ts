import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-server';
import { canAddProduct } from '@/lib/plans';
import { SearchQueryService } from '@/lib/services/search-query-service';
import { BatchProcessingService } from '@/lib/services/batch-processing';

const productSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  config: z.record(z.string(), z.any()).optional(),
});

export async function GET() {
  try {
    const { session, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const userId = session.user.id;

    const products = await db.client.product.findMany({
      where: { userId },
      include: {
        _count: {
          select: { leads: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const sanitizedProducts = products.map((p) => {
      const { searchQueries, ...rest } = p as any;
      return rest;
    });

    return NextResponse.json({ success: true, products: sanitizedProducts });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Get Products error');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const userId = session.user.id;
    const body = await req.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const user = await db.client.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const activeProductCount = await db.client.product.count({
      where: { userId, isActive: true },
    });

    if (!canAddProduct(activeProductCount, user.plan)) {
      return NextResponse.json(
        { success: false, error: 'Plan limits reached. Upgrade to track more products.' },
        { status: 403 }
      );
    }

    const cleanConfig: Record<string, any> = { ...(data.config || {}) };
    delete cleanConfig['lastManualScanDate'];
    delete cleanConfig['manualScansToday'];

    const product = await db.client.product.create({
      data: {
        userId,
        name: data.name,
        description: data.description || null,
        websiteUrl: data.websiteUrl || null,
        isActive: data.isActive,
        config: cleanConfig,
      },
      include: {
        _count: {
          select: { leads: true },
        },
      },
    });

    // Generate AI search queries in background / alongside
    SearchQueryService.generateAndSaveQueries(product.id)
      .then(() => {
        // Kick off initial background scan
        BatchProcessingService.processProduct(product.id).catch((err) => {
          logger.error({ err, productId: product.id }, 'Initial scan failed');
        });
      })
      .catch((err) => {
        logger.error({ err, productId: product.id }, 'Failed to generate queries');
      });

    const { searchQueries: _, ...sanitizedProduct } = product as any;
    return NextResponse.json({ success: true, product: sanitizedProduct }, { status: 201 });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Create Product error');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
