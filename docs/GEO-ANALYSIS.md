# GEO / AI-search analysis: esim.uplisoft.com

> **Status 2026-10-08 (after this audit):**
> - Fix 5 (brand spelling, branded titles, homepage H1) was already in the repo, just not deployed.
> - Shipped in this session:
>   - USD/GBP estimates on every /esim page.
>   - A "Before you buy" block (phone support, number/WhatsApp, hotspot, top-up, refund) on every /esim page.
>   - A visible updated date and byline on guides.
>   - /travel/internet-abroad rewritten with a comparison table (f274).
> - Still open:
>   - Off-site footprint (see docs/brand-outreach-kit.md).
>   - Per-country network names and hotspot data: needs the backend to pass the Airalo operator fields through /packages.
>   - Rewriting the other thin guides.

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
