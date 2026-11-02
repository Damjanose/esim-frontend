# 2026-11-02 — Faster build

**Problem:** `next build` took ~114s and pages randomly exceeded Next's 60s prerender limit and retried.

**Cause:** ~50 destination/compare pages each called `unstable_cache(loadCatalog)` at once. `unstable_cache` doesn't dedupe in-flight calls, so ~55 parallel downloads of the 2.7MB `/api/packages` hit prod during every build.

**Fix (src/lib/destinationPricing.ts, src/lib/backend.ts):**
- One shared in-flight catalog promise per process (55 fetches → 4).
- `loadCatalog` throws on failure (30s cap) so an empty catalog is never cached for an hour; callers still get `emptyCatalog()`.
- `backendFetch` gets a 15s timeout only when `NEXT_PHASE=phase-production-build`; runtime unchanged.

**Result:** clean build 114s → 77s, warm 58s; bundles identical; prices verified in built `/esim/spain`.

**Rejected:** `next build --turbopack` (compile 41s → 6s) — added ~18kB First Load JS to every page (shared 103 → 149kB), beta in 15.5.

**Gotcha:** when timing builds, delete `.next/cache/fetch-cache` or the cached catalog hides the fetch.
