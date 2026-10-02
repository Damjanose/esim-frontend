# 2026-10-02: Homepage hero, dark photo card (NASA Earth at night)

## Goal
Make the homepage hero more premium. Designed first on a claude.ai Design canvas (desktop 1440 and phone 390 frames), then implemented in `page.tsx`.

## What changed
- `page.tsx` `Hero()` is now a dark photo card.
  - It runs full-bleed below lg, so the capsule Navbar floats inside it, and becomes a rounded 1400px card from lg.
  - Headline: "Land anywhere. / Already connected.", with the second line in `text-brandTeal`. `aqua` is a retired token.
  - Eyebrow: "200+ destinations · Instant activation".
  - Search, tune button and chips are the same components as before, now sitting over the photo.
  - From lg there's an "eSIM preview" card (Italy, Connected, "Install in minutes · 24/7 support").
  - A `heroPerks` strip of four trust items sits below the card.
  - "Photo: NASA" credit line.
- Photo: NASA iss065e045974 (May 2021), southern Italy at night with a blue sunrise along the horizon. The original is 5568×3712 and public domain; NASA asks for a credit and no implied endorsement.
  - The first pick, ISS032-E-020159 (2012), was dropped after the user reported low quality. At 1:1 it's motion-blurred and noisy, and sharpening only brought out the grain.
  - There are two art-directed high-quality masters (q92). Visitors only get the optimizer's re-encodes of them:
    - `public/images/hero-earth-wide.webp`: 2880×1390, a full-width crop starting just below the station's solar panel.
    - `public/images/hero-earth-tall.webp`: 1290×1965. The photo starts 300px down under dark sky, so the sunrise glow sits just below the phone navbar.
  - `quality: 90` for wide and `80` for tall; the default 75 smears the city lights. Served sizes: phone w=1200 is 212 KB, desktop w=1920 is 299 KB, and w=3840 at 2× density is about 1 MB.
- Delivery: `getImageProps` + `<picture>` (`<source media="(min-width: 1024px)">`), so each viewport downloads one crop. There's no `priority`, because that would also preload the tall crop on desktop. The `<img>` is `loading="eager"` with `fetchPriority="high"`.
- Only the photo layer clips (`absolute inset-0 overflow-hidden rounded-[inherit]`), never the card. The search dropdown is in normal flow and must not be cut off.
- Tests: the hero contract in `hero-package-search.test.ts` and the image contract in `core-web-vitals.test.ts` were rewritten on purpose for the new hero. `mountain.webp` stays, because `EsimDestinationPage` still uses it.

## Also fixed: stale "Download the App" image
The section kept showing the old phone mockups after `app-store.png` was replaced in place. `/images/*` is cached immutable for a year, and the optimizer follows that, so I renamed it to `app-download-phones.png` (f231 and a troubleshooting entry).

## Verification
- `pnpm test`: 102 files, 751 tests passing. `tsc` is clean.
- Dev server screenshots at 1440px, 820px, 390×844 and 360×640. Phone widths were rendered in iframes, because headless Chrome windows can't go below about 500px. No horizontal scroll. On 360×640 the search box ends at about 478px, above the dock (about 568px).
- The rendered `<picture>` serves `/_next/image` srcsets for both crops.
- Not run: Lighthouse/LCP and `pnpm build`.

## Regenerating the crops
Source: `https://images-assets.nasa.gov/image/iss065e045974/iss065e045974~orig.jpg`. Each crop was rendered with headless Chrome from a small HTML page, with `filter: contrast(1.05) saturate(1.06)` on the photo:
- Wide (2880×1390): img width 2880px, top -536px.
- Tall (1290×1965): a box from top 300px holding the img at width 4095px, left -1912px, top -765px, with a 110px black fade at the box's top.

Both add a radial `#0B2A73 → #071236 → #040A20` overlay with `mix-blend-mode: lighten` at 0.5 opacity, then `cwebp -q 92 -m 6 -sharp_yuv`.
