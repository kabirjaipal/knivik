import { EventEmitter } from 'events';
import { NextRequest } from 'next/server';
import { db } from './db';

// Global in-process event emitter for local dev & single-container execution
const globalEmitter = globalThis as unknown as {
  scanEmitter: EventEmitter | undefined;
};

export const scanEmitter = globalEmitter.scanEmitter ?? new EventEmitter();
scanEmitter.setMaxListeners(200);
globalEmitter.scanEmitter = scanEmitter;

/**
 * Broadcasts scan progress both in-memory (local) and via DB (cross-container serverless on Vercel)
 */
export const emitScanStatus = (
  userId: string,
  productId?: string,
  isScanning = false,
  status = 'IDLE'
) => {
  // 1. Instant in-memory broadcast
  if (productId) {
    scanEmitter.emit(`scan:${productId}`, { productId, userId, isScanning, status });
  }
  if (userId) {
    scanEmitter.emit(`user:${userId}`, { productId: productId || '', userId, isScanning, status });
  }

  // 2. Asynchronous DB persistence for cross-container serverless synchronization
  (async () => {
    try {
      if (userId) {
        await db.client.user.update({
          where: { id: userId },
          data: { isScanning, lastScanStatus: status },
        }).catch(() => {});
      }
      if (productId) {
        const prod = await db.client.product.findUnique({
          where: { id: productId },
          select: { config: true },
        });
        const currentConfig = (prod?.config as Record<string, any>) || {};
        await db.client.product.update({
          where: { id: productId },
          data: {
            config: {
              ...currentConfig,
              isScanning,
              lastScanStatus: status,
            },
          },
        }).catch(() => {});
      }
    } catch (_) {}
  })();
};

interface CreateScanStreamOptions {
  req: NextRequest;
  userId: string;
  productId?: string;
  initialIsScanning?: boolean;
  initialStatus?: string;
}

/**
 * Creates a unified SSE stream response that works both in-memory (local) and across serverless containers (Vercel)
 */
export const createScanEventStream = ({
  req,
  userId,
  productId,
  initialIsScanning = false,
  initialStatus = 'IDLE',
}: CreateScanStreamOptions) => {
  const encoder = new TextEncoder();
  const eventChannel = productId ? `scan:${productId}` : `user:${userId}`;

  const stream = new ReadableStream({
    start(controller) {
      // Auto-reconnect directive for browser EventSource
      controller.enqueue(encoder.encode('retry: 3000\n\n'));

      // Send initial state immediately
      const initialPayload = `data: ${JSON.stringify({
        productId: productId || '',
        userId,
        isScanning: initialIsScanning,
        status: initialStatus,
      })}\n\n`;
      controller.enqueue(encoder.encode(initialPayload));

      // 1. In-process listener (Instant on Localhost)
      const listener = (data: { productId: string; userId: string; isScanning: boolean; status: string }) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          if (!data.isScanning) {
            setTimeout(() => {
              try { controller.close(); } catch (_) {}
            }, 1000);
          }
        } catch (_) {}
      };

      scanEmitter.on(eventChannel, listener);

      // 2. Cross-container sync polling (1s interval for Vercel Serverless)
      let isClosed = false;
      let wasScanningState = initialIsScanning;
      let lastEmittedStatus = initialStatus;

      const interval = setInterval(async () => {
        if (isClosed) return;
        try {
          const [prodRecord, userRecord] = await Promise.all([
            productId
              ? db.client.product.findUnique({
                  where: { id: productId },
                  select: { config: true },
                })
              : null,
            db.client.user.findUnique({
              where: { id: userId },
              select: { isScanning: true, lastScanStatus: true },
            }),
          ]);

          const pConfig = (prodRecord?.config as Record<string, any>) || {};
          const isScanning = Boolean(
            productId
              ? (pConfig.isScanning ?? userRecord?.isScanning ?? false)
              : (userRecord?.isScanning ?? false)
          );
          const currentStatus = (productId ? pConfig.lastScanStatus : null) || userRecord?.lastScanStatus || (isScanning ? 'INITIALIZING' : 'IDLE');

          if (isScanning) {
            wasScanningState = true;
            if (currentStatus !== lastEmittedStatus) {
              lastEmittedStatus = currentStatus;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                productId: productId || '',
                userId,
                isScanning: true,
                status: currentStatus,
              })}\n\n`));
            }
          } else if (wasScanningState && !isScanning) {
            wasScanningState = false;
            lastEmittedStatus = currentStatus;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              productId: productId || '',
              userId,
              isScanning: false,
              status: currentStatus === 'IDLE' ? 'SUCCESS' : currentStatus,
            })}\n\n`));
            setTimeout(() => {
              try { controller.close(); } catch (_) {}
            }, 1000);
          }

          // Heartbeat ping
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch (_) {}
      }, 1000);

      const cleanup = () => {
        isClosed = true;
        clearInterval(interval);
        scanEmitter.off(eventChannel, listener);
      };

      req.signal.addEventListener('abort', cleanup);
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
};

export default scanEmitter;
