import { EventEmitter } from 'events';

// Global event emitter for in-process SSE streaming
const globalEmitter = globalThis as unknown as {
  scanEmitter: EventEmitter | undefined;
};

export const scanEmitter = globalEmitter.scanEmitter ?? new EventEmitter();
scanEmitter.setMaxListeners(100);

if (process.env.NODE_ENV !== 'production') {
  globalEmitter.scanEmitter = scanEmitter;
}

export const emitScanStatus = (
  userId: string,
  productId: string,
  isScanning: boolean,
  status: string
) => {
  scanEmitter.emit(`scan:${productId}`, { productId, userId, isScanning, status });
  scanEmitter.emit(`user:${userId}`, { productId, userId, isScanning, status });
};

export default scanEmitter;
