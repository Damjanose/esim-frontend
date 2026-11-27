# 2026-11-26 user analytics (web)

Branch `feature/analytics`. Part of the first-party analytics plan (`docs/superpowers/plans/2026-11-26-user-analytics.md` in the workspace).

## What changed

- **Tracker (WA):** `src/lib/analytics-events/` queues events (20 per batch, 200 max, oldest dropped). `AnalyticsTracker` (mounted in `src/app/layout.tsx`) sends one `screen_view` per route template. Search, flight search, checkout steps, payment failures and promo taps come from their call sites. Nothing is sent without analytics consent, on `/x*` pages, for browsers with an admin token, or for bots.
- **BFF:** `POST /bff/events` forwards batches to `/analytics/events` with the visitor's IP and approximate location (cf-* headers, percent-encoded into x-client-* headers with the BFF key).
- **Privacy text:** a "Usage data and analytics" section in the privacy policy.
- **Admin dashboard (WB/WC):** `/xinsightsy` (hidden, in the Growth nav group) with Overview, Locations, Audience, Screens, Destinations, Searches, Peak times, Funnel, Campaigns (first source plus a campaign link builder) and Data health. Reads the 10 reports through `/bff/admin/insights/[report]`. Charts are CSS bars and a CSS-grid heatmap; no chart library.
- **Sales page:** `/xloginy` shows an "estimated" badge on profit when a cost is estimated.

## Decisions

- Destination names on the dashboard are title-cased backend codes (`united-states` → "United States"). The catalogue's own display name for the USA is "USA", which was not used, to match the plan's example.
- The arrival airport picker is marked with an explicit `role="to"` prop, not by its label.
- Non-ASCII location names are percent-encoded in the geo headers; the backend decodes them.
- Filters live in the URL (`history.replaceState`), read after mount so SSR and hydration match.

## Not done yet

- Browser check at 375 px and 1280 px (no dev server was running).
- The backend has to be live (`ANALYTICS_COLLECTION_ENABLED`) before any real data appears.
- Reviewer pass and commits (not requested in this lane).
