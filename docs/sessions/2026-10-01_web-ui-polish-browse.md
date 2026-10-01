# 2026-10-01: Web UI polish, phase 3: destination browse

## Goal
Spec option B: Trending and the 5 rails become photo-tile carousels, and the All destinations grid becomes app-style country rows. The content is unchanged. Plan: `docs/superpowers/plans/2026-10-01-web-ui-polish-phase3-browse.md`.

## What changed
- `countryImageCache.ts` (+8 tests): the `/bff/country-image` URL and key, a per-country promise cache, and `isOptimizableImageUrl`, which mirrors `next.config` `remotePatterns`.
- `carouselScroll.ts` (+3 tests): pure edge and step math for the arrows.
- `useLazyCountryImage.ts` + `PhotoTile.tsx`: IntersectionObserver lazy photos. A tile shows a gradient until its photo fades in, the fade is motion-safe, and the tile always shows its flag and caption.
- `TileCarousel.tsx`: a scroll-snap track that bleeds to the screen edge below lg, with arrows at lg+. The wrapper is `min-w-0 [contain:inline-size]` and the track is `relative`.
- `CountryRow.tsx`: flag, name, "N plans", "from €X" and a chevron. It keeps "N plans" so no content is lost.
- `browseCountries.ts` (+4 tests): `toCountryOptions` moved out of `DestinationBrowse`. "from €X" is now the cheapest charged price.
- `BrowseSkeleton.tsx`: built from the real `TileCarousel` and `PHOTO_TILE_BOX`.
- `DestinationBrowse.tsx`:
  - Trending and the rails are carousels.
  - The grid uses `CountryRow` in 1/2/3 columns.
  - Help me choose is the only gradient `Button`; retry and Show all are flat.
  - The file went from 549 to 452 lines.

## Review findings
- **Fixed:** the diacritics regex used invisible literal combining characters (the implementer reported it as escaped). It's now `/[̀-ͯ]/g`.
- **Checked, not bugs:**
  - Every tile photo ends at opacity 1. An early screenshot simply caught the fade-in.
  - The duplicate "Help me choose" button in the DOM is Next's hidden streamed `S:1` container in a background tab.
  - Only one Help me choose button is visible, so the section has one gradient primary.
- **Search, Show all/less and the 20-row cap** are unchanged. The diff touches no filter or slice logic.

## Verification
- `pnpm test`: 73 files, 590 tests passing. `tsc` is clean. `pnpm build`: `/` stays ○ and `/destinations` stays ƒ (it reads `searchParams`, as before).
- **Browser, prod build:**
  - The grid is 1, 2 and 3 columns at 320, 768 and 1440px, with no horizontal scroll at any width.
  - Lazy photos are only requested in a foreground tab. Visible tiles only: 8 requests for 11 tiles at 375px (w=384) and 23 for 30 at 1440px (w=640), out of 56 tiles in total.
  - Arrows show only at lg+.
- **Lighthouse mobile `/`:** CLS 0.000 on every run. Simulated LCP was 3.61–3.68s against 3.53–3.58s after phase 2, about +80ms.
  - Observed LCP subparts are unchanged (render delay about 80–90ms).
  - `fetchPriority="low"` on tiles, and deferring tile observation to `window.load`, were both measured: no change. Both were reverted.
  - That points to the carousels' client JS (first load 213 → 216 KB). This is accepted and recorded in f211.

## Commits
`d016fcd` plan, `8107ff9` image cache, `454f1f6` carousel math, `b56731e` PhotoTile, `9dab279` TileCarousel, `ea71f20` CountryRow, `c18068e` browseCountries, `5016023` carousels, `22d543b` grid, then this docs/feedAI commit.

## Next
Phase 4: country plans (`PlanRow` + `planRowTags()`, desktop sidebar, collapsed country bar on phones). That phase also has to fix `DestinationPlans`' `pt-20`, which leaves only 4px under the navbar capsule at lg.
