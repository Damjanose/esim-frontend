# 2026-10-09 · flight search

**Focus:** web

## Why
New cross-repo feature: a public flight search whose results are affiliate deal-links to the partner site (nothing is bought on eSIM2you). The backend owns the Travelpayouts calls and rate limits; this repo is the page and the BFF.

## What changed
- **`/flights`** (`src/app/flights/`): server `page.tsx` (metadata, WebPage JSON-LD) + client `FlightSearchForm.tsx` and `FlightResults.tsx`. Round trip / one way, From and To country then airport selects, swap button, native date inputs (min today, return min departure), Lottie flight loader while searching (reduced-motion respected).
- **BFF** `src/app/bff/flights/{countries,airports,search}/route.ts` over `proxyFlights()` (`src/lib/flightsBff.ts`): countries/airports `revalidate: 86400`, search uncached, backend status codes (400, 429, 503) forwarded.
- **`backendFetch` `clientIp` option** + `getClientIp(request)`: sends the visitor IP as `X-Client-IP` plus the shared `X-BFF-Key` (env `BFF_SHARED_SECRET`, must match the backend's) so the backend's per-IP rate limit sees visitors, not the Next server (which reaches the backend through Cloudflare from one IP). Without the secret, no IP is forwarded. IP source order: `CF-Connecting-IP`, `X-Real-IP`, then the last `X-Forwarded-For` entry.
- Results: price, airline + flight number, depart/return times (airport wall-clock, no zone shift), stops, duration, "View deal" `rel="noopener noreferrer sponsored"`. Empty / `upstreamError` / error / 429 states with Google Flights + Skyscanner fallback links. Footnote: fares were found recently by other travellers, final price on the partner site.
- Pure helpers `src/lib/flightSearch.ts` (+ test). Navbar (wideOnly) and footer link, sitemap entry (static segment), `content-dates` entry (static sitemap lastmod now 2026-10-09 in `seo-routes.test.ts`).

## Verified
- `pnpm test`: 119 files / 929 tests pass. `tsc --noEmit`: only the pre-existing stale `.next/types` bulk-profit entry.
- Not exercised against a live backend (built in parallel); contract from the plan's flights-contract.

## Follow-ups
- Confirm the production nginx/Express trust-proxy setup uses the forwarded IP.
- Confirm Navbar fit at xl with the extra link.
- Review fixes: reference routes (countries/airports) no longer forward clientIp (fetch cache key was per-IP); swap now swaps the airport seq counters so a pending load isn't discarded.
- Nearby dates: when `offers` is empty and `nearbyOffers` has items, FlightResults shows them under "No fares on {date} — cheapest nearby dates" (date + "N days earlier/later" via `dayDiffLabel`), with the Google/Skyscanner links below.
- Option A client (v3): `dateStrip` type; `DateStrip` in `FlightResults.tsx` (up to 7 chips, searched day filled, cheapest day green, "—" when no price; scrolls inside its own `overflow-x-auto` box). Picking a day calls `onPickDate` -> `FlightSearchForm.pickDate` -> `withDepartDate` (return date shifted by the same days, trip length kept) -> `runSearch`. Offer cards show `isOtherAirport` badge ("Lands at MXP · other airport"). Helpers `shiftDate`, `withDepartDate`, `formatStripDay`, `isOtherAirport` tested. Not visually checked in a browser at phone width (layout is contained by design).
- Review fixes: strip chips before local today are disabled and muted (`isPastDay`); nearby offers departing before today are dropped (`dropPastOffers`); `pickDate` searches with the shifted submitted form but merges only departDate/returnDate into the live form (unsubmitted edits kept); round-trip strip shows "Prices for a N-night trip" (`tripNights`). Helpers tested in `flightSearch.test.ts`.

## Follow-up: low-cost airline links

Ryanair Group, easyJet, Wizz Air and Pegasus don't sell through Aviasales, so their fares can never appear in Travelpayouts results. The backend search response now carries `airlineLinks`, which are direct search links on each airline's own site. An airline is included only when both airports are in countries it roughly serves (`E-SIM backend/src/services/flightAirlineLinks.ts`). Web `/flights` and the mobile Flight search screen render them as a separate "Fares from these low-cost airlines aren't in our results" row.

- Ryanair link format verified: its server echoes route and dates into the redirect. The Wizz Air path resolves. The easyJet deeplink parameters are unverified because easyJet's bot protection blocks curl, so click it once by hand.
- Pegasus has no public deep-link format, so its button opens flypgs.com/en with nothing prefilled.
- These links earn no commission. Revenue on these airlines would come from joining Skyscanner's affiliate program through Impact.
