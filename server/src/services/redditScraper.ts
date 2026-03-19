import { db } from '../lib/db.js';
import logger from '../lib/logger.js';
import { analyzeIntent } from './aiService.js';
import { Platform } from '@prisma/client';
import { sendLeadAlert } from './alertService.js';
import { emitToUser } from '../lib/socket.js';

// Sleep utility to avoid rate limits
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const USER_AGENT = 'IntentRadar/1.0.0 (Node.js Bot; contact: me@intentradar.io)';

let isRunning = false;

/**
 * Main orchestrator to run Reddit scraper for all active products
 */
export const runRedditScraper = async (userId?: string) => {
  if (isRunning) {
    logger.warn('Reddit Scraper is already running, skipping this trigger.');
    return;
  }

  isRunning = true;
  logger.info(userId ? `Starting on-demand Reddit Scraper for User: ${userId}` : 'Starting background Reddit Scraper cycle...');
  
  try {
    const activeProducts = await db.client.product.findMany({
      where: { 
        isActive: true,
        ...(userId ? { userId } : {})
      },
      include: {
        keywords: { where: { isActive: true } },
        sources: { where: { isActive: true, platform: 'REDDIT' } },
        negativeKeywords: true,
      },
    });

    if (activeProducts.length === 0) {
      logger.info('No active products to scrape for.');
      return;
    }

    const MAX_LEADS_PER_PRODUCT = 5;

    for (const product of activeProducts) {
      if (product.sources.length === 0 || product.keywords.length === 0) {
        continue;
      }

      logger.info(`Scraping Reddit for product: ${product.name}`);
      let foundInThisCycle = 0;

      for (const source of product.sources) {
        if (foundInThisCycle >= MAX_LEADS_PER_PRODUCT) break;

        for (const keyword of product.keywords) {
          if (foundInThisCycle >= MAX_LEADS_PER_PRODUCT) break;

          const savedCount = await scrapeRedditKeyword(product, source, keyword, MAX_LEADS_PER_PRODUCT - foundInThisCycle);
          foundInThisCycle += savedCount;
          
          if (foundInThisCycle < MAX_LEADS_PER_PRODUCT) {
             // Wait briefly between queries to respect Reddit rates while remaining fast
             await sleep(500);
          }
        }
      }
      logger.info(`Finished product ${product.name}. Found ${foundInThisCycle} high-intent leads.`);
    }
    logger.info('Finished Reddit Scraper cycle successfully.');
  } catch (error) {
    logger.error({ error }, 'Fatal error during Reddit Scraper cycle:');
  } finally {
    isRunning = false;
  }
};

/**
 * Scrapes a single keyword on a specific source (subreddit or global)
 */
async function scrapeRedditKeyword(product: any, source: any, keyword: any, limit: number) {
  let savedCount = 0;
  const isGlobal = source.identifier.toLowerCase() === 'global';
  let url = `https://www.reddit.com/search.json?q=${encodeURIComponent(keyword.keyword)}&sort=new&limit=10`;
  
  if (!isGlobal) {
    url = `https://www.reddit.com/r/${source.identifier}/search.json?q=${encodeURIComponent(keyword.keyword)}&restrict_sr=1&sort=new&limit=10`;
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (!response.ok) {
      logger.warn(`Reddit API returned ${response.status} for URL: ${url}`);
      return savedCount;
    }

    const data = (await response.json()) as any;
    const children = data?.data?.children;

    if (!children || !Array.isArray(children)) {
      return savedCount;
    }

    for (const child of children) {
      if (savedCount >= limit) break;

      const postData = child.data;
      if (!postData || !postData.id) continue;

      const postId = postData.id;
      
      // Check cache first to avoid re-processing or re-LLMing
      const cached = await db.client.scrapeCache.findUnique({
        where: {
          platform_externalPostId: {
            platform: Platform.REDDIT,
            externalPostId: postId,
          },
        },
      });

      if (cached) continue;

      // Make sure we cache it now
      // Note: We cache it REGARDLESS of score to ensure we don't re-analyze it
      await db.client.scrapeCache.create({
        data: {
          platform: Platform.REDDIT,
          externalPostId: postId,
        },
      });

      const title = postData.title || '';
      const content = postData.selftext || '';
      const combinedText = `${title}\n\n${content}`;

      // Check against negative keywords
      const hasNegative = product.negativeKeywords.some((nk: any) => 
        combinedText.toLowerCase().includes(nk.keyword.toLowerCase())
      );

      if (hasNegative) {
        logger.debug(`Skipping post ${postId} due to negative keyword hit`);
        continue;
      }

      // Found a potential lead -> Analyze intent natively with AI
      const scoreResult = await analyzeIntent(combinedText);

      // Save if intent score >= 50
      if (scoreResult.intentScore >= 50) {
        try {
          const newLead = await db.client.lead.create({
            data: {
              productId: product.id,
              platform: Platform.REDDIT,
              externalPostId: postId,
              title: title.substring(0, 255),
              content: content.substring(0, 5000), // Protect against massive DB rows
              url: `https://reddit.com${postData.permalink}`,
              authorUsername: postData.author,
              intentLevel: scoreResult.intentLevel,
              intentScore: scoreResult.intentScore,
              postedAt: new Date(postData.created_utc * 1000),
            },
          });
          logger.info(`Saved new Lead for ${product.name} (Score: ${scoreResult.intentScore})`);
          savedCount++;
          
          // Alert the user via socket and secondary channels (Email/Slack)
          if (product.userId) {
            // Include product name for the frontend UI
            const leadWithProduct = {
              ...newLead,
              product: { name: product.name }
            };
            emitToUser(product.userId, 'new-lead', leadWithProduct);
          }
          await sendLeadAlert(newLead.id);
        } catch (dbErr: any) {
          // If the unique constraint on (platform, externalPostId, productId) hits, ignore
          if (dbErr.code !== 'P2002') {
            logger.error({ error: dbErr }, 'Failed to save lead:');
          }
        }
      }
    }
  } catch (error) {
    logger.error({ error }, `Error fetching Reddit data for ${keyword.keyword}`);
  }
  
  return savedCount;
}
