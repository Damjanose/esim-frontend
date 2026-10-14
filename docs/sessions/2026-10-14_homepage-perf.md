# 2026-10-14 · homepage performance, flags, link text

**Focus:** web

## Why
A `/seo technical` re-run after the 10-14 deploy scored 94/100. The one real gap was mobile LCP on `/`: 4.0 s with Lighthouse 12.6 mobile and DevTools throttling against production. The hero image is requested at 660 ms together with the HTML, so it was never discovered late. It took 3.3 s to download because 3 high-priority font preloads (111 KB) and about 240 KB of JS shared the bandwidth, including lottie-web (76 KB gzip, mostly unused). Lighthouse also flagged Airalo's `__cf_bm` third-party cookie from raw flag images (best-practices 79) and the cookie banner's "Learn more" link text (SEO 92).

## What changed
- `DestinationBrowse`: `WizardWelcomeIntro` is now `next/dynamic` (ssr:false), so Lottie leaves the homepage first load. First Load JS for `/` drops from 228 KB to 144 KB. f283.
- `layout.tsx`: Geist (font-mono, only used in the wizard and admin pages) gets `preload: false`, leaving 2 font preloads instead of 3. f283.
- New `src/app/components/FlagImage.tsx` (next/image), used for every public flag. `cdn-revamp.airalo.com` is added to `remotePatterns` and `NEXT_IMAGE_HOSTS`. Flags are about 1 KB instead of 4–6 KB, and no third-party cookie is set. f284.
- `ConsentManager`: "Learn more" becomes "Read our privacy policy". f285.
- Tried and rejected: AVIF for the hero, which comes out larger than WebP for this photo. A preload hint would also not help, since the image is already requested with the HTML.

## Verified
- Tests written first and seen failing. Then `pnpm test`: 121 files / 965 tests pass. `tsc --noEmit` is clean.
- Local production build (`next start -p 3077`, Lighthouse 12.6 mobile, DevTools throttling, 2 runs): `/` performance 96, LCP 2.6 s, CLS 0, best-practices 96, SEO 100, accessibility 100. 56 flag requests, all 200 through `/_next/image`, about 1 KB each, and no raw Airalo requests. `/esim/usa` performance 99, LCP 1.6 s.
- Local numbers aren't directly comparable with production (no CDN or TLS hop). Re-measure `/` on production after deploy.

## Not done
- PageSpeed Insights / CrUX field data: needs a Google API key from the owner (`google_auth.py --setup`).
- Hero quality stays q80 (f230 decision).
- Admin `/xpricing` flags still use a plain `img`.
