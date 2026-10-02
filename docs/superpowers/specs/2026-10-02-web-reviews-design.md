# Web reviews: write first, sign in to send

**Date:** 2026-10-02 · **Focus:** web · **Backend changes:** none

## Goal

Let web visitors leave a review (a testimonial) without allowing anonymous "type an email and submit" posts. A review must come from a signed-in account that owns a paid order. The flow is designed so people actually finish it: they write first and sign in only when they press Send, and nothing they typed is lost.

## What already exists (do not rebuild)

- **Backend** `GET /user/testimonial` → `{ testimonial | null, quota }` and `PUT /user/testimonial` (JWT-guarded, `E-SIM backend/src/routes/user.ts`).
  - Body: `{ airaloOrderId?, rating 1–5, body 10–500, displayName 1–40, consentToPublish, locale, platform }`.
  - When `airaloOrderId` is omitted, the backend uses the latest settled order. With no paid order it returns `TESTIMONIAL_NO_PURCHASE`.
  - Limit: 2 sends per rolling 90 days (`429 TESTIMONIAL_LIMIT`, with `quota.resetsAt`). Every send starts as `pending`, and an admin decides in `/xtestimonialsy`.
- **Web:** `src/app/Testimonials.tsx` renders approved reviews from `/bff/testimonials` via `src/lib/loadPublicTestimonials.ts`.
- **Mobile:** `ShareExperienceScreen` and `InstallReviewSheet` (same contract). The rules and copy tone should match.

## Entry points

| Where | Condition | Heading |
|---|---|---|
| `/account/[orderId]?new=1` (checkout success) | settled order, composer state = `can-write` | "How was buying your eSIM?" (compact card under the success banner) |
| `/account/[orderId]` (later visits) | `lifecycle_status` is `active` or `expired`, `can-write`, not dismissed for this order | "How's your trip data?" |
| Homepage `Testimonials` section | always shows a "Share your experience" button (`src/app/ShareExperienceButton.tsx`, kept out of `Testimonials.tsx` because `homepage-blocks.test.ts` forbids the string "Review" there, per f191). When there are 0 approved quotes, the section renders the header and the button instead of hiding | Composer opens in a dialog |

On order pages the composer sends `airaloOrderId = order.id`. From the homepage it omits the id, so the backend picks the latest paid order.

## Composer states (single pure function)

`deriveReviewState({ auth, testimonial, quota, now })` in `src/lib/review-composer.ts` returns one of the following:

- `signed-out`: the GET returned 401. The form is fully usable. Send = save the draft, then go to sign-in.
- `can-write`: signed in, `quota.remaining > 0`, and no testimonial created within the window.
- `already-sent`: there is a testimonial within the window. Show "Thanks, your review is **pending review** / **live**". No form.
- `limit-reached`: `quota.remaining === 0`. Show "You can share another review after {resetsAt}".
- `no-purchase`: set only after a PUT returns `TESTIMONIAL_NO_PURCHASE`. Show "Reviews come from verified travelers. Pick a plan and tell us how it went" with a link to plans. The draft is kept.

The homepage copy states up front that reviews are "from travelers who bought a plan", so a signed-out writer isn't surprised later.

## The composer (`src/app/components/ReviewComposer.tsx`, client)

- **Stars first.** These are 5 large tap targets (≥44px), and the text box appears after the first tap.
- **Quick prompts.** Chips ("Easy setup", "Fast data", "Great price", "Helpful support") add a phrase to the text box. They only help people get started and are not stored separately.
- **Text box** with a live counter. Send is disabled until there are 10 characters. The limit is 500.
- **Display name.** Prefilled as "First L." from the billing profile (`/bff/user/billing-address`) when it exists, otherwise empty. Editable, max 40.
- **Consent checkbox** "Show my review on eSim2you.com", checked by default. Unchecked still sends; the backend stores `consentToPublish=false` and the review never shows publicly.
- Sends `locale: "en"`, `platform: "web"`.
- **Success:** `public/lottie/stamp.json` via `lottie-react`, followed by "Thanks! It'll appear after a quick check." The card then switches to `already-sent`.
- **Dismiss** (order page only): "Not now" sets `localStorage["review_dismissed_<orderId>"]`. The order-page card stays hidden for that order, but the homepage button still works.
- The homepage loads the composer with `next/dynamic` only when the button is clicked, so it adds no weight to the homepage's initial load and doesn't affect the CWV tests.

## Write first, sign in at Send

1. A signed-out user presses Send. `saveDraft()` writes `sessionStorage["esim2you_review_draft"] = { rating, body, displayName, consent, airaloOrderId?, returnPath, savedAt }`.
2. Navigate to `/signin?reason=review&next=<returnPath with ?review=open>`, where the path is validated by the existing `safeNextPath`. When `reason=review`, `signin/page.tsx` shows "Sign in to post your review. Your text is saved." above the sign-in buttons. Any other value is ignored, and the email OTP and social flows already carry `next` through.
3. Any provider (Google / Apple / email OTP) returns to `next`. Seeing `review=open`, the composer opens, `loadDraft()` restores the fields, and Send is focused. **It doesn't send automatically**: the user sees their text and confirms with one tap.
4. A draft older than 24 h, or one that fails to parse, is discarded. A successful send clears it.

## BFF

New file `src/app/bff/user/testimonial/route.ts`, following the `bff/user/account` pattern:

- `GET`: `callWithSession(readSessionTokens(request), token => backendFetch("/user/testimonial", { token }))`, returning `{ testimonial, quota }`, or 401 when there is no session.
- `PUT`: forwards the JSON body unchanged (the backend validates). Passes through `status` and `code`, so the client can tell 400 / 404 / 429 / `TESTIMONIAL_NO_PURCHASE` apart. Refreshed cookies are forwarded as the other routes do.
- Both responses are `Cache-Control: no-store`.

## Public display

`Testimonials.tsx` adds a small "Verified traveler" label under each name. This is honest by construction, because the backend only accepts reviews tied to a settled order owned by the author. The JSON-LD stays unchanged.

## Errors

| Case | UI |
|---|---|
| 401 after a refresh attempt during PUT | Save the draft, then send the user to sign-in (same as signed-out) |
| 400 `TESTIMONIAL_INVALID` | Inline message, form stays filled |
| 404 / `ORDER_NOT_OWNED` / `ORDER_UNPAID` | "This order can't be reviewed", form hidden |
| 429 | Switch to `limit-reached` |
| Network / 5xx | "Couldn't send. Try again", with the draft kept in the form |

## Testing (vitest)

- `src/lib/review-composer.test.ts`: each `deriveReviewState` state and the window edge, plus a draft save/load round trip with expiry, corrupt JSON and the 24 h cutoff, `formatDisplayName` ("anna karenina" → "Anna K."), and validation lengths.
- `src/app/bff/user/user-routes.test.ts`: extended with GET/PUT testimonial, covering passthrough of the error code and a 401 when signed out.
- Manual check against local backend: signed-out homepage → write → Google sign-in → draft restored → send → row appears pending in `/xtestimonialsy` → approve → shows on homepage with "Verified traveler". Also check the checkout `?new=1` card and the 429 state.
- `pnpm exec tsc --noEmit` and `pnpm test`.

## Out of scope (YAGNI)

- Review emails after purchase (needs backend plus email templates). This is the obvious next step if volume stays low.
- Per-destination reviews, replies, editing a sent review, and photos.
- Profile "your review" card. Mobile has one; the web can add it later.

## Docs and feedAI on completion

- A `feedAI/facts.jsonl` fact (feature, topic `public-content-pages`) and a `topics/public-content-pages.json` entry.
- A session doc plus an INDEX row, and a bump to the `brain.json` sync block.
