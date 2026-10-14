# GEO / AI-search analysis: esim.uplisoft.com

Re-audit: **2026-10-14**. Previous audit: 2026-10-08 (~55/100), kept at the bottom of this file.

> **Status 2026-10-14:** Shipped: change 2 (answer shown in the /esim hero, f281) and the /esim country-name 308s (f282). Still open: changes 1, 3, 4 (needs backend operator and hotspot fields) and 5.
>
> **Re-check 2026-10-14 (after deploy), ~65/100.** The answer block is live and sits at ~6% page depth on /esim/usa, /uk, /italy, /japan and /europe (it was ~80%), so citability goes from 15 to 17. Nothing else has changed: guides are still ~320–350 words with the nav and footer included, the price index has no key-findings lead or USD/GBP, inner pages still have no Organization node (SCHEMA-REPORT.md finding 1), robots.txt and llms.txt are unchanged, and there are no new off-site mentions. Perf commit e0ed504 isn't deployed yet.

Method: fetched live pages as a crawler would (raw HTML, no JS), counted words inside `<main>` (this count still includes the nav and footer, so the unique copy is lower), and checked where key answers sit on the page. Ran web searches for the brand and for "best eSIM for USA from UK". Platform visibility in ChatGPT, Perplexity and Google AI Overviews/AI Mode was **not measured with a tool**, so readiness is qualitative.

## GEO readiness: ~63/100 (was ~55)

| Area | Weight | Was | Now | Notes |
|---|---|---|---|---|
| Citability | 25 | 12 | 15 | /esim pages: EUR+USD+GBP ranges, plan table with validity and 4G/5G, "Before you buy" block. /esim-price-index is real original data (€0.28–€4.20/GB, median €0.47/GB, dated). But the best answer block ("Does eSIM2you work in the USA? Yes… 27 plans, from €4.00, valid 3 to 30 days") sits in the FAQ at ~80% page depth. 20 guide/compare/use-case pages still have 280–470 words including chrome, roughly 150–250 unique. |
| Structure | 20 | 15 | 16 | One H1, question H2s, tables on /esim, compare and the index. Guides have no tables. |
| Multi-modal | 15 | 6 | 6 | Destination photos and homepage app screenshots only. No video, no setup screenshots in guides, no chart on the price index. |
| Authority / brand | 20 | 5 | 8 | Visible "Updated … · By the eSIM2you team" on guides. /about, /contact and /press exist, and a brand search now returns the homepage. Still no Reddit, YouTube, Trustpilot, Wikipedia/Wikidata, LinkedIn or eSIM-comparison-site presence, and no third-party review anywhere. |
| Technical access | 20 | 17 | 18 | SSR (590 words on homepage without JS), 69/69 sitemap URLs 200 with self-canonicals, valid JSON-LD in server HTML, IndexNow pinged on deploy, real 404s. |

## AI crawler access

robots.txt has only a `*` group (`Allow: /`, disallow /api /admin /auth /bff /cdn-cgi/), so every bot below falls through to it.

Search and citation crawlers:
- Googlebot (Google Search, AI Overviews, AI Mode): allowed
- OAI-SearchBot (ChatGPT Search citations): allowed
- Claude-SearchBot (Claude search citations): allowed
- PerplexityBot (Perplexity index): allowed
- Applebot (Siri, Spotlight, Safari): allowed

Training crawlers (a licensing choice that doesn't affect visibility):
- GPTBot (OpenAI training): allowed
- ClaudeBot (Anthropic training): allowed
- Google-Extended (Gemini/Vertex training and grounding): allowed
- CCBot (Common Crawl): allowed
- Applebot-Extended (Apple Intelligence training): allowed

Nothing blocks AI search. No change is needed.

## llms.txt

Present, valid per Lighthouse, 2.9 KB, generated from `src/content/llms.ts`. Google says it neither helps nor hurts. Leave it as is.

## Brand mentions (web search, 2026-10-14)

- "eSIM2you" now returns esim.uplisoft.com as a result (on 10-08 the research index had no pages).
- Product Hunt: listed, 0 upvotes, 1 comment (hunted.space mirror).
- No Reddit, YouTube, Trustpilot, Wikipedia, LinkedIn or review-site results.
- **Name collisions:** eSIM2Me (Trustpilot 3.8–4.2), esim2go.org, and a RedteaGO promo code "ESIM2YOU". An AI answer can blend these with us.
- **appsapk.com hosts an "eSim2you APK"** that claims to be the official build. If it isn't ours, it's a brand-trust and security risk, so report it and ask them to take it down.
- "Best eSIM for USA from UK" results are vendor roundups (Jetpac, Roamless, Saily-leaning Unusual Nomad, mybestsim) plus kiwitaxi. We're in none of them.

## Top 5 changes, highest impact first

1. **Earn third-party mentions and reviews.** This is still the biggest gap: AI answers about "best eSIM for X" are assembled from roundups, Reddit and review sites, and we aren't on any of them.
   - Prompt for App Store and Play reviews after a successful install.
   - Claim a Trustpilot page.
   - List on eSIMDB and esims.io.
   - Pitch mybestsim, Unusual Nomad and kiwitaxi for their USA/UK roundups, leading with the price index.
   - Post 3–5 short YouTube setup videos.
   - Playbook: docs/brand-outreach-kit.md.
   - *How you'd know it failed:* in 60 days a brand search still shows only our own pages and Product Hunt.
2. **Move the "Does eSIM2you work in X?" answer to the top of every /esim page**, right under the price line.
   - It's the most quotable passage on the page but sits in the FAQ at ~80% depth. About 44% of AI citations come from the first 30% of a page (SE Ranking).
   - Keep the FAQ entry and the FAQPage JSON-LD as they are.
   - *How you'd know it failed:* AI answers still quote competitors' "does X work in USA" wording.
3. **Rewrite the thin pages, US and UK first.** Do `/travel/best-esim-usa-travel`, `/travel/best-esim-uk-travel`, `/travel/best-esim-europe-travel`, `/compare/airalo-vs-esim2you` and `/compare/holafly-vs-esim2you` first.
   - Use the same shape as `/travel/internet-abroad`: 800–1,200 words, question H2s, a table, and specific numbers from our live plans and the price index.
   - Answer the questions the USA roundups answer: coverage across states, hotspot and throttling, calls/SMS plans, and UK carriers' US roaming costs.
4. **Give a concrete hotspot and network answer per plan.**
   - The Network column shows "4G/5G" and never names a carrier (AT&T, T-Mobile, Vodafone…).
   - The hotspot answer says "depends… ask support", and every roundup treats hotspot as a deciding factor.
   - This needs the backend to pass Airalo's operator and tethering fields through `/packages` (still open from 10-08).
5. **Make the price index easy to cite.**
   - Add a "Key findings" lead with 3–4 dated, self-contained sentences, e.g. "In October 2026 the median best price for travel eSIM data across 28 destinations was €0.47/GB (~$0.53)".
   - Add USD and GBP alongside EUR, since US and UK are the priority markets.
   - Add a simple chart.
   - This is our only original data, and original data is what earns "highly cited" links.

Smaller: `/esim/united-states`, `/esim/united-kingdom` and `/esim/great-britain` return 404. Add 308s to `/esim/usa` and `/esim/uk`, because people and agents guess those slugs.

## Schema

The current set is valid and server-rendered: Organization (with sameAs for Instagram, Facebook, Product Hunt and both stores), WebSite, SoftwareApplication, Product/AggregateOffer, Article, BreadcrumbList, Dataset on the index, and FAQPage. FAQPage no longer gets a Google rich result (retired May 2026). It's harmless, so leave it.

To add:
- LinkedIn and YouTube in `sameAs` once those profiles exist.
- `aggregateRating` only from real store ratings, never from testimonials.

## Passages to rewrite

- **/travel/what-is-an-esim** (about 150 unique words). The opening "This guide explains what an eSIM is: …" is a meta-sentence. Start with the definition instead: "An eSIM is a digital SIM profile stored on your phone's chip. A travel eSIM adds a second, data-only line, so you can buy mobile data for your destination before you fly and keep your usual number on your home SIM." Then add sections with numbers: how many phones support eSIM, setup time, typical price per GB (link the index), and eSIM vs physical SIM vs roaming as a table.
- **/esim/usa intro**: "eSIM2you helps travelers visiting the United States set up mobile internet…" is generic. Replace it with the facts the FAQ already has: "eSIM2you sells 27 prepaid USA eSIM plans from €4.00 (~$4.49), 1 GB to unlimited, valid 3–30 days, on 4G/5G. Some include US calls and SMS. Install before you fly, turn the data line on when you land."
- **Hotspot answer in "Before you buy"**: replace "depends on the plan… ask support" with a per-plan yes/no once the backend exposes it (change 4).

---

# Previous audit (2026-10-08)

Date: 2026-10-08. Method: fetched the live pages as a crawler (raw HTML, no JS), ran web searches on brand and priority-market queries, and compared our page wording with Airalo's Italy page and the "best eSIM for Italy / USA" results. Platform visibility (ChatGPT, Perplexity, Google AI Overviews) was **not measured with a tool**, so readiness below is qualitative.

## GEO readiness: ~55/100

| Area | Weight | Score | Notes |
|---|---|---|---|
| Citability | 25 | 12 | Destination pages have real plan tables. Guides are thin, and no page has a quotable "X is…" answer block or unique data. |
| Structure | 20 | 15 | One H1, question-style FAQ, tables. Guide pages have only 2 content H2s. |
| Multi-modal | 15 | 6 | Flag and Wikimedia photos only. No video, no setup screenshots. |
| Authority / brand | 20 | 5 | No visible dates, no author, no ratings. Almost no brand footprint off-site. |
| Technical access | 20 | 17 | SSR, fast TTFB (~0.1–0.3s), clean robots.txt, sitemap index, JSON-LD. |

## AI crawler access (robots.txt: `User-Agent: * / Allow: /`, no bot-specific rules)

- Googlebot (Search, AI Overviews, AI Mode): allowed
- OAI-SearchBot (ChatGPT Search citations): allowed
- Claude-SearchBot (Claude search citations): allowed
- PerplexityBot (Perplexity): allowed
- Applebot (Siri/Spotlight/Safari): allowed
- GPTBot (OpenAI training): allowed
- ClaudeBot (Anthropic training): allowed
- Google-Extended (Gemini training/grounding): allowed
- CCBot (Common Crawl training): allowed
- Applebot-Extended (Apple training): allowed

Nothing is blocking AI search. The training bots are allowed too, which is a licensing choice and doesn't affect rankings.

## llms.txt

Present and accurate (`/llms.txt`, served from `src/content/llms.ts`). Google ignores it, and no major engine has confirmed it uses it, so leave it as is and don't spend more time on it.

## Brand mentions

- Web search for "eSim2you" only finds a Product Hunt mirror (hunted.space). No Reddit threads, YouTube videos, Wikipedia/Wikidata entry, LinkedIn page or review-site listing (eSIMDB, esims.io, Trustpilot).
- A `site:esim.uplisoft.com` search on the research tool's (non-Google) index returned **no pages**. Check Google Search Console and Bing Webmaster for real index coverage.
- The brand runs on a subdomain of `uplisoft.com`, which weakens the "eSim2you" entity.
- Spelling is inconsistent: "eSim2you" (titles, llms.txt, H1 area) vs "eSIM2you" (pricing note, `brandedTitle()` suffix).

## Wording gap vs pages that rank (Italy example)

Term counts on the live HTML:

| Term | Our /esim/italy | Airalo Italy / top "best eSIM Italy" results |
|---|---|---|
| hotspot / tethering | 0 | present, a deciding factor in every roundup |
| network names (TIM, Vodafone, WindTre, Iliad) | 0 | WindTre named, Vodafone named by Yesim |
| coverage / speed | 0 | present |
| top-up / refund | 0 | present (renewals, refund FAQ) |
| compatible phones | 0 | present |
| $ / £ prices | 0 (€ only) | USD shown |
| word count (incl. nav) | ~700 | ~1,200–1,400 |

Our homepage has no "days" or "GB" wording. The internet-abroad guide has ~350 words including nav and footer, so its unique copy is well under 200.

## Top 5 changes, highest impact first

1. **Build an off-site footprint.** List on eSIMDB, esims.io and Alertify's eSIM index, and get on Trustpilot / App Store review prompts. Seed honest Reddit answers (r/travel, r/digitalnomad, r/solotravel). Post 3–5 short YouTube setup videos. Pitch the "best eSIM for X" roundups (Cybernews, Jetpac-style lists, mybestsim). For AI answers, mentions count for more than backlinks.
2. **Use the words searchers use on every /esim page.** Hotspot allowed (yes/no), the network partner(s) per country (from Airalo package data), 4G/5G, coverage, top-up, refund, compatible devices. Add a short "Is eSim2you good for Italy?" answer block at the top: 2–3 sentences covering price range, networks, hotspot and validity.
3. **Show $ and £ to US and UK visitors.** US and UK are the priority markets, but every price on the site is in €. Product schema and visible prices in local currency also match "cheap eSIM USA" style queries.
4. **Rewrite the thin guides** (`/travel/*`, `/use-cases/*`) to 800–1,200 words with question H2s. For example: "Does an eSIM work in the USA from the UK?", "How much data do I need for 7 days in Italy?", "Can I keep my WhatsApp number?". Put a visible "Updated <date>" and a named author or "eSim2you team" byline on each.
5. **Fix brand and title signals.** Pick one spelling (suggest **eSIM2you**, to match `brandedTitle()`). Deploy f271's `brandedTitle()`: live titles still lack the suffix. Change the homepage title to lead with the keyword, e.g. "Travel eSIM for 200+ Countries | eSIM2you", and add "travel eSIM" to the H1 or the subheading under it.

Domain: stay on esim.uplisoft.com (owner decision 2026-10-08, feedAI f269/brain sync note). A third party holds the matching .com, so never name it in copy.

## Schema

The current set is good: Organization, WebSite, SoftwareApplication, FAQPage, Product, Article, BreadcrumbList. To add:

- `Organization.sameAs` → Instagram, Facebook, App Store, Google Play, plus LinkedIn and YouTube once they exist.
- `Article.author` (Organization or Person) and visible `datePublished` / `dateModified` on guides.
- `aggregateRating` on SoftwareApplication **only** from real store ratings, once there are enough. Never use testimonials (see 2026-09-27 decision).
- Offer `priceCurrency` per market if $ or £ pricing ships.

## Passages to rewrite

- **/esim/italy intro:** "An Italy eSIM helps travelers prepare mobile internet before a trip…" is generic. Replace it with facts: "eSim2you Italy plans cost €4–€17.50 for 1–30 days, run on [network] 4G/5G, and [allow/don't allow] hotspot. Install before you fly; the plan starts when you connect in Italy."
- **/travel/internet-abroad:** add a comparison table (roaming vs local SIM vs eSIM vs Wi-Fi: cost per GB, setup time, keeps number, hotspot). Add a "typical UK/US roaming cost" section that cites the carriers' published rates.
- **Homepage H1** "Your phone works the minute you land.": keep it as the brand line, but put "Travel eSIM data for 200+ countries" in the first sentence (it is already close).
