# WIP: Search Console re-check (due 2026-10-21 or later)

Baseline taken **2026-10-14**. Re-check after Google has had about 7 days to crawl the 10-14 deploys and any indexing requests. Delete this file once every item below is closed or moved into a session doc.

## What changed on 2026-10-14 (all live)
- Security headers: CSP, Referrer-Policy, Permissions-Policy (f280).
- The "Does eSIM2you work in X?" answer moved into the /esim hero, at ~6% page depth instead of ~80% (f281).
- `/esim/united-states`, `/esim/united-kingdom`, `/esim/england` and similar names 308 to the real slug (f282).
- Homepage first load diet: Lottie is lazy-loaded and Geist isn't preloaded. Airalo flags go through next/image, and the cookie link text is descriptive (f283–f285).
- IndexNow ping keeps going when one engine fails (commit cb1307b).

## Baseline (Search Console, property `sc-domain:uplisoft.com`, filter Page contains `esim.uplisoft.com`, last 3 months, Web)

| Metric | 2026-10-14 |
|---|---|
| Clicks | 13 (12 on `/`) |
| Impressions | 769 |
| Avg. position | 43.7 |
| Queries with impressions | 197 (top 10: 14, 11–20: 10, 21–50: 23, 50+: 150) |

Pages to watch:

| Page | Impr. | Pos. |
|---|---|---|
| `/` | 89 | 4.7 |
| `/esim/albania` | 18 | 4.8 |
| `/esim/spain` | 35 | 9.5 |
| `/esim/italy` | 44 | 20.3 |
| `/esim/asia` | 52 | 74.8 |
| `/travel/best-esim-uk-travel` | 84 | 62.7 |
| `/travel/what-is-an-esim` | 82 | 76.7 |

Queries close to page 1: "japan esim comparison" at 8.8, "esim barcelona" at 10.1 (20 impressions), "esim rome" at 13.1, "esim milan" at 18.7.

Lighthouse mobile on production (12.6, DevTools throttling):

| Page | Perf | LCP | SEO | Best practices |
|---|---|---|---|---|
| `/` | 90 | 3.3 s | 100 | 96 |
| `/esim/usa` | 97 | 2.1 s | 100 | 96 |

The domain-wide indexing report shows 69 indexed and 89 not indexed. Most of the not-indexed count is intentional or belongs to other uplisoft sites.

## Checklist for the re-check

1. **Indexing requests.** As of 10-14 none have been submitted. Request indexing in URL Inspection (about 10 per day) for:
   - [ ] `/esim/croatia`: "Discovered – currently not indexed"
   - [ ] `/travel/best-esim-europe-travel`: discovered, not indexed
   - [ ] `/travel/esim-compatible-phones`: discovered, not indexed
   - [ ] `/travel/keep-your-number-with-esim`: discovered, not indexed
   - [ ] `/trip-plan`: discovered, not indexed
   - [ ] `/esim/usa`, `/esim/uk`: changed 10-14 (answer-first)
   - [ ] `/esim-price-index`
2. **Indexing report** (Indexing → Pages): the 5 URLs above should have moved to Indexed. If any is still "Discovered" after 7+ days, it needs more internal links pointing at it, not another request.
3. **Sitemaps:** `esim.uplisoft.com/sitemap.xml` should show about 69 discovered pages (it was 64, last read 10-10). Optional cleanup: remove the dead `http://www.uplisoft.com/sitemap.xml` (2010, "Couldn't fetch").
4. **Noindex count (69):** this should only be `/checkout?package=`, `/signin?next=` and similar private URLs (intentional, f263). If an `/esim/*`, `/travel/*` or `/compare/*` URL ever appears there, it's a regression.
5. **Performance:** compare clicks, impressions and position with the baseline. Look at the queries close to page 1 and at `/esim/usa` and `/esim/uk`, using a 7-day comparison against the previous period.
6. **Old redirect URLs:** `/destinations?country=albania` (last crawled 26 Sept) should eventually show as "Page with redirect" pointing at `/esim/albania`.
7. **Lighthouse:** re-run on `/` and `/esim/usa`. A homepage LCP above 3.3 s is a regression.

## How to check

- GSC performance with the eSIM filter: `https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain%3Auplisoft.com&page=*esim.uplisoft.com&num_of_months=3&metrics=CLICKS%2CIMPRESSIONS%2CPOSITION` (append `&breakdown=page` for the pages tab).
- Indexing: `https://search.google.com/search-console/index?resource_id=sc-domain%3Auplisoft.com`
- These pages need the owner's Google sign-in. Claude reads them through Claude in Chrome. A cloud or scheduled agent can't, unless a service account is added to GSC and `~/.config/claude-seo/google-api.json` is set, after which `/seo google` works headless.
- Lighthouse: `npx -y lighthouse@12.6.0 https://esim.uplisoft.com/ --throttling-method=devtools --only-categories=performance,seo,best-practices,accessibility --output=json`

## Still open outside GSC
- Schema: inner pages need a local Organization node (docs/SCHEMA-REPORT.md finding 1), a per-country Product image, and SoftwareApplication `offers`.
- GEO (docs/GEO-ANALYSIS.md):
  - Off-site mentions and reviews, starting with an eSIMDB listing.
  - Thin US/UK/Europe guides.
  - Price index key findings in USD/GBP.
  - Per-plan carrier and hotspot answers (backend).
- appsapk.com hosts an unofficial "eSim2you APK". Ask for a takedown if it isn't yours.
- Deploy access: no SSH key on the server yet (`ssh-copy-id -i ~/.ssh/id_ed25519.pub root@72.61.183.120`).
