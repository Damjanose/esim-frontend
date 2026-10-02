# 2026-10-02: Web UI polish, phase 7 (homepage) and final pass

## Phase 7: homepage blocks (fast mode)
- **Built around the owner's new How it works** (commit `487e8d2`), which is left unchanged. Only its dead mockup helpers were removed.
- **Bento benefits**: a gradient tile, two tinted tiles and an ink strip.
- **Testimonials**: a carousel on phones and a grid at lg.
- **FAQ**: restyled cards over a native `<details>` FAQ.
- **App download and partner promo**: shown as a card row.
- **CTA**: a gradient card.
- **Content and JSON-LD are unchanged.**
- **Accessibility**: the store badge accessible names now match their visible text, including the `{" "}` word space. Homepage a11y went from 0.97 to 1.0, with CLS 0 and LCP about 3.6s.
- **Stale tests updated** to describe the new How it works: the old phone-mockup assertions and the `page.tsx` flag alt check.

## Final pass
- The navbar logo link now has a 44px tap target on phones.
- `pnpm test`: 102 files, 751 tests passing. `tsc` is clean and `pnpm build` passes.
- **Sweep**: 12 public pages × 320/375/1440. No horizontal scroll, every page has an H1, no page errors.

## Redesign status
Phases 1–9 are complete (facts f207–f228; session logs dated 2026-10-01 and 2026-10-02).

**Open follow-ups for the owner:**
- `app-store.png` is 4.6 MB. Compress it.
- The order page's H1 is the raw package id.
- The legal pages have no Navbar or dock.
- The `/compare` table can't be scrolled with the keyboard.
- Check the iOS keyboard against the sticky Pay bar, and make one real purchase.
