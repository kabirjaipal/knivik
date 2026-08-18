import { NextRequest } from "next/server";
import logger from "@/lib/logger";

/**
 * Known suspicious probe patterns targeted by automated vulnerability scanners
 */
const SUSPICIOUS_PATH_PATTERNS = [
  // Sensitive files & credentials
  /\/\.env/i,
  /\/\.git/i,
  /\/\.svn/i,
  /\/\.aws/i,
  /\/\.ssh/i,
  /\/\.ds_store/i,
  /\/\.vscode/i,
  /\/\.idea/i,
  /\/\.config/i,
  /\/\.well-known\/(?!security\.txt|apple-app-site-association)/i,
  /\.php$/i,
  /\.asp$/i,
  /\.aspx$/i,
  /\.jsp$/i,
  /\.cgi$/i,
  /\.sql$/i,
  /\.bak$/i,
  /\.old$/i,
  /\.swp$/i,
  /\.tar(\.gz)?$/i,
  /\.zip$/i,
  
  // Vulnerability scanners / CMS probing
  /\/wp-admin/i,
  /\/wp-login/i,
  /\/wp-includes/i,
  /\/wp-content/i,
  /\/xmlrpc\.php/i,
  /\/phpinfo/i,
  /\/phpmyadmin/i,
  /\/pma/i,
  /\/adminer/i,
  /\/actuator/i,
  /\/eval-stdin/i,
  /\/solr/i,
  /\/cgi-bin/i,
  /\/server-status/i,
  /\/web\.config/i,
  
  // Path traversal
  /\.\.\//,
  /\.\.\\/,
  /%2e%2e/i,
  /%2f/i,
  /\/etc\/passwd/i,
  /\/etc\/shadow/i,
  /boot\.ini/i,
];

/**
 * Malicious security scanner User-Agents
 */
const MALICIOUS_USER_AGENTS = [
  "sqlmap",
  "nikto",
  "masscan",
  "zgrab",
  "nmap",
  "gobuster",
  "dirbuster",
  "wpscan",
  "nuclei",
  "acunetix",
  "nessus",
  "openvas",
  "morfeus",
  "arachni",
  "vega",
];

// Simple in-memory rate limiter for edge/middleware protection
interface RateLimitEntry {
  count: number;
  resetAt: number;
  blockedUntil?: number;
}

const ipRequestMap = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL_MS = 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [ip, entry] of ipRequestMap.entries()) {
    if (entry.resetAt < now && (!entry.blockedUntil || entry.blockedUntil < now)) {
      ipRequestMap.delete(ip);
    }
  }
}

/**
 * Extract client IP from request headers
 */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "unknown";
}

/**
 * Check if the incoming request is a malicious vulnerability probe or scanner
 */
export function isMaliciousProbe(request: NextRequest): { isMalicious: boolean; reason?: string } {
  const pathname = request.nextUrl.pathname;
  const rawUrl = request.nextUrl.toString();
  const userAgent = (request.headers.get("user-agent") || "").toLowerCase();

  // 1. Check User-Agent against known scanner tools
  for (const scanner of MALICIOUS_USER_AGENTS) {
    if (userAgent.includes(scanner)) {
      return { isMalicious: true, reason: `Malicious Scanner User-Agent: ${scanner}` };
    }
  }

  // 2. Check path against exploit & probe patterns
  for (const pattern of SUSPICIOUS_PATH_PATTERNS) {
    if (pattern.test(pathname) || pattern.test(rawUrl)) {
      return { isMalicious: true, reason: `Suspicious Probe Pattern: ${pattern.toString()}` };
    }
  }

  // 3. Check for obvious SQL injection / XSS in query parameters
  const search = request.nextUrl.search.toLowerCase();
  if (
    search.includes("union+select") ||
    search.includes("union%20select") ||
    search.includes("<script") ||
    search.includes("%3cscript") ||
    search.includes("information_schema") ||
    search.includes(";drop%20table") ||
    search.includes(";drop+table")
  ) {
    return { isMalicious: true, reason: "SQL Injection / XSS Probe in query string" };
  }

  return { isMalicious: false };
}

/**
 * Edge rate-limiter: Limits abusive or rapid repeated requests per IP
 * Default: 60 requests per 10 seconds per IP, with automatic 1-minute ban on violation
 */
export function checkEdgeRateLimit(
  ip: string,
  maxRequests: number = 60,
  windowMs: number = 10 * 1000
): { allowed: boolean; remaining: number } {
  cleanupExpiredEntries();

  if (ip === "unknown" || ip === "127.0.0.1" || ip === "::1") {
    return { allowed: true, remaining: maxRequests };
  }

  const now = Date.now();
  let entry = ipRequestMap.get(ip);

  if (entry && entry.blockedUntil && entry.blockedUntil > now) {
    return { allowed: false, remaining: 0 };
  }

  if (!entry || entry.resetAt < now) {
    entry = { count: 1, resetAt: now + windowMs };
    ipRequestMap.set(ip, entry);
    return { allowed: true, remaining: maxRequests - 1 };
  }

  entry.count += 1;

  if (entry.count > maxRequests) {
    // Temporarily block the IP for 60 seconds
    entry.blockedUntil = now + 60 * 1000;
    logger.warn({ ip, count: entry.count }, "[Security] IP temporarily blocked due to rate limit violation");
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: Math.max(0, maxRequests - entry.count) };
}
