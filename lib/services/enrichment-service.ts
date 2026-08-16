import config from '../config';
import logger from '../logger';
import { db } from '../db';
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

    // 2. Discover from the post content/title itself (if any social link is missing)
    if (!result.linkedinUrl || !result.twitterUrl || !result.githubUrl) {
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
  } else if (platform === Platform.GITHUB) {
    await enrichFromGitHub(username, enrichment);
  } else if (platform === Platform.BLUESKY) {
    await enrichFromBluesky(username, enrichment);
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

async function enrichFromGitHub(username: string, enrichment: EnrichmentData): Promise<void> {
  // Set GitHub URL by default
  enrichment.githubUrl = `https://github.com/${username}`;
  try {
    const res = await fetch(`https://api.github.com/users/${username}`, {
      headers: { 'User-Agent': `${config.PROJECT_NAME}/1.0.0` },
    });
    if (!res.ok) return;
    const data = (await res.json()) as any;

    if (data?.twitter_username) {
      enrichment.twitterUrl = `https://x.com/${data.twitter_username}`;
    }

    const textToSearch = [data?.blog, data?.bio, data?.company].filter(Boolean).join(' ').toLowerCase();
    extractLinksFromText(textToSearch, enrichment);
  } catch {
    // Swallow silently
  }
}

async function enrichFromBluesky(username: string, enrichment: EnrichmentData): Promise<void> {
  try {
    const res = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${username}`);
    if (!res.ok) return;
    const data = (await res.json()) as any;

    const textToSearch = [data?.description, data?.displayName].filter(Boolean).join(' ').toLowerCase();
    extractLinksFromText(textToSearch, enrichment);
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
    'dev', 'developer', 'founder', 'github', 'twitter', 'linkedin', 'site', 'website',
    'blog', 'portfolio', 'link', 'links', 'resume', 'cv', 'contact', 'dm', 'email',
    'me', 'us', 'here', 'profile', 'my', 'our', 'your', 'details', 'info', 'support',
    'page', 'user', 'username', 'account', 'handle', 'social', 'media', 'active',
    'find', 'follow', 'reach', 'message', 'write', 'chat', 'connect', 'about', 'more'
  ];

  // 1. LinkedIn
  const li = text.match(/linkedin\.com\/in\/([a-z0-9\-_%]+)/i);
  if (li && li[1]) {
    enrichment.linkedinUrl = `https://linkedin.com/in/${li[1]}`;
  } else {
    // Check for "linkedin: username" or "li: username" or similar handles
    const liHandle = text.match(/(?:linkedin|li)\s*[:@\-]?\s*([a-z0-9\-_%]+)/i);
    if (liHandle && liHandle[1] && !ignoreList.includes(liHandle[1].toLowerCase())) {
      enrichment.linkedinUrl = `https://linkedin.com/in/${liHandle[1]}`;
    }
  }

  // 2. Twitter/X
  const tw = text.match(/(?:twitter\.com|x\.com)\/([a-z0-9_]+)/i);
  if (tw && tw[1]) {
    enrichment.twitterUrl = `https://x.com/${tw[1]}`;
  } else {
    // Check for "twitter: @handle" or "twitter: handle" or "x: @handle"
    const twHandle = text.match(/(?:twitter|x|twt)\s*[:\-]?\s*@?([a-z0-9_]{1,15})/i);
    if (twHandle && twHandle[1] && !ignoreList.includes(twHandle[1].toLowerCase())) {
      enrichment.twitterUrl = `https://x.com/${twHandle[1]}`;
    }
  }

  // 3. GitHub
  const gh = text.match(/github\.com\/([a-z0-9\-]+)/i);
  if (gh && gh[1]) {
    enrichment.githubUrl = `https://github.com/${gh[1]}`;
  } else {
    // Check for "github: username" or "gh: username"
    const ghHandle = text.match(/(?:github|gh)\s*[:@\-]?\s*([a-z0-9\-]+)/i);
    if (ghHandle && ghHandle[1] && !ignoreList.includes(ghHandle[1].toLowerCase())) {
      enrichment.githubUrl = `https://github.com/${ghHandle[1]}`;
    }
  }
}
