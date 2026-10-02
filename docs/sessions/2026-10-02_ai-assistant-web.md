# 2026-10-02 — AI assistant on the web

## Goal
Bring the app's floating AI assistant (velocity-eSim `src/components/AssistantBubble`) to the website, as a static icon bottom-right.

## What changed
- `src/lib/assistant/` — pure port of the app's assistant logic: `types.ts`, `copy.ts` (English strings keyed like the app's `assistant.*` i18n keys + tiny `t()`), `localReplies.ts` (destination/city/typo matching, days/GB/sort parsing, packages-or-trip clarify, filter refinement, FAQ), `suggestions.ts` (starter chips, screen presets, greeting, out-of-scope reply), `navigation.ts` (action → web href, screen per path, visibility, catalog helpers). Tests: `assistant.test.ts` (25).
- `src/app/components/assistant/` — `AssistantLauncher` (fixed bottom-right astronaut button, one teaser per tab session, above the BottomDock below lg), `AssistantChat` (lazy-loaded with `next/dynamic` on first open; card from sm, full screen on phones; Lottie thinking loader; Esc closes), `assistantStore` (module-level transcript per screen + 30-min reply cache, survives client navigations because every page renders its own Navbar).
- Mounted from `Navbar.tsx`, so it shows wherever the public shell does (never on x* admin pages). Hidden on `/checkout`, `/signin`, `/profile/deleted`, `/profile/support`, `/trip-plan/[id]`.
- New BFF: `POST /bff/assistant/chat` (proxies backend `POST /assistant/chat`; forwards the session when present, falls back to guest on an expired session for the marketplace screen) and `GET /bff/user/orders`.
- `/trip-plan` prefills the destination from `?destination=` (Suspense-wrapped `useSearchParams`, page stays static).
- Assets: `public/images/assistant-astronaut.png` (192px), `public/lottie/assistant-thinking.json` (the app's planning.json).

## Action mapping
apply_filters → `/destinations?country=&daysMin=&daysMax=&dataMin=&dataMax=&unlimited=` (sort/price/search dropped, no web params); open_country → `destinationBrowseHref`; plan_trip → `/trip-plan?destination=`; top_up → `/account/{id}#top-up`; open_billing → `/profile/billing`; open_support → `/profile/support` (guest `/support`); open_esims → `/account`; open_profile_settings → `/profile`; sign_in → `/signin?next=`. Gift, currency and review have no web page: no button.

Screen: guests always `marketplace` (backend only allows that for guests); signed in, `/account*` → `esims`, `/profile*` → `profile`, else `marketplace`.

## Verification
`tsc` clean, `pnpm test` 811/811, `pnpm build` OK (`/` and `/trip-plan` still static). Dev smoke: launcher in SSR HTML on `/`, `/destinations`, `/trip-plan`, `/support`, absent on `/signin`; guest AI turn through the BFF answered; guest `esims` → 401 as expected. Not verified in a real browser (Chrome extension not connected): visual layout, phone full-screen sheet, signed-in esims/profile chips.

## Follow-ups
- Visual check on phone + desktop, and a signed-in pass (top-up chip, trip-plan prefill).
- Copy is English-only; keep `copy.ts` and `localReplies.ts` in step with the app when its assistant changes.
