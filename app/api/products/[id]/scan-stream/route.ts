import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { scanEmitter } from '@/lib/scan-emitter';

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
      select: { id: true, userId: true },
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

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const isCurrentlyScanning = dbUser?.isScanning ?? false;
      
      // If actively scanning on connect, send the initial in-progress state
      if (isCurrentlyScanning) {
        const initialPayload = `data: ${JSON.stringify({
          productId,
          isScanning: true,
          status: 'INITIALIZING',
        })}\n\n`;
        controller.enqueue(encoder.encode(initialPayload));
      }

      const listener = (data: { productId: string; userId: string; isScanning: boolean; status: string }) => {
        try {
          const payload = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
          if (!data.isScanning) {
            // Finished
            setTimeout(() => {
              try {
                controller.close();
              } catch (_) {}
            }, 1000);
          }
        } catch (_) {}
      };

      scanEmitter.on(`scan:${productId}`, listener);

      // Keep-alive heartbeat ping every 15s
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch (_) {
          clearInterval(interval);
        }
      }, 15000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        scanEmitter.off(`scan:${productId}`, listener);
      });
    },
    cancel() {
      // Stream cancelled by client
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
