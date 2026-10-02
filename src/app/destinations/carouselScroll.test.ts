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
