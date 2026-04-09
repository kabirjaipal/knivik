import { Platform, Keyword, ProductSource } from '@prisma/client';
import { BaseScraperEngine, ProductWithDetails } from './baseEngine.js';
import { chromium, Browser, BrowserContext } from 'playwright';
import logger from '../lib/logger.js';

// Buying signal patterns
const BUYING_SIGNALS = [
  'looking for', 'recommendation', 'suggest', 'alternative',
  'anyone know', 'what do you use', 'how do you',
  'need a', 'searching for', 'best tool for',
  'can anyone recommend', 'what software', 'looking to buy',
  'want to purchase', 'considering', 'thinking about'
];

interface TwitterPost {
  id: string;
  content: string;
  url: string;
  author: string;
  postedAt: Date;
  externalPostId: string;
}

/**
 * Twitter/X engine using Playwright to scrape x.com/search.
 * Nitter is dead in 2026 — direct Playwright scraping is the only viable free method.
 *
 * NOTE: Twitter requires login cookies for reliable results.
 * Without cookies, only a few public tweets load before hitting a wall.
 * Set TWITTER_AUTH_TOKEN and TWITTER_CT0 in your .env for best results.
 */
export class TwitterEngine extends BaseScraperEngine {
  platform = Platform.TWITTER;

  private browser: Browser | null = null;

  private getRandomDelay(): number {
    return 4000 + Math.random() * 4000;
  }

  private containsBuyingIntent(text: string): boolean {
    const lowerText = text.toLowerCase();
    return BUYING_SIGNALS.some(signal => lowerText.includes(signal));
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-infobars',
          '--window-size=1280,900',
        ],
      });
    }
    return this.browser;
  }

  private async createStealthContext(browser: Browser): Promise<BrowserContext> {
    const authToken = process.env['TWITTER_AUTH_TOKEN'];
    const ct0 = process.env['TWITTER_CT0'];
    const hasAuth = !!authToken && !!ct0;

    const context = await browser.newContext({
      userAgent: this.getRandomUserAgent(),
      viewport: { width: 1280, height: 900 },
      locale: 'en-US',
      timezoneId: 'America/New_York',
      ...(hasAuth
        ? {
            storageState: {
              cookies: [
                {
                  name: 'auth_token',
                  value: authToken as string,
                  domain: '.x.com',
                  path: '/',
                  expires: -1,   // -1 = session cookie (no expiry)
                  httpOnly: true,
                  secure: true,
                  sameSite: 'None' as const,
                },
                {
                  name: 'ct0',
                  value: ct0 as string,
                  domain: '.x.com',
                  path: '/',
                  expires: -1,   // -1 = session cookie (no expiry)
                  httpOnly: false,
                  secure: true,
                  sameSite: 'None' as const,
                },
              ],
              origins: [],
            },
          }
        : {}),
    });

    // Hide automation signals
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    return context;
  }

  private async scrapeXSearch(query: string, limit: number): Promise<TwitterPost[]> {
    const posts: TwitterPost[] = [];
    let context: BrowserContext | null = null;

    try {
      const browser = await this.getBrowser();
      context = await this.createStealthContext(browser);
      const page = await context.newPage();

      const searchUrl = `https://x.com/search?q=${encodeURIComponent(query)}&f=live&src=typed_query`;
      logger.debug(`[TWITTER] Navigating to: ${searchUrl}`);

      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Wait for tweets to appear, or bail if login wall appears
      try {
        await page.waitForSelector('[data-testid="tweet"]', { timeout: 12000 });
      } catch (_err) {
        logger.warn('[TWITTER] No tweets loaded — login wall likely. Set TWITTER_AUTH_TOKEN + TWITTER_CT0 in .env');
        return [];
      }

      // Scroll once to load more tweets — pass as string to avoid TS checking browser globals
      await page.evaluate('window.scrollBy(0, 800)');
      await this.sleep(1500);

      const tweetEls = await page.$$('[data-testid="tweet"]');

      for (const el of tweetEls.slice(0, limit)) {
        try {
          // Text content
          const textEl = await el.$('[data-testid="tweetText"]');
          const content = textEl ? (await textEl.innerText()).trim() : '';
          if (!content) continue;

          // Author
          const authorEl = await el.$('[data-testid="User-Name"] a');
          const authorHref = authorEl ? (await authorEl.getAttribute('href') ?? '') : '';
          const author = authorHref ? authorHref.replace('/', '') : 'unknown';

          // Tweet URL and ID
          const timeEl = await el.$('a[href*="/status/"]');
          const tweetPath = timeEl ? (await timeEl.getAttribute('href') ?? '') : '';
          const idMatch = tweetPath.match(/\/status\/(\d+)/);
          const tweetId = (idMatch ? idMatch[1] : undefined) ?? `tw_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
          const tweetUrl = tweetPath ? `https://x.com${tweetPath}` : `https://x.com/${author}`;

          posts.push({
            id: tweetId,
            content,
            url: tweetUrl,
            author,
            postedAt: new Date(),
            externalPostId: tweetId,
          });
        } catch (_err) {
          continue;
        }
      }

      logger.debug(`[TWITTER] Scraped ${posts.length} tweets for query "${query}"`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`[TWITTER] Playwright scraping failed: ${message}`);
    } finally {
      if (context) await context.close().catch(() => undefined);
    }

    return posts;
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close().catch(() => undefined);
      this.browser = null;
    }
  }

  protected async scrapeKeyword(
    product: ProductWithDetails,
    _source: ProductSource,
    keyword: Keyword,
    limit: number,
    signal?: AbortSignal
  ): Promise<number> {
    let savedCount = 0;

    try {
      const query = `${keyword.keyword} (${BUYING_SIGNALS.slice(0, 4).join(' OR ')}) lang:en`;
      const posts = await this.scrapeXSearch(query, limit);

      const matchingPosts = posts.filter(post => {
        if (signal?.aborted) return false;
        return this.containsBuyingIntent(post.content);
      });

      for (const post of matchingPosts) {
        if (signal?.aborted) break;

        const isNew = await this.processPotentialLead(
          product,
          post.externalPostId,
          null,
          post.content,
          post.url,
          post.author,
          post.postedAt
        );

        if (isNew) {
          savedCount++;
          logger.info(`[TWITTER] New lead: ${post.content.substring(0, 60)}...`);
        }
      }

      logger.info(`[TWITTER] ${savedCount} leads for keyword: "${keyword.keyword}"`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`[TWITTER] Error scraping keyword "${keyword.keyword}": ${message}`);
    }

    await this.sleep(this.getRandomDelay());
    return savedCount;
  }

  override async fetchRecentPosts(source: ProductSource, limit: number, _signal?: AbortSignal): Promise<Array<{ id: string; title: string | null; content: string; url: string; author?: string; postedAt?: Date }>> {
    const searchQuery = (source.identifier.toLowerCase() === 'global' || !source.identifier)
      ? 'saas OR software tool OR recommendation lang:en'
      : source.identifier;

    try {
      const posts = await this.scrapeXSearch(searchQuery, limit);

      return posts.map(post => ({
        id: post.externalPostId,
        title: null,
        content: post.content,
        url: post.url,
        author: post.author,
        postedAt: post.postedAt,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`[TWITTER] Error fetching recent posts: ${message}`);
      return [];
    }
  }
}
