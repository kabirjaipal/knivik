import { RedditEngine } from './redditEngine.js';
import { HackerNewsEngine } from './hackerNewsEngine.js';
import { TwitterEngine } from './twitterEngine.js';
import logger from '../lib/logger.js';
import { db } from '../lib/db.js';
import { emitToUser } from '../lib/socket.js';

export const engines = [
  new RedditEngine(),
  new HackerNewsEngine(),
  new TwitterEngine(),
];

const abortControllers = new Map<string, AbortController>();

export const runAllEngines = async (userId: string) => {
  // 1. Prevent duplicate concurrent scans for the same user
  if (abortControllers.has(userId)) {
    logger.info(`⚠️ Scan already active for User ${userId}, skipping duplicate request.`);
    return;
  }

  logger.info(`🚀 Starting all scraper engines for User: ${userId}`);
  
  const controller = new AbortController();
  abortControllers.set(userId, controller);

  try {
    // 2. Mark as scanning in DB
    await db.client.user.update({
      where: { id: userId },
      data: { isScanning: true, lastScanStatus: 'SCANNING' }
    });
    
    // Safety check: if stopped while marking DB, revert and exit
    if (controller.signal.aborted) {
      await db.client.user.update({
        where: { id: userId },
        data: { isScanning: false, lastScanStatus: 'STOPPED' }
      });
      return;
    }

    emitToUser(userId, 'scan-status', { isScanning: true, status: 'SCANNING' });

    // 3. Launch Engines (Pass signal)
    const tasks = engines.map(engine => engine.runAll(userId, controller.signal));
    await Promise.all(tasks);

    // 4. Mark complete (unless aborted)
    // Check signal again as Promise.all might not throw if engines don't support signal perfectly
    if (!controller.signal.aborted) {
      await db.client.user.update({
        where: { id: userId },
        data: { isScanning: false, lastScanStatus: 'SUCCESS' }
      });
      emitToUser(userId, 'scan-status', { isScanning: false, status: 'SUCCESS' });
      logger.info(`✅ User ${userId} scan cycle finished.`);
    }
  } catch (err: any) {
    if (err.name === 'AbortError' || controller.signal.aborted) {
      logger.info(`🛑 User ${userId} scan was manually stopped.`);
      // stopAllEngines already handles the DB reset to STOPPED
    } else {
      logger.error({ err }, `❌ Fatal error during user ${userId} engine manager execution:`);
      await db.client.user.update({
        where: { id: userId },
        data: { isScanning: false, lastScanStatus: 'FAILED' }
      });
      emitToUser(userId, 'scan-status', { isScanning: false, status: 'FAILED' });
    }
  } finally {
    // Only delete OUR controller from the map
    if (abortControllers.get(userId) === controller) {
      abortControllers.delete(userId);
    }
  }
};

export const stopAllEngines = async (userId: string) => {
  const controller = abortControllers.get(userId);
  
  if (controller) {
    controller.abort();
    abortControllers.delete(userId);
  }

  // Always reset the state in the database to be safe against stale entries or server restarts
  await db.client.user.update({
    where: { id: userId },
    data: { isScanning: false, lastScanStatus: 'STOPPED' }
  });

  emitToUser(userId, 'scan-status', { isScanning: false, status: 'STOPPED' });
  return true;
};
