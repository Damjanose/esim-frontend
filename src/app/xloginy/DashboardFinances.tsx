import { ArrowUpRight, ShoppingBag, Users, Wallet } from "lucide-react";
import { Button } from "../components/Button";
import {
  formatAmounts,
  formatDate,
  profitLabel,
  type Dashboard,
  type Earnings,
  type Pagination,
} from "./dashboard-model";

export function TodayCards({
  dashboard,
  onUsers,
}: {
  dashboard: Dashboard;
  onUsers: () => void;
}) {
  const today = dashboard.today;
  const cards = [
    {
      label: "Sales today",
      value: today
        ? today.purchases === 0
          ? "0"
          : formatAmounts(today.revenueByCurrency)
        : "—",
      note: "Amount paid by customers",
      Icon: Wallet,
    },
    {
      label: "Est. profit today",
      value: today ? (today.purchases === 0 ? "0" : profitLabel(today)) : "—",
      note: "Before fees & commissions",
      Icon: ArrowUpRight,
    },
    {
      label: "Purchases today",
      value: today?.purchases ?? "—",
      note: "eSIM orders placed today",
      Icon: ShoppingBag,
    },
    {
      label: "Total users",
      value: dashboard.summary.userCount,
      note: "View your customers",
      Icon: Users,
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {cards.map(({ label, value, note, Icon }, index) => (
        <article
          key={label}
          className={`rounded-2xl border p-4 sm:p-5 ${index === 0 ? "border-brandBlue bg-brandBlue text-white" : "border-outline bg-white text-brandInk"}`}
        >
          <div className="flex items-center justify-between gap-3">
            <p
              className={`text-sm font-medium ${index === 0 ? "text-white/85" : "text-onSurfaceVariant"}`}
            >
              {label}
            </p>
            <Icon
              aria-hidden="true"
              size={18}
              className={index === 0 ? "text-white/80" : "text-brandBlue"}
            />
          </div>
          <p className="mt-3 break-words font-display text-2xl font-bold sm:text-3xl tracking-tight tabular-nums">
            {value}
          </p>
          {index === 3 ? (
            <button
              type="button"
              onClick={onUsers}
              className="mt-2 rounded text-xs font-semibold text-brandBlue underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2"
            >
              {note} →
            </button>
          ) : (
            <p
              className={`mt-2 text-xs ${index === 0 ? "text-white/80" : "text-onSurfaceVariant"}`}
            >
              {note}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

export function PeriodSummary({
  dashboard,
  month,
}: {
  dashboard: Dashboard;
  month: string;
}) {
  const { summary } = dashboard;
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-outline bg-white px-5 py-4 text-sm">
      <p className="font-semibold text-brandInk">
        {month
          ? formatDate(`${month}-01T00:00:00Z`, true).replace(/^\d+ /, "")
          : "All time"}
      </p>
      <p className="text-onSurfaceVariant">
        Sales{" "}
        <strong className="ml-1 text-brandInk tabular-nums">
          {summary.purchaseCount === 0
            ? "0"
            : formatAmounts(summary.revenueByCurrency)}
        </strong>
      </p>
      <p className="text-onSurfaceVariant">
        Est. Airalo cost{" "}
        <strong className="ml-1 text-brandInk tabular-nums">
          {summary.purchaseCount === 0
            ? "0"
            : formatAmounts(summary.costByCurrency)}
        </strong>
      </p>
      <p className="text-onSurfaceVariant">
        Est. profit{" "}
        <strong className="ml-1 text-brandInk tabular-nums">
          {summary.purchaseCount === 0 ? "0" : profitLabel(summary)}
        </strong>
      </p>
    </div>
  );
}

export function TablePagination({
  pagination,
  loading,
  onPageChange,
}: {
  pagination?: Pagination;
  loading: boolean;
  onPageChange: (page: number) => void;
}) {
  if (!pagination || pagination.total === 0) return null;
  const pages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize));
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline px-5 py-4">
      <p className="text-xs text-onSurfaceVariant">
        Page {pagination.page} of {pages} <span className="mx-1">·</span>{" "}
        {pagination.total.toLocaleString()} results
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="tint"
          disabled={loading || pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
        >
          Previous
        </Button>
        <Button
          size="sm"
          variant="tint"
          disabled={loading || pagination.page >= pages}
          onClick={() => onPageChange(pagination.page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export function DailyEarnings({
  days,
  page,
  onPageChange,
}: {
  days: Earnings[];
  page: number;
  onPageChange: (page: number) => void;
}) {
  const sorted = [...days].sort((a, b) => b.date.localeCompare(a.date));
  const pageSize = 10;
  return (
    <section
      aria-label="Daily earnings"
      className="overflow-hidden rounded-2xl border border-outline bg-white"
    >
      <div className="px-5 py-5">
        <h2 className="font-display text-lg font-bold text-brandInk">
          Daily earnings
        </h2>
        <p className="mt-1 text-xs text-onSurfaceVariant">
          Days with purchases in the selected period. All dates are UTC.
        </p>
      </div>
      {sorted.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-y border-outline bg-surfaceBright text-xs text-onSurfaceVariant">
              <tr>
                {[
                  "Day (UTC)",
                  "Purchases",
                  "Sales",
                  "Est. Airalo cost",
                  "Est. profit",
                ].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="px-5 py-3 font-medium"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline">
              {sorted
                .slice((page - 1) * pageSize, page * pageSize)
                .map((day) => (
                  <tr key={day.date}>
                    <th
                      scope="row"
                      className="whitespace-nowrap px-5 py-4 font-semibold text-brandInk"
                    >
                      {formatDate(`${day.date}T00:00:00Z`, true)}
                    </th>
                    <td className="px-5 py-4 tabular-nums">{day.purchases}</td>
                    <td className="px-5 py-4 font-semibold tabular-nums">
                      {formatAmounts(day.revenueByCurrency)}
                    </td>
                    <td className="px-5 py-4 tabular-nums">
                      {formatAmounts(day.costByCurrency)}
                      {day.missingCostCount > 0 ? (
                        <span className="mt-1 block text-xs text-amber-800">
                          {day.missingCostCount} cost(s) unavailable
                        </span>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 font-semibold tabular-nums">
                      {profitLabel(day)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No earnings in this period"
          description="Choose another month or All time to see purchases."
        />
      )}
      <TablePagination
        pagination={{ page, pageSize, total: sorted.length }}
        loading={false}
        onPageChange={onPageChange}
      />
    </section>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="font-semibold text-brandInk">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-onSurfaceVariant">
        {description}
      </p>
    </div>
  );
}
