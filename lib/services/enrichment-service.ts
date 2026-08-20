import config from '../config';
import logger from '../logger';
import { db } from '../db';
import { Platform } from '@prisma/client';

export interface EnrichmentData {
  twitterUrl?: string;
}

/**
 * Attempts to find public social profiles for a given username.
 * - For Reddit usernames: checks Reddit profile for linked accounts (bio links)
 * - For HN usernames: checks HN profile for "about" field which often has links
 * 
 * Non-blocking by design — always resolves (never throws).
 */
export const enrichLead = async (
  leadId: string,
  username: string,
  platform: Platform
): Promise<void> => {
  try {
    // Check owner's plan capability
    const lead = await db.client.lead.findUnique({
      where: { id: leadId },
      include: { product: { include: { user: true } } }
    });

    const { hasCapability } = await import('../plans');
    if (!lead || !hasCapability(lead.product.user.plan as any, 'canAccessEnrichment')) {
      return; // Enrichment is a restricted capability
    }

    // 1. Discover from profile bio/about text
    const result: EnrichmentData = (await discoverProfiles(username, platform)) || {};

    // 2. Discover from the post content/title itself (if social link is missing)
    if (!result.twitterUrl) {
      const postText = [lead.title, lead.content].filter(Boolean).join(' ');
      extractLinksFromText(postText, result);
    }

    if (Object.keys(result).length === 0) return;

    await db.client.lead.update({
      where: { id: leadId },
      data: { enrichment: result as any },
    });

    logger.debug({ leadId, username, found: Object.keys(result) }, 'Lead enrichment succeeded');
  } catch (error) {
    // Non-critical, never fail the pipeline
    logger.debug({ error, leadId, username }, 'Lead enrichment failed (non-fatal)');
  }
};

async function discoverProfiles(
  username: string,
  platform: Platform
): Promise<EnrichmentData | null> {
  if (!username || username === '[deleted]') return null;

  const enrichment: EnrichmentData = {};

  if (platform === Platform.REDDIT) {
    await enrichFromReddit(username, enrichment);
  } else if (platform === Platform.HACKERNEWS) {
    await enrichFromHackerNews(username, enrichment);
  }

  return Object.keys(enrichment).length > 0 ? enrichment : null;
}

async function enrichFromReddit(username: string, enrichment: EnrichmentData): Promise<void> {
  try {
    const res = await fetch(`https://www.reddit.com/user/${username}/about.json`, {
      headers: { 'User-Agent': `${config.PROJECT_NAME}/1.0.0 (contact: support@${config.PROJECT_NAME.toLowerCase()}.io)` },
    });

    if (!res.ok) return;
    const data = (await res.json()) as any;
    const subreddit = data?.data?.subreddit;

    // Parse public description for social links
    const bio = [subreddit?.public_description, subreddit?.description].join(' ').toLowerCase();

    extractLinksFromText(bio, enrichment);
  } catch {
    // Swallow silently — user may be private
  }
}

async function enrichFromHackerNews(username: string, enrichment: EnrichmentData): Promise<void> {
  try {
    const res = await fetch(`https://hacker-news.firebaseio.com/v0/user/${username}.json`);
    if (!res.ok) return;
    const data = (await res.json()) as any;

    // HN "about" field often has HTML links and handles
    const about = (data?.about || '').replace(/<[^>]*>/g, ' ').toLowerCase();
    extractLinksFromText(about, enrichment);
  } catch {
    // Swallow silently
  }
}

/**
 * Parses raw text for recognizable social profile patterns.
 */
function extractLinksFromText(text: string, enrichment: EnrichmentData): void {
  if (!text) return;

  const ignoreList = [
    'a', 'the', 'an', 'in', 'and', 'or', 'for', 'to', 'with', 'at', 'by', 'of', 'on',
    'dev', 'developer', 'founder', 'github', 'twitter', 'site', 'website',
    'blog', 'portfolio', 'link', 'links', 'resume', 'cv', 'contact', 'dm', 'email',
    'me', 'us', 'here', 'profile', 'my', 'our', 'your', 'details', 'info', 'support',
    'page', 'user', 'username', 'account', 'handle', 'social', 'media', 'active',
    'find', 'follow', 'reach', 'message', 'write', 'chat', 'connect', 'about', 'more'
  ];

  // Twitter/X
  const tw = text.match(/(?:twitter\.com|x\.com)\/([a-z0-9_]+)/i);
  if (tw && tw[1]) {
    enrichment.twitterUrl = `https://x.com/${tw[1]}`;
  } else {
    // Check for "twitter: @handle" or "twitter: handle" or "x: @handle"
    const twHandle = text.match(/(?:twitter|x)\s*[:@\-]?\s*@?([a-z0-9_]+)/i);
    if (twHandle && twHandle[1] && !ignoreList.includes(twHandle[1].toLowerCase())) {
      enrichment.twitterUrl = `https://x.com/${twHandle[1]}`;
    }
  }
}
