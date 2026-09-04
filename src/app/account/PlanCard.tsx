import Link from "next/link";
import { ArrowRight, Globe2 } from "lucide-react";
import type { UsageSummary } from "@/lib/esim-install";
import type { OrderSummary } from "@/lib/order-groups";
import type { HeroPackageOption } from "@/services/packages";

const STATUS_STYLES: Record<string, string> = {
  active: "border-brandTeal/40 bg-brandTeal/10 text-brandTeal",
  ready: "border-outline bg-mist text-brandBlue",
  expired: "border-outline bg-mist text-onSurfaceVariant"
};

/**
 * Provider package ids (e.g. "szia-in-7days-1gb") name an operator SKU, not the
 * destination — never fit for display. When the catalog lookup misses (a
 * discontinued or rotated package), fall back to whatever duration/data figures
 * can be read out of the id rather than showing the raw slug.
 */
function detailsFromPackageId(packageId: string): string {
  const data = packageId.match(/(\d+(?:\.\d+)?)\s*(gb|mb)/i);
  const days = packageId.match(/(\d+)\s*days?/i);
  const parts = [
    data ? `${data[1]}${data[2]!.toUpperCase()}` : null,
    days ? `${days[1]} ${days[1] === "1" ? "day" : "days"}` : null
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : "Data plan";
}

export type PackageDescription = { title: string; details: string; flagUri: string | null };

export function describePackage(
  packageId: string,
  catalog: ReadonlyMap<string, HeroPackageOption>
): PackageDescription {
  const option = catalog.get(packageId);
  if (option) {
    return {
      title: option.country,
      details: `${option.dataLabel} · ${option.durationLabel}`,
      flagUri: option.flagUri || null
    };
  }
  return { title: "eSIM plan", details: detailsFromPackageId(packageId), flagUri: null };
}

function PlanIcon({ flagUri, label }: { flagUri: string | null; label: string }) {
  return flagUri ? (
    // Plain img: flag URIs come from the catalog CDN, not a domain the
    // image optimiser is configured for.
    <img alt={`${label} flag`} className="h-full w-full rounded-[14px] object-cover" src={flagUri} />
  ) : (
    <Globe2 size={22} />
  );
}

export function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function UsageBar({ usage }: { usage: UsageSummary }) {
  if (!usage.available) {
    return <p className="mt-4 text-sm leading-6 text-onSurfaceVariant">{usage.message}</p>;
  }

  return (
    <div className="mt-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-3xl font-black tracking-[-0.04em] text-brandInk">
          {usage.remainingLabel}
        </p>
        <p className="text-xs text-onSurfaceVariant">of {usage.totalLabel} remaining</p>
      </div>

      <div
        aria-label={`${usage.usedPercent}% of data used`}
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-mist"
        role="img"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-brandBlue via-[#0E86C0] to-brandTeal"
          style={{ width: `${Math.min(100, Math.max(0, usage.usedPercent))}%` }}
        />
      </div>

      {usage.expiresAt ? (
        <p className="mt-3 text-xs text-onSurfaceVariant">
          Expires {formatDate(usage.expiresAt)}
        </p>
      ) : null}
    </div>
  );
}

/** The single live plan, given the width its data usage deserves. */
export function ActivePlanCard({
  order,
  usage,
  catalog
}: {
  order: OrderSummary;
  usage: UsageSummary;
  catalog: ReadonlyMap<string, HeroPackageOption>;
}) {
  const { title, details, flagUri } = describePackage(order.package_id, catalog);

  return (
    <Link
      className="group block rounded-[20px] border border-brandTeal/40 bg-brandTeal/5 p-6 shadow-brandCard transition duration-300 hover:-translate-y-1 hover:border-brandTeal/70 sm:p-7"
      href={`/account/${order.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-[14px] border border-brandTeal/40 bg-white text-brandTeal">
          <PlanIcon flagUri={flagUri} label={title} />
        </span>

        <span className="rounded-full border border-brandTeal/40 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-brandTeal">
          Active
        </span>
      </div>

      <p className="mt-4 font-display text-xl font-black text-brandInk">{title}</p>
      <p className="mt-1 text-xs text-onSurfaceVariant">
        {details} · Order {order.code}
      </p>

      <UsageBar usage={usage} />

      <span className="mt-6 inline-flex items-center gap-2 text-xs font-black text-brandTeal">
        View eSIM
        <ArrowRight className="transition-transform group-hover:translate-x-1" size={14} />
      </span>
    </Link>
  );
}

export function PlanCard({
  order,
  catalog
}: {
  order: OrderSummary;
  catalog: ReadonlyMap<string, HeroPackageOption>;
}) {
  const { title, details, flagUri } = describePackage(order.package_id, catalog);

  return (
    <Link
      className="group flex h-full flex-col rounded-[18px] border border-outline bg-white p-5 shadow-brandCard transition duration-300 hover:-translate-y-1 hover:border-brandBlue/50"
      href={`/account/${order.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-[14px] border border-outline bg-mist text-brandBlue">
          <PlanIcon flagUri={flagUri} label={title} />
        </span>

        <span
          className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${
            STATUS_STYLES[order.lifecycle_status] ?? STATUS_STYLES.ready
          }`}
        >
          {order.lifecycle_status}
        </span>
      </div>

      <p className="mt-4 font-display text-lg font-black text-brandInk">{title}</p>

      <dl className="mt-3 space-y-1.5 text-xs text-onSurfaceVariant">
        <div className="flex justify-between gap-3">
          <dt>Details</dt>
          <dd className="font-semibold text-brandInk">{details}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Order</dt>
          <dd className="font-semibold text-brandInk">{order.code}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Purchased</dt>
          <dd className="font-semibold text-brandInk">{formatDate(order.created_at)}</dd>
        </div>
      </dl>

      <span className="mt-5 inline-flex items-center gap-2 text-xs font-black text-brandBlue">
        View eSIM
        <ArrowRight className="transition-transform group-hover:translate-x-1" size={14} />
      </span>
    </Link>
  );
}
