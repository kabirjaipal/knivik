# Micro-Tools Progress

## Summary

- **Total planned micro-tools:** 5
- **Completed:** 4
- **Pending:** 1

## Completed (4/5)

1. ✅ **Advanced Social Search Operator Builder**
   - Route: `/tools/search-builder`
   - Files:
     - `client/app/(marketing)/tools/search-builder/page.tsx`
     - `client/app/(marketing)/tools/search-builder/SearchBuilderClient.tsx`
   - Notes:
     - Platform-specific query generation updated for Reddit / Google / HN / X syntax.
     - UI compacted, equal-height top cards, full-width CTA row below.
     - Operator Output tabs removed (shows all queries directly).
     - Platform badges use `react-icons` brand icons.

2. ✅ **Outreach Message "Warmth" & Spam Auditor**
   - Route: `/tools/warmth-auditor`
   - Files:
     - `client/app/(marketing)/tools/warmth-auditor/page.tsx`
     - `client/app/(marketing)/tools/warmth-auditor/WarmthAuditorClient.tsx`
   - Notes:
     - Computes **Warmth Score** + **Spam Risk**.
     - Detects personalization, empathy, hard-sell language, urgency, link overuse, CTA softness, generic opener, readability signals.
     - Produces actionable suggestions + copyable rewrite.
     - Scoring/rewrite logic upgraded to be less generic and more realistic.

3. ✅ **Reddit & HackerNews Testimonial Card Generator**
   - Route: `/tools/testimonial-generator`
   - Files:
     - `client/app/(marketing)/tools/testimonial-generator/page.tsx`
     - `client/app/(marketing)/tools/testimonial-generator/TestimonialGeneratorClient.tsx`
   - Notes:
     - Generates shareable testimonial card previews from Reddit/HN quotes.
     - Supports presets for minimal, social-proof, and bold layouts.
     - Includes copyable text outputs, live preview, and SVG card download.
     - Adds CTA to `/pricing` and footer navigation under Free Tools.

4. ✅ **Ask HN Lead Finder Feed**
   - Route: `/tools/ask-hn-feed`
   - Files:
     - `client/app/(marketing)/tools/ask-hn-feed/page.tsx`
     - `client/app/(marketing)/tools/ask-hn-feed/AskHnFeedClient.tsx`
   - Notes:
     - Displays curated HackerNews thread lead feed filtered by intent and topics.
     - Interactive search, sorting, intent level filtering.
     - Live customizable pitch template generator updating in real-time.
     - Collapsible/expandable thread details showing HN discussion comments context.
     - Link added to footer under Free Tools.

## Navigation Integration

- Free tools are linked from footer:
  - `client/components/landing/footer.tsx`
  - Current links:
    - `/tools/search-builder`
    - `/tools/warmth-auditor`
    - `/tools/testimonial-generator`
    - `/tools/ask-hn-feed`

## Pending (1/5)

5. ⏳ **Subreddit Niche Lead Directory**

## Recommended Next Build (for new chat)

### Next tool: **Subreddit Niche Lead Directory**

Suggested route/files:

- `client/app/(marketing)/tools/subreddit-directory/page.tsx`
- `client/app/(marketing)/tools/subreddit-directory/SubredditDirectoryClient.tsx`

Suggested MVP scope:

- Directory of high-value subreddits categorized by business niche (SaaS, eCommerce, DevTools, Agency, Creator, etc.).
- Search and filterable list showcasing active subscriber sizes, common pain points, and specific high-intent keyword triggers.
- Quick link actions to launch search-builders or register active monitors inside Knivik.
- Keep UI consistent, using clean table or grid layouts, with HSL token-based Midnight Premium design.

## Handoff Notes

- Keep UI compact and consistent with existing tool cards (`p-4`, `text-xs`, tight spacing).
- Use existing Tailwind/theme tokens and current component style patterns.
- Avoid adding new npm packages unless necessary.
- Keep progress file updated after each tool completion.
