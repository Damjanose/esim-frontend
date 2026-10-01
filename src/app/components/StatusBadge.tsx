import type { LifecycleBadge } from "@/lib/accountEsims";

const TONE_CLASSES: Record<LifecycleBadge["tone"], string> = {
  active: "bg-brandTeal/15 text-brandInk",
  ready: "bg-brandBlue/10 text-brandBlue",
  expired: "bg-outline/40 text-onSurfaceVariant"
};

/** Active / Ready / Expired, straight from lifecycle_status (lifecycleBadge). */
export function StatusBadge({ badge }: { badge: LifecycleBadge }) {
  return (
    <span
      className={`inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[10px] font-black uppercase tracking-[0.06em] ${TONE_CLASSES[badge.tone]}`}
    >
      {badge.label}
    </span>
  );
}
