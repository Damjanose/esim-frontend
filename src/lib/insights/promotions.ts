import type { PromotionRow } from "./types";

type PromoKind = PromotionRow["promoKind"];

/** The order the kinds are shown in. */
const KIND_ORDER: PromoKind[] = ["event_modal", "promo_code", "notification", "game_reward"];

const KIND_LABELS: Record<PromoKind, string> = {
  event_modal: "Event modal",
  promo_code: "Promo code",
  notification: "Notification",
  game_reward: "Game reward"
};

export function promoKindLabel(kind: PromoKind): string {
  return KIND_LABELS[kind];
}

/** Rows grouped by kind in a fixed order. Empty kinds are left out. Rows keep the backend order. */
export function groupPromotionsByKind(rows: PromotionRow[]): { kind: PromoKind; label: string; rows: PromotionRow[] }[] {
  return KIND_ORDER.flatMap((kind) => {
    const group = rows.filter((row) => row.promoKind === kind);
    return group.length > 0 ? [{ kind, label: promoKindLabel(kind), rows: group }] : [];
  });
}
