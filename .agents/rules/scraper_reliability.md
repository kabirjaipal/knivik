---
trigger: always_on
---

# Rule: Resilient Web Scraping & Ingestion

Use this rule whenever you are writing, refactoring, or reviewing web scrapers, crawler services, HTTP clients, or selector parsers (Reddit, HackerNews, Twitter/X).

---

## 🚦 1. Ethical Scraping & Rate Limits

*   **Randomized Delays (Jitter):** Never send requests in rapid-fire succession. Add randomized delays (e.g., 1–3 seconds) between queries to mimic human browsing behavior and prevent IP blocks.
*   **Robots.txt & Terms Compliance:** Inspect the target domain's `/robots.txt` path and follow crawl-delay rules and route exclusions.
*   **Exponential Backoff:** If you hit an HTTP `429 Too Many Requests` status, back off exponentially with jitter to allow the target server to recover.
*   **Off-Peak Scheduling:** Execute heavy batch crawls during off-peak hours of the target platform.

---

## 🛡️ 2. Anti-Bot & Fingerprint Defense

*   **Header Consistency:** Ensure request headers (User-Agent, Referer, Accept-Language, Sec-Fetch-*) are realistic and match modern browser headers. Rotate realistic User-Agents across requests.
*   **Proxy Rotation & IP Pooling:** Distribute requests across proxy pools where necessary to prevent single-IP blocklisting.
*   **Decoupled Fallbacks:** Implement secondary fallback strategies (e.g., edge-cached RSS feeds, Yahoo search endpoints) when primary JSON API endpoints hit rate limits.

---

## 🪓 3. Resilient Parsing & Extractor Design

*   **Decouple Fetching from Parsing:** Store the raw HTML or JSON payload first, then run parsing logic on the saved dataset. If a layout changes, you can patch the parser without re-scraping live servers.
*   **Multi-Fallback Selectors:** Use flexible selectors. If a platform changes its DOM structure, have fallback CSS/Cheerio selector paths.
*   **Schema Validation:** Pipe parsed data directly into Zod schema validators to filter out malformed, empty, or corrupted records before database insertion.
*   **Isolated Try-Catch Blocks:** Ensure parsing failures on a single post never crash the entire ingestion loop. Log the error and continue to the next item.
