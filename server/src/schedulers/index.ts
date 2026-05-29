import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../lib/logger.js';

interface SchedulerModule {
  start?: () => void;
  stop?: () => void;
}

const loadedSchedulers: SchedulerModule[] = [];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const startSchedulers = async (): Promise<void> => {
  try {
    const files = fs.readdirSync(__dirname);
    
    for (const file of files) {
      // Exclude index.ts / index.js and any non-js/ts files
      if (
        file.startsWith('index.') || 
        (!file.endsWith('.js') && !file.endsWith('.ts')) || 
        file.endsWith('.d.ts')
      ) {
        continue;
      }

      logger.info(`🔌 Loading scheduler: ${file}`);
      const modulePath = `./${file}`;
      const scheduler: SchedulerModule = await import(modulePath);
      
      if (scheduler.start) {
        scheduler.start();
        loadedSchedulers.push(scheduler);
      } else {
        logger.warn(`⚠️ Scheduler ${file} does not export a start function`);
      }
    }
  } catch (error) {
    logger.error({ error }, 'Failed to dynamically load schedulers');
  }
};

export const stopSchedulers = (): void => {
  logger.info('🔌 Stopping all active schedulers...');
  for (const scheduler of loadedSchedulers) {
    if (scheduler.stop) {
      try {
        scheduler.stop();
      } catch (error) {
        logger.error({ error }, 'Error stopping scheduler');
      }
    }
  }
  // Clear the array
  loadedSchedulers.length = 0;
};

