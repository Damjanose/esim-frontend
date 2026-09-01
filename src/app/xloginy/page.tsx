"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, DollarSign, LogOut, RefreshCw, ShoppingBag, Users, type LucideIcon } from "lucide-react";
import { AdminNav } from "../AdminNav";
import { AdminLoginCard } from "../AdminLoginCard";
import { useAdminSession } from "../useAdminSession";

type Purchase = {
  id: string;
  airaloId: number;
  userEmail: string;
  packageId: string;
  paymentAmountCents: number | null;
  paymentCurrency: string | null;
  paymentStatus: string | null;
  providerCreatedAt: string;
  createdAt: string;
};

type ChartPoint = {
  date: string;
  purchases: number;
  revenueCents: number;
};

type DashboardUser = {
  email: string;
  createdAt: string;
  updatedAt: string;
  otpRequestCount: number;
  lastOtpRequestedAt: string | null;
};

type OtpRequestEvent = {
  id: string;
  email: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
};

type DashboardPayload = {
  status?: string;
  data?: {
    summary?: {
      purchaseCount: number;
      userCount?: number;
      revenueByCurrency: Record<string, number>;
      latestPurchaseAt: string | null;
    };
    chart?: ChartPoint[];
    purchases?: Purchase[];
    purchasesPagination?: Pagination;
    users?: DashboardUser[];
    usersPagination?: Pagination;
    recentOtpRequests?: OtpRequestEvent[];
    otpPagination?: Pagination;
  };
  message?: string;
};

const TABLE_PAGE_SIZE = 10;

function formatMoney(amountCents: number | null, currency: string | null) {
  if (amountCents == null || !currency) return "N/A";
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currency.toUpperCase()
  }).format(amountCents / 100);
}

function formatDate(value: string | null) {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatRevenue(revenueByCurrency: Record<string, number>) {
  const entries = Object.entries(revenueByCurrency);
  if (entries.length === 0) return "N/A";
  return entries.map(([currency, amount]) => formatMoney(amount, currency)).join(" + ");
}

function formatOtpStatus(status: string) {
  return status.replaceAll("_", " ");
}

const CHART_LEFT_PAD = 44;
const CHART_RIGHT_PAD = 54;
const CHART_TOP_PAD = 20;
const CHART_BASELINE = 172;
const CHART_BAND = 150;
const CHART_HEIGHT = 220;

function compactMoney(amountCents: number, currency: string | null) {
  const amount = amountCents / 100;
  if (!currency) return amount >= 1000 ? `${(amount / 1000).toFixed(1)}k` : amount.toFixed(0);
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currency.toUpperCase(),
    notation: amount >= 1000 ? "compact" : "standard",
    maximumFractionDigits: amount >= 1000 ? 1 : 0
  }).format(amount);
}

function PurchasesRevenueChart({
  data,
  revenueByCurrency
}: {
  data: ChartPoint[];
  revenueByCurrency: Record<string, number>;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const currencies = Object.keys(revenueByCurrency);
  const primaryCurrency = currencies[0] ?? null;
  const hasMixedCurrencies = currencies.length > 1;

  if (data.length === 0) {
    return (
      <div className="grid min-h-56 place-items-center rounded-xl border border-dashed border-line bg-[#fbfeff] text-sm font-semibold text-muted">
        No purchases yet
      </div>
    );
  }

  const totalPurchases = data.reduce((sum, point) => sum + point.purchases, 0);
  const totalRevenueCents = data.reduce((sum, point) => sum + point.revenueCents, 0);
  const avgPerDay = totalPurchases / data.length;
  const busiestDay = data.reduce((best, point) => (point.purchases > best.purchases ? point : best), data[0]);

  const maxPurchases = Math.max(1, ...data.map((point) => point.purchases));
  const maxRevenue = Math.max(1, ...data.map((point) => point.revenueCents));
  const width = Math.max(480, data.length * 64);
  const columnWidth = (width - CHART_LEFT_PAD - CHART_RIGHT_PAD) / data.length;
  const barWidth = Math.max(14, Math.min(36, columnWidth - 16));
  const gridSteps = 4;
  const gridFractions = Array.from({ length: gridSteps + 1 }, (_, i) => i / gridSteps);

  function columnX(index: number) {
    return CHART_LEFT_PAD + index * columnWidth;
  }

  const linePoints = data.map((point, index) => {
    const x = columnX(index) + columnWidth / 2;
    const y = CHART_BASELINE - (point.revenueCents / maxRevenue) * CHART_BAND;
    return { x, y };
  });
  const linePath = linePoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${linePoints[linePoints.length - 1].x},${CHART_BASELINE} L${linePoints[0].x},${CHART_BASELINE} Z`;

  const hovered = hoveredIndex != null ? data[hoveredIndex] : null;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4 text-[11px] font-bold text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2 w-2 rounded-sm bg-[#00d9f5]" />
          Purchases
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-brandTeal" />
          Revenue
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg
          aria-label="Purchases and revenue over time"
          className="min-w-full"
          onMouseLeave={() => setHoveredIndex(null)}
          role="img"
          viewBox={`0 0 ${width} ${CHART_HEIGHT}`}
        >
          <defs>
            <linearGradient id="barGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#00d9f5" />
              <stop offset="100%" stopColor="#71efff" />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#09C3BE" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#09C3BE" stopOpacity="0" />
            </linearGradient>
          </defs>

          {gridFractions.map((fraction) => {
            const y = CHART_BASELINE - fraction * CHART_BAND;
            return (
              <g key={fraction}>
                <line
                  stroke={fraction === 0 ? "#c7e9ef" : "#eef8fa"}
                  strokeWidth="1"
                  x1={CHART_LEFT_PAD}
                  x2={width - CHART_RIGHT_PAD}
                  y1={y}
                  y2={y}
                />
                <text fill="#5a8b93" fontSize="10" textAnchor="end" x={CHART_LEFT_PAD - 8} y={y + 3}>
                  {Math.round(fraction * maxPurchases)}
                </text>
                <text fill="#0a8a86" fontSize="10" textAnchor="start" x={width - CHART_RIGHT_PAD + 8} y={y + 3}>
                  {compactMoney(fraction * maxRevenue, primaryCurrency)}
                </text>
              </g>
            );
          })}

          {data.map((point, index) => {
            const x = columnX(index) + (columnWidth - barWidth) / 2;
            const barHeight = point.purchases > 0 ? Math.max(4, (point.purchases / maxPurchases) * CHART_BAND) : 0;
            const y = CHART_BASELINE - barHeight;
            const isHovered = hoveredIndex === index;

            return (
              <rect
                fill={isHovered ? "#001f26" : "url(#barGradient)"}
                height={barHeight}
                key={`bar-${point.date}`}
                rx="6"
                width={barWidth}
                x={x}
                y={y}
              />
            );
          })}

          <path d={areaPath} fill="url(#areaGradient)" />
          <path d={linePath} fill="none" stroke="#09C3BE" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
          {linePoints.map((p, index) => (
            <circle
              cx={p.x}
              cy={p.y}
              fill={hoveredIndex === index ? "#09C3BE" : "#ffffff"}
              key={`dot-${data[index].date}`}
              r={hoveredIndex === index ? 4.5 : 3}
              stroke="#09C3BE"
              strokeWidth="2"
            />
          ))}

          {data.map((point, index) => (
            <text
              fill="#5a8b93"
              fontSize="11"
              key={`label-${point.date}`}
              textAnchor="middle"
              x={columnX(index) + columnWidth / 2}
              y="198"
            >
              {point.date.slice(5)}
            </text>
          ))}

          {data.map((point, index) => (
            <rect
              fill="transparent"
              height={CHART_HEIGHT}
              key={`hit-${point.date}`}
              onMouseEnter={() => setHoveredIndex(index)}
              width={columnWidth}
              x={columnX(index)}
              y={0}
            />
          ))}

          {hoveredIndex != null ? (
            <line
              stroke="#c7e9ef"
              strokeDasharray="3 3"
              x1={columnX(hoveredIndex) + columnWidth / 2}
              x2={columnX(hoveredIndex) + columnWidth / 2}
              y1={CHART_TOP_PAD}
              y2={CHART_BASELINE}
            />
          ) : null}
        </svg>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f8fdfe] px-4 py-3">
        {hovered ? (
          <p className="text-xs font-bold text-midnight">
            {hovered.date} · {hovered.purchases} purchase{hovered.purchases === 1 ? "" : "s"} ·{" "}
            {compactMoney(hovered.revenueCents, primaryCurrency)} revenue
          </p>
        ) : (
          <p className="text-xs font-bold text-midnight">
            {totalPurchases} purchases over {data.length} day{data.length === 1 ? "" : "s"} ·{" "}
            {compactMoney(totalRevenueCents, primaryCurrency)} total ·{" "}
            {avgPerDay.toFixed(1)} avg/day · busiest {busiestDay.date} ({busiestDay.purchases})
          </p>
        )}
        {hasMixedCurrencies ? (
          <p className="text-[10px] font-semibold text-muted">Revenue mixes multiple currencies; totals are approximate.</p>
        ) : null}
      </div>
    </div>
  );
}

const STAT_ACCENTS = {
  cyan: { icon: "text-cyanDeep", glow: "rgba(0,217,245,0.14)" },
  teal: { icon: "text-brandTeal", glow: "rgba(9,195,190,0.16)" },
  blue: { icon: "text-brandBlue", glow: "rgba(11,73,183,0.14)" },
  ink: { icon: "text-midnight", glow: "rgba(0,31,38,0.12)" }
} as const;

function StatCard({
  label,
  value,
  icon: Icon,
  accent
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent: keyof typeof STAT_ACCENTS;
}) {
  const { icon: iconClass, glow } = STAT_ACCENTS[accent];
  return (
    <article className="relative overflow-hidden rounded-2xl border border-line bg-white p-4 shadow-card">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full"
        style={{ background: `radial-gradient(circle, ${glow}, transparent 70%)` }}
      />
      <div className="flex items-center gap-1.5">
        <Icon aria-hidden="true" className={iconClass} size={13} />
        <p className="text-[10px] font-black uppercase tracking-wide text-muted">{label}</p>
      </div>
      <p className="mt-1 font-display text-2xl font-black text-midnight">{value}</p>
    </article>
  );
}

function TablePagination({
  pagination,
  isLoading,
  onPageChange
}: {
  pagination?: Pagination;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}) {
  if (!pagination || pagination.total === 0) return null;
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/60 px-5 py-3">
      <p className="text-[11px] font-bold text-muted">
        Page {pagination.page} of {totalPages} · {pagination.total} total
      </p>
      <div className="flex gap-2">
        <button
          className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-midnight transition hover:border-cyan disabled:cursor-not-allowed disabled:opacity-40"
          disabled={isLoading || pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
          type="button"
        >
          Prev
        </button>
        <button
          className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-midnight transition hover:border-cyan disabled:cursor-not-allowed disabled:opacity-40"
          disabled={isLoading || pagination.page >= totalPages}
          onClick={() => onPageChange(pagination.page + 1)}
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const session = useAdminSession();
  const { token, handleUnauthorized } = session;

  const [dashboard, setDashboard] = useState<DashboardPayload["data"] | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [error, setError] = useState("");
  const [purchasesPage, setPurchasesPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [otpPage, setOtpPage] = useState(1);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const purchases = dashboard?.purchases ?? [];
  const chart = dashboard?.chart ?? [];
  const users = dashboard?.users ?? [];
  const recentOtpRequests = dashboard?.recentOtpRequests ?? [];
  const summary = dashboard?.summary ?? {
    purchaseCount: 0,
    userCount: 0,
    revenueByCurrency: {},
    latestPurchaseAt: null
  };

  const latestPurchase = useMemo(() => formatDate(summary.latestPurchaseAt), [summary.latestPurchaseAt]);
  const totalRevenue = useMemo(
    () => formatRevenue(summary.revenueByCurrency),
    [summary.revenueByCurrency]
  );

  async function loadDashboard(nextToken = token) {
    if (!nextToken) return;
    setIsLoadingDashboard(true);
    setError("");

    try {
      const params = new URLSearchParams({
        purchasesPage: String(purchasesPage),
        purchasesPageSize: String(TABLE_PAGE_SIZE),
        usersPage: String(usersPage),
        usersPageSize: String(TABLE_PAGE_SIZE),
        otpPage: String(otpPage),
        otpPageSize: String(TABLE_PAGE_SIZE)
      });
      const response = await fetch(`/bff/admin/dashboard?${params.toString()}`, {
        headers: { Authorization: `Bearer ${nextToken}` },
        cache: "no-store"
      });
      const payload = (await response.json()) as DashboardPayload;

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }

      if (!response.ok || payload.status !== "success" || !payload.data) {
        throw new Error(payload.message ?? "Could not load dashboard");
      }

      setDashboard(payload.data);
      setLastRefreshedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load dashboard");
      setDashboard(null);
    } finally {
      setIsLoadingDashboard(false);
    }
  }

  useEffect(() => {
    if (token) void loadDashboard(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, purchasesPage, usersPage, otpPage]);

  return (
    <div className="flex min-h-screen bg-cloud">
      <AdminNav />
      <div className="min-w-0 flex-1 px-6 py-7 md:px-9">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-cyanDeep">
              <BarChart3 aria-hidden="true" size={13} />
              Admin · Live
            </p>
            <h1 className="mt-1 font-display text-[26px] font-black tracking-tight text-midnight md:text-[30px]">
              Purchase dashboard
            </h1>
          </div>
          {token ? (
            <div className="flex items-center gap-3">
              {lastRefreshedAt ? (
                <p className="hidden text-[11px] font-semibold text-muted sm:block">
                  Updated {new Intl.DateTimeFormat("en", { timeStyle: "medium" }).format(lastRefreshedAt)}
                </p>
              ) : null}
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-xs font-bold text-midnight shadow-sm transition hover:border-cyan disabled:opacity-50"
                disabled={isLoadingDashboard}
                onClick={() => void loadDashboard()}
                type="button"
              >
                <RefreshCw aria-hidden="true" className={isLoadingDashboard ? "animate-spin" : ""} size={14} />
                {isLoadingDashboard ? "Loading..." : "Refresh"}
              </button>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-midnight to-ink px-4 text-xs font-bold text-aqua shadow-glow transition hover:opacity-90"
                onClick={session.logout}
                type="button"
              >
                <LogOut aria-hidden="true" size={14} />
                Logout
              </button>
            </div>
          ) : null}
        </div>

        {!token ? (
          <AdminLoginCard
            email={session.email}
            error={session.error}
            isLoggingIn={session.isLoggingIn}
            onSubmit={session.login}
            password={session.password}
            setEmail={session.setEmail}
            setPassword={session.setPassword}
          />
        ) : !dashboard && isLoadingDashboard ? (
          <div className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div className="h-[74px] animate-pulse rounded-2xl border border-line bg-white/60" key={i} />
              ))}
            </div>
            <div className="h-64 animate-pulse rounded-2xl border border-line bg-white/60" />
            <div className="h-48 animate-pulse rounded-2xl border border-line bg-white/60" />
          </div>
        ) : (
          <div className="grid gap-5">
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {error}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-4">
              <StatCard accent="cyan" icon={ShoppingBag} label="Total purchases" value={summary.purchaseCount} />
              <StatCard accent="teal" icon={DollarSign} label="Total revenue" value={totalRevenue} />
              <StatCard accent="blue" icon={BarChart3} label="Latest purchase" value={latestPurchase} />
              <StatCard accent="ink" icon={Users} label="Total users" value={summary.userCount ?? users.length} />
            </div>

            <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
              <h2 className="text-[11px] font-black uppercase tracking-wide text-muted">Purchases &amp; revenue</h2>
              <div className="mt-3">
                <PurchasesRevenueChart data={chart} revenueByCurrency={summary.revenueByCurrency} />
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
              <div className="border-b border-line/70 px-5 py-3.5">
                <h2 className="text-[11px] font-black uppercase tracking-wide text-muted">Purchases</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-[#f8fdfe]">
                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wide text-muted">Email</th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Package
                      </th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">Price</th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">Status</th>
                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Purchased At
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((purchase) => (
                      <tr className="border-t border-line/60 hover:bg-[#fbfeff]" key={purchase.id}>
                        <td className="px-5 py-3 font-semibold text-midnight">{purchase.userEmail}</td>
                        <td className="px-3 py-3 text-muted">{purchase.packageId}</td>
                        <td className="px-3 py-3 font-bold text-midnight">
                          {formatMoney(purchase.paymentAmountCents, purchase.paymentCurrency)}
                        </td>
                        <td className="px-3 py-3 text-muted">{purchase.paymentStatus ?? "unknown"}</td>
                        <td className="px-5 py-3 text-muted">{formatDate(purchase.providerCreatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <TablePagination
                isLoading={isLoadingDashboard}
                onPageChange={setPurchasesPage}
                pagination={dashboard?.purchasesPagination}
              />
            </section>

            <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
              <div className="border-b border-line/70 px-5 py-3.5">
                <h2 className="text-[11px] font-black uppercase tracking-wide text-muted">Users</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-[#f8fdfe]">
                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wide text-muted">Email</th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Created
                      </th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Updated
                      </th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        OTP requests
                      </th>
                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Latest OTP
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? (
                      users.map((user) => (
                        <tr className="border-t border-line/60 hover:bg-[#fbfeff]" key={user.email}>
                          <td className="px-5 py-3 font-semibold text-midnight">{user.email}</td>
                          <td className="px-3 py-3 text-muted">{formatDate(user.createdAt)}</td>
                          <td className="px-3 py-3 text-muted">{formatDate(user.updatedAt)}</td>
                          <td className="px-3 py-3 font-bold text-midnight">{user.otpRequestCount}</td>
                          <td className="px-5 py-3 text-muted">{formatDate(user.lastOtpRequestedAt)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-t border-line/60">
                        <td className="px-5 py-6 text-center text-sm font-semibold text-muted" colSpan={5}>
                          No users yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <TablePagination isLoading={isLoadingDashboard} onPageChange={setUsersPage} pagination={dashboard?.usersPagination} />
            </section>

            <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
              <div className="border-b border-line/70 px-5 py-3.5">
                <h2 className="text-[11px] font-black uppercase tracking-wide text-muted">Recent OTP requests</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-[#f8fdfe]">
                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wide text-muted">Email</th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">Status</th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                        Timestamp
                      </th>
                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wide text-muted">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOtpRequests.length > 0 ? (
                      recentOtpRequests.map((request) => (
                        <tr className="border-t border-line/60 hover:bg-[#fbfeff]" key={request.id}>
                          <td className="px-5 py-3 font-semibold text-midnight">{request.email}</td>
                          <td className="px-3 py-3 font-bold text-midnight">{formatOtpStatus(request.status)}</td>
                          <td className="px-3 py-3 text-muted">{formatDate(request.createdAt)}</td>
                          <td className="px-5 py-3 text-muted">{request.errorMessage ?? "N/A"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-t border-line/60">
                        <td className="px-5 py-6 text-center text-sm font-semibold text-muted" colSpan={4}>
                          No OTP requests yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <TablePagination isLoading={isLoadingDashboard} onPageChange={setOtpPage} pagination={dashboard?.otpPagination} />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
