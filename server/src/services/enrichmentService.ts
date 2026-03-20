import logger from '../lib/logger.js';
import { db } from '../lib/db.js';
import { Platform } from '@prisma/client';

export interface EnrichmentData {
  githubUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
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
    const result = await discoverProfiles(username, platform);
    if (!result || (Object.keys(result).length === 0)) return;

    await db.client.lead.update({
      where: { id: leadId },
      data: { enrichment: result },
    });

    logger.info({ leadId, username, found: Object.keys(result) }, 'Lead enrichment succeeded');
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
      headers: { 'User-Agent': 'IntentRadar/1.0.0 (contact: me@intentradar.io)' },
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

  // LinkedIn
  const li = text.match(/linkedin\.com\/in\/([a-z0-9\-_%]+)/i);
  if (li) enrichment.linkedinUrl = `https://linkedin.com/in/${li[1]}`;

  // Twitter/X
  const tw = text.match(/(?:twitter\.com|x\.com)\/([a-z0-9_]+)/i);
  if (tw) enrichment.twitterUrl = `https://x.com/${tw[1]}`;

  // GitHub
  const gh = text.match(/github\.com\/([a-z0-9\-]+)/i);
  if (gh) enrichment.githubUrl = `https://github.com/${gh[1]}`;
}
