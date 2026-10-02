import type { PlanDocument } from "./types";

/**
 * What TripPlanDocument draws, already formatted. The real plan and the fixed
 * sample both go through this shape so they share one layout. Ported from
 * velocity-eSim's tripPlanDocView.ts, which mirrors the backend PDF's lines.
 */
export type DocView = {
  title: string;
  /** Muted lines under the cover title: subtitle, stay, style. */
  coverLines: string[];
  glance: Array<{ day: string; theme: string; highlight: string }>;
  logistics?: string;
  transit?: string;
  tips: string[];
  days: Array<{
    heading: string;
    title: string;
    /** Occasion days use the accent band, as in the PDF. */
    accent: boolean;
    blocks: Array<{ time: string; place: string; details: string; highlight: boolean }>;
  }>;
  notes: Array<{ label: string; text: string }>;
  locked: boolean;
};

function daysCount(count: number): string {
  return count === 1 ? "1 day" : `${count} days`;
}

export function toDocView(doc: PlanDocument): DocView {
  const days = doc.days ?? [];
  const first = days[0]?.date;
  const last = days[days.length - 1]?.date;
  const range = first && last && first !== last ? `${first} – ${last}` : first ?? "";
  const subtitle = [doc.subtitle, range, daysCount(days.length)].filter(Boolean).join("  •  ");
  const stay = [doc.accommodation ?? doc.base, doc.occasion].filter(Boolean).join("  |  ");
  const l = doc.logistics;
  const logistics = l
    ? [
        l.arrival ? `Arrival: ${l.arrival}` : "",
        l.departure ? `Departure: ${l.departure}` : "",
        l.base ? `Base: ${l.base}` : ""
      ]
        .filter(Boolean)
        .join("   |   ")
    : "";
  const locked = doc.locked === true;

  return {
    title: doc.title,
    coverLines: [subtitle, stay, doc.style ?? ""].filter(Boolean),
    glance: days.map((day, index) => ({
      day: `${[day.weekday, day.date].filter(Boolean).join(" · ") || `Day ${index + 1}`}${day.occasion ? " *" : ""}`,
      theme: day.theme ?? day.title,
      highlight: day.highlight ?? ""
    })),
    logistics: logistics || undefined,
    transit: l?.nearestTransit || undefined,
    tips: doc.transportTips ?? [],
    // The locked cut carries stops for day 1 only; empty day bands would read as broken.
    days: days
      .map((day, index) => ({ day, index }))
      .filter(({ day }) => !locked || (day.blocks ?? []).length > 0)
      .map(({ day, index }) => {
        const head = [`Day ${index + 1}`, day.weekday, day.date].filter(Boolean).join(" · ");
        return {
          heading: day.occasion ? `${head} — ${day.occasion}` : head,
          title: day.title,
          accent: Boolean(day.occasion),
          blocks: (day.blocks ?? []).map((block) => ({
            time: block.start ?? "",
            place: block.place,
            details: block.details,
            highlight: block.highlight === true
          }))
        };
      }),
    notes: doc.notes ?? [],
    locked
  };
}
