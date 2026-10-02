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
