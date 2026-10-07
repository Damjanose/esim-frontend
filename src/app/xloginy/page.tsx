"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, DollarSign, LogOut, RefreshCw, ShoppingBag, TrendingUp, Users, Wallet, type LucideIcon } from "lucide-react";
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
  costCents: number | null;
  costCurrency: string | null;
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
      costByCurrency?: Record<string, number>;
      profitByCurrency?: Record<string, number>;
      latestPurchaseAt: string | null;
      month?: string | null;
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

function currentUtcMonth() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

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

const CHART_WIDTH = 900;
const CHART_HEIGHT = 180;
const CHART_PAD_LEFT = 60;
const CHART_PAD_RIGHT = 20;
const CHART_PAD_TOP = 12;
const CHART_PAD_BOTTOM = 30;
const CHART_Y_TICKS = 4;
const CHART_MAX_X_LABELS = 8;

type ChartMetric = "revenue" | "purchases";

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

// Rounds the axis top up to a 1/2/5 x 10^n step so tick labels are clean numbers.
function niceAxisMax(maxValue: number, minStep: number) {
  const rawStep = Math.max(minStep, maxValue / CHART_Y_TICKS);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const niceStep = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude;
  return Math.max(minStep, niceStep) * CHART_Y_TICKS;
}

function formatAxisDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date.slice(5);
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(parsed);
}

function formatChartDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(parsed);
}

// Monotone cubic (Fritsch–Carlson) so the curve is smooth like the mobile spend chart
// but never overshoots below zero or above the day's real value.
function smoothPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return "";
  const n = points.length;
  const slopes = points.slice(0, -1).map((p, i) => (points[i + 1].y - p.y) / (points[i + 1].x - p.x));
  const tangents = points.map((_, i) => {
    if (i === 0) return slopes[0];
    if (i === n - 1) return slopes[n - 2];
    return slopes[i - 1] * slopes[i] <= 0 ? 0 : (slopes[i - 1] + slopes[i]) / 2;
  });
  for (let i = 0; i < n - 1; i++) {
    if (slopes[i] === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
      continue;
    }
    const a = tangents[i] / slopes[i];
    const b = tangents[i + 1] / slopes[i];
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      tangents[i] = t * a * slopes[i];
      tangents[i + 1] = t * b * slopes[i];
    }
  }
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const dx = (p1.x - p0.x) / 3;
    d += ` C${p0.x + dx},${p0.y + tangents[i] * dx} ${p1.x - dx},${p1.y - tangents[i + 1] * dx} ${p1.x},${p1.y}`;
  }
  return d;
}

function PurchasesRevenueChart({
  data,
  revenueByCurrency
}: {
  data: ChartPoint[];
  revenueByCurrency: Record<string, number>;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [metric, setMetric] = useState<ChartMetric>("revenue");
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

  const valueOf = (point: ChartPoint) => (metric === "revenue" ? point.revenueCents : point.purchases);
  const formatValue = (value: number) =>
    metric === "revenue" ? compactMoney(value, primaryCurrency) : `${value} purchase${value === 1 ? "" : "s"}`;

  const totalPurchases = data.reduce((sum, point) => sum + point.purchases, 0);
  const totalRevenueCents = data.reduce((sum, point) => sum + point.revenueCents, 0);
  const total = metric === "revenue" ? totalRevenueCents : totalPurchases;
  // Revenue ticks step in whole currency units (100 cents), purchases in whole purchases.
  const axisMax = niceAxisMax(Math.max(0, ...data.map(valueOf)), metric === "revenue" ? 100 : 1);
  const yTicks = Array.from({ length: CHART_Y_TICKS + 1 }, (_, i) => (axisMax / CHART_Y_TICKS) * i);
  const formatTick = (value: number) =>
    metric === "revenue" ? compactMoney(value, primaryCurrency) : String(Math.round(value));
  const labelEvery = Math.max(1, Math.ceil(data.length / CHART_MAX_X_LABELS));

  const plotWidth = CHART_WIDTH - CHART_PAD_LEFT - CHART_PAD_RIGHT;
  const plotHeight = CHART_HEIGHT - CHART_PAD_TOP - CHART_PAD_BOTTOM;
  const baseline = CHART_PAD_TOP + plotHeight;
  const step = data.length > 1 ? plotWidth / (data.length - 1) : 0;

  const points = data.map((point, index) => ({
    x: data.length > 1 ? CHART_PAD_LEFT + index * step : CHART_PAD_LEFT + plotWidth / 2,
    y: baseline - (valueOf(point) / axisMax) * plotHeight
  }));
  // A single day still reads as a flat line across the card instead of a lone dot.
  const linePoints =
    points.length > 1
      ? points
      : [
          { x: CHART_PAD_LEFT, y: points[0].y },
          { x: CHART_PAD_LEFT + plotWidth, y: points[0].y }
        ];
  const linePath = smoothPath(linePoints);
  const first = linePoints[0];
  const last = linePoints[linePoints.length - 1];
  const areaPath = `${linePath} L${last.x},${baseline} L${first.x},${baseline} Z`;

  const activeIndex = hoveredIndex ?? data.length - 1;
  const activePoint = points.length > 1 ? points[activeIndex] : last;
  const hovered = hoveredIndex != null ? data[hoveredIndex] : null;
  const hitWidth = data.length > 1 ? step : plotWidth;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-black tracking-tight text-midnight">
            {metric === "revenue" ? "Revenue" : "Purchases"} over {data.length} day{data.length === 1 ? "" : "s"}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-muted">
            {hovered
              ? `${formatChartDate(hovered.date)}: ${formatValue(valueOf(hovered))}`
              : `Total: ${formatValue(total)}`}
          </p>
        </div>
        <div className="flex rounded-full bg-[#eef8fa] p-1" role="group" aria-label="Chart metric">
          {(["revenue", "purchases"] as const).map((option) => (
            <button
              aria-pressed={metric === option}
              className={`rounded-full px-4 py-1.5 text-xs font-bold capitalize transition ${
                metric === option ? "bg-white text-midnight shadow-sm" : "text-muted hover:text-midnight"
              }`}
              key={option}
              onClick={() => setMetric(option)}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <svg
        aria-label={`${metric === "revenue" ? "Revenue" : "Purchases"} over time`}
        className="mt-4 block h-auto w-full overflow-visible"
        onMouseLeave={() => setHoveredIndex(null)}
        role="img"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      >
        <defs>
          <linearGradient id="chartAreaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#00d9f5" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00d9f5" stopOpacity="0" />
          </linearGradient>
          <filter id="chartLineGlow" x="-10%" y="-30%" width="120%" height="160%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        {yTicks.map((tick) => {
          const y = baseline - (tick / axisMax) * plotHeight;
          return (
            <g key={`y-${tick}`}>
              <line
                stroke={tick === 0 ? "#c7e9ef" : "#eef8fa"}
                strokeWidth="1"
                x1={CHART_PAD_LEFT}
                x2={CHART_PAD_LEFT + plotWidth}
                y1={y}
                y2={y}
              />
              <text fill="#5a8b93" fontSize="11" textAnchor="end" x={CHART_PAD_LEFT - 10} y={y + 4}>
                {formatTick(tick)}
              </text>
            </g>
          );
        })}

        {data.map((point, index) =>
          // Skip a regular label that would crowd the always-shown last date.
          (index % labelEvery === 0 && data.length - 1 - index >= labelEvery / 2) || index === data.length - 1 ? (
            <text
              fill="#5a8b93"
              fontSize="11"
              key={`x-${point.date}`}
              textAnchor={data.length === 1 ? "middle" : index === 0 ? "start" : index === data.length - 1 ? "end" : "middle"}
              x={points[index].x}
              y={CHART_HEIGHT - 8}
            >
              {formatAxisDate(point.date)}
            </text>
          ) : null
        )}

        <path d={areaPath} fill="url(#chartAreaGradient)" />
        <path
          d={linePath}
          fill="none"
          filter="url(#chartLineGlow)"
          opacity="0.35"
          stroke="#00d9f5"
          strokeLinecap="round"
          strokeWidth="8"
        />
        <path d={linePath} fill="none" stroke="#00b8cf" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />

        {hoveredIndex != null ? (
          <line
            stroke="#c7e9ef"
            strokeDasharray="3 4"
            x1={activePoint.x}
            x2={activePoint.x}
            y1={CHART_PAD_TOP}
            y2={baseline}
          />
        ) : null}

        <circle cx={activePoint.x} cy={activePoint.y} fill="#00d9f5" filter="url(#chartLineGlow)" opacity="0.5" r="9" />
        <circle cx={activePoint.x} cy={activePoint.y} fill="#00b8cf" r="5.5" stroke="#ffffff" strokeWidth="2.5" />

        {data.map((point, index) => (
          <rect
            fill="transparent"
            height={CHART_HEIGHT}
            key={`hit-${point.date}`}
            onMouseEnter={() => setHoveredIndex(index)}
            width={hitWidth}
            x={data.length > 1 ? points[index].x - step / 2 : CHART_PAD_LEFT}
            y={0}
          />
        ))}
      </svg>


      {hasMixedCurrencies && metric === "revenue" ? (
        <p className="mt-2 text-[10px] font-semibold text-muted">Revenue mixes multiple currencies; totals are approximate.</p>
      ) : null}
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
  const [month, setMonth] = useState(currentUtcMonth);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const purchases = dashboard?.purchases ?? [];
  const chart = dashboard?.chart ?? [];
  const users = dashboard?.users ?? [];
  const recentOtpRequests = dashboard?.recentOtpRequests ?? [];
  const summary = dashboard?.summary ?? {
    purchaseCount: 0,
    userCount: 0,
    revenueByCurrency: {},
    costByCurrency: {},
    profitByCurrency: {},
    latestPurchaseAt: null,
    month: null
  };

  const latestPurchase = useMemo(() => formatDate(summary.latestPurchaseAt), [summary.latestPurchaseAt]);
  const totalRevenue = useMemo(
    () => formatRevenue(summary.revenueByCurrency),
    [summary.revenueByCurrency]
  );
  const totalSpend = useMemo(
    () => formatRevenue(summary.costByCurrency ?? {}),
    [summary.costByCurrency]
  );
  const totalProfit = useMemo(
    () => formatRevenue(summary.profitByCurrency ?? {}),
    [summary.profitByCurrency]
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
      if (month) params.set("month", month);
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
  }, [token, purchasesPage, usersPage, otpPage, month]);

  return (
    <>
      <AdminNav />
      <div className="min-h-screen bg-cloud px-6 py-7 md:px-9">
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
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-[11px] font-bold text-midnight shadow-sm">
                Month
                <input
                  className="bg-transparent text-xs font-semibold text-midnight outline-none"
                  onChange={(event) => {
                    setMonth(event.target.value);
                    setPurchasesPage(1);
                  }}
                  type="month"
                  value={month}
                />
              </label>
              <button
                className="h-10 rounded-xl border border-line bg-white px-4 text-xs font-bold text-midnight shadow-sm transition hover:border-cyan disabled:opacity-50"
                onClick={() => {
                  setMonth("");
                  setPurchasesPage(1);
                }}
                type="button"
              >
                All time
              </button>
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
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
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

            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
              <StatCard accent="cyan" icon={ShoppingBag} label="Total purchases" value={summary.purchaseCount} />
              <StatCard accent="teal" icon={DollarSign} label="Earned" value={totalRevenue} />
              <StatCard accent="blue" icon={Wallet} label="Spent" value={totalSpend} />
              <StatCard accent="ink" icon={TrendingUp} label="Profit" value={totalProfit} />
              <StatCard accent="blue" icon={BarChart3} label="Latest purchase" value={latestPurchase} />
              <StatCard accent="ink" icon={Users} label="Total users" value={summary.userCount ?? users.length} />
            </div>
            <p className="text-[11px] font-semibold text-muted">
              Spent uses the current Airalo buy price for each package. Totals follow the selected month
              {month ? ` (${month})` : " (all time)"}.
            </p>

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
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">Cost</th>
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
                        <td className="px-3 py-3 font-bold text-midnight">
                          {formatMoney(purchase.costCents, purchase.costCurrency)}
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
    </>
  );
}
