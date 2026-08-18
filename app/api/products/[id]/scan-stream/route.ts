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
      // 1. Tell browser EventSource to auto-reconnect every 3 seconds if disconnected
      controller.enqueue(encoder.encode('retry: 3000\n\n'));

      const isCurrentlyScanning = dbUser?.isScanning ?? false;
      
      // 2. If actively scanning on initial connect, send immediate progress state
      if (isCurrentlyScanning) {
        const initialPayload = `data: ${JSON.stringify({
          productId,
          isScanning: true,
          status: 'INITIALIZING',
        })}\n\n`;
        controller.enqueue(encoder.encode(initialPayload));
      } else {
        const idlePayload = `data: ${JSON.stringify({
          productId,
          isScanning: false,
          status: 'IDLE',
        })}\n\n`;
        controller.enqueue(encoder.encode(idlePayload));
      }

      const listener = (data: { productId: string; userId: string; isScanning: boolean; status: string }) => {
        try {
          const payload = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
          if (!data.isScanning) {
            // Keep open briefly so client receives completion confirmation, then close
            setTimeout(() => {
              try {
                controller.close();
              } catch (_) {}
            }, 1000);
          }
        } catch (_) {}
      };

      scanEmitter.on(`scan:${productId}`, listener);

      // 3. Heartbeat + Database Sync Polling (for multi-container serverless support)
      let isClosed = false;
      const interval = setInterval(async () => {
        if (isClosed) return;
        try {
          // Check DB state across separate serverless lambda containers
          const userState = await db.client.user.findUnique({
            where: { id: userId },
            select: { isScanning: true, lastScanStatus: true },
          });

          if (userState && !userState.isScanning) {
            isClosed = true;
            clearInterval(interval);
            const finalPayload = `data: ${JSON.stringify({
              productId,
              userId,
              isScanning: false,
              status: userState.lastScanStatus || 'SUCCESS',
            })}\n\n`;
            controller.enqueue(encoder.encode(finalPayload));
            setTimeout(() => {
              try { controller.close(); } catch (_) {}
            }, 1000);
            return;
          }

          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch (_) {
          // Keep stream alive
        }
      }, 2500);

      const cleanup = () => {
        isClosed = true;
        clearInterval(interval);
        scanEmitter.off(`scan:${productId}`, listener);
      };

      req.signal.addEventListener('abort', cleanup);
    },
    cancel() {
      // Client closed or aborted connection
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Content-Encoding': 'none',
    },
  });
}
