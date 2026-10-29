"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { RefreshCw, Search, X } from "lucide-react";
import { AdminNav } from "../AdminNav";
import { AdminLoginCard } from "../AdminLoginCard";
import { useAdminSession } from "../useAdminSession";
import { Button } from "../components/Button";
import { DailyEarnings, PeriodSummary, TodayCards } from "./DashboardFinances";
import { PurchaseList } from "./PurchaseList";
import { AudienceTables } from "./AudienceTables";
import {
  currentUtcMonth,
  formatDate,
  type Dashboard,
  type ProviderState,
} from "./dashboard-model";

import {
  createProviderChecks,
  requestAdminData,
  startProviderQueue,
} from "./dashboard-requests";

const DashboardLoading = dynamic(() => import("./DashboardLoading"), {
  ssr: false,
  loading: () => (
    <p
      role="status"
      className="py-12 text-center text-sm text-onSurfaceVariant"
    >
      Loading your dashboard…
    </p>
  ),
});

const TABS = [
  { id: "purchases", label: "Purchases" },
  { id: "daily", label: "Daily earnings" },
  { id: "users", label: "Users" },
  { id: "otp", label: "OTP activity" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export default function AdminDashboardPage() {
  const session = useAdminSession();
  const { token, handleUnauthorized } = session;
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [month, setMonth] = useState(currentUtcMonth);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [customer, setCustomer] = useState("");
  const [tab, setTab] = useState<Tab>("purchases");
  const [purchasesPage, setPurchasesPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [otpPage, setOtpPage] = useState(1);
  const [dailyPage, setDailyPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [providers, setProviders] = useState<Record<string, ProviderState>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const sessionToken = useRef(token);
  sessionToken.current = token;
  const providerChecks = useMemo(
    () => createProviderChecks({
      token,
      isCurrent: () => sessionToken.current === token,
      onUnauthorized: handleUnauthorized,
      onState: (id, state) =>
        setProviders((previous) => ({ ...previous, [id]: state })),
    }),
    [token, handleUnauthorized],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query.trim());
      setPurchasesPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setProviders({});
    setExpanded(null);
    setDashboard(null);
    return () => providerChecks.cancelPending();
  }, [token, providerChecks]);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      purchasesPage: String(purchasesPage),
      purchasesPageSize: "10",
      usersPage: String(usersPage),
      usersPageSize: "10",
      otpPage: String(otpPage),
      otpPageSize: "10",
    });
    if (month) params.set("month", month);
    if (search) params.set("q", search);
    if (customer) params.set("userEmail", customer);
    void (async () => {
      try {
        const data = await requestAdminData<Dashboard>(
          `/bff/admin/dashboard?${params}`,
          {
            token,
            signal: controller.signal,
            isCurrent: () => sessionToken.current === token,
            onUnauthorized: handleUnauthorized,
          },
        );
        if (controller.signal.aborted) return;
        setDashboard(data);
        setExpanded(null);
        setUpdatedAt(new Date().toISOString());
      } catch (err) {
        if (!controller.signal.aborted)
          setError(
            err instanceof Error ? err.message : "Could not load dashboard.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [
    token,
    month,
    search,
    customer,
    purchasesPage,
    usersPage,
    otpPage,
    revision,
    handleUnauthorized,
  ]);

  useEffect(() => {
    if (tab !== "purchases" || !dashboard || loading) return;
    return startProviderQueue(
      dashboard.purchases.map((purchase) => purchase.id),
      providerChecks,
    );
  }, [dashboard, tab, loading, providerChecks]);

  const changeMonth = (value: string) => {
    setMonth(value);
    setPurchasesPage(1);
    setDailyPage(1);
  };
  const showCustomer = (email: string) => {
    setQuery("");
    setSearch("");
    setCustomer(email);
    setMonth("");
    setPurchasesPage(1);
    setDailyPage(1);
    setTab("purchases");
  };
  const clearFilters = () => {
    setCustomer("");
    setQuery("");
    setSearch("");
    setPurchasesPage(1);
  };

  return (
    <>
      <AdminNav session={session} />
      <main className="min-h-screen bg-surfaceBright px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1600px]">
          <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-brandBlue">Operations</p>
              <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-brandInk">
                Sales &amp; eSIMs
              </h1>
              <p className="mt-2 text-sm text-onSurfaceVariant">
                Daily earnings and customer packages, in one place.
              </p>
            </div>
            {token ? (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs text-onSurfaceVariant">
                  {updatedAt
                    ? `Updated ${formatDate(updatedAt)} UTC`
                    : "Reporting in UTC"}
                </p>
                <Button
                  size="sm"
                  variant="tint"
                  loading={loading}
                  onClick={() => setRevision((value) => value + 1)}
                >
                  <RefreshCw aria-hidden="true" size={14} />
                  Refresh sales
                </Button>
              </div>
            ) : null}
          </header>
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
          ) : (
            <div className="space-y-5">
              {error ? (
                <div
                  role="alert"
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                >
                  <p>
                    {error}
                    {dashboard
                      ? " Showing the last loaded results; your new filters have not loaded."
                      : ""}
                  </p>
                  <Button
                    size="sm"
                    variant="tint"
                    onClick={() => setRevision((value) => value + 1)}
                  >
                    Try again
                  </Button>
                </div>
              ) : null}
              {!dashboard && loading ? (
                <DashboardLoading />
              ) : dashboard ? (
                <>
                  <div>
                    <h2 className="mb-3 text-sm font-semibold text-brandInk">
                      Today{" "}
                      <span className="ml-1 font-normal text-onSurfaceVariant">
                        {formatDate(
                          dashboard.today
                            ? `${dashboard.today.date}T00:00:00Z`
                            : new Date().toISOString(),
                          true,
                        )}{" "}
                        · UTC
                      </span>
                    </h2>
                    <TodayCards
                      dashboard={dashboard}
                      onUsers={() => setTab("users")}
                    />
                  </div>
                  <section
                    aria-label="Period and filters"
                    className="space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="flex h-10 items-center gap-2 rounded-xl border border-outline bg-white px-3 text-sm font-medium text-brandInk">
                          Period
                          <input
                            aria-label="Reporting month"
                            className="min-w-0 bg-transparent text-sm outline-none focus-visible:ring-2 focus-visible:ring-brandBlue"
                            type="month"
                            value={month}
                            onChange={(event) =>
                              changeMonth(event.target.value)
                            }
                          />
                        </label>
                        <Button
                          size="sm"
                          variant={
                            month === currentUtcMonth() ? "tint" : "ghost"
                          }
                          onClick={() => changeMonth(currentUtcMonth())}
                        >
                          This month
                        </Button>
                        <Button
                          size="sm"
                          variant={!month ? "tint" : "ghost"}
                          onClick={() => changeMonth("")}
                        >
                          All time
                        </Button>
                      </div>
                      <span className="text-xs text-onSurfaceVariant">
                        Period applies to earnings and purchases
                      </span>
                    </div>
                    <PeriodSummary
                      dashboard={dashboard}
                      month={dashboard.summary.month ?? ""}
                    />
                    <p className="text-xs leading-relaxed text-onSurfaceVariant">
                      Costs use current Airalo catalogue prices. Profit is an
                      estimate before payment fees and partner commissions.
                      Currencies are kept separate; unavailable costs make
                      profit incomplete.
                    </p>
                  </section>
                  <div>
                    <div
                      role="tablist"
                      aria-label="Dashboard sections"
                      className="flex gap-1 overflow-x-auto border-b border-outline"
                    >
                      {TABS.map(({ id, label }, index) => (
                        <button
                          key={id}
                          id={`tab-${id}`}
                          role="tab"
                          type="button"
                          aria-selected={tab === id}
                          aria-controls={`panel-${id}`}
                          tabIndex={tab === id ? 0 : -1}
                          onClick={() => setTab(id)}
                          onKeyDown={(event) => {
                            const next =
                              event.key === "ArrowRight"
                                ? (index + 1) % TABS.length
                                : event.key === "ArrowLeft"
                                  ? (index - 1 + TABS.length) % TABS.length
                                  : event.key === "Home"
                                    ? 0
                                    : event.key === "End"
                                      ? TABS.length - 1
                                      : null;
                            if (next != null) {
                              event.preventDefault();
                              setTab(TABS[next].id);
                              document
                                .getElementById(`tab-${TABS[next].id}`)
                                ?.focus();
                            }
                          }}
                          className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-brandBlue ${tab === id ? "border-brandBlue text-brandBlue" : "border-transparent text-onSurfaceVariant hover:text-brandInk"}`}
                        >
                          {label}
                          {id === "users"
                            ? ` (${dashboard.summary.userCount.toLocaleString()})`
                            : ""}
                        </button>
                      ))}
                    </div>
                    <div
                      id={`panel-${tab}`}
                      role="tabpanel"
                      aria-labelledby={`tab-${tab}`}
                      aria-busy={loading}
                      className={`mt-4 space-y-4 ${loading ? "opacity-60" : ""}`}
                    >
                      {tab === "purchases" ? (
                        <>
                          <div className="flex flex-wrap items-center gap-3">
                            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-outline bg-white px-3 py-2.5 sm:max-w-md">
                              <Search
                                aria-hidden="true"
                                size={16}
                                className="shrink-0 text-onSurfaceVariant"
                              />
                              <input
                                aria-label="Search customer or package"
                                className="min-w-0 flex-1 bg-transparent text-sm text-brandInk outline-none placeholder:text-onSurfaceVariant focus-visible:ring-2 focus-visible:ring-brandBlue"
                                value={query}
                                onChange={(event) =>
                                  setQuery(event.target.value)
                                }
                                placeholder="Search customer, package or destination…"
                              />
                            </label>
                            {customer ? (
                              <span className="max-w-full break-all rounded-lg bg-brandBlue/10 px-3 py-2 text-xs text-brandBlue">
                                Customer: {customer}
                              </span>
                            ) : null}
                            {query || customer ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={clearFilters}
                              >
                                <X aria-hidden="true" size={14} />
                                Clear
                              </Button>
                            ) : null}
                          </div>
                          {loading ? (
                            <p
                              role="status"
                              className="text-xs text-onSurfaceVariant"
                            >
                              Updating results… Showing the previous results
                              until your filters load.
                            </p>
                          ) : null}
                          <PurchaseList
                            dashboard={dashboard}
                            providers={providers}
                            expanded={expanded}
                            onExpand={(id) =>
                              setExpanded((previous) =>
                                previous === id ? null : id,
                              )
                            }
                            onRetry={(id) => void providerChecks.check(id, true)}
                            loading={loading}
                            onPageChange={setPurchasesPage}
                          />
                        </>
                      ) : tab === "daily" ? (
                        <DailyEarnings
                          days={dashboard.dailyEarnings ?? []}
                          page={dailyPage}
                          onPageChange={setDailyPage}
                        />
                      ) : (
                        <AudienceTables
                          dashboard={dashboard}
                          tab={tab}
                          loading={loading}
                          onPageChange={
                            tab === "users" ? setUsersPage : setOtpPage
                          }
                          onCustomer={showCustomer}
                        />
                      )}
                    </div>
                  </div>
                </>
              ) : !error ? (
                <p
                  role="status"
                  className="py-12 text-center text-sm text-onSurfaceVariant"
                >
                  Preparing dashboard…
                </p>
              ) : null}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
