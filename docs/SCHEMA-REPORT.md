# Schema report: esim.uplisoft.com

Date: 2026-10-14. Method: fetched all 69 sitemap URLs (raw server HTML, no JS) and parsed every `application/ld+json` block. Each node was checked for `@context`, required and recommended properties per type, absolute URLs, ISO dates and numeric prices. No Microdata or RDFa was found, so all markup is JSON-LD, which is what Google prefers.

## Summary

All 69 pages have structured data, and every block parses, has `@context`, uses absolute URLs and has valid dates and prices. One structural problem affects 68 pages: inner pages point at the brand by `#organization` / `#website` IDs that are only defined on the homepage.

| Type | Pages | Status | Issues |
|---|---|---|---|
| Organization, WebSite | 1 (`/`) | ✅ | Defined only on the homepage. See finding 1. |
| SoftwareApplication | 1 (`/`) | ⚠️ | No `offers`, no `aggregateRating` (`siteReviewStats` is null), so it isn't eligible for an app rich result. |
| WebPage / AboutPage / ContactPage | 65 / 2 / 1 | ⚠️ | `isPartOf` → `#website`, which isn't defined on the page. |
| BreadcrumbList | 68 | ✅ | Positions and absolute `item` URLs are correct. |
| Product + AggregateOffer | 29 (`/esim/*`) | ⚠️ | `brand` → `#organization` with no name on the page. The `image` is the generic OG card on all 29 pages. Prices, currency (EUR), `offerCount` and `availability` are valid. |
| Article | 22 (`/travel/*`, `/compare/*`, `/use-cases/*`) | ⚠️ | `author`/`publisher` → `#organization` with no name on the page. No `datePublished` (deliberate, see seo.ts:527). |
| Dataset + DataDownload | 1 (`/esim-price-index`) | ✅ | Has name, description, license (CC BY 4.0), creator, CSV distribution and dateModified. |
| FAQPage | 56 | ℹ️ | Google retired FAQ rich results for all sites on 2026-05-07, so these earn no SERP feature. They're harmless, so keep them. |

## Findings

### 1. High: the brand is a dangling reference on 68 pages
`createOfferProductJsonLd` (seo.ts:494), `createContentPageJsonLd` (seo.ts:567, 607–608) and `createWebPageJsonLd` (seo.ts:400, 403) emit `{"@id": ".../#organization"}` and `{"@id": ".../#website"}`. Only `createLandingJsonLd` defines those nodes, and only on `/`.

Google reads structured data page by page, so on `/esim/usa` the Product's `brand` and on every guide the Article's `author`/`publisher` are nodes with no `name`. Rich Results Test reports these as missing `name` in `brand` / `author`.

**Fix:** add a small Organization node (and the WebSite node) to every page's `@graph`, so each `@id` resolves locally. Keep the full Organization (sameAs, contactPoint, description) on `/` and `/about`.

```json
{
  "@type": "Organization",
  "@id": "https://esim.uplisoft.com/#organization",
  "name": "eSIM2you",
  "url": "https://esim.uplisoft.com/",
  "logo": "https://esim.uplisoft.com/app-logo.png"
}
```

**How you'd know it failed:** Rich Results Test on `/esim/usa` and `/travel/what-is-an-esim` still shows missing `name` in `brand` or `author`.

### 2. Medium: Articles have no `datePublished`
All 22 Articles only have `dateModified`. This was a deliberate choice (no real publish dates were recorded). Google lists `datePublished` as recommended, not required. A true first-publish date (for example, the date the page first went live in git history or the sitemap) would let Google and AI answers show "published / updated".

Don't invent dates. If the real date isn't known, leave it out.

### 3. Low: one generic image on every Product
All 29 `/esim/*` Products use `og/esim2you-og.png?v=5`. The page already loads the country photo server-side (`getDestinationMedia`), so passing that as `Product.image` (keeping the OG card as a fallback) gives each product a distinct, representative image.

### 4. Low: SoftwareApplication has no `offers`
The app is free to download. Add `"offers": {"@type": "Offer", "price": "0", "priceCurrency": "EUR"}`. On its own this still won't produce an app rich result, because Google also wants `aggregateRating` or `review`. Fill `siteReviewStats` from real App Store / Play ratings once there are enough, and never use testimonials (2026-09-27 decision).

### Not recommended
- No HowTo (deprecated 2023), and no new FAQPage for SERP benefit.
- No `Review`/`AggregateRating` from site testimonials.
- No `LocalBusiness`: there's no physical location.
