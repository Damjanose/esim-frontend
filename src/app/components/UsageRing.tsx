import type { ReactNode } from "react";
import type { LifecycleBadge, UsageMeter } from "@/lib/accountEsims";
import { LinkButton } from "./Button";
import { EsimFlag } from "./EsimFlag";
import { StatusBadge } from "./StatusBadge";

/**
 * Teal ring of the data LEFT (lg+ account pages), with the figure in the middle.
 * SVG strokes take token classes (stroke-brandTeal / stroke-mist), so there are no
 * colour literals; pathLength=100 makes the dash the percentage.
 */
export function UsageRing({ meter }: { meter: UsageMeter }) {
  return (
    <div aria-label={meter.label} className="relative grid h-40 w-40 shrink-0 place-items-center" data-usage-ring role="img">
      <svg aria-hidden="true" className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
        <circle className="stroke-mist" cx="50" cy="50" fill="none" r="44" strokeWidth="8" />
        {meter.leftPercent ? (
          <circle
            className="stroke-brandTeal"
            cx="50"
            cy="50"
            fill="none"
            pathLength={100}
            r="44"
            strokeDasharray={`${meter.leftPercent} 100`}
            strokeLinecap="round"
            strokeWidth="8"
          />
        ) : null}
      </svg>

      <span aria-hidden="true" className="relative flex max-w-[112px] flex-col items-center text-center">
        <span className="font-display text-2xl font-black leading-tight tracking-[-0.03em] text-brandInk">
          {meter.headline ?? "—"}
        </span>
        {meter.caption ? <span className="mt-0.5 text-xs leading-4 text-onSurfaceVariant">{meter.caption}</span> : null}
      </span>
    </div>
  );
}

/**
 * The lg+ active-plan card: ring on the left; country, status, Top up + Details on
 * the right. `primaryTopUp` makes Top up the view's one gradient (accountPrimaryAction).
 */
export function UsageRingCard({
  title,
  flagUri,
  badge,
  statusLine,
  details,
  meter,
  topUpHref,
  detailsHref,
  primaryTopUp = false,
  children
}: {
  title: string;
  flagUri: string | null;
  badge: LifecycleBadge;
  statusLine: string;
  details?: string;
  meter: UsageMeter;
  topUpHref?: string;
  detailsHref?: string;
  primaryTopUp?: boolean;
  /** Extra actions after Top up / Details. */
  children?: ReactNode;
}) {
  return (
    // flex-wrap: in a half-width column (order page) the text drops under the ring
    // instead of truncating the country name.
    <article className="flex flex-wrap items-center gap-x-8 gap-y-5 rounded-[20px] border border-outline/60 bg-surface p-6 shadow-brandCard">
      <UsageRing meter={meter} />

      <div className="min-w-[220px] flex-1">
        <div className="flex items-center gap-3">
          <EsimFlag className="h-11 w-11 rounded-[12px] border border-outline/60 bg-surfaceBright text-brandBlue" flagUri={flagUri} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-xl font-black text-brandInk">{title}</h3>
            <p className="truncate text-sm text-onSurfaceVariant">{statusLine}</p>
          </div>
          <StatusBadge badge={badge} />
        </div>

        {details ? <p className="mt-4 text-sm text-onSurfaceVariant">{details}</p> : null}
        {meter.note ? <p className="mt-3 text-sm leading-6 text-onSurfaceVariant">{meter.note}</p> : null}

        {topUpHref || detailsHref || children ? (
          <div className="mt-5 flex flex-wrap gap-3">
            {topUpHref ? (
              <LinkButton href={topUpHref} variant={primaryTopUp ? "lit" : "tint"}>
                Top up
              </LinkButton>
            ) : null}
            {detailsHref ? (
              <LinkButton href={detailsHref} variant="tint">
                Details
              </LinkButton>
            ) : null}
            {children}
          </div>
        ) : null}
      </div>
    </article>
  );
}
