import { describe, expect, it } from "vitest";
import { visibleTestimonials } from "@/lib/testimonials";

describe("visibleTestimonials", () => {
  it("omits the homepage section when there is nothing approved", () => {
    expect(visibleTestimonials(undefined)).toEqual([]);
    expect(visibleTestimonials([])).toEqual([]);
  });

  it("keeps a real quote", () => {
    expect(
      visibleTestimonials([
        {
          displayName: "Ada",
          rating: 5,
          body: "Setup was fast and the data worked on arrival.",
          locale: "en",
          createdAt: "2026-09-23T09:00:00.000Z"
        }
      ])
    ).toHaveLength(1);
  });
});
