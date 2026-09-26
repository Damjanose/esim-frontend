# 2026-09-26: Testimonials premium UI

**Focus:** web

## What changed
- `src/app/Testimonials.tsx` was restyled. Production has only one approved quote, and it sat alone in the left column of a 3-column grid under a centered heading.
  - 1 quote: a dark featured card with a large display-font quote, teal quote mark and stars, an initial avatar, and "eSim2you traveler · Mon YYYY".
  - 2 quotes use 2 columns. 3 or more use a 3-column grid of light cards with a hover lift.
  - The header is left-aligned, with a rating summary (average and count) on the right.
- No data or contract changes. The empty list still hides the section, and the JSON-LD is unchanged.

## Verification
- `pnpm exec tsc --noEmit` passed.
- Checked in the browser against the production API, using the 1-quote layout and a temporary 3-quote injection (reverted).
