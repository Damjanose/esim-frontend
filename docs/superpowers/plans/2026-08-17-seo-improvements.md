# SEO / AI-Search Visibility Fixes — Implementation Plan

> **For agentic workers:** Most tasks below are account/dashboard changes, not code — the
> superpowers:executing-plans / subagent-driven-development TDD scaffolding does not apply
> to those. Follow steps in order; each task states whether it's a **code task** (has files,
> tests, commit) or a **manual task** (dashboard/account action a human must do, verified by
> a follow-up check).

**Goal:** Fix the concrete gaps found in the 2026-08-17 SEO audit — AI crawlers blocked at
the edge, no confirmed Google/Bing indexing, zero off-site presence — then measure whether
ranking/citation actually improved.

**Architecture:** No application code changes are required for the top-priority fix (the AI
bot block lives in Cloudflare's dashboard, not in `src/app/robots.ts`). Remaining work is
GSC/Bing account setup and off-site outreach. One optional code task (destination-page
expansion) is included for later, lower priority.

**Tech Stack:** Cloudflare dashboard, Google Search Console, Bing Webmaster Tools, Next.js
(`src/app/robots.ts`, `src/lib/seo.ts`, `src/content/seo-pages.ts`).

---

## Task 1: Unblock AI crawlers in Cloudflare (manual — do first, highest leverage)

**Where:** Cloudflare dashboard → the `esim.uplisoft.com` zone → **Security** → **Bots** →
**Configure Super Bot Fight Mode** (or **AI Crawl Control**, depending on plan tier — newer
Cloudflare accounts show a dedicated "AI Crawl Control" page under **Security**).

**Why this is Task 1:** `curl -s https://esim.uplisoft.com/robots.txt` shows a block on
`Google-Extended`, `GPTBot`, `ClaudeBot`, `Applebot-Extended`, `Amazonbot`, `Bytespider`,
`CCBot`, and `meta-externalagent`, injected under a `# BEGIN Cloudflare Managed content`
comment block. This is **not** in the repo (`src/app/robots.ts` only emits `Allow: /` plus
the private-route disallow list) — it's a Cloudflare-side toggle, almost certainly the
default "Block AI Bots" setting. It directly blocks every AI assistant this project wants to
be cited by.

- [ ] **Step 1:** Log into the Cloudflare dashboard for the account that owns `esim.uplisoft.com`.
- [ ] **Step 2:** Navigate to the zone → **Security** → **Bots**. Find the rule/toggle
  blocking "AI Scrapers and Crawlers" (Cloudflare's managed AI bot category).
- [ ] **Step 3:** Decide the policy and apply it:
  - If the goal is "let AI assistants cite us in answers, but don't let them train on us":
    turn off the block for **retrieval/search bots** specifically —
    `ClaudeBot` (Anthropic), `OAI-SearchBot` (ChatGPT search/citations),
    `Google-Extended` (Gemini grounding), `PerplexityBot`, `Applebot-Extended`.
    Leave `GPTBot` blocked if you want to opt out of OpenAI *training* specifically (note:
    `GPTBot` also affects some ChatGPT browsing, so test after — see Step 5).
  - If the goal is simplest and matches `robots.txt`'s existing `Content-Signal: ai-train=no,
    use=reference` intent: allow all the crawlers, keep training opt-out expressed via the
    `Content-Signal` line only (that line is a stated preference, not an enforced block, but
    it's the correct place to express "don't train on this, but you can cite it").
- [ ] **Step 4:** Save the change in Cloudflare. No deploy needed — this is edge-level, not
  app code.
- [ ] **Step 5:** Verify the fix (do this immediately, don't wait for Task 7):
  ```bash
  curl -s https://esim.uplisoft.com/robots.txt
  ```
  Expected: the `User-agent: ClaudeBot` / `GPTBot` / `Google-Extended` /
  `Applebot-Extended` stanzas either no longer appear, or show `Allow: /` instead of
  `Disallow: /`.
- [ ] **Step 6:** No commit needed (no repo file changed). If you want a record of the
  decision, add one line to `docs/seo-aso-checklist.md` section 1 noting which bots were
  unblocked and the date.

---

## Task 2: Verify Google Search Console property + submit sitemap (manual)

**Where:** [Google Search Console](https://search.google.com/search-console)

- [ ] **Step 1:** Add property `esim.uplisoft.com` (domain or URL-prefix property — URL-prefix
  is simpler since `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` already renders the meta-tag
  verification method).
- [ ] **Step 2:** Complete verification via the meta tag method (should succeed immediately
  since the tag is already live — confirm with `curl -s https://esim.uplisoft.com | grep
  google-site-verification`).
- [ ] **Step 3:** Go to **Sitemaps** (left nav) → submit `https://esim.uplisoft.com/sitemap.xml`.
- [ ] **Step 4:** Confirm status reads "Success" (may take a few minutes to a day).
- [ ] **Step 5:** Go to **Pages** (under Indexing) → **Request indexing** for the homepage
  and `/destinations` at minimum, to accelerate the first crawl.
- [ ] **Step 6:** No commit — this is account state, not code.

---

## Task 3: Verify Bing Webmaster Tools property + submit sitemap (manual)

**Where:** [Bing Webmaster Tools](https://www.bing.com/webmasters)

- [ ] **Step 1:** Add site `esim.uplisoft.com`. Bing Webmaster Tools offers a one-click
  "Import from Google Search Console" option once Task 2 is done — use that if available, it
  auto-verifies and imports the sitemap.
- [ ] **Step 2:** If importing manually instead, verify via the meta tag
  (`NEXT_PUBLIC_BING_SITE_VERIFICATION` already renders it) and submit
  `https://esim.uplisoft.com/sitemap.xml` under **Sitemaps**.
- [ ] **Step 3:** Confirm no errors. This feeds Bing search **and** Microsoft Copilot answers,
  so it matters for the AI-search half of the goal, not just classic search.
- [ ] **Step 4:** No commit — account state only.

---

## Task 4: Validate structured data and social previews (manual, ~5 min, do after Task 1)

- [ ] **Step 1:** [Google Rich Results Test](https://search.google.com/test/rich-results) →
  enter `https://esim.uplisoft.com/`. Expected: no errors on `Organization`, `WebSite`,
  `SoftwareApplication`, `FAQPage`.
- [ ] **Step 2:** [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) →
  enter the same URL → click "Scrape Again" (cache may be stale) → confirm title,
  description, and `og/esim2you-og.png` render correctly.
- [ ] **Step 3:** No commit — these were already confirmed valid in the 2026-08-17 audit; this
  step is a regression check, only act if something now fails.

---

## Task 5: Off-site presence — the actual driver of AI citations (manual, ongoing)

This is the slowest task and the one with the highest ceiling. `llms.txt` and JSON-LD only
help crawlers *parse* the site correctly — they don't make an AI assistant *cite* it. A web
search for "best eSIM app for USA travel" during the audit surfaced Saily, Holafly, Sim
Local, and roundups from cybernews/gizmodo/wise.com — eSim2you appeared nowhere.

- [ ] **Step 1:** Identify the top 5–10 eSIM comparison/aggregator sites (the ones that
  outranked eSim2you in the audit search are a good starting list: cybernews.com,
  gizmodo.com, wise.com, traveltomtom.net, runawaytraveller.com,
  belaroundtheworld.com, easysim.global). For each, find their "submit your service" or
  editorial contact and request inclusion, using the description/facts from `llms.txt` as the
  canonical copy so every listing matches.
- [ ] **Step 2:** Post genuine, non-spammy mentions where relevant in r/travel,
  r/digitalnomad, r/eSIM (if it exists), and relevant Quora threads about travel data.
- [ ] **Step 3:** Check [wikidata.org](https://www.wikidata.org) for an existing entry; create
  one if none exists, matching name/URL/description exactly to `llms.txt`.
- [ ] **Step 4:** List on Crunchbase and any G2/Capterra-style directories relevant to travel
  apps, again keeping name/description/URL consistent everywhere.
- [ ] **Step 5:** No commit — this is outreach, not code. Track progress informally (a simple
  checklist in `docs/seo-aso-checklist.md` section 4 is enough).

---

## Task 6 (optional, lower priority): Expand destination coverage in the sitemap

**Files:**
- Modify: `src/content/seo-pages.ts` (add new entries to `destinationPages`)
- Read (no change needed): `src/lib/seo.ts:45-71` (`indexableRoutes` already maps over
  `publicSeoPages` automatically — new destination pages appear in the sitemap for free)
- Test: `src/content/seo-pages.test.ts`, `src/app/seo-routes.test.ts`

**Note:** the audit's first pass assumed the sitemap was thin (~8 URLs) based on a truncated
`curl | head -50`. It is **not** thin — 12 destination pages already exist (USA, Europe,
Japan, Turkey, France, UK, Germany, Italy, Spain, Greece, Portugal, Switzerland) plus 5
guide/use-case pages. `llms.txt` mentions no destinations beyond these. Only do this task once
GSC **Performance → Search results** (Task 2) shows real query gaps — don't guess at new
country pages without impression data.

- [ ] **Step 1:** After 2–4 weeks of GSC data (Task 2), check **Performance** → filter by
  query → sort by impressions. Look for country/region names with impressions but no
  matching destination page.
- [ ] **Step 2:** For each gap, add an entry to `destinationPages` in
  `src/content/seo-pages.ts` following the existing shape (see `usa` entry,
  `src/content/seo-pages.ts:35-75` — `slug`, `path`, `title`, `description`, `eyebrow`,
  `heading`, `intro`, `sections`, `faqs`, `relatedLinks`).
- [ ] **Step 3:** Run existing tests to confirm the new route is picked up automatically:
  ```bash
  pnpm test src/content/seo-pages.test.ts src/app/seo-routes.test.ts
  ```
  Expected: PASS, new route appears in `indexableRoutes` / sitemap output.
- [ ] **Step 4:** Commit:
  ```bash
  git add src/content/seo-pages.ts
  git commit -m "feat: add <country> destination page"
  ```

---

## Task 7: Ranking / AI-citation re-check (do 2–4 weeks after Tasks 1–3, not immediately)

Search engines and AI assistants don't re-crawl and re-rank instantly — checking the day
after Task 1 will show "nothing changed" and isn't a useful signal. Space this out.

**Baseline (recorded 2026-08-17, before any fix):**
- `site:esim.uplisoft.com` on Google web search → **0 results**
- Web search "best eSIM app for USA travel" → eSim2you not mentioned; top results were Saily,
  Holafly, Sim Local, Airalo, and roundups from cybernews/gizmodo/wise.com/traveltomtom.net
- `robots.txt` blocked `ClaudeBot`, `GPTBot`, `Google-Extended`, `Applebot-Extended`,
  `Amazonbot`, `Bytespider`, `CCBot`, `meta-externalagent`

- [ ] **Step 1 (same day as Task 1, immediate):** Re-run `curl -s
  https://esim.uplisoft.com/robots.txt` — confirm the crawler block is actually gone (this is
  the only check that should happen immediately; it validates the fix landed, not that
  ranking changed).
- [ ] **Step 2 (~1 week after Tasks 1–3):** Check GSC **Pages** (Indexing) — pages should be
  moving from "Discovered, not indexed" toward "Indexed." Check **Coverage/Page experience**
  for errors.
- [ ] **Step 3 (~2–4 weeks after Tasks 1–3):** Re-run `site:esim.uplisoft.com` — expect it to
  return the indexed pages (homepage, `/destinations`, destination pages) instead of 0.
- [ ] **Step 4 (~2–4 weeks after Tasks 1–3):** Re-run the same web search used for the
  baseline ("best eSIM app for USA travel", plus 2–3 more like "eSIM for Europe travel" and
  "how to get mobile data traveling to USA") and compare against the baseline list above. Note
  whether eSim2you appears anywhere in results or in an AI-generated summary — appearing in
  results at all is the first milestone; appearing in the generated summary text is the real
  target.
- [ ] **Step 5:** Record results in `docs/seo-aso-checklist.md` section 5 (the existing
  "Ongoing measurement (monthly)" checklist already covers this cadence — just start
  checking it off with dates and findings instead of leaving it unchecked).
- [ ] **Step 6:** If `site:esim.uplisoft.com` still returns 0 after 4 weeks, the bottleneck
  has moved from "not indexed" to something else (thin content, manual action, crawl budget)
  — that's a new investigation, not a re-run of this plan.

---

## Summary of what's code vs. account work

| Task | Type | Who does it |
| --- | --- | --- |
| 1. Unblock AI crawlers | Cloudflare dashboard | Whoever has Cloudflare access |
| 2. GSC verification | Account setup | Whoever has domain/DNS or was already granted GSC access |
| 3. Bing verification | Account setup | Same |
| 4. Structured data / OG validation | Read-only check | Anyone |
| 5. Off-site presence | Outreach | Marketing/founder, not engineering |
| 6. Destination page expansion | Code (Next.js) | Engineering, data-driven by GSC (Task 2) |
| 7. Ranking re-check | Search + GSC checks | Anyone, on the stated schedule |
