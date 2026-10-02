import { describe, expect, it } from "vitest";
import { toDocView } from "./docView";
import type { PlanDocument } from "./types";

const doc: PlanDocument = {
  title: "Tirana",
  subtitle: "Walking days",
  base: "Blloku",
  logistics: { arrival: "TIA", base: "Blloku", nearestTransit: "Bus 2 min" },
  transportTips: ["Walk"],
  notes: [{ label: "Cash", text: "Carry lek" }],
  days: [
    {
      date: "14 Jun",
      weekday: "Sat",
      title: "Centre",
      theme: "Old town",
      blocks: [{ start: "09:00", place: "Square", details: "Start", highlight: true }]
    },
    { date: "15 Jun", title: "Dajti", occasion: "Birthday", blocks: [{ place: "Cable car", details: "" }] }
  ]
};

describe("toDocView", () => {
  it("builds the PDF's cover, logistics, glance and day lines", () => {
    const view = toDocView(doc);
    expect(view.coverLines[0]).toBe("Walking days  •  14 Jun – 15 Jun  •  2 days");
    expect(view.coverLines[1]).toBe("Blloku");
    expect(view.logistics).toBe("Arrival: TIA   |   Base: Blloku");
    expect(view.transit).toBe("Bus 2 min");
    expect(view.glance[0]).toEqual({ day: "Sat · 14 Jun", theme: "Old town", highlight: "" });
    expect(view.glance[1].day).toBe("15 Jun *");
    expect(view.glance[1].theme).toBe("Dajti");
    expect(view.days).toHaveLength(2);
    expect(view.days[1].accent).toBe(true);
    expect(view.days[1].heading).toBe("Day 2 · 15 Jun — Birthday");
    expect(view.days[0].blocks[0]).toEqual({ time: "09:00", place: "Square", details: "Start", highlight: true });
    expect(view.days[1].blocks[0].time).toBe("");
    expect(view.locked).toBe(false);
  });

  it("drops empty day bands from the locked cut but keeps the glance table", () => {
    const view = toDocView({
      ...doc,
      locked: true,
      transportTips: [],
      notes: [],
      days: [doc.days[0], { ...doc.days[1], blocks: [] }]
    });
    expect(view.locked).toBe(true);
    expect(view.days).toHaveLength(1);
    expect(view.glance).toHaveLength(2);
  });

  it("keeps the real day number when an earlier locked day is dropped", () => {
    const view = toDocView({ ...doc, locked: true, days: [{ ...doc.days[0], blocks: [] }, doc.days[1]] });
    expect(view.days).toHaveLength(1);
    expect(view.days[0].heading.startsWith("Day 2")).toBe(true);
  });

  it("says 1 day in the singular", () => {
    expect(toDocView({ ...doc, subtitle: undefined, days: [doc.days[0]] }).coverLines[0]).toBe("14 Jun  •  1 day");
  });
});
