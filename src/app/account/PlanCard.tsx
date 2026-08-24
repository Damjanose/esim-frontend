import Link from "next/link";
import { ArrowRight, Globe2 } from "lucide-react";
import type { UsageSummary } from "@/lib/esim-install";
import type { OrderSummary } from "@/lib/order-groups";

const STATUS_STYLES: Record<string, string> = {
  active: "border-brandTeal/40 bg-brandTeal/10 text-brandTeal",
  ready: "border-outline bg-mist text-brandBlue",
  expired: "border-outline bg-mist text-onSurfaceVariant"
};

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
  usage
}: {
  order: OrderSummary;
  usage: UsageSummary;
}) {
  return (
    <Link
      className="group block rounded-[20px] border border-brandTeal/40 bg-brandTeal/5 p-6 shadow-brandCard transition duration-300 hover:-translate-y-1 hover:border-brandTeal/70 sm:p-7"
      href={`/account/${order.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] border border-brandTeal/40 bg-white text-brandTeal">
          <Globe2 size={22} />
        </span>

        <span className="rounded-full border border-brandTeal/40 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-brandTeal">
          Active
        </span>
      </div>

      <p className="mt-4 font-display text-xl font-black text-brandInk">{order.package_id}</p>
      <p className="mt-1 text-xs text-onSurfaceVariant">Order {order.code}</p>

      <UsageBar usage={usage} />

      <span className="mt-6 inline-flex items-center gap-2 text-xs font-black text-brandTeal">
        View eSIM
        <ArrowRight className="transition-transform group-hover:translate-x-1" size={14} />
      </span>
    </Link>
  );
}

export function PlanCard({ order }: { order: OrderSummary }) {
  return (
    <Link
      className="group flex h-full flex-col rounded-[18px] border border-outline bg-white p-5 shadow-brandCard transition duration-300 hover:-translate-y-1 hover:border-brandBlue/50"
      href={`/account/${order.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] border border-outline bg-mist text-brandBlue">
          <Globe2 size={22} />
        </span>

        <span
          className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${
            STATUS_STYLES[order.lifecycle_status] ?? STATUS_STYLES.ready
          }`}
        >
          {order.lifecycle_status}
        </span>
      </div>

      <p className="mt-4 font-display text-lg font-black text-brandInk">{order.package_id}</p>

      <dl className="mt-3 space-y-1.5 text-xs text-onSurfaceVariant">
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
