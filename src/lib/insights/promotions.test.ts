import { describe, expect, it } from "vitest";
import { groupPromotionsByKind, promoKindLabel } from "./promotions";
import type { PromotionRow } from "./types";

const row = (promoKind: PromotionRow["promoKind"], promoId: string): PromotionRow => ({
  promoKind,
  promoId,
  label: null,
  views: 0,
  viewers: 0,
  taps: 0,
  tappers: 0,
  tapRate: null,
  buyersWithin7d: 0,
  revenueWithin7d: { byCurrency: {}, unknownCount: 0 },
  salesWithCode: 0,
  revenueWithCode: { byCurrency: {}, unknownCount: 0 }
});

describe("promoKindLabel", () => {
  it("gives a plain name for each kind", () => {
    expect(promoKindLabel("event_modal")).toBe("Event modal");
    expect(promoKindLabel("promo_code")).toBe("Promo code");
    expect(promoKindLabel("notification")).toBe("Notification");
    expect(promoKindLabel("game_reward")).toBe("Game reward");
  });
});

describe("groupPromotionsByKind", () => {
  it("groups in a fixed kind order, keeps the backend order inside a group, and skips empty kinds", () => {
    const groups = groupPromotionsByKind([
      row("notification", "n1"),
      row("promo_code", "SUMMER"),
      row("event_modal", "e1"),
      row("promo_code", "WINTER")
    ]);
    expect(groups.map((g) => g.kind)).toEqual(["event_modal", "promo_code", "notification"]);
    expect(groups[1].rows.map((r) => r.promoId)).toEqual(["SUMMER", "WINTER"]);
    expect(groups[1].label).toBe("Promo code");
  });

  it("returns nothing for no rows", () => {
    expect(groupPromotionsByKind([])).toEqual([]);
  });
});
