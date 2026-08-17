---
last_updated: 2026-08-17
---

## 2026-08-17 audit + implementation status

Full audit + plan: `docs/superpowers/plans/2026-08-17-seo-improvements.md`.

Findings:
- `site:esim.uplisoft.com` returns **0 Google results** — not indexed at all.
- `robots.txt` blocks `ClaudeBot`, `GPTBot`, `Google-Extended`, `Applebot-Extended`,
  `Amazonbot`, `Bytespider`, `CCBot`, `meta-externalagent` at the Cloudflare edge (not in
  `src/app/robots.ts` — this is a Cloudflare dashboard "Bots" setting, confirmed still active
  as of 2026-08-17 20:xx UTC re-check). This blocks AI assistants from citing the site.
- On-page SEO (title/meta/OG/JSON-LD/`llms.txt`/sitemap with 12 destination pages) is solid —
  not the bottleneck.
- Web search "best eSIM app for USA travel" does not surface eSim2you anywhere (Saily,
  Holafly, Sim Local, Airalo, and comparison-site roundups dominate).

**Blocked — needs a human with account access, not something Claude can execute:**
- [ ] Task 1: Cloudflare dashboard → unblock AI crawler bots (**highest priority**)
- [ ] Task 2: Google Search Console → verify property, submit sitemap
- [ ] Task 3: Bing Webmaster Tools → verify property, submit sitemap
- [ ] Task 5: Off-site listings/backlinks/Reddit/Wikidata outreach

Claude has no Cloudflare/Google/Bing login and the Chrome browser-automation extension is not
connected in this session, so these four cannot be done autonomously — see
`docs/superpowers/plans/2026-08-17-seo-improvements.md` for exact steps for whoever has access.

**Done / not blocked:**
- [x] Task 4: structured data validated manually (JSON-LD parses cleanly as `Organization`,
  `WebSite`, `SoftwareApplication`, `FAQPage` — confirmed via raw HTML fetch, no errors)
- Task 6 (destination page expansion): correctly deferred — sitemap already has 12 destination
  pages, expanding further needs GSC query-gap data that doesn't exist yet (Task 2 blocked)
- Task 7 (ranking re-check): baseline recorded above; re-check requires 1-4 weeks after Tasks
  1-3 land, and Tasks 1-3 haven't landed yet

# SEO / ASO / AI-discoverability checklist

Where to check each item and what "done" looks like. Code-side SEO infra (sitemap,
robots, llms.txt, JSON-LD, metadata) is already built and confirmed live — this
checklist is about verifying it's actually registered with search engines, and
about the off-site work that isn't code at all.

---

## 1. Search engine indexing (Google + Bing)

| Check | Where | What to look for |
| --- | --- | --- |
| Property verified | [Google Search Console](https://search.google.com/search-console) → add property `esim.uplisoft.com` | Green "Ownership verified" status. The `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` env var only renders the meta tag — it does nothing until you actually add the property in GSC and it verifies. |
| Sitemap submitted | GSC → **Sitemaps** (left nav) | `sitemap.xml` listed with status "Success", showing ~22 discovered URLs |
| Indexing errors | GSC → **Pages** (under Indexing) | Should show pages under "Indexed", not "Excluded" or "Error" |
| Actual indexed count | Google search bar: `site:esim.uplisoft.com` | Compare result count to the 22 URLs in `sitemap.xml` |
| Core Web Vitals | GSC → **Page experience** | No "Poor" URLs; check mobile specifically |
| Bing property verified | [Bing Webmaster Tools](https://www.bing.com/webmasters) → add site | Same idea as GSC. Feeds Bing search **and** Microsoft Copilot answers. `NEXT_PUBLIC_BING_SITE_VERIFICATION` only renders the tag — verify in the dashboard too. |
| Bing sitemap submitted | Bing Webmaster Tools → **Sitemaps** | `sitemap.xml` listed, no errors |
| Edge-level redirects | `curl -I http://www.esim.uplisoft.com/` and `curl -I http://esim.uplisoft.com/` from a terminal | Both should return a 301/308 to `https://esim.uplisoft.com/` — confirms Cloudflare/proxy redirects, not just Next middleware |
| OG image renders correctly | Paste `https://esim.uplisoft.com` into [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) or [Twitter Card Validator](https://cards-dev.twitter.com/validator), or just share the link in Slack/WhatsApp | Correct title, description, and `og/esim2you-og.png` shown |
| Structured data valid | [Google Rich Results Test](https://search.google.com/test/rich-results) → enter `https://esim.uplisoft.com/` | No errors on `Organization`, `WebSite`, `SoftwareApplication`, `FAQPage` |

---

## 2. On-site content depth

| Check | Where | What to look for |
| --- | --- | --- |
| Which queries bring traffic | GSC → **Performance** → Search results | Sort by impressions; find query gaps not covered by an existing destination/guide page |
| Which destinations to add next | GSC Performance filtered by query, plus Play Console/App Store Connect search terms | Add country pages for destinations people are already searching, not guesses |
| Internal link coverage | Manually crawl `src/content/seo-pages.ts` and the rendered pages | Each destination/guide/use-case page should link to at least 2-3 related pages, not just back to the homepage |
| Review/rating schema | Once real app reviews exist, add `AggregateRating` in `src/app/JsonLd.tsx` | Validate with the Rich Results Test above |

---

## 3. App Store Optimization (ASO)

| Check | Where | What to look for |
| --- | --- | --- |
| Listing copy is live | [App Store Connect](https://appstoreconnect.apple.com) and [Google Play Console](https://play.google.com/console) → app listing pages | Compare against `velocity-eSim/docs/store-optimization.md` — confirm the drafted copy was actually pasted in, not just written in the doc |
| Localization status | Same consoles, per-locale listing tabs | Check which of the 10 priority languages (`store-optimization.md`) have translated title/description/screenshots vs. English fallback |
| Review prompt timing | Manually test the app flow | Rating prompt should fire only after a successful purchase/install/dashboard interaction, never mid-checkout |
| Search term performance | App Store Connect → **App Analytics** → search terms; Play Console → **Acquisition reports** | Track monthly; only adjust keywords/metadata once you have enough impressions to see a trend |

---

## 4. Off-site presence (this is what actually gets you cited by AI assistants)

`llms.txt` and JSON-LD help AI crawlers *parse* the site correctly — they don't make
ChatGPT/Perplexity/Gemini *cite* eSim2you in an answer. That comes from third-party
mentions. This is almost certainly the real gap right now.

| Action | Where | Why it matters |
| --- | --- | --- |
| Get listed on eSIM comparison sites | Search "best travel eSIM apps" and identify the top 5-10 comparison/aggregator sites; request inclusion | These get scraped/cited constantly by AI travel queries |
| Seed organic mentions | Reddit (r/travel, r/digitalnomad, r/eSIM if it exists), Quora, travel forums | Real user mentions with the app name are exactly what LLMs surface for "what app do people use for X" |
| Wikidata entry | [wikidata.org](https://www.wikidata.org) — check if an entry can be created/claimed for the business | Common structured-fact source AI models pull from |
| Business directory consistency | Crunchbase, G2/Capterra-style directories, any local business directories | Name/description/URL must match `llms.txt` and the App Store listing exactly — mismatches dilute AI confidence in which facts are correct |
| Press/blog backlinks | Outreach to travel-tech blogs, even small ones | Backlinks help classic SEO ranking and increase the odds an AI model's training/retrieval data includes the site |

---

## 5. Ongoing measurement (monthly)

- [ ] GSC: check Performance (queries, impressions, average position)
- [ ] Bing Webmaster Tools: same
- [ ] App Store Connect / Play Console: search term impressions
- [ ] Manually test 3-5 prompts in ChatGPT, Perplexity, and Gemini — e.g. "best eSIM app for Europe travel" — and note whether eSim2you appears, to track AI-citation progress over time
