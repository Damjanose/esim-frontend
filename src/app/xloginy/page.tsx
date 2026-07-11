"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { BarChart3, LockKeyhole, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { AdminNav } from "../AdminNav";

type AdminLoginResponse = {
  status?: string;
  data?: {
    token?: string;
  };
  message?: string;
};

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
    users?: DashboardUser[];
    recentOtpRequests?: OtpRequestEvent[];
  };
  message?: string;
};

const ADMIN_TOKEN_STORAGE_KEY = "velocity-admin-dashboard-token";

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

function PurchasesChart({ data }: { data: ChartPoint[] }) {
  const maxPurchases = Math.max(1, ...data.map((point) => point.purchases));
  const width = Math.max(360, data.length * 64);
  const height = 220;
  const chartHeight = 150;
  const barWidth = data.length > 0 ? Math.max(18, Math.min(42, width / data.length - 18)) : 32;

  if (data.length === 0) {
    return (
      <div className="grid min-h-56 place-items-center rounded-lg border border-dashed border-line bg-white text-sm font-semibold text-slate-500">
        No purchases yet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <svg aria-label="Purchases over time" className="min-w-full" role="img" viewBox={`0 0 ${width} ${height}`}>
        <line x1="24" x2={width - 18} y1="172" y2="172" stroke="#c7e9ef" strokeWidth="2" />
        {data.map((point, index) => {
          const x = 36 + index * (width / data.length);
          const barHeight = Math.max(8, (point.purchases / maxPurchases) * chartHeight);
          const y = 172 - barHeight;

          return (
            <g key={point.date}>
              <rect
                className="fill-cyan transition hover:fill-aqua"
                height={barHeight}
                rx="6"
                width={barWidth}
                x={x}
                y={y}
              />
              <text fill="#001f26" fontSize="13" fontWeight="800" textAnchor="middle" x={x + barWidth / 2} y={y - 8}>
                {point.purchases}
              </text>
              <text fill="#64748b" fontSize="11" textAnchor="middle" x={x + barWidth / 2} y="198">
                {point.date.slice(5)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [dashboard, setDashboard] = useState<DashboardPayload["data"] | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [error, setError] = useState("");

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
      const response = await fetch("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${nextToken}` },
        cache: "no-store"
      });
      const payload = (await response.json()) as DashboardPayload;

      if (response.status === 401) {
        sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
        setToken("");
        throw new Error("Session expired. Sign in again.");
      }

      if (!response.ok || payload.status !== "success" || !payload.data) {
        throw new Error(payload.message ?? "Could not load dashboard");
      }

      setDashboard(payload.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load dashboard");
      setDashboard(null);
    } finally {
      setIsLoadingDashboard(false);
    }
  }

  useEffect(() => {
    const storedToken = sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
    if (!storedToken) return;
    setToken(storedToken);
    void loadDashboard(storedToken);
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoggingIn(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const payload = (await response.json()) as AdminLoginResponse;
      const nextToken = payload.data?.token;

      if (!response.ok || payload.status !== "success" || !nextToken) {
        throw new Error(payload.message ?? "Invalid admin credentials");
      }

      sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, nextToken);
      setToken(nextToken);
      setPassword("");
      await loadDashboard(nextToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid admin credentials");
    } finally {
      setIsLoggingIn(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    setToken("");
    setDashboard(null);
    setError("");
  }

  return (
    <main className="min-h-screen bg-cloud text-ink">
      <section className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-12">
        <AdminNav />
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-black uppercase text-cyan">
              <ShieldCheck aria-hidden="true" size={18} />
              Admin
            </p>
            <h1 className="mt-2 font-display text-3xl font-black text-midnight md:text-5xl">
              Purchase dashboard
            </h1>
          </div>
          {token ? (
            <div className="flex gap-2">
              <button
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-bold text-midnight transition hover:border-cyan"
                disabled={isLoadingDashboard}
                onClick={() => void loadDashboard()}
                type="button"
              >
                <RefreshCw aria-hidden="true" size={16} />
                Refresh
              </button>
              <button
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-midnight px-4 text-sm font-bold text-white transition hover:bg-ink"
                onClick={handleLogout}
                type="button"
              >
                <LogOut aria-hidden="true" size={16} />
                Logout
              </button>
            </div>
          ) : null}
        </div>

        {!token ? (
          <form
            className="mx-auto max-w-md rounded-lg border border-line bg-white p-6 shadow-sm"
            onSubmit={handleLogin}
          >
            <span className="mb-5 grid h-12 w-12 place-items-center rounded-lg bg-cyan/15 text-midnight">
              <LockKeyhole aria-hidden="true" size={22} />
            </span>
            <label className="block text-sm font-bold text-midnight" htmlFor="admin-email">
              Email
            </label>
            <input
              autoComplete="email"
              className="mt-2 h-12 w-full rounded-lg border border-line px-4 text-sm outline-none transition focus:border-cyan"
              id="admin-email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
            <label className="mt-4 block text-sm font-bold text-midnight" htmlFor="admin-password">
              Password
            </label>
            <input
              autoComplete="current-password"
              className="mt-2 h-12 w-full rounded-lg border border-line px-4 text-sm outline-none transition focus:border-cyan"
              id="admin-password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
            {error ? <p className="mt-4 text-sm font-semibold text-red-600">{error}</p> : null}
            <button
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-lg bg-midnight px-5 text-sm font-black text-cyan transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoggingIn}
              type="submit"
            >
              {isLoggingIn ? "Signing in..." : "Sign in"}
            </button>
          </form>
        ) : (
          <div className="grid gap-6">
            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-4">
              <article className="rounded-lg border border-line bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase text-slate-500">Total purchases</p>
                <p className="mt-2 font-display text-3xl font-black text-midnight">
                  {summary.purchaseCount}
                </p>
              </article>
              <article className="rounded-lg border border-line bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase text-slate-500">Total revenue</p>
                <p className="mt-2 font-display text-3xl font-black text-midnight">{totalRevenue}</p>
              </article>
              <article className="rounded-lg border border-line bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase text-slate-500">Latest purchase</p>
                <p className="mt-2 text-lg font-black text-midnight">{latestPurchase}</p>
              </article>
              <article className="rounded-lg border border-line bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase text-slate-500">Total users</p>
                <p className="mt-2 font-display text-3xl font-black text-midnight">
                  {summary.userCount ?? users.length}
                </p>
              </article>
            </div>

            <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 aria-hidden="true" className="text-cyan" size={22} />
                <h2 className="font-display text-xl font-black text-midnight">Purchases over time</h2>
              </div>
              <PurchasesChart data={chart} />
            </section>

            <section className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
              <div className="border-b border-line px-4 py-3">
                <h2 className="font-display text-xl font-black text-midnight">Purchases</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead className="bg-midnight text-white">
                    <tr>
                      <th className="px-4 py-3 font-black">Email</th>
                      <th className="px-4 py-3 font-black">Package</th>
                      <th className="px-4 py-3 font-black">Price</th>
                      <th className="px-4 py-3 font-black">Status</th>
                      <th className="px-4 py-3 font-black">Purchased At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((purchase) => (
                      <tr className="border-t border-line" key={purchase.id}>
                        <td className="px-4 py-3 font-semibold text-midnight">{purchase.userEmail}</td>
                        <td className="px-4 py-3 text-slate-600">{purchase.packageId}</td>
                        <td className="px-4 py-3 font-bold text-midnight">
                          {formatMoney(purchase.paymentAmountCents, purchase.paymentCurrency)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{purchase.paymentStatus ?? "unknown"}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(purchase.providerCreatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
              <div className="border-b border-line px-4 py-3">
                <h2 className="font-display text-xl font-black text-midnight">Users</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead className="bg-midnight text-white">
                    <tr>
                      <th className="px-4 py-3 font-black">Email</th>
                      <th className="px-4 py-3 font-black">Created</th>
                      <th className="px-4 py-3 font-black">Updated</th>
                      <th className="px-4 py-3 font-black">OTP requests</th>
                      <th className="px-4 py-3 font-black">Latest OTP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? (
                      users.map((user) => (
                        <tr className="border-t border-line" key={user.email}>
                          <td className="px-4 py-3 font-semibold text-midnight">{user.email}</td>
                          <td className="px-4 py-3 text-slate-600">{formatDate(user.createdAt)}</td>
                          <td className="px-4 py-3 text-slate-600">{formatDate(user.updatedAt)}</td>
                          <td className="px-4 py-3 font-bold text-midnight">{user.otpRequestCount}</td>
                          <td className="px-4 py-3 text-slate-600">{formatDate(user.lastOtpRequestedAt)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-t border-line">
                        <td className="px-4 py-5 text-center text-sm font-semibold text-slate-500" colSpan={5}>
                          No users yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
              <div className="border-b border-line px-4 py-3">
                <h2 className="font-display text-xl font-black text-midnight">Recent OTP requests</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead className="bg-midnight text-white">
                    <tr>
                      <th className="px-4 py-3 font-black">Email</th>
                      <th className="px-4 py-3 font-black">Status</th>
                      <th className="px-4 py-3 font-black">Timestamp</th>
                      <th className="px-4 py-3 font-black">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOtpRequests.length > 0 ? (
                      recentOtpRequests.map((request) => (
                        <tr className="border-t border-line" key={request.id}>
                          <td className="px-4 py-3 font-semibold text-midnight">{request.email}</td>
                          <td className="px-4 py-3 font-bold text-midnight">{formatOtpStatus(request.status)}</td>
                          <td className="px-4 py-3 text-slate-600">{formatDate(request.createdAt)}</td>
                          <td className="px-4 py-3 text-slate-600">{request.errorMessage ?? "N/A"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-t border-line">
                        <td className="px-4 py-5 text-center text-sm font-semibold text-slate-500" colSpan={4}>
                          No OTP requests yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
