import { describe, expect, it } from "vitest";
import { validateChartNoteForm } from "./chartNoteForm";

describe("validateChartNoteForm", () => {
  it("accepts a date, a known kind and a trimmed title", () => {
    expect(validateChartNoteForm({ date: "2026-11-27", kind: "release", title: "  New app  " })).toEqual({
      ok: true,
      value: { date: "2026-11-27", kind: "release", title: "New app" }
    });
  });

  it("removes HTML tags from the title", () => {
    const result = validateChartNoteForm({ date: "2026-11-27", kind: "other", title: "<b>Sale</b> <i>day</i>" });
    expect(result.ok && result.value.title).toBe("Sale day");
  });

  it("rejects an empty or too long title", () => {
    const empty = validateChartNoteForm({ date: "2026-11-27", kind: "other", title: "   " });
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.errors.title).toBe("Enter a title of 1 to 80 characters.");
    const long = validateChartNoteForm({ date: "2026-11-27", kind: "other", title: "x".repeat(81) });
    expect(long.ok).toBe(false);
  });

  it("rejects a date that is not real, and an unknown kind", () => {
    const result = validateChartNoteForm({ date: "2026-02-30", kind: "party", title: "Hi" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.date).toBe("Pick a real date.");
      expect(result.errors.kind).toBe("Pick a kind.");
    }
  });
});
