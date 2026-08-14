/**
 * Next.js Native Logger
 * Zero-dependency logger wrapping standard console methods with timestamps and levels.
 */

type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

const logLevels: Record<LogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
const minLevelValue = logLevels[currentLevel] ?? 30;

export const logger = {
  trace: (...args: any[]) => {
    if (minLevelValue <= 10) console.trace(...args);
  },
  debug: (...args: any[]) => {
    if (minLevelValue <= 20) console.debug(...args);
  },
  info: (...args: any[]) => {
    if (minLevelValue <= 30) {
      if (args.length === 2 && typeof args[0] === 'object' && typeof args[1] === 'string') {
        console.log(`[INFO] ${args[1]}`, args[0]);
      } else {
        console.log('[INFO]', ...args);
      }
    }
  },
  warn: (...args: any[]) => {
    if (minLevelValue <= 40) {
      if (args.length === 2 && typeof args[0] === 'object' && typeof args[1] === 'string') {
        console.warn(`[WARN] ${args[1]}`, args[0]);
      } else {
        console.warn('[WARN]', ...args);
      }
    }
  },
  error: (...args: any[]) => {
    if (minLevelValue <= 50) {
      if (args.length === 2 && typeof args[0] === 'object' && typeof args[1] === 'string') {
        console.error(`[ERROR] ${args[1]}`, args[0]);
      } else {
        console.error('[ERROR]', ...args);
      }
    }
  },
  fatal: (...args: any[]) => {
    if (minLevelValue <= 60) {
      if (args.length === 2 && typeof args[0] === 'object' && typeof args[1] === 'string') {
        console.error(`[FATAL] ${args[1]}`, args[0]);
      } else {
        console.error('[FATAL]', ...args);
      }
    }
  },
};

export default logger;
