import { RedditEngine } from './redditEngine.js';
import { HackerNewsEngine } from './hackerNewsEngine.js';
import { TwitterEngine } from './twitterEngine.js';
import { LinkedInEngine } from './linkedinEngine.js';
import { ProductHuntEngine } from './productHuntEngine.js';
import logger from '../lib/logger.js';

export const engines = [
  new RedditEngine(),
  new HackerNewsEngine(),
  new TwitterEngine(),
  new LinkedInEngine(),
  new ProductHuntEngine(),
];

export const runAllEngines = async (userId?: string) => {
  logger.info(`🚀 Starting all scraper engines...${userId ? ` (Requested by User: ${userId})` : ''}`);
  
  // We can run these in parallel or sequence. 
  // Parallel is faster, but might be more resource intensive.
  // For now, parallel is fine as there are few platforms.
  try {
    const tasks = engines.map(engine => engine.runAll(userId));
    await Promise.all(tasks);
    logger.info('📦 All engines finished their cycles.');
  } catch (err) {
    logger.error({ err }, 'Fatal error during engine manager execution:');
  }
};
