import logger from '../logger';

// Realistic user agents for rotation
export const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

// Rate limiting configurations
export const RATE_LIMIT_CONFIGS = {
  REDDIT: {
    MIN_DELAY_MS: 2000,      // 2 seconds minimum
    MAX_DELAY_MS: 8000,      // 8 seconds maximum
    BURST_DELAY_MS: 15000,  // 15 seconds after rate limit
    MAX_RETRIES: 3,          // Maximum retry attempts
    BACKOFF_MULTIPLIER: 2    // Exponential backoff
  },
  HACKERNEWS: {
    MIN_DELAY_MS: 1000,      // 1 second minimum (HN is more lenient)
    MAX_DELAY_MS: 5000,      // 5 seconds maximum
    BURST_DELAY_MS: 10000,  // 10 seconds after rate limit
    MAX_RETRIES: 3,          // Maximum retry attempts
    BACKOFF_MULTIPLIER: 2    // Exponential backoff
  },
  TWITTER: {
    MIN_DELAY_MS: 2000,      // 2 seconds minimum
    MAX_DELAY_MS: 10000,     // 10 seconds maximum
    BURST_DELAY_MS: 20000,  // 20 seconds after rate limit
    MAX_RETRIES: 3,          // Maximum retry attempts
    BACKOFF_MULTIPLIER: 2    // Exponential backoff
  }
};

/**
 * IP Protection and Rate Limiting Utility
 */
export class IPProtection {
  private lastRequestTime = 0;
  private requestCount = 0;
  private rateLimitHits = 0;
  private config: typeof RATE_LIMIT_CONFIGS.REDDIT | typeof RATE_LIMIT_CONFIGS.HACKERNEWS | typeof RATE_LIMIT_CONFIGS.TWITTER;
  public platform: 'REDDIT' | 'HACKERNEWS' | 'TWITTER';

  constructor(platform: 'REDDIT' | 'HACKERNEWS' | 'TWITTER') {
    this.platform = platform;
    this.config = RATE_LIMIT_CONFIGS[platform];
  }

  /**
   * Get a realistic user agent with rotation
   */
  getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)] || USER_AGENTS[0]!;
  }

  /**
   * Smart rate limiting to prevent IP bans
   */
  async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    // Calculate dynamic delay based on recent activity
    let delay = this.config.MIN_DELAY_MS;
    
    // Increase delay if we've been making many requests
    const threshold = this.platform === 'REDDIT' ? 10 : 20;
    if (this.requestCount > threshold) {
      delay = Math.min(this.config.MAX_DELAY_MS, delay * 1.5);
    }
    
    // Increase delay if we've hit rate limits recently
    if (this.rateLimitHits > 0) {
      delay = this.config.BURST_DELAY_MS;
      this.rateLimitHits--; // Decay the counter
    }
    
    const remainingDelay = delay - timeSinceLastRequest;
    if (remainingDelay > 0) {
      logger.debug(`[${this.platform}] Rate limiting: waiting ${remainingDelay}ms`);
      await this.sleep(remainingDelay);
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * Make a safe HTTP request with retry logic
   */
  async safeFetch(url: string, customHeaders?: Record<string, string>, timeoutMs: number = 30000): Promise<Response | null> {
    try {
      await this.enforceRateLimit();
      
      const defaultHeaders: Record<string, string> = this.platform === 'REDDIT' ? {
        'User-Agent': this.getRandomUserAgent(),
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin'
      } : this.platform === 'HACKERNEWS' ? {
        'User-Agent': 'Mozilla/5.0 (compatible; HN-Bot/1.0; +https://news.ycombinator.com)',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      } : {
        'User-Agent': this.getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      };

      const headers: Record<string, string> = { ...defaultHeaders, ...(customHeaders as Record<string, string> || {}) };
      
      const response = await fetch(url, { 
        headers,
        signal: AbortSignal.timeout(timeoutMs)
      });

      // Handle rate limiting
      if (response.status === 429 || response.status === 503) {
        this.rateLimitHits++;
        logger.warn(`[${this.platform}] 🛑 Rate limit hit (${response.status}) on ${url}. Attempt 1/${this.config.MAX_RETRIES}`);
        
        // Try exponential backoff
        for (let attempt = 1; attempt < this.config.MAX_RETRIES; attempt++) {
          const backoffDelay = this.config.BURST_DELAY_MS * Math.pow(this.config.BACKOFF_MULTIPLIER, attempt - 1);
          logger.debug(`[${this.platform}] Backing off for ${backoffDelay}ms (attempt ${attempt + 1})...`);
          await this.sleep(backoffDelay);
          
          try {
            const retryResponse = await fetch(url, { 
              headers,
              signal: AbortSignal.timeout(timeoutMs)
            });
            
            if (retryResponse.ok) {
              // Reset counter on successful retry
              this.requestCount = Math.max(0, this.requestCount - 5);
              return retryResponse;
            }
          } catch (error: any) {
            logger.warn(`[${this.platform}] Retry attempt ${attempt + 1} failed: ${error.message}`);
          }
        }
        
        logger.error(`[${this.platform}] Max retries exceeded for ${url}`);
        return null;
      }

      // Handle other HTTP errors
      if (!response.ok) {
        logger.warn(`[${this.platform}] HTTP ${response.status} for ${url}`);
        return null;
      }

      // Reset counter on successful request
      this.requestCount = Math.max(0, this.requestCount - 5);

      return response;
      
    } catch (error: any) {
      logger.error(`[${this.platform}] Request failed for ${url}: ${error.message}`);
      return null;
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus() {
    return {
      requestCount: this.requestCount,
      rateLimitHits: this.rateLimitHits,
      lastRequestTime: this.lastRequestTime,
      platform: this.platform
    };
  }

  /**
   * Reset rate limit counters (useful for testing or recovery)
   */
  resetCounters() {
    this.requestCount = 0;
    this.rateLimitHits = 0;
    this.lastRequestTime = 0;
  }

  /**
   * Check if we should back off due to rate limiting
   */
  shouldBackOff(): boolean {
    return this.rateLimitHits > 0 || this.requestCount > 50;
  }
}

/**
 * Global IP protection instances
 */
export const redditProtection = new IPProtection('REDDIT');
export const hackerNewsProtection = new IPProtection('HACKERNEWS');
export const twitterProtection = new IPProtection('TWITTER');

/**
 * Utility function to check IP health across all platforms
 */
export function getGlobalIPHealth() {
  return {
    reddit: redditProtection.getRateLimitStatus(),
    hackernews: hackerNewsProtection.getRateLimitStatus(),
    twitter: twitterProtection.getRateLimitStatus(),
    overall: {
      totalRequests: redditProtection.getRateLimitStatus().requestCount + hackerNewsProtection.getRateLimitStatus().requestCount + twitterProtection.getRateLimitStatus().requestCount,
      totalRateLimitHits: redditProtection.getRateLimitStatus().rateLimitHits + hackerNewsProtection.getRateLimitStatus().rateLimitHits + twitterProtection.getRateLimitStatus().rateLimitHits,
      needsBackoff: redditProtection.shouldBackOff() || hackerNewsProtection.shouldBackOff() || twitterProtection.shouldBackOff()
    }
  };
}

/**
 * Utility function to reset all IP protection counters
 */
export function resetAllIPProtection() {
  redditProtection.resetCounters();
  hackerNewsProtection.resetCounters();
  twitterProtection.resetCounters();
}
