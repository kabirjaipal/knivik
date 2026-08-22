import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { createScanEventStream } from '@/lib/scan-emitter';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { id: productId } = await params;
  const userId = session.user.id;

  const [product, dbUser] = await Promise.all([
    db.client.product.findUnique({
      where: { id: productId },
      select: { id: true, userId: true, config: true },
    }),
    db.client.user.findUnique({
      where: { id: userId },
      select: { isScanning: true },
    }),
  ]);

  if (!product || product.userId !== userId) {
    return new Response(JSON.stringify({ error: 'Product not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const productConfig = (product.config as Record<string, any>) || {};
  const isCurrentlyScanning = Boolean(productConfig.isScanning ?? dbUser?.isScanning ?? false);
  const initialStatus = isCurrentlyScanning
    ? (productConfig.lastScanStatus || 'INITIALIZING')
    : 'IDLE';

  return createScanEventStream({
    req,
    userId,
    productId,
    initialIsScanning: isCurrentlyScanning,
    initialStatus,
  });
}
