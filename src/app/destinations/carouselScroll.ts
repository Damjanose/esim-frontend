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
