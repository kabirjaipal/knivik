# Micro-Tools Progress

## Summary

- **Total planned micro-tools:** 5
- **Completed:** 2
- **Pending:** 3

## Completed (2/5)

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

## Navigation Integration

- Free tools are linked from footer:
  - `client/components/landing/footer.tsx`
  - Current links:
    - `/tools/search-builder`
    - `/tools/warmth-auditor`

## Pending (3/5)

3. ⏳ **Reddit & HackerNews Testimonial Card Generator**
4. ⏳ **Ask HN Lead Finder Feed**
5. ⏳ **Subreddit Niche Lead Directory**

## Recommended Next Build (for new chat)

### Next tool: **Reddit & HackerNews Testimonial Card Generator**

Suggested route/files:

- `client/app/(marketing)/tools/testimonial-generator/page.tsx`
- `client/app/(marketing)/tools/testimonial-generator/TestimonialGeneratorClient.tsx`

Suggested MVP scope:

- Input: quote text, author handle, source platform (Reddit/HN), source link, optional product/niche tag.
- Live preview testimonial card (theme-consistent dark/light).
- Preset styles (minimal, social-proof, bold).
- Copy-to-clipboard output text and optional downloadable image card.
- Include CTA to `/pricing` similar to other tools.
- Add footer link under **Free Tools** after implementation.

## Handoff Notes

- Keep UI compact and consistent with existing tool cards (`p-4`, `text-xs`, tight spacing).
- Use existing Tailwind/theme tokens and current component style patterns.
- Avoid adding new npm packages unless necessary.
- Keep progress file updated after each tool completion.
