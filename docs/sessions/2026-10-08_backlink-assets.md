# 2026-10-08 · backlink assets

**Focus:** web

## Why
An external SEO review scored backlinks/authority 2/10 and brand recognition 2/10. Common Crawl has no record of esim.uplisoft.com or uplisoft.com, and no backlink API keys (Moz/Bing/DataForSEO) are configured, so the profile can't be measured yet. Code can't create links, so this session builds pages that give other sites a reason to link, plus a playbook for earning the links.

## What changed
- **`/esim-price-index`**: live table of every `/esim/[slug]` destination with plans: starting price, lowest price per GB (unlimited plans excluded) and plan count. Headline cards show the cheapest per GB, the median and the most expensive per GB, all computed from rows. Dataset JSON-LD (CC BY 4.0, CSV distribution) only when rows exist. Citation snippet box. Revalidates hourly.
- **`/esim-price-index.csv`**: the same data as a download.
- **`/press`**: press kit with the boilerplate (`brandDescription`), key facts, 4 logo downloads, link snippets with the correct anchors, story links and media contact.
- **Partner materials**: "Link from your website" card with a badge (`public/badges/esim2you-badge.svg`) and a text link using the referral code, both `rel="sponsored"` (commissioned links; Google requires it).
- `brandProfileLinks.productHunt` added to Organization `sameAs`. Footer, llms.txt and sitemap (static segment) list the new pages. `content-dates.ts` entries added.
- `getPriceIndex()` in `destinationPricing.ts`: the cached catalog gains `bestPerGb` + `fetchedAt` (read with `?.` for old cache entries). Pure helpers in `src/lib/price-index.ts`.
- `docs/brand-outreach-kit.md`: link-earning assets + weekly link-building playbook.

## Verified
- `pnpm test`: 118 files / 917 tests pass. New tests: `price-index.test.ts`, `getPriceIndexRows` in `destinationPricing.test.ts`, partner snippet test.
- Dev server against the production API: `/esim-price-index` rendered 28 destinations (e.g. Netherlands €0.28/GB cheapest), Dataset JSON-LD present, CSV 200 `text/csv`, `/press` and the badge 200.
- `tsc --noEmit`: only a pre-existing stale `.next/types` entry for a deleted bulk-profit route.

## Follow-ups (off-site, owner)
- Add free Moz + Bing Webmaster API keys so `/seo backlinks` can score the profile.
- Run the playbook in `docs/brand-outreach-kit.md`; add every new real profile to `brandProfileLinks`.
