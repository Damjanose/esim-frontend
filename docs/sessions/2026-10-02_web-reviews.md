# 2026-10-02: Web reviews

**Focus:** web · **Spec:** `docs/superpowers/specs/2026-10-02-web-reviews-design.md` · **Plan:** `docs/superpowers/plans/2026-10-02-web-reviews.md`

## Goal
Let people leave a review on the web, but only from a signed-in account. Typing an email and submitting is not enough. Make it pleasant enough that people actually do it.

## What changed
- **Backend unchanged.** `GET/PUT /user/testimonial` already required a JWT and a settled order, with a limit of 2 per 90 days and admin moderation in `/xtestimonialsy`.
- `src/app/bff/user/testimonial/route.ts`: a GET/PUT proxy through `callWithSession`. It adds `locale: "en"` and `platform: "web"` and passes the backend error `code` through. The response is `no-store`.
- `src/lib/review-composer.ts`: pure rules (state derivation, draft with a 24h TTL, `formatDisplayName`, validation, quick prompts, sign-in href, and mapping error codes to UI states).
- `src/app/components/ReviewComposer.tsx`: stars, then quick-prompt chips, text with a counter, display name (filled from the billing holder name as "First L."), consent, and send. Success shows the `stamp.json` Lottie animation. It also handles the already-sent, limit-reached, no-purchase and not-eligible states.
- **Homepage:** `ShareExperienceButton` opens a dialog, which becomes a bottom sheet on phones. The composer loads only when opened. The testimonials section now renders even with 0 quotes, and the author line reads "Verified traveler".
- **Order page:** `OrderReviewCard` shows "How was buying your eSIM?" on `?new=1` and "How's your trip data?" once the eSIM is active or expired. "Not now" hides it for that order only.
- **Sign-in:** `?reason=review` changes the heading and subline ("Your text is saved…").

## Flow for signed-out users
1. Rate and write.
2. "Sign in to post" saves `esim2you_review_draft` and goes to `/signin?reason=review&next=/?review=open`.
3. After sign-in the dialog reopens with the draft.
4. One tap on Send posts it. Nothing is sent automatically.

## Verification
- `pnpm exec tsc --noEmit` passed. `pnpm test`: 109 files / 837 tests passed, including the new `review-composer.test.ts` and the testimonial cases in `user-routes.test.ts`.
- Browser, signed out (local dev → production API, so **nothing was sent**): the dialog opened, the stars, chips and counter worked, the sign-in heading changed, and the draft came back on `/?review=open`. No console errors.
- Fixed during verification: while loading, the dialog showed an empty white strip. It now shows a spinner there; the order card still stays hidden until it's ready.
- **Not yet checked in a browser:** a signed-in send, the order-page card and its states, and the phone-width layout (the window resize didn't take effect). These need a local backend or a test account.

## Gotchas
- `Testimonials.tsx` must not contain the string "Review" (f191 test), which is why the button is a separate file.
