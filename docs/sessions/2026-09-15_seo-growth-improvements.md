# SEO and growth improvements

## Scope

Applied the high-confidence repository changes from the SEO/GEO action plan:

- Rendered the homepage FAQ from `landingContent.faqs` under the existing `#faq` anchor so visible FAQ content matches the homepage FAQPage JSON-LD.
- Added descriptive country flag alt text to the public homepage destination browser.
- Expanded the homepage metadata description with instant activation, eSIM, destination, and roaming terms.
- Corrected the repeated `Buy a eSim2you` grammar error in destination descriptions.
- Added regression checks for homepage FAQ wiring, destination image alt text, duplicate SEO slugs, and the invalid copy pattern.

## Decisions and constraints

- The live catalog exposes 200+ browse destinations, but only 29 curated destination records are indexable SEO pages. No thin pages were generated from live package coverage.
- Destination FAQPage and BreadcrumbList schema already existed and were preserved rather than duplicated.
- No carrier, nationwide coverage, rural coverage, or 5G claims were added because the current frontend package model does not provide reliable provenance for those facts.
- `public/llms.txt` already exists and the deployed wildcard robots policy permits public crawlers while protecting private routes. No crawler-specific group was added.
- Visible freshness dates were not added because there is no trustworthy per-page content timestamp or maintenance workflow.

## Verification

- Targeted SEO/content tests: 63 files, 510 tests passed.
- Production `robots.txt`, `sitemap.xml`, and `llms.txt`: HTTP 200.
- Production homepage, `/esim/usa`, and `/destinations`: HTTP 200.
- Deployed robots protections and sitemap reference verified.
- Lighthouse CLI is not installed in the frontend workspace.
- Google Search Console/Bing Webmaster verification and sitemap submission require authenticated operator access and remain manual release actions.
