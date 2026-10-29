---
date: 2026-10-29
tags: [analytics, ga4, google-ads, ecommerce, blog, holo, seo]
focus: web
status: complete
---

# Session: GA4 + ecommerce events + blog SEO

## What existed before
- `GoogleTag.tsx` loaded gtag.js after consent and configured Google Ads (marketing) and an unset `NEXT_PUBLIC_GA_MEASUREMENT_ID` (analytics). Its `window.gtag` stub pushed a rest-args **array** to `dataLayer`; gtag.js only runs commands pushed as an `arguments` object, so the consent/config/conversion commands were most likely ignored.
- Only a Google Ads purchase conversion on `/account/<id>?new=1`.
- Blog (f299-f300): `/blog` showed the backend's default first page, `/blog/<slug>` had canonical/OG/BlogPosting JSON-LD, sitemap with lastmod, `/bff/blog/revalidate` used `revalidatePath` only.

## What was done
- GA4 `G-95H527D5BG` (`NEXT_PUBLIC_GA_ID`, default in `src/lib/analytics.ts`) on the same single gtag.js loader. Stub fixed to push `arguments`; `gtag('js')` added; each config sent once per page load (a consent change no longer repeats a page_view).
- Route-change page views come from GA4 enhanced measurement's history events; no manual page_view (no double counting).
- GA4 events (EUR): `view_item` (`/esim/<slug>` all listed plans, `/pkg/<id>`), `begin_checkout` (`/checkout`), `purchase` once per order code (localStorage) with value = checkout's settled total (stashed in sessionStorage by `CheckoutPriceSection`, catalog price fallback), `login` (email/google/apple; OTP doesn't say new vs returning, so no `sign_up`), `generate_lead` (partner request).
- UTM/click ids kept on the auth-guard redirect to `/signin` and on the `/destinations?country=` page-level redirect (middleware and next.config redirects already kept the query).
- Blog: `/blog` lists all posts newest first, 12 per page via `?page=N` (self canonical, out-of-range 404); 3 related posts under each post (shared title/excerpt words, then recency); `DUPLICATE_POST_GROUPS` makes the older eSIM-vs-roaming post canonicalise to the newer (decided at render time by publishedAt, since the live API wasn't reachable from the session) and drops it from the sitemap; all blog fetches tagged `blog`, revalidated by `/bff/blog/revalidate` via `revalidateTag`.
- Tests: blog pagination/duplicates/related, sitemap duplicate exclusion, revalidateTag, guard UTM carry. 133 files / 1059 tests green, `tsc` clean, `next build` ok. Browser check: one loader, GA4 + Ads config, entries are `[object Arguments]`.

## Decisions
- Enhanced measurement over a manual page_view tracker: manual + the GA4 default history setting double-counts.
- Holo webhook (`/api/holo-webhook`) lives in the backend repo, not here; its review (constant-time HMAC, upsert by article.id, deliveryId dedupe, test:true → 200 without storing, `{url}` response) must be done there.

## Follow-ups
- GA4 admin: keep enhanced measurement "page changes based on browser history events" on; add Pokpay's checkout domain to unwanted referrals; mark `purchase` as key event.
- Confirm in Google Ads that the purchase conversion starts recording now that the stub is fixed.
- Backend: verify the Holo webhook checklist above.
