import Link from "next/link";
import { ArrowRight, Globe2 } from "lucide-react";
import type { UsageSummary } from "@/lib/esim-install";
import type { OrderSummary } from "@/lib/order-groups";

const STATUS_STYLES: Record<string, string> = {
  active: "border-[#1c7a4b] bg-[#07281a] text-[#4ade80]",
  ready: "border-[#1c8dc5] bg-[#07213a] text-[#3db7ff]",
  expired: "border-[#4a4a58] bg-[#16161d] text-[#9ca3af]"
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
    return <p className="mt-4 text-sm leading-6 text-[#8ea3ba]">{usage.message}</p>;
  }

  return (
    <div className="mt-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-3xl font-black tracking-[-0.04em]">
          {usage.remainingLabel}
        </p>
        <p className="text-xs text-[#748aa2]">of {usage.totalLabel} remaining</p>
      </div>

      <div
        aria-label={`${usage.usedPercent}% of data used`}
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#0a2038]"
        role="img"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#1857ff] to-[#29c9ff]"
          style={{ width: `${Math.min(100, Math.max(0, usage.usedPercent))}%` }}
        />
      </div>

      {usage.expiresAt ? (
        <p className="mt-3 text-xs text-[#748aa2]">
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
      className="group block rounded-[20px] border border-[#1c7a4b]/70 bg-[linear-gradient(150deg,#07231c,#051520)] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#4ade80]/60 sm:p-7"
      href={`/account/${order.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] border border-[#1c7a4b] bg-[#07281a] text-[#4ade80]">
          <Globe2 size={22} />
        </span>

        <span className="rounded-full border border-[#1c7a4b] bg-[#07281a] px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#4ade80]">
          Active
        </span>
      </div>

      <p className="mt-4 font-display text-xl font-black">{order.package_id}</p>
      <p className="mt-1 text-xs text-[#8196ad]">Order {order.code}</p>

      <UsageBar usage={usage} />

      <span className="mt-6 inline-flex items-center gap-2 text-xs font-black text-[#4ade80]">
        View eSIM
        <ArrowRight className="transition-transform group-hover:translate-x-1" size={14} />
      </span>
    </Link>
  );
}

export function PlanCard({ order }: { order: OrderSummary }) {
  return (
    <Link
      className="group flex h-full flex-col rounded-[18px] border border-[#214867]/85 bg-[linear-gradient(145deg,#07182c,#051224)] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#168cff]/75"
      href={`/account/${order.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] border border-[#1c8dc5] bg-[#07213a] text-[#3db7ff]">
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

      <p className="mt-4 font-display text-lg font-black">{order.package_id}</p>

      <dl className="mt-3 space-y-1.5 text-xs text-[#8196ad]">
        <div className="flex justify-between gap-3">
          <dt>Order</dt>
          <dd className="font-semibold text-[#c7d6e5]">{order.code}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Purchased</dt>
          <dd className="font-semibold text-[#c7d6e5]">{formatDate(order.created_at)}</dd>
        </div>
      </dl>

      <span className="mt-5 inline-flex items-center gap-2 text-xs font-black text-[#42b1ff]">
        View eSIM
        <ArrowRight className="transition-transform group-hover:translate-x-1" size={14} />
      </span>
    </Link>
  );
}
