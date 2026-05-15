import { db } from '../lib/db.js';
import logger from '../lib/logger.js';
import {
  analyzeIntent,
  detectCompetitorSignal,
  semanticScan,
  SemanticScanPost,
} from '../services/aiService.js';
import { Platform, IntentLevel, Product } from '@prisma/client';
import { enrichLead } from '../services/enrichmentService.js';
import { sendLeadAlert } from '../services/alertService.js';
import { hasCapability } from '../lib/plans.js';


export type ProductWithDetails = Product;

// Detection mode for how a lead was found
export type DetectionMode = 'KEYWORD' | 'SEMANTIC' | 'COMPETITOR';

export abstract class BaseScraperEngine {
  abstract platform: Platform;

  protected abstract scrapeQuery(
    product: ProductWithDetails,
    query: string,
    limit: number,
    signal?: AbortSignal
  ): Promise<number>;

  /**
   * Fetches raw recent posts from a given source — used for semantic scanning.
   * Subclasses may override this to provide platform-specific fetching.
   */
  protected async fetchRecentPosts(
    _product: ProductWithDetails,
    _limit: number
  ): Promise<Array<{ id: string; title: string | null; content: string; url: string; author?: string; postedAt?: Date }>> {
    return [];
  }

  /**
   * Main entry point. Runs keyword scan + semantic scan + competitor scan.
   */
  async runAll(userId?: string, signal?: AbortSignal): Promise<void> {
    logger.info(`[${this.platform}] Engine starting${userId ? ` for User: ${userId}` : ''}...`);

    try {
      signal?.throwIfAborted();

      // 0. Plan Capability Check (e.g. Twitter is PRO only)
      if (userId && this.platform === Platform.TWITTER) {
        const user = await db.client.user.findUnique({ where: { id: userId }, select: { plan: true } });
        if (!user || !hasCapability(user.plan as any, 'canAccessTwitter')) {
          logger.info(`[${this.platform}] Skipping: User ${userId} plan (${user?.plan}) does not include Twitter access.`);
          return;
        }
      }

      const activeProducts = await db.client.product.findMany({
        where: {
          isActive: true,
          ...(userId ? { userId } : {}),
        },
      });

      if (activeProducts.length === 0) {
        logger.info(`[${this.platform}] No active products.`);
        return;
      }

      // Randomized stagger delay so engines don't all hit the internet at once
      const stagger = Math.floor(Math.random() * 5000) + 1000;
      await this.sleep(stagger);

      for (const product of activeProducts) {
        signal?.throwIfAborted();
        
        logger.info(`[${this.platform}] Starting cycle for: ${product.name}`);
        const MAX = 5;
        let found = 0;

        const searchQueries = (product.searchQueries as string[]) || [];

        // Pass 1: Query scan
        if (searchQueries.length > 0) {
          // Shuffle queries to ensure variety across runs
          const shuffledQueries = [...searchQueries].sort(() => Math.random() - 0.5);
          
          for (const query of shuffledQueries) {
            signal?.throwIfAborted();
            if (found >= MAX) break;
            
            found += await this.scrapeQuery(product as ProductWithDetails, query, MAX - found, signal);
            
            // Extra pause between queries to be respectful
            await this.sleep(3000); 
          }
        }

        // Pass 2: Semantic scan (no-keyword detection) - PRO only
        const user = await db.client.user.findUnique({ where: { id: product.userId }, select: { plan: true } });
        const hasAdvancedAI = user && hasCapability(user.plan as any, 'canAccessAdvancedAI');

        if (product.description && hasAdvancedAI) {
          found += await this.runSemanticPass(product as ProductWithDetails, MAX - found);
        }

        // Pass 3: Competitor venting scan - PRO only
        // Note: Competitor names are now implicitly handled via AI-generated search queries (Pass 1)
        // and semantic analysis (Pass 2), but we could still have a specific pass if needed.
        // For now, Pass 1 and 2 cover it.

        logger.info(`[${this.platform}] Done with ${product.name}. Found ${found} leads this cycle.`);
      }
    } catch (error: any) {
      logger.error({ message: error.message, platform: this.platform }, 'Fatal error in engine cycle:');
    }
  }

  /**
   * Semantic pass: fetches recent posts from each source, batches them to the AI
   * to find implicit problem-fits, even without keyword matches.
   */
  private async runSemanticPass(product: ProductWithDetails, limit: number): Promise<number> {
    if (limit <= 0) return 0;
    let found = 0;

    let rawPosts = await this.fetchRecentPosts(product, 30);
    if (!rawPosts.length) return 0;

    // Filter out posts older than 1 month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    rawPosts = rawPosts.filter(p => !p.postedAt || p.postedAt >= oneMonthAgo);

    if (!rawPosts.length) return 0;

    const postsForScan: SemanticScanPost[] = rawPosts.map(p => ({
      id: p.id,
      text: `${p.title || ''}\n${p.content}`.trim(),
    }));

    const results = await semanticScan(
      postsForScan,
      product.description || product.name,
      product.userId,
      product.id
    );

    for (const result of results) {
      if (found >= limit) break;
      if (!result.isMatch || result.intentScore < 80) continue; // Higher bar for quality

      const rawPost = rawPosts.find(p => p.id === result.id);
      if (!rawPost) continue;

      const intentLevel: IntentLevel = result.intentScore >= 80 ? 'BUY_NOW'
        : result.intentScore >= 60 ? 'RESEARCHING'
        : 'LOW_INTENT';

      const saved = await this.saveLead(
        product,
        rawPost.id,
        rawPost.title,
        rawPost.content,
        rawPost.url,
        rawPost.author,
        rawPost.postedAt,
        intentLevel,
        result.intentScore,
        'SEMANTIC',
        result.reasoning
      );
      if (saved) found++;
    }

    return found;
  }


  /**
   * processPotentialLead: Used by keyword scan (Pass 1) with all smart pre-filters.
   */
  protected async processPotentialLead(
    product: ProductWithDetails,
    externalPostId: string,
    title: string | null,
    content: string,
    url: string,
    authorUsername?: string,
    postedAt?: Date
  ): Promise<boolean> {
    // 0. Age check (max 1 month old)
    if (postedAt) {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      if (postedAt < oneMonthAgo) return false;
    }

    // 1. Cache check
    const cached = await db.client.scrapeCache.findUnique({
      where: { platform_externalPostId: { platform: this.platform, externalPostId } },
    });
    if (cached) return false;

    // 2. Mark as processed immediately
    await db.client.scrapeCache.create({
      data: { platform: this.platform, externalPostId },
    });

    const combinedText = `${title || ''}\n\n${content}`;

    // 3. Minimum content length: reject very small fragments 
    if (combinedText.trim().length < 50) return false;

    // 4. Bot detection
    if (authorUsername?.toLowerCase().includes('bot')) return false;

    // 5. Smart regex negative keywords
    // [REMOVED] - Negative keywords are now handled by the heuristic pre-qualifier logic 
    // or implicitly by the search query generation.

    // 6. Heuristic pre-qualifier gate (zero-cost, zero-latency)
    // Only posts that pass this gate are sent to the LLM.
    const preQualified = this.preQualifyLead(combinedText);
    if (!preQualified.passed) {
      logger.debug(`[${this.platform}] Heuristic reject [score:${preQualified.score}] (${preQualified.reason}) for ${externalPostId}`);
      return false;
    }
    logger.debug(`[${this.platform}] Heuristic PASS [score:${preQualified.score}] (${preQualified.reason}) for ${externalPostId} → sending to AI`);

    // 7. LLM intent analysis — only reached by posts that passed the heuristic gate
    const scoreResult = await analyzeIntent(
      combinedText,
      product.name,
      product.description || '',
      product.userId,
      product.id
    );
    if (scoreResult.intentScore < 75) {
      logger.debug(`[${this.platform}] Rejected: Low intent score (${scoreResult.intentScore}) for ${externalPostId}. Reason: ${scoreResult.reasoning}`);
      return false; 
    }

    return this.saveLead(
      product,
      externalPostId,
      title,
      content,
      url,
      authorUsername,
      postedAt,
      scoreResult.intentLevel,
      scoreResult.intentScore,
      'KEYWORD',
      scoreResult.reasoning
    );
  }

  /**
   * Central lead persistence + notification layer.
   */
  private async saveLead(
    product: ProductWithDetails,
    externalPostId: string,
    title: string | null,
    content: string,
    url: string,
    authorUsername: string | undefined,
    postedAt: Date | undefined,
    intentLevel: IntentLevel,
    intentScore: number,
    detectedBy: DetectionMode,
    reasoning?: string
  ): Promise<boolean> {
    try {
      const { checkLeadQuota, incrementLeadUsage } = await import('../lib/plans.js');
      const user = await db.client.user.findUnique({ where: { id: product.userId } });
      
      if (!user || !(await checkLeadQuota(user.id, user.plan as any))) {
        logger.warn({ userId: product.userId, productId: product.id }, 'Lead limit reached. Skipping save.');
        return false;
      }

      const newLead = await db.client.lead.create({
        data: {
          productId: product.id,
          platform: this.platform,
          externalPostId,
          title: title?.substring(0, 255) ?? null,
          content: content.substring(0, 5000),
          url,
          authorUsername: authorUsername ?? null,
          intentLevel,
          intentScore,
          postedAt: postedAt ?? null,
          detectedBy,
          ...(reasoning ? { metadata: { qualificationReasoning: reasoning } } : {}),
        },
      });

      // Increment usage
      await incrementLeadUsage(user.id);

      logger.info(
        `[${this.platform}] New ${detectedBy} lead saved for ${product.name} (Score: ${intentScore})`
      );


      // Unified Pipeline: Enrich and Alert directly
      if (authorUsername) {
        enrichLead(newLead.id, authorUsername, this.platform).catch(() => {});
      }
      sendLeadAlert(newLead.id).catch(() => {});

      return true;
    } catch (err: any) {
      if (err.code !== 'P2002') {
        logger.error({ message: err.message }, 'Failed to save lead:');
      }
      return false;
    }
  }

  /**
   * Advanced Intent Scoring Engine (AISE)
   *
   * A zero-cost, zero-latency pre-qualifier that scores every post 0–100
   * using 9 weighted signal tiers, inspired by enterprise intent-data
   * platforms (Bombora, Apollo, G2, Gong) — but running entirely in-memory.
   *
   * Tier 0: Hard-reject noise (self-promo, jobs, tutorials) → immediate fail
   * Tier 1: Buying intent phrases               (+30–45 pts, strongest)
   * Tier 2: Pain / frustration signals          (+20–30 pts)
   * Tier 3: Research / comparison signals       (+15–25 pts, stacking)
   * Tier 4: Competitor mention                  (+50 pts, always stacks)
   * Tier 5: Question depth                      (+10–20 pts)
   * Tier 6: Urgency multiplier                  (×1.5 final score)
   * Tier 7: Content quality & context bonuses  (+5–15 pts)
   * Tier 8: Specificity bonuses                 (+8–10 pts)
   * Tier 9: Negation penalty                    (×0.4 score)
   *
   * PASS_THRESHOLD = 35 → only top ~15% of posts ever touch the LLM.
   */
  private preQualifyLead(
    text: string
  ): { passed: boolean; score: number; reason: string } {
    const PASS_THRESHOLD = 35;
    const lower = text.toLowerCase();
    let score = 0;
    const signals: string[] = [];

    // ── TIER 0: HARD REJECTS ─────────────────────────────────────────────────
    //  "Provider" posts: the author is building/sharing/advising — NOT buying.
    //  These bypass all scoring and immediately disqualify the post.
    const hardRejects: Array<[RegExp, string]> = [
      [/\b(i built|we built|i made|we made|just launched|show hn|check out my|introducing|just shipped)\b/i,                       'self-promo:launch'],
      [/\b(my (tool|startup|app|saas|product)|built (a|this|an) (tool|app|saas|product))\b/i,                                     'self-promo:product'],
      [/\b(how i (got|grew|built|scaled|hit|reached \d)|my (journey|founder story))\b/i,                                          'story:success'],
      [/\b(lessons? (from|after|i('?ve)? learned)|tips? for [a-z]+ing|guide (to|for)|case study|step[- ]by[- ]step)\b/i,          'story:advice'],
      [/\b(we'?re hiring|we are hiring|join (our|the) team|job (post|listing|opening)|open (position|role))\b/i,                   'noise:job'],
      [/\b(salary|full[- ]?time (role|position)|internship|apply (now|here|at)|send (your |a )?resume)\b/i,                        'noise:job'],
      [/\b(breaking news|press release|we are (happy|excited|thrilled) to announce|today we announce)\b/i,                         'noise:news'],
      [/\b(tutorial[: ]|how[- ]to[: ]|i (explain|teach|walk you through)|complete guide)\b/i,                                      'noise:tutorial'],
    ];

    for (const [pattern, label] of hardRejects) {
      if (pattern.test(lower)) {
        return { passed: false, score: 0, reason: `hard-reject:${label}` };
      }
    }

    // ── TIER 1: BUYING INTENT PHRASES (+30–45 pts, take strongest match) ──────
    //  These phrases directly indicate someone SEARCHING for a tool/solution.
    const buyingPatterns: Array<[RegExp, number, string]> = [
      [/\b(looking for (a |an )?(good |reliable |solid |decent )?(tool|app|software|platform|crm|saas|solution|service))\b/i,        45, 'looking-for-tool'],
      [/\b(need (a |an )?(good |reliable |decent )?(tool|app|software|crm|platform|solution))\b/i,                                  45, 'need-tool'],
      [/\b(searching for (a |an )?(tool|software|solution|platform|alternative))\b/i,                                               40, 'searching-tool'],
      [/\b(want (to find|a |an )?(better |good )?(tool|app|software|solution|alternative))\b/i,                                     40, 'want-tool'],
      [/\b(recommend (a |an |me |us )?(good |solid )?(tool|app|software|service|platform))\b/i,                                     40, 'recommend-request'],
      [/\b(any (good|solid|reliable|decent) (tool|app|software|recommendations?)|anything (better|like|similar) (to|for))\b/i,      35, 'any-recommendations'],
      [/\b(what (crm|tool|app|software|platform|service) do you (use|recommend|prefer|suggest))\b/i,                                40, 'what-tool-question'],
      [/\b(alternative (to|for)|switch(ing)? (from|away from)|drop(ping)? .{2,30} for|replacing .{2,30} with)\b/i,                 45, 'alternative-seeking'],
      [/\b(migrat(e|ing) (from|away)|move (away from|off of)|leav(e|ing) .{2,30} (for|because))\b/i,                               45, 'migrate-intent'],
      [/\b(ready to (pay|buy|purchase|invest)|budget (for|of) \$?\d|looking to (spend|invest) \$?\d)\b/i,                          45, 'purchase-ready'],
      [/\b(\$\d+\s*(\/|per)\s*(month|mo|year|yr|user|seat)|lifetime deal|one[- ]time (fee|payment))\b/i,                           35, 'price-anchor'],
      [/\b(subscription (plan|pricing)|enterprise (plan|pricing|tier)|startup plan|free (trial|plan))\b/i,                          30, 'plan-seeking'],
    ];

    for (const [pattern, pts, label] of buyingPatterns) {
      if (pattern.test(lower)) {
        score += pts;
        signals.push(`${label}(+${pts})`);
        break; // Only count the single strongest buying-intent signal
      }
    }

    // ── TIER 2: PAIN / FRUSTRATION SIGNALS (+20–30 pts, take strongest) ───────
    const painPatterns: Array<[RegExp, number, string]> = [
      [/\b(so (frustrated|sick|tired)|incredibly frustrated|absolutely (hate|can'?t stand))\b/i,           30, 'high-frustration'],
      [/\b(frustrated (with|by)|fed up (with|of)|sick of|tired of|can'?t stand)\b/i,                     25, 'frustration'],
      [/\b(struggling (with|to)|pain (point|in the ass)|bottleneck|blocke[rd])\b/i,                       20, 'pain-point'],
      [/\b(doesn'?t work|not working|completely (broken|useless)|crashes? (constantly|all the time))\b/i, 20, 'product-failure'],
      [/\b(too expensive|way overpriced|price (increase|hike|jump)|raised (their )?price)\b/i,            25, 'pricing-pain'],
      [/\b(wasting (hours?|days?|so much time)|takes? (forever|hours?|way too long))\b/i,                 20, 'efficiency-pain'],
      [/\b(scalability (issue|problem)|can'?t scale|doesn'?t scale|breaks? at scale)\b/i,                 20, 'scale-pain'],
    ];

    for (const [pattern, pts, label] of painPatterns) {
      if (pattern.test(lower)) {
        score += pts;
        signals.push(`${label}(+${pts})`);
        break;
      }
    }

    // ── TIER 3: RESEARCH / COMPARISON SIGNALS (+15–25 pts, STACKING) ─────────
    //  These stack because someone researching AND expressing pain is a hot lead.
    const researchPatterns: Array<[RegExp, number, string]> = [
      [/\b(\w+ vs\.?\s*\w+|versus|side[- ]by[- ]side|compared? (to|with)|head[- ]to[- ]head)\b/i,          25, 'comparison'],
      [/\b(pros (and|&|vs\.?) cons|trade[- ]?offs?|which is (better|best)|better than)\b/i,                20, 'evaluation'],
      [/\b(has anyone (used|tried|tested)|anyone (else )?(using|tried|tested)|experience with)\b/i,         20, 'social-proof-seeking'],
      [/\b(thoughts? on|opinions? on|reviews? of|what (do you think|are your thoughts))\b/i,                15, 'opinion-seeking'],
      [/\b(is .{2,40} worth (it|the money|the investment)\?|should i (switch to|use|try|pay for))\b/i,     25, 'worth-it-question'],
      [/\b(evaluat(e|ing|ion)|assess(ing|ment)|short[- ]?list(ing)?|vendor (selection|comparison))\b/i,   20, 'formal-evaluation'],
      [/\b(free (alternative|option)|open[- ]source (alternative|replacement)|cheaper alternative)\b/i,    25, 'budget-alternative'],
    ];

    for (const [pattern, pts, label] of researchPatterns) {
      if (pattern.test(lower)) {
        score += pts;
        signals.push(`${label}(+${pts})`);
        // Note: these stack intentionally — don't break
      }
    }

    // ── TIER 4: COMPETITOR MENTION (+50 pts, stacks with everything) ──────────
    // [DEPRECATED] - Competitors model removed. Intent now handled via general signals.

    // ── TIER 5: QUESTION DEPTH (+10–20 pts) ──────────────────────────────────
    //  More questions = more confused/searching person = better lead.
    const questionCount = (text.match(/\?/g) || []).length;
    if      (questionCount >= 3) { score += 20; signals.push('3+-questions(+20)'); }
    else if (questionCount === 2) { score += 15; signals.push('2-questions(+15)'); }
    else if (questionCount === 1) { score += 10; signals.push('1-question(+10)'); }

    // ── TIER 6: URGENCY MULTIPLIER (×1.5 applied to running score) ───────────
    //  Time pressure = deal is imminent. Multiply ALL previous signals.
    const urgencyPattern = /\b(asap|urgent(ly)?|right (now|away)|immediately|by (next week|monday|friday|end of (week|month)|eod|eow)|deadline|need (it |this )?(today|now|soon|immediately)|time[- ]sensitive|in a (rush|hurry))\b/i;
    if (urgencyPattern.test(lower)) {
      score = Math.round(score * 1.5);
      signals.push('urgency(×1.5)');
    }

    // ── TIER 7: CONTENT QUALITY BONUSES (+5–15 pts) ───────────────────────────
    const textLength = text.trim().length;
    if      (textLength > 600) { score += 15; signals.push('detailed-post(+15)'); }
    else if (textLength > 250) { score += 8;  signals.push('medium-post(+8)'); }
    else if (textLength > 100) { score += 5;  signals.push('short-post(+5)'); }

    // ALL CAPS words signal emotional intensity (frustration/desperation)
    const IGNORED_CAPS = new Set(['URL', 'API', 'CRM', 'SaaS', 'MVP', 'B2B', 'CEO', 'CTO', 'CTR', 'ROI', 'SKU', 'SQL', 'AWS', 'GCP', 'ETL']);
    const capsWords = (text.match(/\b[A-Z]{3,}\b/g) || []).filter(w => !IGNORED_CAPS.has(w));
    if (capsWords.length >= 2) { score += 10; signals.push('caps-emotion(+10)'); }

    // ── TIER 8: SPECIFICITY BONUSES (+5–10 pts) ───────────────────────────────
    //  Specificity = real person with a concrete problem, not casual browsing.
    if (/\b(small team|our team|my team|we have \d+|team of \d+|company of|our company|our (startup|org|organization))\b/i.test(lower)) {
      score += 10; signals.push('company-context(+10)');
    }
    if (/\b(next (week|month|quarter|sprint)|q[1-4] \d{4}|by \w+ \d{1,2}|within \d+ (days?|weeks?))\b/i.test(lower)) {
      score += 8; signals.push('timeframe(+8)');
    }
    if (/\b(\d+[km]?\+? (users?|customers?|clients?|employees?|seats?)|enterprise|team plan)\b/i.test(lower)) {
      score += 8; signals.push('scale-context(+8)');
    }
    // Direct mention of a specific use case domain
    if (/\b(for (my|our) (team|startup|agency|company|clients?|workflow)|use case|our (workflow|process|pipeline))\b/i.test(lower)) {
      score += 5; signals.push('use-case-context(+5)');
    }

    // ── TIER 9: NEGATION PENALTY (×0.4 — drastic score reduction) ────────────
    //  Common pattern: "I'm NOT looking for recommendations" or "already using X".
    const negationPattern = /\b(not (looking for|asking for|seeking|interested in)|don'?t (need|want|recommend)|already (have|using|set up|switched)|no longer (need|looking)|we('?ve)? decided)\b/i;
    if (negationPattern.test(lower)) {
      score = Math.round(score * 0.4);
      signals.push('negation-penalty(×0.4)');
    }

    const passed = score >= PASS_THRESHOLD;
    return {
      passed,
      score,
      reason: signals.length > 0 ? signals.join(' | ') : 'no-signals',
    };
  }

  /**
   * Automatically adds a 20-30% random time jitter to any sleep call.
   * This is a crucial stealth technique so requests don't look like an automated 
   * CRON job hitting exact intervals.
   */
  protected async sleep(baseMs: number) {
    const jitter = baseMs * 0.30; 
    const fuzz = Math.random() * (jitter * 2) - jitter; // ±30%
    const finalMs = Math.max(250, baseMs + fuzz); // never sleep less than 250ms
    return new Promise((resolve) => setTimeout(resolve, finalMs));
  }

  /**
   * Randomly selects a highly-common browser User-Agent so our "stealth" engines 
   * (DuckDuckGo, Nitter) think we are a standard human browsing on a Mac/PC/iPhone.
   */
  protected getRandomUserAgent(): string {
    const agents = [
      // Chrome (Windows)
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      // Chrome (Mac)
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      // Safari (Mac)
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
      // Firefox (Windows)
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
      // iPhone
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
      // Edge (Windows)
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0',
    ];
    return agents[Math.floor(Math.random() * agents.length)] as string;
  }
}
