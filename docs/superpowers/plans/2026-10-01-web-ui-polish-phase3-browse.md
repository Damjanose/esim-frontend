# Web UI Polish, Phase 3: Destination Browse (Photo-Tile Carousels) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Repo rule (overrides any skill):** implementers **never** run `git commit`. Each "Commit (controller)" step is done by the controller, who stages the files, shows the message, and asks the user before every commit. Stay on the current branch, with no new branches, worktrees or stashes.

**Goal:** Turn `DestinationBrowse`'s Trending section and its 5 rails into horizontal scroll-snap carousels of country **photo tiles** (spec option B), and the All destinations grid into compact **`CountryRow`** cards. The section header and "Help me choose" get the app's type scale and the shared `Button`. Copy, links, data and the wizard flow stay the same.

**Architecture:** Four small, single-job pieces go next to `DestinationBrowse`, which shrinks from 549 to about 450 lines instead of growing:
- `countryImageCache.ts` is a pure-ish module: one `/bff/country-image` request per country per page session, with an injectable fetch for tests.
- `useLazyCountryImage.ts` is an IntersectionObserver hook that asks the cache for a tile's photo only once the tile is near the viewport.
- `PhotoTile.tsx` is the fixed-size link card: gradient placeholder, lazy photo, scrim, flag, caption.
- `TileCarousel.tsx` is the scroll-snap track, with lg+ arrows driven by the pure `carouselScroll.ts`.
- `CountryRow.tsx` is the All destinations card.
- `BrowseSkeleton.tsx` is the loading state, built from the same `TileCarousel` and tile boxes, so swapping it for content never shifts layout.
- `browseCountries.ts` takes `toCountryOptions` out of `DestinationBrowse` and fixes "from €X" to be the cheapest plan.

The wizard's state, its single `<HelpMeChooseWizard>` and the `planWizardOpener` subscription are not touched (f210).

**Tech Stack:** Next.js 15.5 App Router, React 19.2 (`inert` is a typed boolean prop), Tailwind 3.4 (`line-clamp-*`, `scroll-px-*` and `motion-safe:` are built in), lucide-react 0.475 (`ChevronLeft`, `ChevronRight`, `Globe2`, `Flame` and `ArrowDownUp` exist under `dist/esm/icons/`), vitest in a node env (pure-logic and source-string tests; no RTL/jsdom). `sharp@0.34.5` is installed, so next/image optimization works under `next start`.

**Spec:** `docs/superpowers/specs/2026-10-01-web-ui-mobile-polish-design.md`. See "Constraints carried over", "Breakpoints", "### 3. Destination browse (option B: photo-tile carousels)", "Shared components" and "Risks". The local mockup is `.superpowers/brainstorm/20458-1790844487/browse.html`, card B.

**Scope:** spec build-order step 4 only. The mockup's "Team pick" badge and "See all ›" links are **not** added, because they'd be new content. `/esim/[slug]`, `DestinationPlans` and the country-plans redesign are phase 5.

**Baseline (2026-10-01, after phase 2 `0007110`):** `pnpm test` → **69 files, 569 tests passing**.

**Dry run:** every code block below was applied to a scratch copy of this repo before the plan was written. The per-task test counts, `tsc`, `pnpm build` and a headless-Chromium pass at 320–1440px all came out as stated here. See "Verification numbers from the dry run" at the end.

---

## Image-loading decision

- **Source:** `/bff/country-image?slug=<countryCode>&country=<name>`, a thin proxy to the backend's Postgres `CountryMedia` cache (f153). It uses the same parameter order as `DestinationPlans`' `useCountryHeroImage`, so the URL is byte-identical and the two share the browser HTTP cache. The request is `cache: "force-cache"`, like the existing hook.
- **When:** only once the tile is within **200px** of the viewport (`IntersectionObserver`, `rootMargin: "200px"`, root = the viewport). A carousel's `overflow-x-auto` clips its tiles, and the IO spec intersects the target with each clipping ancestor before applying the root margin. So tiles scrolled out of a rail don't count as visible: they load as they're swiped or arrowed in. That's the "only visible tiles" behavior, and the dry run measured it: 9–24 of 56 tiles requested at first view.
- **Once per country:** a module-level `Map` keyed by slug holds the **in-flight promise**, so a country shown in Trending and in three rails fetches once, even when all its tiles mount in the same frame. A definitive miss (non-2xx, or no `imageUrl`) is cached as `null`, and the tile keeps its gradient without asking again. A thrown network error is **evicted**, so a tile mounted later can retry. `peek()` returns a settled result synchronously, so a remounted tile (Trending re-sort, Show all toggling the page) never flashes the gradient.
- **next/image, not `<img>`:** every `imageUrl` the backend returns is a Wikimedia file (`upload.wikimedia.org` / `thumb.wikimedia.org`, in the seeds and the resolver). `next.config.mjs` already allows `*.wikimedia.org` (f076), and `DestinationPlans` already renders these same URLs through next/image in production.
  - They are **1920px originals**: Japan is 926 KB and the USA 664 KB direct, versus **19 KB / 17 KB** at `/_next/image?w=384`, measured on the dry-run build. A plain `<img loading="lazy">` would download about 50× the bytes per tile, so next/image with an exact `sizes` is the right call here.
  - As a safety net, `isOptimizableImageUrl()` mirrors `remotePatterns`, and any other host renders with `unoptimized`. In dev, next/image throws on an unconfigured host, which would take down the whole browse section.
- **Placeholder:** the tile itself is the placeholder. A `bg-gradient-to-br from-brandBlue via-[#0E86C0] to-brandTeal` box at a fixed width and aspect ratio. The photo fades in on `onLoad`. On `onError` it's removed and the gradient stays. The flag and caption always render.
- **Reduced motion:** the fade, the hover zoom and the track's smooth scrolling are all `motion-safe:`. The arrows call `scrollBy` without a `behavior`, so the CSS `scroll-behavior` decides, and `prefers-reduced-motion` gets an instant jump.

## Design numbers (verified, don't re-derive)

- **Tiles:** fixed width + aspect ratio, so the gradient, the photo and the skeleton occupy one box.

  | Tile | phone | sm (≥640) | lg (≥1024) | ratio | `sizes` |
  |---|---|---|---|---|---|
  | Trending | 150×110 | 176×129 | 208×153 | `aspect-[15/11]` | `(min-width: 1024px) 208px, (min-width: 640px) 176px, 150px` |
  | Rail | 100×70 | 128×90 | 152×106 | `aspect-[10/7]` | `(min-width: 1024px) 152px, (min-width: 640px) 128px, 100px` |

  At DPR 2 the browser picks `w=384` / `w=256` on phones and `w=640` / `w=384` at lg (measured).
- **Rail tile fit at 100×70:** flag `h-4` at `top-2` reaches 24px, and the caption (name 16px + 2 + detail 14px) at `bottom-2` takes 40px, so 64 ≤ 70. At sm the flag is `h-5`: 28 + 44 ≤ 90. The Trending caption allows `line-clamp-2` on "3 GB · 7 days · from €4.00": 32 + 54 ≤ 110.
- **Track gutter:** `DestinationBrowse`'s section is `px-5 md:px-8`. Below lg the track is `-mx-5 px-5 scroll-px-5 md:-mx-8 md:px-8 md:scroll-px-8`, so tiles swipe in from the screen edge, and snapped tiles align with the gutter. At lg it's `lg:mx-0 lg:px-0 lg:scroll-px-0`. Its edges coincide with the section's edges, so nothing overflows (`scrollWidth === clientWidth` at 320/375/768/1024/1440, measured).
- **No page widening:** the carousel wrapper is `min-w-0 [contain:inline-size]` (the f209 lesson), and the `<ul>` scroller is `relative` (f195).
- **Header heights (CLS):** `TileCarousel` renders its header as `flex-col gap-3` below sm and as a row from sm.
  - The Trending heading is exactly `h-9`. The sort control is `h-11` (a 44px tap target, up from `h-10`).
  - A rail heading is `text-title-sm` (22px).
  - At lg the arrow pair (44px) is **always laid out** and only `lg:invisible` when nothing overflows, so the header never changes height after the first measure.
  - `BrowseSkeleton` uses `TileCarousel` itself with the same heading and control heights. The dry run measured homepage CLS **0.0000** at 412×823 (browse section top at 655px, in the viewport) and at 1440×900.
- **Arrows:** they're `h-11 w-11` flat circles (`border-outline bg-surface text-brandBlue`), shown `hidden lg:flex`. Back is disabled at the start and forward at the end; both are hidden when the track fits. One press scrolls `round(clientWidth × 0.9)`, and `snap-mandatory` lands it on a tile edge. They're native `<button>`s with `aria-label="Scroll <label> back|forward"` and `aria-controls` set to the track, so Tab, Enter and Space work.
- **Grid:** `ul.grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3`, so 1, 2 and 3 columns (measured). `xl:grid-cols-4` is dropped, as the brief says. `CountryRow` is `min-h-[60px]`.
- **Type scale:** the eyebrow is `text-label-caps uppercase` and the H2 is `font-display text-display-lg font-black md:text-[32px] md:leading-[38px]`. Rail and All destinations headings are `<h3 className="font-display text-title-sm text-brandInk">`, under the existing H2.
- **Buttons:** "Help me choose" is `Button` (primary, the section's one gradient). "Show all/less" and "Try again" are `Button variant="flat"` (46px tall).
- **Colors:** tokens only. `bg-white`, `bg-mist` and `text-white` leave `DestinationBrowse`, and new text on photos is `text-surface`. The only hex is the documented gradient stop `#0E86C0`.
- **"from €X" in CountryRow:** `CountryOption.fromPrice` used to be the price of **whichever package came first** in the catalog. It wasn't shown anywhere, so this was never visible. Task 6 makes it the cheapest positive `priceNumeric` across the destination's local plans and the regional/global bundles that cover it (f115). The row keeps its existing "N plans" line too, so no content is lost.

---

## File map

| File | Action | Responsibility |
|---|---|---|
| `src/app/destinations/countryImageCache.ts` | create | BFF URL/key, per-country promise cache, `isOptimizableImageUrl` |
| `src/app/destinations/countryImageCache.test.ts` | create | unit tests (injected fetch) + remotePatterns drift guard |
| `src/app/destinations/carouselScroll.ts` | create | pure arrow math: `carouselEdges`, `sameEdges`, `carouselStep` |
| `src/app/destinations/carouselScroll.test.ts` | create | unit tests |
| `src/app/destinations/useLazyCountryImage.ts` | create | IntersectionObserver → cache hook |
| `src/app/destinations/PhotoTile.tsx` | create | lazy country photo card + `PHOTO_TILE_BOX` |
| `src/app/destinations/TileCarousel.tsx` | create | scroll-snap track + lg arrows |
| `src/app/destinations/CountryRow.tsx` | create | All destinations card |
| `src/app/destinations/browseComponents.test.ts` | create | source contracts for the four UI files above |
| `src/app/destinations/browseCountries.ts` | create | `toCountryOptions` (moved) with cheapest from-price |
| `src/app/destinations/browseCountries.test.ts` | create | unit tests + "single copy" guard |
| `src/app/destinations/BrowseSkeleton.tsx` | create | loading state from the real carousel + tile boxes |
| `src/app/destinations/DestinationBrowse.tsx` | modify | use all of the above; header/grid/error restyle |
| `src/app/destinations/destinationBrowse-wiring.test.ts` | modify | +2 contract tests |
| `src/content/landing.test.ts` | modify | flag-alt assertions follow the markup into `PhotoTile` / `CountryRow` |
| `feedAI/*`, `docs/sessions/*` | modify/create | Task 10 |

---

### Task 1: Country image cache (TDD)

**Files:**
- Create: `src/app/destinations/countryImageCache.ts`
- Test: `src/app/destinations/countryImageCache.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/destinations/countryImageCache.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  countryImageKey,
  countryImageUrl,
  createCountryImageCache,
  isOptimizableImageUrl,
} from "./countryImageCache";

const JAPAN = { slug: "japan", country: "Japan" };
const PHOTO = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Shinjuku.jpg/1920px-Shinjuku.jpg";

function fetcherReturning(response: { ok: boolean; body?: unknown }) {
  return vi.fn(async (_input: string, _init?: RequestInit) => ({
    ok: response.ok,
    json: async () => response.body,
  }));
}

describe("countryImageCache", () => {
  it("builds the same BFF URL DestinationPlans uses (slug first, then country)", () => {
    expect(countryImageUrl(JAPAN)).toBe("/bff/country-image?slug=japan&country=Japan");
    expect(countryImageUrl({ slug: "", country: "Côte d'Ivoire" })).toBe(
      "/bff/country-image?country=C%C3%B4te+d%27Ivoire",
    );
  });

  it("keys by slug, falling back to the slugified country name", () => {
    expect(countryImageKey({ slug: " Japan ", country: "Ignored" })).toBe("japan");
    expect(countryImageKey({ slug: "", country: "Côte d'Ivoire" })).toBe("cote-d-ivoire");
    expect(countryImageKey({ slug: "", country: "  " })).toBe("");
  });

  it("fetches each country once, however many tiles ask for it", async () => {
    const fetcher = fetcherReturning({ ok: true, body: { imageUrl: PHOTO, alt: "Shinjuku" } });
    const cache = createCountryImageCache(fetcher);

    const [first, second] = await Promise.all([
      cache.load(JAPAN),
      cache.load({ slug: "JAPAN ", country: "Japan" }),
    ]);
    const later = await cache.load(JAPAN);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith("/bff/country-image?slug=japan&country=Japan", {
      cache: "force-cache",
    });
    expect(first).toEqual({ imageUrl: PHOTO });
    expect(second).toBe(first);
    expect(later).toBe(first);
  });

  it("peek is undefined until the request settles, then returns the cached result", async () => {
    const cache = createCountryImageCache(fetcherReturning({ ok: true, body: { imageUrl: PHOTO } }));

    expect(cache.peek(JAPAN)).toBeUndefined();
    const pending = cache.load(JAPAN);
    expect(cache.peek(JAPAN)).toBeUndefined();
    await pending;

    expect(cache.peek(JAPAN)).toEqual({ imageUrl: PHOTO });
    expect(cache.peek({ slug: "italy", country: "Italy" })).toBeUndefined();
  });

  it("caches a definitive miss (non-2xx or no imageUrl) as null without refetching", async () => {
    const notFound = fetcherReturning({ ok: false, body: { message: "Could not resolve media" } });
    const missCache = createCountryImageCache(notFound);
    expect(await missCache.load(JAPAN)).toBeNull();
    expect(await missCache.load(JAPAN)).toBeNull();
    expect(missCache.peek(JAPAN)).toBeNull();
    expect(notFound).toHaveBeenCalledTimes(1);

    const noUrl = fetcherReturning({ ok: true, body: { imageUrl: "" } });
    expect(await createCountryImageCache(noUrl).load(JAPAN)).toBeNull();

    const emptyKey = fetcherReturning({ ok: true, body: { imageUrl: PHOTO } });
    expect(await createCountryImageCache(emptyKey).load({ slug: "", country: " " })).toBeNull();
    expect(emptyKey).not.toHaveBeenCalled();
  });

  it("turns a network error into null and evicts it, so a later tile can retry", async () => {
    let offline = true;
    const fetcher = vi.fn(async (_input: string, _init?: RequestInit) => {
      if (offline) throw new TypeError("Failed to fetch");
      return { ok: true, json: async () => ({ imageUrl: PHOTO }) };
    });
    const cache = createCountryImageCache(fetcher);

    expect(await cache.load(JAPAN)).toBeNull();
    expect(cache.peek(JAPAN)).toBeUndefined();

    offline = false;
    expect(await cache.load(JAPAN)).toEqual({ imageUrl: PHOTO });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("only hands next/image the hosts next.config.mjs allows", () => {
    expect(isOptimizableImageUrl(PHOTO)).toBe(true);
    expect(isOptimizableImageUrl("https://thumb.wikimedia.org/x.jpg")).toBe(true);
    expect(isOptimizableImageUrl("https://images.unsplash.com/photo-1")).toBe(true);
    expect(isOptimizableImageUrl("https://flagcdn.com/w80/jp.png")).toBe(true);

    expect(isOptimizableImageUrl("http://upload.wikimedia.org/x.jpg")).toBe(false);
    expect(isOptimizableImageUrl("https://a.b.wikimedia.org/x.jpg")).toBe(false);
    expect(isOptimizableImageUrl("https://wikimedia.org.example.com/x.jpg")).toBe(false);
    expect(isOptimizableImageUrl("https://example.com/x.jpg")).toBe(false);
    expect(isOptimizableImageUrl("not a url")).toBe(false);
  });

  it("stays in sync with next.config.mjs remotePatterns", () => {
    const config = readFileSync(join(process.cwd(), "next.config.mjs"), "utf8");

    expect(config).toContain('hostname: "images.unsplash.com"');
    expect(config).toContain('hostname: "*.wikimedia.org"');
    expect(config).toContain('hostname: "flagcdn.com"');
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm exec vitest run src/app/destinations/countryImageCache.test.ts`
Expected: FAIL. `./countryImageCache` can't be resolved.

- [ ] **Step 3: Implement**

Create `src/app/destinations/countryImageCache.ts`:

```ts
/**
 * Country photos for the browse PhotoTiles. The source is /bff/country-image,
 * a thin proxy to the backend's Postgres CountryMedia cache (f153). It's the
 * same URL DestinationPlans requests, so the two share the browser HTTP cache.
 *
 * The module-level cache is keyed by destination slug and holds the in-flight
 * promise, so a country shown in Trending and in three rails is fetched once,
 * even when all of its tiles mount together. A definitive miss (non-2xx, or no
 * imageUrl) is cached as null, so the tile keeps its gradient without asking
 * again. A network error is evicted, so a tile mounted later can retry.
 */

export type CountryImage = { imageUrl: string };
export type CountryImageQuery = { slug: string; country: string };

type FetchLike = (
  input: string,
  init?: RequestInit,
) => Promise<{ ok: boolean; json(): Promise<unknown> }>;

type CacheEntry = {
  promise: Promise<CountryImage | null>;
  settled: boolean;
  value: CountryImage | null;
};

function slugifyCountryName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Cache key: the destination slug, else the slugified country name (the BFF's own fallback). */
export function countryImageKey({ slug, country }: CountryImageQuery): string {
  return slug.trim().toLowerCase() || slugifyCountryName(country);
}

/** Same parameters, in the same order, as DestinationPlans' useCountryHeroImage. */
export function countryImageUrl({ slug, country }: CountryImageQuery): string {
  const params = new URLSearchParams();
  if (slug.trim()) params.set("slug", slug.trim());
  if (country.trim()) params.set("country", country.trim());
  return `/bff/country-image?${params.toString()}`;
}

function toCountryImage(payload: unknown): CountryImage | null {
  if (!payload || typeof payload !== "object") return null;
  const imageUrl = (payload as { imageUrl?: unknown }).imageUrl;
  return typeof imageUrl === "string" && imageUrl.trim() ? { imageUrl } : null;
}

export function createCountryImageCache(fetcher: FetchLike) {
  const entries = new Map<string, CacheEntry>();

  function load(query: CountryImageQuery): Promise<CountryImage | null> {
    const key = countryImageKey(query);
    if (!key) return Promise.resolve(null);

    const existing = entries.get(key);
    if (existing) return existing.promise;

    const entry: CacheEntry = { promise: Promise.resolve(null), settled: false, value: null };
    entry.promise = fetcher(countryImageUrl(query), { cache: "force-cache" })
      .then(async (response) => (response.ok ? toCountryImage(await response.json()) : null))
      .then(
        (value) => {
          entry.settled = true;
          entry.value = value;
          return value;
        },
        () => {
          entries.delete(key);
          return null;
        },
      );
    entries.set(key, entry);
    return entry.promise;
  }

  /** The settled result, or undefined while the photo is unrequested or in flight. */
  function peek(query: CountryImageQuery): CountryImage | null | undefined {
    const entry = entries.get(countryImageKey(query));
    return entry?.settled ? entry.value : undefined;
  }

  return { load, peek };
}

// The arrow looks fetch up on each call, so it's never invoked detached from window.
const browserCountryImages = createCountryImageCache((input, init) => fetch(input, init));

export const loadCountryImage = browserCountryImages.load;
export const peekCountryImage = browserCountryImages.peek;

/**
 * Mirrors next.config.mjs images.remotePatterns (Next's `*` matches exactly one
 * subdomain label). next/image throws on any other host, so a photo from
 * anywhere else is rendered with `unoptimized` instead.
 */
const NEXT_IMAGE_HOSTS = [/^images\.unsplash\.com$/, /^[^.]+\.wikimedia\.org$/, /^flagcdn\.com$/];

export function isOptimizableImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && NEXT_IMAGE_HOSTS.some((host) => host.test(url.hostname));
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `pnpm exec vitest run src/app/destinations/countryImageCache.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Full suite + types**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: **70 files, 577 tests**; tsc prints nothing.

- [ ] **Step 6: Commit (controller)**

```bash
git add src/app/destinations/countryImageCache.ts src/app/destinations/countryImageCache.test.ts
git commit -m "feat(browse): per-country image cache for lazy photo tiles"
```

---

### Task 2: Carousel scroll math (TDD)

**Files:**
- Create: `src/app/destinations/carouselScroll.ts`
- Test: `src/app/destinations/carouselScroll.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/destinations/carouselScroll.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { carouselEdges, carouselStep, sameEdges } from "./carouselScroll";

describe("carouselEdges", () => {
  it("reports nothing to scroll when the tiles fit, so the arrows stay hidden", () => {
    expect(carouselEdges({ scrollLeft: 0, scrollWidth: 600, clientWidth: 600 })).toEqual({
      canScroll: false,
      atStart: true,
      atEnd: true,
    });
    // Sub-pixel overflow from fractional widths doesn't count.
    expect(carouselEdges({ scrollLeft: 0, scrollWidth: 600.5, clientWidth: 600 }).canScroll).toBe(false);
  });

  it("flags the start and the end with a 1px tolerance", () => {
    const track = { scrollWidth: 1200, clientWidth: 400 };

    expect(carouselEdges({ ...track, scrollLeft: 0 })).toEqual({ canScroll: true, atStart: true, atEnd: false });
    expect(carouselEdges({ ...track, scrollLeft: 300 })).toEqual({ canScroll: true, atStart: false, atEnd: false });
    expect(carouselEdges({ ...track, scrollLeft: 799.4 })).toEqual({ canScroll: true, atStart: false, atEnd: true });
    // Mid-scroll positions compare equal, so a scroll event doesn't re-render the arrows.
    expect(
      sameEdges(carouselEdges({ ...track, scrollLeft: 10 }), carouselEdges({ ...track, scrollLeft: 20 })),
    ).toBe(true);
  });
});

describe("carouselStep", () => {
  it("moves about one viewport of tiles per arrow press, never zero", () => {
    expect(carouselStep(1000)).toBe(900);
    expect(carouselStep(333)).toBe(300);
    expect(carouselStep(0)).toBe(1);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm exec vitest run src/app/destinations/carouselScroll.test.ts`
Expected: FAIL. `./carouselScroll` can't be resolved.

- [ ] **Step 3: Implement**

Create `src/app/destinations/carouselScroll.ts`:

```ts
/** Pure scroll math for TileCarousel's prev/next arrows. */

export type CarouselMetrics = { scrollLeft: number; scrollWidth: number; clientWidth: number };
export type CarouselEdges = { canScroll: boolean; atStart: boolean; atEnd: boolean };

/** Zoomed pages and fractional tile widths leave scrollLeft a hair short of the end. */
const EDGE_TOLERANCE_PX = 1;

export function carouselEdges({ scrollLeft, scrollWidth, clientWidth }: CarouselMetrics): CarouselEdges {
  const maxScroll = scrollWidth - clientWidth;
  if (maxScroll <= EDGE_TOLERANCE_PX) return { canScroll: false, atStart: true, atEnd: true };

  return {
    canScroll: true,
    atStart: scrollLeft <= EDGE_TOLERANCE_PX,
    atEnd: scrollLeft >= maxScroll - EDGE_TOLERANCE_PX,
  };
}

export function sameEdges(a: CarouselEdges, b: CarouselEdges): boolean {
  return a.canScroll === b.canScroll && a.atStart === b.atStart && a.atEnd === b.atEnd;
}

/** One arrow press moves about a viewport of tiles; scroll-snap then lands on a tile edge. */
export function carouselStep(clientWidth: number): number {
  return Math.max(1, Math.round(clientWidth * 0.9));
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `pnpm exec vitest run src/app/destinations/carouselScroll.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Full suite + types**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: **71 files, 580 tests**; tsc clean.

- [ ] **Step 6: Commit (controller)**

```bash
git add src/app/destinations/carouselScroll.ts src/app/destinations/carouselScroll.test.ts
git commit -m "feat(browse): pure edge/step math for carousel arrows"
```

---

### Task 3: Lazy photo hook + PhotoTile

These are unused until Task 7, so nothing on screen changes yet.

**Files:**
- Create: `src/app/destinations/useLazyCountryImage.ts`, `src/app/destinations/PhotoTile.tsx`
- Test: `src/app/destinations/browseComponents.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/destinations/browseComponents.test.ts` with **only** the header and the `describe("PhotoTile", …)` block from the final file below. Tasks 4 and 5 append the `TileCarousel` and `CountryRow` blocks. The header and `read()` helper:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function read(file: string) {
  return readFileSync(join(process.cwd(), "src/app/destinations", file), "utf8");
}
```

Then the PhotoTile block:

```ts
describe("PhotoTile", () => {
  it("is a fixed-size link with a brand-gradient placeholder, scrim, flag and caption", () => {
    const source = read("PhotoTile.tsx");

    expect(source).toContain('"use client"');
    // The gradient, the photo and the skeleton share one box: fixed width + aspect ratio.
    expect(source).toContain('trending: "w-[150px] aspect-[15/11] sm:w-[176px] lg:w-[208px]"');
    expect(source).toContain('rail: "w-[100px] aspect-[10/7] sm:w-[128px] lg:w-[152px]"');
    expect(source).toContain("bg-gradient-to-br from-brandBlue via-[#0E86C0] to-brandTeal");
    expect(source).toContain("bg-gradient-to-t from-brandInk/85");
    // f147: country-specific flag alt text. Regional/global bundles without a flag get Globe2.
    expect(source).toContain("alt={`${country} flag`}");
    expect(source).toContain("<Globe2");
    // The photo is decorative (the name is text) and sized to the tile, not the 1920px original.
    expect(source).toContain('alt=""');
    expect(source).toContain('trending: "(min-width: 1024px) 208px, (min-width: 640px) 176px, 150px"');
    expect(source).toContain('rail: "(min-width: 1024px) 152px, (min-width: 640px) 128px, 100px"');
    expect(source).toContain("unoptimized={!isOptimizableImageUrl(photoUrl)}");
    // A broken photo falls back to the gradient.
    expect(source).toContain("onError={() => setFailedUrl(photoUrl)}");
    // Token colors only (#0E86C0 is the documented gradient stop).
    expect(source).not.toMatch(/#(?!0E86C0)[0-9a-fA-F]{3,6}\b/);
    expect(source).not.toContain("text-white");
    expect(source).not.toContain("fetch(");
  });

  it("requests its photo only when the tile nears the viewport, through the shared cache", () => {
    const source = read("useLazyCountryImage.ts");

    expect(source).toContain('export const TILE_IMAGE_ROOT_MARGIN = "200px";');
    expect(source).toContain("new IntersectionObserver(");
    expect(source).toContain("{ rootMargin: TILE_IMAGE_ROOT_MARGIN }");
    expect(source).toContain("observer.disconnect();");
    expect(source).toContain("peekCountryImage(");
    expect(source).toContain("loadCountryImage(");
    expect(source).not.toContain("fetch(");
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm exec vitest run src/app/destinations/browseComponents.test.ts`
Expected: FAIL with `ENOENT … PhotoTile.tsx` and `ENOENT … useLazyCountryImage.ts`.

- [ ] **Step 3: Implement the hook**

Create `src/app/destinations/useLazyCountryImage.ts`:

```ts
import { useEffect, useState, type RefObject } from "react";
import { loadCountryImage, peekCountryImage, type CountryImage } from "./countryImageCache";

/** Start a tile's photo request this far before it reaches the viewport. */
export const TILE_IMAGE_ROOT_MARGIN = "200px";

/**
 * The tile's country photo, requested only once the tile comes within
 * TILE_IMAGE_ROOT_MARGIN of the viewport. Null means "show the gradient":
 * not requested yet, still loading, or there's no photo for this country.
 *
 * The root is the viewport, and a carousel's overflow clips its tiles, so
 * tiles scrolled out of a rail don't count as visible: they load as they're
 * swiped or arrowed in, not all at once.
 */
export function useLazyCountryImage(
  ref: RefObject<HTMLElement | null>,
  slug: string,
  country: string,
): CountryImage | null {
  const [image, setImage] = useState<CountryImage | null>(
    () => peekCountryImage({ slug, country }) ?? null,
  );

  useEffect(() => {
    const query = { slug, country };
    const cached = peekCountryImage(query);
    if (cached !== undefined) {
      setImage(cached);
      return;
    }
    setImage(null);

    const node = ref.current;
    if (!node) return;

    let active = true;
    const start = () => {
      void loadCountryImage(query).then((result) => {
        if (active) setImage(result);
      });
    };

    if (typeof IntersectionObserver === "undefined") {
      start();
      return () => {
        active = false;
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        start();
      },
      { rootMargin: TILE_IMAGE_ROOT_MARGIN },
    );
    observer.observe(node);

    return () => {
      active = false;
      observer.disconnect();
    };
  }, [ref, slug, country]);

  return image;
}
```

(No `"use client"` is needed. It's a hook module that's only imported from client components.)

- [ ] **Step 4: Implement the tile**

Create `src/app/destinations/PhotoTile.tsx`:

```tsx
"use client";

import { Globe2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { isOptimizableImageUrl } from "./countryImageCache";
import { useLazyCountryImage } from "./useLazyCountryImage";

export type PhotoTileSize = "trending" | "rail";

/**
 * Fixed width and aspect ratio per size. The gradient placeholder, the photo
 * and BrowseSkeleton's placeholders all use this box, so nothing shifts when a
 * photo arrives (or never does). Phone sizes follow the app: about 150x110 for
 * Trending and 100x70 for rails.
 */
export const PHOTO_TILE_BOX: Record<PhotoTileSize, string> = {
  trending: "w-[150px] aspect-[15/11] sm:w-[176px] lg:w-[208px]",
  rail: "w-[100px] aspect-[10/7] sm:w-[128px] lg:w-[152px]",
};

/**
 * The tile's rendered width per breakpoint. The backend's photos are 1920px
 * Wikimedia files; this keeps next/image on its small variants.
 */
const PHOTO_TILE_SIZES: Record<PhotoTileSize, string> = {
  trending: "(min-width: 1024px) 208px, (min-width: 640px) 176px, 150px",
  rail: "(min-width: 1024px) 152px, (min-width: 640px) 128px, 100px",
};

type PhotoTileProps = {
  href: string;
  country: string;
  /** Destination slug, used as the /bff/country-image lookup key. */
  countryCode: string;
  flagUri: string;
  /** "3 GB · 7 days · from €4.00" (Trending) or "from €4.00" (rails). */
  detail: string;
  size: PhotoTileSize;
};

/** A country photo card for the browse carousels. The photo loads lazily (useLazyCountryImage). */
export function PhotoTile({ href, country, countryCode, flagUri, detail, size }: PhotoTileProps) {
  const tileRef = useRef<HTMLAnchorElement>(null);
  const image = useLazyCountryImage(tileRef, countryCode, country);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const photoUrl = image && image.imageUrl !== failedUrl ? image.imageUrl : null;
  const trending = size === "trending";
  const badge = trending ? "h-6 w-6" : "h-4 w-4 sm:h-5 sm:w-5";

  return (
    <Link
      className={`group relative block overflow-hidden rounded-[16px] bg-gradient-to-br from-brandBlue via-[#0E86C0] to-brandTeal shadow-brandCard focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brandBlue ${PHOTO_TILE_BOX[size]}`}
      href={href}
      ref={tileRef}
    >
      {photoUrl ? (
        <Image
          alt=""
          className={`object-cover motion-safe:transition motion-safe:duration-300 motion-safe:group-hover:scale-[1.04] ${
            loadedUrl === photoUrl ? "opacity-100" : "opacity-0"
          }`}
          fill
          onError={() => setFailedUrl(photoUrl)}
          onLoad={() => setLoadedUrl(photoUrl)}
          sizes={PHOTO_TILE_SIZES[size]}
          src={photoUrl}
          unoptimized={!isOptimizableImageUrl(photoUrl)}
        />
      ) : null}

      {/* Bottom scrim: keeps the caption readable over any photo, and over the gradient. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-brandInk/85 via-brandInk/25 to-transparent"
      />

      {flagUri ? (
        <img
          alt={`${country} flag`}
          className={`absolute left-2 top-2 rounded-full border border-surface/80 object-cover ${badge}`}
          decoding="async"
          loading="lazy"
          src={flagUri}
        />
      ) : (
        <span
          className={`absolute left-2 top-2 grid place-items-center rounded-full bg-surface/90 text-brandBlue ${badge}`}
        >
          <Globe2 aria-hidden="true" size={trending ? 14 : 11} />
        </span>
      )}

      <span className="absolute inset-x-2 bottom-2 text-surface">
        <span className="block truncate font-display text-[13px] font-black leading-4 sm:text-sm sm:leading-5">
          {country}
        </span>
        <span
          className={`mt-0.5 block text-[11px] font-semibold leading-[14px] text-surface/85 ${
            trending ? "line-clamp-2" : "truncate"
          }`}
        >
          {detail}
        </span>
      </span>
    </Link>
  );
}
```

Notes for the implementer (don't change these):
- The flag `alt={`${country} flag`}` is f147's country-specific alt text, and `landing.test.ts` follows it here in Task 7. The photo is `alt=""`: the country name is real text in the same link.
- `ref` on `next/link` reaches the `<a>` (Next 15 Link forwards refs).
- The flag stays a plain `<img>`, like everywhere else in browse. It's tiny, and flag hosts aren't all in `remotePatterns`.

- [ ] **Step 5: Run it and watch it pass**

Run: `pnpm exec vitest run src/app/destinations/browseComponents.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 6: Full suite + types**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: **72 files, 582 tests**; tsc clean.

- [ ] **Step 7: Commit (controller)**

```bash
git add src/app/destinations/useLazyCountryImage.ts src/app/destinations/PhotoTile.tsx src/app/destinations/browseComponents.test.ts
git commit -m "feat(browse): PhotoTile with viewport-lazy country photo"
```

---

### Task 4: TileCarousel

**Files:**
- Create: `src/app/destinations/TileCarousel.tsx`
- Test: `src/app/destinations/browseComponents.test.ts` (append)

- [ ] **Step 1: Write the failing test**

Append to `src/app/destinations/browseComponents.test.ts`:

```ts
describe("TileCarousel", () => {
  it("is a snap-scrolling list that can't widen the page, with lg+ arrow buttons", () => {
    const source = read("TileCarousel.tsx");

    expect(source).toContain('"use client"');
    // f209: contain:inline-size so the unwrapped track can't widen its parent.
    expect(source).toContain('className="mt-8 min-w-0 [contain:inline-size]"');
    // f195: the scroller is positioned, so absolute children can't escape it.
    expect(source).toContain("`relative mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto");
    // Smooth only without prefers-reduced-motion; scrollBy never forces smooth.
    expect(source).toContain("motion-safe:scroll-smooth");
    expect(source).not.toContain('behavior: "smooth"');
    expect(source).toContain("aria-label={label}");
    expect(source).toContain("aria-label={`Scroll ${label} back`}");
    expect(source).toContain("aria-label={`Scroll ${label} forward`}");
    expect(source).toContain("disabled={edges.atStart}");
    expect(source).toContain("disabled={edges.atEnd}");
    expect(source).toContain("hidden items-center gap-2 lg:flex");
    expect(source).toContain("carouselStep(track.clientWidth)");
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm exec vitest run src/app/destinations/browseComponents.test.ts`
Expected: FAIL with `ENOENT … TileCarousel.tsx`. The other 2 still pass.

- [ ] **Step 3: Implement**

Create `src/app/destinations/TileCarousel.tsx`:

```tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { carouselEdges, carouselStep, sameEdges, type CarouselEdges } from "./carouselScroll";

/**
 * Below lg the track bleeds to the screen edge (cancelling DestinationBrowse's
 * px-5 / md:px-8 gutter), so tiles swipe in from the edge like the app. The
 * matching scroll padding keeps a snapped tile aligned with the gutter.
 */
const TRACK_GUTTER = "-mx-5 px-5 scroll-px-5 md:-mx-8 md:px-8 md:scroll-px-8 lg:mx-0 lg:px-0 lg:scroll-px-0";

const ARROW_BUTTON =
  "grid h-11 w-11 place-items-center rounded-full border border-outline bg-surface text-brandBlue shadow-brandCard transition hover:border-brandBlue/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brandBlue disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none";

type TileCarouselProps = {
  /** Accessible name for the list and its arrows, e.g. "Popular destinations". */
  label: string;
  heading: ReactNode;
  /** Extra controls before the arrows (Trending's sort). */
  controls?: ReactNode;
  /** Changing it scrolls back to the first tile (Trending re-sorted). */
  resetKey?: string;
  /** `<li>` items. */
  children: ReactNode;
};

/**
 * A horizontal scroll-snap row: swipe on touch, prev/next arrows at lg+.
 * The wrapper's contain:inline-size stops the unwrapped track from widening
 * its parent (f209), and the track is `relative` so no absolute child escapes
 * it (f195). Either would let phones pan the whole page sideways.
 */
export function TileCarousel({ label, heading, controls, resetKey, children }: TileCarouselProps) {
  const trackId = useId();
  const trackRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState<CarouselEdges>({ canScroll: false, atStart: true, atEnd: true });

  const updateEdges = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const next = carouselEdges(track);
    setEdges((previous) => (sameEdges(previous, next) ? previous : next));
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    track.addEventListener("scroll", updateEdges, { passive: true });
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateEdges);
    resizeObserver?.observe(track);

    return () => {
      track.removeEventListener("scroll", updateEdges);
      resizeObserver?.disconnect();
    };
  }, [updateEdges]);

  useEffect(() => {
    trackRef.current?.scrollTo({ left: 0 });
    updateEdges();
  }, [resetKey, updateEdges]);

  function scrollByPage(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    // No behavior option: the track's motion-safe:scroll-smooth decides, so
    // prefers-reduced-motion gets an instant jump.
    track.scrollBy({ left: direction * carouselStep(track.clientWidth) });
  }

  return (
    <div className="mt-8 min-w-0 [contain:inline-size]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">{heading}</div>

        <div className={controls ? "flex items-center gap-2" : "hidden items-center gap-2 lg:flex"}>
          {controls}
          {/* Always laid out at lg+ (invisible when everything fits), so the header never changes height. */}
          <div className={`hidden items-center gap-2 lg:flex ${edges.canScroll ? "" : "lg:invisible"}`}>
            <button
              aria-controls={trackId}
              aria-label={`Scroll ${label} back`}
              className={ARROW_BUTTON}
              disabled={edges.atStart}
              onClick={() => scrollByPage(-1)}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={18} />
            </button>
            <button
              aria-controls={trackId}
              aria-label={`Scroll ${label} forward`}
              className={ARROW_BUTTON}
              disabled={edges.atEnd}
              onClick={() => scrollByPage(1)}
              type="button"
            >
              <ChevronRight aria-hidden="true" size={18} />
            </button>
          </div>
        </div>
      </div>

      <ul
        aria-label={label}
        className={`relative mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto py-1 [scrollbar-width:none] motion-safe:scroll-smooth [&::-webkit-scrollbar]:hidden ${TRACK_GUTTER}`}
        id={trackId}
        ref={trackRef}
      >
        {children}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `pnpm exec vitest run src/app/destinations/browseComponents.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Full suite + types**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: **72 files, 583 tests**; tsc clean.

- [ ] **Step 6: Commit (controller)**

```bash
git add src/app/destinations/TileCarousel.tsx src/app/destinations/browseComponents.test.ts
git commit -m "feat(browse): scroll-snap TileCarousel with lg+ arrows"
```

---

### Task 5: CountryRow

**Files:**
- Create: `src/app/destinations/CountryRow.tsx`
- Test: `src/app/destinations/browseComponents.test.ts` (append)

- [ ] **Step 1: Write the failing test**

Append to `src/app/destinations/browseComponents.test.ts`:

```ts
describe("CountryRow", () => {
  it("is a compact flag + name + from-price card with a chevron", () => {
    const source = read("CountryRow.tsx");

    expect(source).toContain("alt={`${country} flag`}");
    expect(source).toContain("<Globe2");
    expect(source).toContain("from {fromPrice}");
    expect(source).toContain('{planCount === 1 ? "plan" : "plans"}');
    expect(source).toContain("<ChevronRight");
    expect(source).toContain("min-h-[60px]");
    expect(source).not.toContain("fetch(");
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm exec vitest run src/app/destinations/browseComponents.test.ts`
Expected: FAIL with `ENOENT … CountryRow.tsx`.

- [ ] **Step 3: Implement**

Create `src/app/destinations/CountryRow.tsx`:

```tsx
import { ChevronRight, Globe2 } from "lucide-react";
import Link from "next/link";

type CountryRowProps = {
  href: string;
  country: string;
  flagUri: string;
  planCount: number;
  /** Cheapest plan's display price (toCountryOptions). */
  fromPrice: string;
};

/** Compact "All destinations" card: flag, name and plan count, from-price, chevron. */
export function CountryRow({ href, country, flagUri, planCount, fromPrice }: CountryRowProps) {
  return (
    <Link
      className="group flex min-h-[60px] items-center gap-3 rounded-[16px] border border-outline/70 bg-surface px-3.5 py-2.5 transition hover:border-brandBlue/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brandBlue"
      href={href}
    >
      {flagUri ? (
        <img
          alt={`${country} flag`}
          className="h-9 w-9 shrink-0 rounded-full border border-outline object-cover"
          decoding="async"
          loading="lazy"
          src={flagUri}
        />
      ) : (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brandBlue/10 text-brandBlue">
          <Globe2 aria-hidden="true" size={16} />
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-black text-brandInk">{country}</span>
        <span className="block text-xs font-semibold text-onSurfaceVariant">
          {planCount} {planCount === 1 ? "plan" : "plans"}
        </span>
      </span>

      <span className="shrink-0 text-xs font-black text-brandBlue">from {fromPrice}</span>
      <ChevronRight
        aria-hidden="true"
        className="shrink-0 text-onSurfaceVariant transition group-hover:text-brandBlue"
        size={16}
      />
    </Link>
  );
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `pnpm exec vitest run src/app/destinations/browseComponents.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Full suite + types**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: **72 files, 584 tests**; tsc clean.

- [ ] **Step 6: Commit (controller)**

```bash
git add src/app/destinations/CountryRow.tsx src/app/destinations/browseComponents.test.ts
git commit -m "feat(browse): compact CountryRow card for All destinations"
```

---

### Task 6: Move `toCountryOptions` out; from-price = cheapest plan (TDD)

This is logic only. `fromPrice` isn't rendered until Task 8, so the page doesn't change.

**Files:**
- Create: `src/app/destinations/browseCountries.ts`
- Test: `src/app/destinations/browseCountries.test.ts`
- Modify: `src/app/destinations/DestinationBrowse.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/app/destinations/browseCountries.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { HeroPackageOption } from "@/services/packages";
import { toCountryOptions } from "./browseCountries";

function plan(
  overrides: Partial<HeroPackageOption> & Pick<HeroPackageOption, "id" | "country" | "countryCode">,
): HeroPackageOption {
  return {
    kind: "package",
    flagUri: "",
    dataLabel: "1 GB",
    durationLabel: "7 days",
    title: "1 GB - 7 days",
    price: "€5.00",
    priceNumeric: 5,
    dataNumericGb: 1,
    durationDays: 7,
    filters: ["local"],
    query: "",
    ...overrides,
  };
}

const ASIA = {
  country: "Asia",
  countryCode: "asia",
  filters: ["regional"],
  countries: [{ countryCode: "JP", title: "Japan" }],
};

describe("toCountryOptions", () => {
  it("merges local plans and regional coverage into one option per destination, sorted by name", () => {
    const options = toCountryOptions([
      plan({ id: "jp-1", country: "Japan", countryCode: "japan", flagUri: "https://flagcdn.com/w80/jp.png" }),
      plan({ id: "asia-1", ...ASIA }),
    ]);

    expect(options.map((option) => [option.country, option.countryCode, option.planCount])).toEqual([
      ["Asia", "asia", 1],
      ["Japan", "japan", 2],
    ]);
    expect(options[1].flagUri).toBe("https://flagcdn.com/w80/jp.png");
  });

  it("shows the cheapest plan as the from-price, including covering regional bundles", () => {
    const localOnly = toCountryOptions([
      plan({ id: "jp-big", country: "Japan", countryCode: "japan", price: "€12.00", priceNumeric: 12 }),
      plan({ id: "jp-small", country: "Japan", countryCode: "japan", price: "€4.50", priceNumeric: 4.5 }),
    ]);
    expect(localOnly[0].fromPrice).toBe("€4.50");

    const withRegional = toCountryOptions([
      plan({ id: "jp-small", country: "Japan", countryCode: "japan", price: "€4.50", priceNumeric: 4.5 }),
      plan({ id: "asia-1", ...ASIA, price: "€3.00", priceNumeric: 3 }),
    ]);
    expect(withRegional.find((option) => option.countryCode === "japan")?.fromPrice).toBe("€3.00");
    expect(withRegional.find((option) => option.countryCode === "asia")?.fromPrice).toBe("€3.00");
  });

  it("ignores unparseable prices unless a destination has nothing else", () => {
    const options = toCountryOptions([
      plan({ id: "it-1", country: "Italy", countryCode: "italy", price: "View plan", priceNumeric: 0 }),
      plan({ id: "it-2", country: "Italy", countryCode: "italy", price: "€6.00", priceNumeric: 6 }),
      plan({ id: "es-1", country: "Spain", countryCode: "spain", price: "View plan", priceNumeric: 0 }),
    ]);

    expect(options.map((option) => option.fromPrice)).toEqual(["€6.00", "View plan"]);
  });

  it("is the only copy: DestinationBrowse imports it", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/destinations/DestinationBrowse.tsx"),
      "utf8",
    );

    expect(source).toContain('import { toCountryOptions } from "./browseCountries";');
    expect(source).not.toContain("function toCountryOptions");
    expect(source).not.toContain("function normalizeCountryCode");
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm exec vitest run src/app/destinations/browseCountries.test.ts`
Expected: FAIL. `./browseCountries` can't be resolved.

- [ ] **Step 3: Implement**

Create `src/app/destinations/browseCountries.ts`. The `destinations` building and the `planCount`/`flagUri` merge are byte-for-byte the old `DestinationBrowse` logic; only the `lowestPrice` tracking is new:

```ts
import { coveredDestinationsForOption, type HeroPackageOption } from "@/services/packages";

export type BrowseCountryOption = {
  country: string;
  countryCode: string;
  flagUri: string;
  planCount: number;
  /** Display price of the cheapest plan: local, or a regional/global bundle that covers it. */
  fromPrice: string;
};

function normalizeCountryCode(value: string) {
  return value.trim().toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
}

/**
 * One option per destination, sorted by name: every local plan's country,
 * plus every country a regional or global bundle covers (f115). Feeds the
 * All destinations grid and the Help Me Choose wizard.
 */
export function toCountryOptions(packages: readonly HeroPackageOption[]): BrowseCountryOption[] {
  const byCode = new Map<string, BrowseCountryOption>();
  const lowestPrice = new Map<string, number>();

  for (const pkg of packages) {
    const destinations = [
      {
        country: pkg.country,
        countryCode: pkg.countryCode,
        flagUri: pkg.flagUri,
      },
      ...(!pkg.filters.includes("local")
        ? coveredDestinationsForOption(pkg).map((destination) => ({
            country: destination.title,
            countryCode: destination.slug,
            flagUri: "",
          }))
        : []),
    ];

    for (const destination of destinations) {
      const code = normalizeCountryCode(destination.countryCode);
      if (!code || !destination.country.trim()) continue;

      let option = byCode.get(code);
      if (option) {
        option.planCount += 1;
        if (!option.flagUri && destination.flagUri) option.flagUri = destination.flagUri;
      } else {
        option = {
          country: destination.country,
          countryCode: destination.countryCode,
          flagUri: destination.flagUri,
          planCount: 1,
          fromPrice: pkg.price,
        };
        byCode.set(code, option);
      }

      // "from €X" is the cheapest plan, not whichever came first in the
      // catalog. priceNumeric 0 means the price couldn't be parsed ("View plan").
      if (pkg.priceNumeric > 0 && pkg.priceNumeric < (lowestPrice.get(code) ?? Number.POSITIVE_INFINITY)) {
        lowestPrice.set(code, pkg.priceNumeric);
        option.fromPrice = pkg.price;
      }
    }
  }

  return Array.from(byCode.values()).sort((a, b) => a.country.localeCompare(b.country));
}
```

Run: `pnpm exec vitest run src/app/destinations/browseCountries.test.ts`
Expected: 3 pass. `"is the only copy: DestinationBrowse imports it"` still fails. (Test 2 would fail against the old algorithm: it returned `€12.00`, the first plan's price.)

- [ ] **Step 4: Use it in DestinationBrowse**

In `src/app/destinations/DestinationBrowse.tsx`:

1. In the `@/services/packages` import, delete the line `  coveredDestinationsForOption,`. It's now only used by `browseCountries.ts`.
2. Change:
   ```tsx
   import type { WizardResult } from "./HelpMeChooseWizard";
   import { onPlanWizardRequest } from "./planWizardOpener";
   ```
   to:
   ```tsx
   import { toCountryOptions } from "./browseCountries";
   import type { WizardResult } from "./HelpMeChooseWizard";
   import { onPlanWizardRequest } from "./planWizardOpener";
   ```
3. Delete the local `type CountryOption = { … };` block (5 fields, right after `DESTINATIONS_COLLAPSED_COUNT`) and its trailing blank line.
4. Delete `function normalizeCountryCode(value: string) { … }` and its trailing blank line.
5. Delete the whole `function toCountryOptions(packages: readonly HeroPackageOption[]): CountryOption[] { … }`, from its first line through the closing `}` just before `type DestinationBrowseProps = {`, plus the blank line.

Leave `isUnlimitedPlan`, `getPlanValueScore` and both `toCountryOptions(...)` call sites (`allCountries`, `filteredCountries`) unchanged. The wizard's `countries` prop still type-checks: it needs only `country`/`countryCode`/`flagUri`.

- [ ] **Step 5: Run it and watch it pass**

Run: `pnpm exec vitest run src/app/destinations/browseCountries.test.ts src/app/destinations/destinationBrowse-wiring.test.ts`
Expected: PASS (4 + 10).

- [ ] **Step 6: Full suite + types**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: **73 files, 588 tests**; tsc clean.

- [ ] **Step 7: Commit (controller)**

```bash
git add src/app/destinations/browseCountries.ts src/app/destinations/browseCountries.test.ts src/app/destinations/DestinationBrowse.tsx
git commit -m "refactor(browse): extract toCountryOptions; from-price is the cheapest plan"
```

---

### Task 7: Trending + rails become photo-tile carousels; tile-sized skeleton

After this commit, the carousels are live and the All destinations grid still has its old (white card) look. That's a coherent page; Task 8 restyles the grid.

**Files:**
- Create: `src/app/destinations/BrowseSkeleton.tsx`
- Modify: `src/app/destinations/DestinationBrowse.tsx`
- Test: `src/app/destinations/destinationBrowse-wiring.test.ts`, `src/content/landing.test.ts`

- [ ] **Step 1: Write the failing test**

In `src/app/destinations/destinationBrowse-wiring.test.ts`, insert this directly after the `"opens its single wizard on an outside request (hero tune button), only once data has loaded"` test (it ends with `expect(source.match(/<HelpMeChooseWizard\b/g)).toHaveLength(1);` and `});`):

```ts
  it("renders Trending and every rail as lazy PhotoTile carousels, with a tile-sized skeleton", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/destinations/DestinationBrowse.tsx"),
      "utf8",
    );
    const skeleton = readFileSync(
      join(process.cwd(), "src/app/destinations/BrowseSkeleton.tsx"),
      "utf8",
    );

    // Trending + the RAILS map: every scroller goes through TileCarousel (f195/f209 guards live there).
    expect(source.match(/<TileCarousel\b/g)).toHaveLength(2);
    expect(source).not.toContain("overflow-x-auto");
    expect(source).toContain('<li className="shrink-0 snap-start" key={pkg.id}>');
    expect(source).toContain("detail={`${pkg.dataLabel} · ${pkg.durationLabel} · from ${pkg.price}`}");
    expect(source).toContain('size="trending"');
    expect(source).toContain("detail={`from ${pkg.price}`}");
    expect(source).toContain('size="rail"');
    // Trending keeps its sort (re-sorting scrolls back to the first tile) and its count line.
    expect(source).toContain("resetKey={trendingSort}");
    expect(source).toContain('<option value="recommended">Recommended</option>');
    expect(source).toContain("selected by the team");
    for (const label of [
      "Popular destinations",
      "Featured plans",
      "Unlimited data",
      "Long stay (30+ days)",
      "Regional & global bundles",
    ]) {
      expect(source).toContain(`label: "${label}"`);
    }
    // Loading: placeholders in the same carousels and tile boxes (no CLS), hidden from AT.
    expect(source).toContain("<BrowseSkeleton />");
    expect(skeleton).toContain("PHOTO_TILE_BOX.trending");
    expect(skeleton).toContain("PHOTO_TILE_BOX.rail");
    expect(skeleton).toContain('<div aria-hidden="true" inert>');
  });
```

- [ ] **Step 2: Update the flag-alt assertion that follows the markup**

In `src/content/landing.test.ts`, test `"uses descriptive alt text for homepage destination and flag images"`, change:

```ts
    const browseSource = readFileSync("src/app/destinations/DestinationBrowse.tsx", "utf8");

    expect(pageSource).toContain('alt={`${row.country} flag`}');
    expect(browseSource).toContain('alt={`${pkg.country} flag`}');
    expect(browseSource).toContain('alt={`${country.country} flag`}');
```

to:

```ts
    const browseSource = readFileSync("src/app/destinations/DestinationBrowse.tsx", "utf8");
    const photoTileSource = readFileSync("src/app/destinations/PhotoTile.tsx", "utf8");

    expect(pageSource).toContain('alt={`${row.country} flag`}');
    // Trending and rail flags now render inside PhotoTile.
    expect(photoTileSource).toContain('alt={`${country} flag`}');
    expect(browseSource).toContain('alt={`${country.country} flag`}');
```

(This passes both before and after Step 6. Without it, the old `pkg.country` assertion would fail once Step 6 removes the inline Trending/rail cards.)

- [ ] **Step 3: Run it and watch it fail**

Run: `pnpm exec vitest run src/app/destinations/destinationBrowse-wiring.test.ts src/content/landing.test.ts`
Expected: FAIL on the new wiring test only (no `<TileCarousel`).

- [ ] **Step 4: Create the skeleton**

Create `src/app/destinations/BrowseSkeleton.tsx`:

```tsx
import { PHOTO_TILE_BOX } from "./PhotoTile";
import { TileCarousel } from "./TileCarousel";

const TRENDING_PLACEHOLDERS = 6;
const RAIL_PLACEHOLDERS = 8;

/**
 * DestinationBrowse's loading state. It's built from the real TileCarousel
 * and PHOTO_TILE_BOX, so header heights, track gutters and tile boxes match
 * what replaces them (homepage CLS 0, f192). `inert` + aria-hidden mean
 * nothing in it is focusable or announced.
 */
export function BrowseSkeleton() {
  return (
    <div aria-hidden="true" inert>
      <TileCarousel
        controls={<span className="block h-11 w-[184px] rounded-full bg-surfaceBright" />}
        heading={
          <span className="flex h-9 items-center gap-2.5">
            <span className="h-9 w-9 shrink-0 rounded-full bg-surfaceBright" />
            <span className="h-4 w-48 rounded-full bg-surfaceBright" />
          </span>
        }
        label="Trending now"
      >
        {Array.from({ length: TRENDING_PLACEHOLDERS }, (_, index) => (
          <li className="shrink-0" key={index}>
            <span
              className={`block rounded-[16px] bg-surfaceBright motion-safe:animate-pulse ${PHOTO_TILE_BOX.trending}`}
            />
          </li>
        ))}
      </TileCarousel>

      <TileCarousel
        heading={<span className="block h-[22px] w-44 rounded-full bg-surfaceBright" />}
        label="Popular destinations"
      >
        {Array.from({ length: RAIL_PLACEHOLDERS }, (_, index) => (
          <li className="shrink-0" key={index}>
            <span
              className={`block rounded-[16px] bg-surfaceBright motion-safe:animate-pulse ${PHOTO_TILE_BOX.rail}`}
            />
          </li>
        ))}
      </TileCarousel>
    </div>
  );
}
```

- [ ] **Step 5: Imports + loading state**

In `src/app/destinations/DestinationBrowse.tsx`, change:

```tsx
import { toCountryOptions } from "./browseCountries";
import type { WizardResult } from "./HelpMeChooseWizard";
import { onPlanWizardRequest } from "./planWizardOpener";
import { WizardWelcomeIntro } from "./WizardWelcomeIntro";
```

to:

```tsx
import { BrowseSkeleton } from "./BrowseSkeleton";
import { toCountryOptions } from "./browseCountries";
import type { WizardResult } from "./HelpMeChooseWizard";
import { PhotoTile } from "./PhotoTile";
import { onPlanWizardRequest } from "./planWizardOpener";
import { TileCarousel } from "./TileCarousel";
import { WizardWelcomeIntro } from "./WizardWelcomeIntro";
```

Then change:

```tsx
        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div className="h-24 animate-pulse rounded-[18px] border border-outline bg-mist" key={i} />
            ))}
          </div>
        ) : loadError ? (
```

to:

```tsx
        {loading ? (
          <BrowseSkeleton />
        ) : loadError ? (
```

- [ ] **Step 6: Trending + rails**

Replace everything from `            {trendingPackages.length > 0 ? (` through the closing `              );` / `            })}` of `RAILS.map` (the whole old Trending panel and the rails loop, just before `            <div className="mt-10">`) with:

```tsx
            {trendingPackages.length > 0 ? (
              <TileCarousel
                controls={
                  <label className="flex h-11 w-fit items-center gap-2 rounded-full border border-outline bg-surface px-4">
                    <ArrowDownUp aria-hidden="true" className="text-brandBlue" size={14} />
                    <span className="text-xs font-bold text-onSurfaceVariant">Sort</span>
                    <select
                      className="bg-surface text-xs font-black text-brandInk outline-none"
                      onChange={(event) => setTrendingSort(event.target.value as TrendingSortOption)}
                      value={trendingSort}
                    >
                      <option value="recommended">Recommended</option>
                      <option value="price-low">Price: low to high</option>
                      <option value="price-high">Price: high to low</option>
                      <option value="duration">Longest validity</option>
                    </select>
                  </label>
                }
                heading={<TrendingHeading count={trendingPackages.length} />}
                label="Trending now"
                resetKey={trendingSort}
              >
                {trendingPackages.map((pkg) => (
                  <li className="shrink-0 snap-start" key={pkg.id}>
                    <PhotoTile
                      country={pkg.country}
                      countryCode={pkg.countryCode}
                      detail={`${pkg.dataLabel} · ${pkg.durationLabel} · from ${pkg.price}`}
                      flagUri={pkg.flagUri}
                      href={destinationBrowseHref(pkg.countryCode)}
                      size="trending"
                    />
                  </li>
                ))}
              </TileCarousel>
            ) : null}

            {RAILS.map((rail) => {
              const items = groups[rail.id];
              if (items.length === 0) return null;

              return (
                <TileCarousel
                  heading={<h3 className="font-display text-title-sm text-brandInk">{rail.label}</h3>}
                  key={rail.id}
                  label={rail.label}
                >
                  {items.map((pkg) => (
                    <li className="shrink-0 snap-start" key={pkg.id}>
                      <PhotoTile
                        country={pkg.country}
                        countryCode={pkg.countryCode}
                        detail={`from ${pkg.price}`}
                        flagUri={pkg.flagUri}
                        href={destinationBrowseHref(pkg.countryCode)}
                        size="rail"
                      />
                    </li>
                  ))}
                </TileCarousel>
              );
            })}
```

Then append this at the very end of the file, after `DestinationBrowse`'s closing `}`:

```tsx


/** Trending's carousel heading. Exactly h-9 tall, matching BrowseSkeleton's placeholder (no CLS). */
function TrendingHeading({ count }: { count: number }) {
  return (
    <div className="flex h-9 items-center gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-error/10 text-error">
        <Flame aria-hidden="true" size={16} />
      </span>
      <div className="min-w-0">
        <h3 className="text-label-caps uppercase text-onSurfaceVariant">Trending now</h3>
        <p className="truncate text-sm font-black leading-5 text-brandInk">
          {count} plan{count === 1 ? "" : "s"} selected by the team
        </p>
      </div>
    </div>
  );
}
```

The Trending count text, the sort options and their values, the `RAILS` labels and every `href` stay unchanged. The section's `<h2>` is still the only H2; the carousel headings are `<h3>`.

- [ ] **Step 7: Run the tests and watch them pass**

Run: `pnpm exec vitest run src/app/destinations src/content/landing.test.ts src/app/hero-package-search.test.ts`
Expected: all PASS (wiring: 11).

- [ ] **Step 8: Full suite + types**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: **73 files, 589 tests**; tsc clean.

- [ ] **Step 9: Quick look**

Run `pnpm dev`, open `/` at 375px and at 1440px. Check:
- Trending (with its sort) and the 5 rails swipe sideways;
- tiles show gradient → photo;
- arrows appear only at 1440;
- the grid below still renders.

- [ ] **Step 10: Commit (controller)**

```bash
git add src/app/destinations/BrowseSkeleton.tsx src/app/destinations/DestinationBrowse.tsx src/app/destinations/destinationBrowse-wiring.test.ts src/content/landing.test.ts
git commit -m "feat(browse): Trending and rails as lazy photo-tile carousels"
```

---

### Task 8: All destinations as CountryRow cards; header, error and buttons restyled

**Files:**
- Modify: `src/app/destinations/DestinationBrowse.tsx`
- Test: `src/app/destinations/destinationBrowse-wiring.test.ts`, `src/content/landing.test.ts`

- [ ] **Step 1: Write the failing test**

In `src/app/destinations/destinationBrowse-wiring.test.ts`, insert directly after the test added in Task 7:

```ts
  it("lists All destinations as CountryRow cards (1/2/3 columns) and keeps search + Show all/Show less", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/destinations/DestinationBrowse.tsx"),
      "utf8",
    );

    expect(source).toContain('import { CountryRow } from "./CountryRow";');
    expect(source).toContain('<ul className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">');
    expect(source).toContain("fromPrice={country.fromPrice}");
    expect(source).toContain('placeholder="Search all destinations..."');
    expect(source).toContain("DESTINATIONS_COLLAPSED_COUNT = 20");
    expect(source).toContain("Show less");
    expect(source).toContain("Show all {filteredCountries.length} destinations");
    // One gradient primary (Help me choose); Show all and Try again are flat.
    expect(source.match(/variant="flat"/g)).toHaveLength(2);
    expect(source).toContain('import { Button } from "../components/Button";');
    // Tokens only: no retired mist panels or raw white.
    expect(source).not.toContain("bg-mist");
    expect(source).not.toContain("bg-white");
    expect(source).not.toContain("text-white");
  });
```

- [ ] **Step 2: Move the last flag-alt assertion**

In `src/content/landing.test.ts`, change the block from Task 7:

```ts
    const browseSource = readFileSync("src/app/destinations/DestinationBrowse.tsx", "utf8");
    const photoTileSource = readFileSync("src/app/destinations/PhotoTile.tsx", "utf8");

    expect(pageSource).toContain('alt={`${row.country} flag`}');
    // Trending and rail flags now render inside PhotoTile.
    expect(photoTileSource).toContain('alt={`${country} flag`}');
    expect(browseSource).toContain('alt={`${country.country} flag`}');
```

to:

```ts
    const photoTileSource = readFileSync("src/app/destinations/PhotoTile.tsx", "utf8");
    const countryRowSource = readFileSync("src/app/destinations/CountryRow.tsx", "utf8");

    expect(pageSource).toContain('alt={`${row.country} flag`}');
    // Browse flags render inside PhotoTile (Trending, rails) and CountryRow (All destinations).
    expect(photoTileSource).toContain('alt={`${country} flag`}');
    expect(countryRowSource).toContain('alt={`${country} flag`}');
```

- [ ] **Step 3: Run it and watch it fail**

Run: `pnpm exec vitest run src/app/destinations/destinationBrowse-wiring.test.ts src/content/landing.test.ts`
Expected: FAIL on the new wiring test only.

- [ ] **Step 4: Imports**

In `src/app/destinations/DestinationBrowse.tsx`, change:

```tsx
import { ArrowDownUp, ChevronDown, ChevronUp, Flame, Globe2, RefreshCw, Sparkles, WifiOff } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
```

to:

```tsx
import { ArrowDownUp, ChevronDown, ChevronUp, Flame, RefreshCw, Sparkles, WifiOff } from "lucide-react";
import dynamic from "next/dynamic";
```

and change:

```tsx
import { useConsent } from "../ConsentManager";
import { BrowseSkeleton } from "./BrowseSkeleton";
```

to:

```tsx
import { Button } from "../components/Button";
import { useConsent } from "../ConsentManager";
import { BrowseSkeleton } from "./BrowseSkeleton";
import { CountryRow } from "./CountryRow";
```

- [ ] **Step 5: Section header**

Change:

```tsx
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brandBlue">
              Browse destinations
            </p>
            <h2 className="mt-2 font-display text-3xl font-black tracking-[-0.03em] text-brandInk">
              Find your eSIM plan
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brandBlue to-brandTeal px-5 py-3 text-xs font-black uppercase tracking-wide text-white shadow-brandCard transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
              onClick={() => setWizardOpen(true)}
              type="button"
            >
              <Sparkles aria-hidden="true" size={15} />
              Help me choose
            </button>
          </div>
        </div>
```

to:

```tsx
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-label-caps uppercase text-brandBlue">Browse destinations</p>
            <h2 className="mt-1.5 font-display text-display-lg font-black text-brandInk md:text-[32px] md:leading-[38px]">
              Find your eSIM plan
            </h2>
          </div>

          {/* This section's one gradient primary (spec §3). Arrows, Show all and Try again are flat. */}
          <Button
            className="self-start sm:self-auto"
            disabled={loading}
            onClick={() => setWizardOpen(true)}
            type="button"
          >
            <Sparkles aria-hidden="true" size={16} />
            Help me choose
          </Button>
        </div>
```

`disabled={loading}` and `onClick={() => setWizardOpen(true)}` are unchanged (the wiring test and f074 rely on them). `Button` passes `disabled` through to the native button.

- [ ] **Step 6: Error panel**

Change:

```tsx
          <div className="mt-8 flex flex-col items-center gap-3 rounded-[18px] border border-outline bg-mist px-6 py-10 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-outline bg-white text-onSurfaceVariant">
```

to:

```tsx
          <div className="mt-8 flex flex-col items-center gap-3 rounded-[20px] border border-outline/70 bg-surfaceBright px-6 py-10 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-outline bg-surface text-onSurfaceVariant">
```

and change:

```tsx
            <button
              className="mt-1 inline-flex items-center gap-2 rounded-full border border-outline bg-white px-4 py-2 text-xs font-black text-brandInk transition hover:border-brandBlue/50"
              onClick={handleRetry}
              type="button"
            >
              <RefreshCw aria-hidden="true" size={14} />
              Try again
            </button>
```

to:

```tsx
            <Button className="mt-1" onClick={handleRetry} type="button" variant="flat">
              <RefreshCw aria-hidden="true" size={14} />
              Try again
            </Button>
```

- [ ] **Step 7: All destinations**

Replace the whole `            <div className="mt-10">` block, from that line through its closing `            </div>` (just before `          </>` / `        )}`), with:

```tsx
            <div className="mt-10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-display text-title-sm text-brandInk">
                  All destinations ({filteredCountries.length})
                </h3>
                <input
                  aria-label="Search all destinations"
                  className="h-11 w-full rounded-full border border-outline bg-surface px-4 text-sm font-semibold text-onSurface outline-none transition placeholder:text-onSurfaceVariant/70 focus:border-brandBlue sm:max-w-[280px]"
                  onChange={(e) => setGridSearch(e.target.value)}
                  placeholder="Search all destinations..."
                  type="text"
                  value={gridSearch}
                />
              </div>

              {filteredCountries.length === 0 ? (
                <p className="mt-6 text-sm text-onSurfaceVariant">
                  No destinations match these filters.
                </p>
              ) : (
                <>
                  <ul className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleCountries.map((country) => (
                      <li className="min-w-0" key={country.countryCode}>
                        <CountryRow
                          country={country.country}
                          flagUri={country.flagUri}
                          fromPrice={country.fromPrice}
                          href={destinationBrowseHref(country.countryCode)}
                          planCount={country.planCount}
                        />
                      </li>
                    ))}
                  </ul>

                  {hasMoreDestinations || showAllDestinations ? (
                    <div className="mt-5 flex justify-center">
                      <Button
                        onClick={() => setShowAllDestinations((prev) => !prev)}
                        type="button"
                        variant="flat"
                      >
                        {showAllDestinations ? (
                          <>
                            Show less
                            <ChevronUp aria-hidden="true" size={16} />
                          </>
                        ) : (
                          <>
                            Show all {filteredCountries.length} destinations
                            <ChevronDown aria-hidden="true" size={16} />
                          </>
                        )}
                      </Button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
```

The search, the `DESTINATIONS_COLLAPSED_COUNT` collapse, `hasMoreDestinations`, the empty message and the Show all/Show less texts are unchanged. The search input gains `aria-label` (it had only a placeholder) and grows to 44px.

- [ ] **Step 8: Run the tests and watch them pass**

Run: `pnpm exec vitest run src/app/destinations src/content/landing.test.ts src/app/hero-package-search.test.ts src/app/public-shell.test.ts`
Expected: all PASS (wiring: 12).

- [ ] **Step 9: Full suite + types**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: **73 files, 590 tests**; tsc clean. `grep -c "" src/app/destinations/DestinationBrowse.tsx` → about 451 (it was 549).

- [ ] **Step 10: Commit (controller)**

```bash
git add src/app/destinations/DestinationBrowse.tsx src/app/destinations/destinationBrowse-wiring.test.ts src/content/landing.test.ts
git commit -m "feat(browse): CountryRow grid, app type scale and shared buttons"
```

---

### Task 9: Full verification

- [ ] **Step 1: Full test suite + types**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: **73 files, 590 tests** passing (baseline 69 / 569: +8 cache, +3 scroll, +4 components, +4 countries, +2 wiring); tsc clean.

- [ ] **Step 2: Production build**

Run: `pnpm build`
Expected: the build succeeds.
- `/` is still **○ (Static)**. The dry run showed `○ /  7.32 kB  215 kB` with revalidate 1m.
- `/destinations` is still **ƒ**.

If `/` flipped to ƒ, something read request data; fix it before going on.

- [ ] **Step 3: Browser matrix**

Run `pnpm build && pnpm start`, then open `/` and `/destinations`. Use real device emulation, with the tab **in the foreground**: a hidden tab never runs IntersectionObserver callbacks, so it shows zero photo requests. Check at **320, 375, 768, 1024 and 1440px**:

| Width | Check | Expected (dry-run result in brackets) |
|---|---|---|
| all | horizontal scroll | `document.documentElement.scrollWidth === document.documentElement.clientWidth`, and `innerWidth` equals the emulated width (no f195 layout-viewport widening) [true at all 5] |
| 320/375 | tiles | Trending 150×110, rails 100×70, swipeable, snapping to tile starts, first tile aligned with the 20px gutter; the first tile's flag and caption don't overlap [150×110 / 100×70] |
| 768 | tiles | 176×129 / 128×90 [same] |
| 1024/1440 | tiles | 208×153 / 152×106 [same] |
| all | lazy photos | DevTools Network, filter `country-image`. At load only the tiles near the viewport request. Scrolling down requests the next rails. Swiping a rail requests only newly revealed tiles. **Each slug requests once** even if it's in several rails. `performance.getEntriesByType("resource").filter(e => e.name.includes("/bff/country-image")).length` stays well under the tile count [9–24 of 56 tiles after scrolling to the first rail; unique slugs = requests] |
| all | photo bytes | `/_next/image?url=…wikimedia…` with `w=256`/`384` on phones and `640`/`384` at lg; never the 1920px original [measured] |
| all | failure | block `*/bff/country-image*` in DevTools and reload: every tile keeps its gradient, flag (or Globe2 for regional) and caption |
| < 1024 | arrows | none visible [0] |
| 1024/1440 | arrows | back is disabled at the start; forward scrolls about 90% of the track and snaps; back becomes enabled; forward is disabled at the end; Tab reaches both; Enter and Space work; rails that fit show no arrows (layout unchanged) [forward → scrollLeft 788 / 568; back enabled] |
| 1440 | reduced motion | DevTools → Rendering → emulate `prefers-reduced-motion: reduce`: arrow presses jump instantly; no photo fade or hover zoom |
| all | Trending sort | changing the sort reorders the tiles and scrolls the row back to the first tile; focus stays on the select |
| 320/375 | grid | 1 column; 768: 2; 1024+: 3 [1/2/3]. Each row shows flag, name, "N plans", "from €X", chevron. Search filters, and "Show all N destinations" / "Show less" toggles |
| all | header | "Browse destinations" eyebrow, H2 "Find your eSIM plan", gradient "Help me choose" (disabled while loading); it opens exactly one wizard: `document.querySelectorAll('[role="dialog"][aria-modal="true"]').length === 1` |
| all | hero tune | the phase 2 tune button still opens that same single wizard |
| all | error | point `BACKEND_API_URL` at a dead host (or block `/bff/packages*`) and reload: the error panel shows a flat "Try again" that retries |
| 375 | dock | the last tiles and the grid aren't hidden behind the bottom dock when scrolled |

- [ ] **Step 4: Lighthouse (mobile) on `/`**

On the prod build, run Lighthouse mobile on `/` 3 times and take the median. Expected:
- **CLS 0.000**. The dry run measured 0.0000 via a `layout-shift` observer at 412×823 and 1440×900, with the browse section top at 655px, in the viewport.
- **LCP ≤ ~3.58s** (f209: 3.53–3.58s), and the LCP element is still the hero `<img>`. Tile photos start only after hydration, two catalog fetches and an IO callback, and a 150×110 tile is far smaller than the hero card.

If LCP regresses, check in the Performance panel whether `/_next/image` tile requests overlap the hero image download before changing anything, and record it.

---

### Task 10: Knowledge + session log (repo rules)

**Files:**
- Modify: `feedAI/facts.jsonl` (append)
- Modify: `feedAI/topics/ui-components-styling.json`
- Create: `docs/sessions/2026-10-01_web-ui-polish-browse.md`
- Modify: `docs/sessions/INDEX.md`
- Modify: `feedAI/brain.json` (`sync` block, `phase.current`)

- [ ] **Step 1: Append facts**

Check the next free id with `tail -1 feedAI/facts.jsonl | cut -c1-20`. It was `f210` when this plan was written, so use `f211` and `f212` unless something landed in between. Append the two facts below, replacing `<X>`/`<Y>` with the Task 9 Lighthouse results:

```json
{"id": "f211", "date": "2026-10-01", "kind": "decision", "topic": "ui-components-styling", "fact": "Destination browse is the spec's option B (phase 3 of the mobile-parity redesign): Trending (sort kept; re-sorting scrolls back via TileCarousel resetKey) and the 5 RAILS render as TileCarousel scroll-snap rows of PhotoTile (gradient placeholder from-brandBlue via-[#0E86C0] to-brandTeal, lazy photo, brandInk scrim, flag or Globe2, caption 'data · duration · from €X' / 'from €X'). PHOTO_TILE_BOX fixes width+aspect (Trending 150x110 -> 176 sm -> 208 lg, aspect 15/11; rails 100x70 -> 128 -> 152, aspect 10/7) and BrowseSkeleton is built from the same TileCarousel + boxes, so CLS stays 0 (header heights fixed: Trending heading h-9, sort h-11, lg arrows always laid out and only lg:invisible). TileCarousel: wrapper min-w-0 [contain:inline-size] (f209), ul relative (f195), track bleeds to the screen edge below lg (-mx-5 px-5 scroll-px-5, md 8), arrows lg+ only, step round(clientWidth*0.9), motion-safe:scroll-smooth (no behavior:'smooth'). All destinations is CountryRow cards (flag, name, N plans, from €X, chevron) in a 1/2/3-column ul.grid; toCountryOptions moved to browseCountries.ts and fromPrice is now the cheapest positive priceNumeric incl. covering regional bundles (it used to be the first catalog row). Help me choose = Button primary; Show all / Try again = Button flat. Lighthouse mobile /: CLS <X>, LCP <Y>s.", "source": "src/app/destinations/DestinationBrowse.tsx; PhotoTile.tsx; TileCarousel.tsx; CountryRow.tsx; BrowseSkeleton.tsx; browseCountries.ts; destinationBrowse-wiring.test.ts; browseComponents.test.ts"}
{"id": "f212", "date": "2026-10-01", "kind": "invariant", "topic": "ui-components-styling", "fact": "Browse tile photos go only through src/app/destinations/countryImageCache.ts + useLazyCountryImage: IntersectionObserver rootMargin '200px' on the viewport (a rail's overflow clips its tiles, so off-screen tiles load as they are swiped in), then one /bff/country-image?slug=&country= request per slug per page session (module Map holds the in-flight promise; non-2xx / no imageUrl cached as null; network errors evicted for retry), same URL and force-cache as DestinationPlans. Photos render through next/image with exact per-size sizes because the backend's imageUrls are 1920px Wikimedia originals (Japan 926KB direct vs 19KB at w=384); isOptimizableImageUrl() mirrors next.config.mjs remotePatterns (unsplash, *.wikimedia.org one label, flagcdn) and anything else renders unoptimized instead of throwing; countryImageCache.test.ts guards the config strings, so update both together. Verify lazy loading in a foreground tab: hidden tabs never fire IO callbacks.", "source": "src/app/destinations/countryImageCache.ts; src/app/destinations/useLazyCountryImage.ts; src/app/destinations/PhotoTile.tsx; next.config.mjs"}
```

- [ ] **Step 2: Topic + session + index + brain sync**

- In `feedAI/topics/ui-components-styling.json`:
  - add `f211` and `f212` to `facts`;
  - add to `notable_components`: `"src/app/destinations/PhotoTile.tsx + TileCarousel.tsx + countryImageCache.ts": "browse photo-tile carousels; lazy one-request-per-country photos via next/image (f211, f212)"`;
  - add `"src/app/destinations/CountryRow.tsx + browseCountries.ts": "All destinations card; toCountryOptions with cheapest from-price (f211)"`.
- Write `docs/sessions/2026-10-01_web-ui-polish-browse.md` in the same shape as `2026-10-01_web-ui-polish-hero.md` (Goal, What changed, Review findings, Verification, Commits, Next). Include:
  - the test counts;
  - the `/` build line;
  - the Task 9 matrix results (request counts per width) and the Lighthouse runs;
  - the deliberately changed assertions: `landing.test.ts` flag alts `DestinationBrowse` `${pkg.country}` / `${country.country}` → `PhotoTile` / `CountryRow` `${country}`.
- Append a row to `docs/sessions/INDEX.md`:
  `| 2026-10-01 | [Web UI polish: destination browse](./2026-10-01_web-ui-polish-browse.md) | Phase 3: Trending + 5 rails as lazy photo-tile carousels (one country-image request per country, next/image small variants), CountryRow grid with cheapest from-price; <N> tests, CLS <X>. |`
- In `feedAI/brain.json`:
  - set `sync.date` to `2026-10-01`;
  - prepend `f211-f212: phase 3 browse B (PhotoTile/TileCarousel/CountryRow, tile-sized skeleton, cheapest from-price) + lazy country photos via countryImageCache/next/image; next plan = country plans A.` to `sync.note_latest`;
  - update `phase.current` to say phases 1–3 shipped 2026-10-01 (f207–f212), and that the next one is phase 4, country plans A.

- [ ] **Step 3: Validate JSON**

Run: `tail -2 feedAI/facts.jsonl | while read -r l; do echo "$l" | node -e 'JSON.parse(require("fs").readFileSync(0,"utf8"))' && echo ok; done && node -e 'JSON.parse(require("fs").readFileSync("feedAI/brain.json","utf8"));JSON.parse(require("fs").readFileSync("feedAI/topics/ui-components-styling.json","utf8"));console.log("json ok")'`
Expected: `ok`, `ok`, `json ok`.

- [ ] **Step 4: Commit (controller)**

```bash
git add feedAI docs/sessions
git commit -m "docs: feedAI + session log for web UI polish phase 3 (browse)"
```

---

## Verification numbers from the dry run

The dry run applied Tasks 1–8 to a scratch copy, built it, and ran `next start` against the hosted backend with headless Chromium at DPR 2.

| | 320 | 375 | 768 | 1024 | 1440 |
|---|---|---|---|---|---|
| scrollWidth = clientWidth | ✓ | ✓ | ✓ | ✓ | ✓ |
| Trending tile | 150×110 | 150×110 | 176×129 | 208×153 | 208×153 |
| Rail tile | 100×70 | 100×70 | 128×90 | 152×106 | 152×106 |
| country-image requests after scrolling to the first rail (of 56 tiles) | 9 | 12 | 18 | 19 (+2 after one arrow press) | 23 (+1) |
| `_next/image` widths | 384, 256 | 384, 256 | 384, 256 | 640, 384 | 640, 384 |
| visible arrow buttons | 0 | 0 | 0 | 12 | 12 |
| grid columns | 1 | 1 | 2 | 3 | 3 |

- `layout-shift` total: 0.0000 at 412×823 and 1440×900.
- Stage-by-stage `pnpm test` matched every count above, and `tsc` was clean at each stage.

## Next plans (not in this document)

4. Country plans A: `PlanRow` + `planRowTags()`, sidebar, collapsed country bar (also fixes `DestinationPlans.tsx`'s `pt-20` under the capsule). `useCountryHeroImage` could then reuse `countryImageCache`.
5. Checkout B + sign-in
6. Account: desktop sidebar dashboard / phone app layout + order detail
7. Homepage bento blocks
8. Content pages restyle + legal token fix
9. Partner pages on the account shell
