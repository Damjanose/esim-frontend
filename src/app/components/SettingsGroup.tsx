import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * The app's grouped settings list (velocity-eSim ProfileGroup): a small caps label,
 * then one white card whose rows are split by hairlines. Used by /profile now and the
 * partner pages on phones (spec section 9). Rows are the direct children.
 */
export function SettingsGroup({
  label,
  className = "",
  children
}: {
  /** Omit for a label-less card (e.g. Sign out on its own). */
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  const card = (
    <div className="divide-y divide-outline/60 overflow-hidden rounded-[18px] border border-outline/60 bg-surface shadow-brandCard">
      {children}
    </div>
  );

  if (!label) return <div className={className}>{card}</div>;

  return (
    <section className={className}>
      <h2 className="mb-2 px-1 text-label-caps uppercase text-onSurfaceVariant">{label}</h2>
      {card}
    </section>
  );
}

/** The leading icon tile every settings row shares. */
export const SETTINGS_ICON_TILE_CLASSES =
  "grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-brandBlue/10 text-brandBlue";

/** One tappable row: icon tile, label (+ description), chevron. At least 56px tall. */
export function SettingsLinkRow({
  description,
  href,
  icon: Icon,
  label
}: {
  description?: string;
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link className="flex min-h-14 items-center gap-4 px-4 py-3 transition hover:bg-surfaceBright" href={href}>
      <span className={SETTINGS_ICON_TILE_CLASSES}>
        <Icon aria-hidden="true" size={18} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-brandInk">{label}</span>
        {description ? <span className="mt-0.5 block text-xs text-onSurfaceVariant">{description}</span> : null}
      </span>

      <ChevronRight aria-hidden="true" className="shrink-0 text-onSurfaceVariant/70" size={17} />
    </Link>
  );
}
