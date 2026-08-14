---
name: scraper-reliability
description: Best practices for resilient web scraping, covering rate-limiting, robots.txt compliance, IP/Proxy rotation, TLS fingerprinting, dynamic headless browsers, and parsing robustness.
version: 1.0.0
author: Web Scraping Best Practices
tags:
  - scrapers
  - crawler
  - proxy
  - anti-bot
  - extraction
---

# Skill: Resilient Web Scraping & Ingestion Playbook

This playbook outlines official best practices and defensive engineering strategies for running web scraping pipelines safely, reliably, and ethically.

---

## 🚀 When to Activate

Trigger this skill automatically whenever you are:
1. Creating or modifying scrapers (Reddit, HackerNews, Twitter ingestion).
2. Configuring HTTP clients, Axios instances, or node-fetch options for third-party pages.
3. Implementing headless browser scripts (Playwright, Puppeteer, Selenium).
4. Writing selector parsing logic (Cheerio, JSDOM, regex extractors).

---

## 🚦 1. Ethical Scraping & Rate Limits

*   **Randomized Delays (Jitter):** Never send requests in rapid-fire succession. Add randomized delays (e.g. 2–10 seconds) between requests to mimic human browsing behavior and prevent IP blocks.
*   **Robots.txt Compliance:** Inspect the target domain's `/robots.txt` path and follow crawl-delay rules and route exclusions.
*   **Exponential Backoff:** If you hit an HTTP `429 Too Many Requests` status, back off exponentially to allow the target server to recover.
*   **Off-Peak Scheduling:** Execute heavy batch crawls during off-peak hours of the target website's timezone.

---

## 🛡️ 2. Anti-Bot & Fingerprint Bypass

*   **Header Consistency:** Ensure request headers (User-Agent, Referer, Accept-Language) are realistic and match the client environment being simulated. Rotate User-Agents regularly.
*   **Proxy Rotation:** Route requests through residential or mobile proxy pools to distribute volume and prevent single-IP blocklisting.
*   **TLS/JA3 Fingerprinting:** Use client libraries (e.g. `curl-cffi` in Python, or custom HTTP clients in Node) that mimic browser-like TLS handshake negotiations, as standard library HTTP requests are easily identified.
*   **Headless Stealth:** When crawling JavaScript-heavy sites with Playwright or Puppeteer, utilize stealth plugins to strip automation variables (e.g., hiding `navigator.webdriver`). Include subtle human-like cursor movements and scrolls.

---

## 🪓 3. Resilient Parsing & Extractor Design

*   **Decouple Fetching from Parsing:** Store the raw HTML or JSON payload first, then run parsing logic on the saved dataset. If a parser fails due to structural changes on the target site, you can patch the script and parse the raw data again without scraping the live server.
*   **Multi-Fallback Selectors:** Use flexible selectors. Do not rely on deep, static XPaths. If the target layout changes, have multiple fallback CSS paths.
*   **Schema Validation:** Pipe parsed data directly into a schema validator (like Zod) to filter out malformed, empty, or corrupted records before inserting them into the database.
*   **Isolated Try-Catch Blocks:** Ensure parsing failures on a single page do not crash the entire ingestion loop. Log the failed HTML structure and proceed to the next item.
