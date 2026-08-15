import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-server';
import { hasCapability } from '@/lib/plans';
import { SearchQueryService } from '@/lib/services/search-query-service';

const productSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  config: z.record(z.string(), z.any()).optional(),
});

export async function GET(
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

    const product = await db.client.product.findUnique({
      where: { id: productId },
      include: {
        _count: {
          select: { leads: true },
        },
      },
    });

    if (!product || product.userId !== userId) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const { searchQueries, ...sanitizedProduct } = product as any;
    return NextResponse.json({ success: true, product: sanitizedProduct });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Get Product By ID error');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const { id: productId } = await params;
    const userId = session.user.id;

    const body = await req.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success || !productId) {
      return NextResponse.json(
        { success: false, error: 'Invalid input or missing ID', details: parsed.error?.issues },
        { status: 400 }
      );
    }

    const existing = await db.client.product.findUnique({ where: { id: productId } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const data = parsed.data;
    const user = await db.client.user.findUnique({ where: { id: userId } });

    const existingConfig = (existing.config as Record<string, any>) || {};
    const finalConfig: Record<string, any> = {
      ...(data.config || {}),
      lastManualScanDate: existingConfig['lastManualScanDate'],
      manualScansToday: existingConfig['manualScansToday'],
    };

    if (finalConfig['customPersona'] && (!user || !hasCapability(user.plan, 'canAccessCustomPersonas'))) {
      delete finalConfig['customPersona'];
    }

    const updated = await db.client.product.update({
      where: { id: productId },
      data: {
        name: data.name,
        description: data.description || null,
        websiteUrl: data.websiteUrl || null,
        isActive: data.isActive,
        config: finalConfig,
        searchQueries: [],
      },
      include: {
        _count: {
          select: { leads: true },
        },
      },
    });

    SearchQueryService.generateAndSaveQueries(productId).catch((err) => {
      logger.error({ err, productId }, 'Failed to regenerate search queries');
    });

    const { searchQueries: _, ...sanitizedUpdated } = updated as any;
    return NextResponse.json({ success: true, product: sanitizedUpdated });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Update Product error');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    await db.client.product.delete({ where: { id: productId } });
    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Delete Product error');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
