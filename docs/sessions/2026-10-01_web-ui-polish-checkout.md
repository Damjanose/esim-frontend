# 2026-10-01: Web UI polish, phase 5: checkout + sign-in

## Goal
Spec option B: a one-page, Stripe-style checkout with a sticky order summary, a summary bar on phones and the real Pay button pinned on phones, plus a restyled sign-in card. Content and flows are unchanged. Plan: `docs/superpowers/plans/2026-10-01-web-ui-polish-phase5-checkout.md`.

## What changed
- **`lib/checkoutSummary.ts`** (TDD): total, price lines (plan / discount / partner code), the phone bar label, and bundle coverage.
- **`components/fieldClasses.ts`**: shared 48px inputs with focus rings.
- **`CardStep`**: still a single Pay button, sticky below lg. Card inputs have `scroll-mb-32`. Payment logic is untouched.
- **`BillingStep`**: restyled, with an `onLoaded` callback. "Save address" is flat.
- **`OrderSummary`**: the phone disclosure and the desktop sticky panel. The promo field is mounted once.
- **Checkout page**: two columns, numbered steps. Step 02 stays invisible until billing has loaded (CLS).
- **Status pages**: failed, not-found and loading restyled. The failed page's buttons are now full-size on phones.
- **Sign-in**: centered card, shared inputs, `LinkEmailStep` restyled. The Google/Apple row no longer causes layout shift.

## Owner decisions taken (flag if you disagree)
1. **Price increases at checkout.** A "discount" priced above retail shows only the charged price, with no strike-through. There are 0 live cases today.
2. **"Covers N countries"** now only shows for multi-country bundles. This fixes "covers 1 countries".
3. **First-time buyers see no gradient button** until the card step: Save address and Apply are flat so that Pay is the single primary. This is a conversion trade-off and easy to flip.
4. **Desktop reading order.** Screen readers meet the summary landmark before the H1, so that the phone bar can sit under the top bar.

## Verification
- `pnpm test`: 84 files, 651 tests passing. `tsc` is clean.
- `pnpm build`: `/checkout` is ƒ and `/signin` is ○.
- **Headless Playwright matrix, 320–1440px.** Safe recipe (f219): a display-only cookie, mocked `/bff`, payment hosts blocked, Pay never clicked.
  - No horizontal scroll anywhere.
  - CLS 0 for the signed-out gate at every width and for first-time buyers.
  - The gate redirects to `/signin?next=…`.
  - The summary is sticky at lg and collapses to a bar below lg.
  - The dock is hidden.
  - Sign-in inputs are 48px and Send code is 54px. Send code is the only gradient besides the navbar CTA at lg.
- **Lighthouse mobile `/signin`:** CLS 0 (it was 0.02–0.09) and a11y 1.0.
- **Known test artifact:** the "Something went wrong!" panel in signed-in screenshots appears because Pokpay is blocked.
- **Still to check by hand:**
  - iOS keyboard over the sticky Pay bar, on a real device.
  - VoiceOver on the checkout and sign-in pages.
  - One real purchase on the owner's account.

## Commits
`5d4ea7e` plan, `375bcdc` summary rules, `e1b7bff` fields + sticky Pay, `32c7bda` OrderSummary, `a7cff9f` checkout layout, `6f6bc2e` status pages, `fcb6305` sign-in, then this docs/feedAI commit.

## Next
Phase 6: account. Desktop sidebar dashboard with a usage ring, the app's My eSIMs layout and grouped settings on phones, and the order detail page.
