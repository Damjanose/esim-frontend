# Trip plan on the web — design

Date: 2026-10-02 · Focus: web · Status: approved in brainstorming, pending spec review

## Goal

Bring the mobile trip planner (AI itinerary: create → locked preview → pay → full plan + PDF, refine with versions, history) to the web at full parity. Today the web only has the admin settings page `/xtripplany` (f160); the traveler flow is mobile-only.

## Non-goals

- Backend changes. The `/itineraries` API already covers everything (see Contract).
- Async generation / job queue (generation stays synchronous, like mobile).
- "Plan is ready" push/email notifications.
- i18n (web is English-only; send `lang: "en"`).
- Adding trip plan to the 5-slot phone BottomDock (it mirrors the app tab bar).

## Backend contract (existing, unchanged)

All under `/itineraries`, `requireDevAuth` (Bearer session token):

| Method | Path | Notes |
|---|---|---|
| GET | `/config` | `{ generationLimit, windowDays, used, remaining, resetsInDays, price }` |
| GET | `/` | `{ plans: ItineraryListItem[] }` (newest first, `archived` flag) |
| POST | `/` | body `TripPlanInput`; **2–5 min**; 201 `ItineraryListItem & { remaining, document }`; 429 when quota exhausted |
| GET | `/:id` | list item + `document` (locked cut before purchase, full latest after) + `versions` once purchased |
| DELETE | `/:id` | |
| POST | `/:id/edit` | body `{ prompt }` (≤500); **long**; returns updated plan |
| GET | `/:id/versions/:n` | one version with its document |
| GET | `/:id/pdf?version=n` | `application/pdf` + `Content-Disposition` |
| POST | `/:id/checkout` | `requireRealEmail`. Returns `{ free: true, … }` (marked purchased), `{ alreadyPurchased: true }`, or `{ free: false, paymentId, environment, amount, currency }` |
| POST | `/:id/provision` | body `{ payment_id }`; idempotent; verifies the Pokpay order belongs to this plan |

Types mirror `velocity-eSim/src/services/itineraries.ts` (`ItineraryListItem`, `PlanDocument`, `ItineraryConfig`, `TripPlanInput`, `ItineraryEdits`, `ItineraryVersionInfo`). The web copies them into `src/lib/tripPlan/types.ts`.

## Design decisions

1. **Synchronous generation through the BFF.** `POST /bff/itineraries` and `POST /bff/itineraries/[id]/edit` hold the request open up to 10 minutes. If the tab closes, Express still finishes and saves the plan; it appears in the list on the next load.
   - Node's global `fetch` (undici) has a 300 s default `headersTimeout`, which would abort a slow generation. `backendFetch` gains an optional `timeoutMs`; when set, the request uses an `undici` `Agent({ headersTimeout: timeoutMs, bodyTimeout: timeoutMs })` dispatcher. Add `undici` as a direct dependency.
   - **Deploy step (manual):** nginx `proxy_read_timeout` / `proxy_send_timeout` on the `location /` → `127.0.0.1:3020` block must be ≥ 600 s (the `/api` block already needs this for mobile).
2. **Payment reuses the inline card checkout, not hosted redirect.** The web's checkout already takes cards inline (`BillingStep` + `CardStep` → `usePOK(paymentId, …)`), then calls a provision endpoint. Trip plan does the same with `paymentId`/`environment` from `/:id/checkout` and `onPaid` → `POST /bff/itineraries/[id]/provision`. (The backend's `/payments/card/confirm` already marks `itinerary:` references purchased; provision is the idempotent client-side confirmation.) This replaces the hosted-redirect + `return_url` idea from brainstorming, so **no backend change** and no `/trip-plan/return` route.
3. **Public, indexable `/trip-plan`**; detail pages are signed-in only.

## Routes and pages

### `/trip-plan` (public)

Server component shell + client island.

- **Signed out:** H1 + short plain pitch, a static sample plan rendered with `TripPlanDocument` (sample data in `src/lib/tripPlan/sample.ts`, port of mobile `TripPlanSampleDocument`), how it works (3 steps), no price shown (`/config` requires auth; the price appears once signed in), CTA → `/signin?next=/trip-plan`. Metadata: title/description for "AI trip planner", canonical, added to the sitemap.
- **Signed in:**
  - Quota line from `/config`: "N of M plans left this {windowDays}-day window" / when 0: "You've used all M plans. Next one frees up in N days" and the form is disabled.
  - `TripPlanForm` (below). Submit → generating state → on success `router.push('/trip-plan/{id}')`.
  - "Your plans" list (`splitPlansByWindow`: current, then "Older" archived). Row: title, base/style, day count, created date, status chip (Locked / Unlocked). Delete with confirm (in-page dialog, not `window.confirm`).
- Navbar: add "Trip planner" → `/trip-plan` to `navItems`.

### `/trip-plan/[id]` (guarded)

Add `/trip-plan/` (children only, not the public index) to `GUARDED_PREFIXES` handling in `route-guard.ts` — guard `pathname.startsWith("/trip-plan/")`.

- Header: title, subtitle, back link to `/trip-plan`.
- `TripPlanDocument` renders `document` (logistics, transport tips, notes, days → time blocks; highlight styling).
- **Locked** (`!price.purchased`): document is the backend's cut; bottom fades out with an unlock panel: "Unlock the full plan — $X" or "Unlock free" (from `summaryCta`).
  - Free → POST checkout → refetch → unlocked.
  - Paid → POST checkout → render `BillingStep` + `CardStep` in the panel (same components as `/checkout`) → `onPaid` → POST provision → refetch. Post-payment failure copy mirrors CheckoutWizard ("Your payment went through, but…").
  - 403 with `code: "real_email_required"` (Apple Hide My Email) → show the backend message ("Add your email address before paying."). The web has no email-claim UI yet (nothing in `src` handles this code); building one is out of scope.
- **Unlocked:** full document, "Download PDF" (`/bff/itineraries/[id]/pdf?version=n`, plain `<a download>`), version switcher (select of `versions`, "Original" for n=0, else the edit prompt truncated) which loads `/versions/n`.
- **Refine** (`refineState`): textarea ≤500 chars, "Update plan" → long POST edit → generating state → new latest version. Shows "N edits left until {date}" or why editing is off.
- `?unlocked=1` not needed (no redirect flow).

### BFF — `src/app/bff/itineraries/**`

Thin `callWithSession(readSessionTokens(request), …)` proxies returning `successJson`/`errorJson` with refreshed cookies, like `bff/payments/provision`:

- `route.ts` — GET list, POST create (`timeoutMs: 600_000`)
- `config/route.ts` — GET
- `[id]/route.ts` — GET, DELETE
- `[id]/edit/route.ts` — POST (`timeoutMs: 600_000`), validates prompt is a non-empty string ≤500
- `[id]/versions/[n]/route.ts` — GET, validates `^\d{1,4}$`
- `[id]/checkout/route.ts` — POST
- `[id]/provision/route.ts` — POST, validates `payment_id`
- `[id]/pdf/route.ts` — GET via `backendFetchBinary` (extend it to also return `Content-Disposition`), passes through `version`
- All `[id]` segments validated as a safe id (`^[A-Za-z0-9_-]{1,64}$`) before being interpolated into the backend path.
- `export const dynamic = "force-dynamic"` on all.

## Components (`src/app/trip-plan/`)

- `TripPlanForm.tsx` — country (searchable select over existing destination data used by hero search), days 1–30 stepper (default 7), start date (`<input type="date">`, min today), people 1–20 (default 1), cities / must-see / accommodation chips (max 10 each, comma-split), transport segmented (public/taxi/car, optional), pets toggle, free-text "anything else". Required: country, days. Uses shared `Button` / `fieldClasses`.
- `TripPlanGenerating.tsx` — staged progress copy ("Reading your trip", "Picking places", "Building days", "Final touches") driven by `generatingStepsDone`/`generatingEtaIndex`; Lottie (existing `public/lottie/*`) per the Lottie-first rule; after ~3 min shows "Still working — this can take up to 5 minutes. You can leave; it'll be in your plans."
- `TripPlanDocument.tsx` — pure render of `PlanDocument` (+ `locked` fade).
- `TripPlanList.tsx`, `TripPlanUnlockPanel.tsx`, `TripPlanRefine.tsx`, `TripPlanVersionSelect.tsx`.

## Pure logic (`src/lib/tripPlan/`)

Port from mobile `tripPlanFormLogic.ts` (no React): `clampInt`, `buildTripPlanInput` (web: `<input type="date">` ISO value → `dd/mm/yyyy` exactly as mobile's `toDdMmYyyy`; `mustSee` and `accommodation` are chip lists joined with `, `; `notes` → `custom`; omit empty optionals; `people` always sent), `addChips`, `splitPlansByWindow`, `summaryCta`, `refineState`, `latestVersion`, `generatingStepsDone`, `generatingEtaIndex`, `EDIT_PROMPT_MAX`. Plus `client.ts` — typed `fetch` wrappers for the BFF that map 401 → `/signin?next=…`.

## Errors

| Case | Behaviour |
|---|---|
| 429 on create | quota message, form disabled, refetch config |
| 5xx / network / timeout on create or edit | "This took longer than expected. Your plan may still show up in your list in a minute." + refetch list |
| 401 anywhere | redirect to `/signin?next=<current path>` |
| 404 on `[id]` | Next `notFound()` style message + link back |
| 403 `real_email_required` on checkout | backend message shown in the unlock panel |
| card error | handled inside `CardStep` (unchanged) |
| provision fails after paid | "Your payment went through, but we couldn't unlock the plan yet…" + retry button (provision is idempotent) |

## Testing

- Vitest for `src/lib/tripPlan/*` pure logic (port mobile test cases).
- Vitest for `route-guard`: `/trip-plan` public, `/trip-plan/abc` guarded.
- Vitest for BFF id/version/prompt validators.
- Vitest for `backendFetch` `timeoutMs` wiring (dispatcher passed when set, absent otherwise).
- `pnpm build` + manual: signed-out landing, generate a plan against prod-like backend, locked view, pay with test card, unlocked + PDF, refine, version switch, delete, quota exhausted.

## Docs / feedAI on completion

- facts.jsonl: new feature fact (web traveler trip plan; supersedes "traveler UI is mobile-only" in f160), invariant for the long-timeout dispatcher + nginx ≥600 s.
- topics: add trip-plan entry to `account-flows.json` (or a new `topics/trip-plan.json` + route key).
- `docs/overview.md` route list, session log + INDEX row, brain.json `sync`.
- Root `feedAI/brain.json` phase note mentions traveler UI is mobile-only → update.
