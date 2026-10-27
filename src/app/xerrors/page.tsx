"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, LogOut, RefreshCw } from "lucide-react";
import { AdminNav } from "../AdminNav";
import { AdminLoginCard } from "../AdminLoginCard";
import { useAdminSession } from "../useAdminSession";
import { ErrorDetailPanel } from "./ErrorDetailPanel";
import { ErrorFiltersPanel } from "./ErrorFiltersPanel";
import {
  filtersFromSearchParams,
  filtersToBackendParams,
  filtersToUrlParams,
  type ErrorFilters
} from "@/lib/xerrors-filters";
import { describeEmailSource, type AdminErrorEvent } from "@/lib/xerrors-report";

type ErrorStats = {
  total: number;
  unresolved: number;
  critical: number;
  payment: number;
  byArea?: Record<string, number>;
  byNoEmailReason?: Record<string, number>;
  byPlatform?: Record<string, number>;
};

type InboxPayload = {
  status?: string;
  data?: {
    errors?: AdminErrorEvent[];
    nextCursor?: string | null;
    total?: number;
    error?: AdminErrorEvent;
    repairResult?: unknown;
  } & Partial<ErrorStats>;
  message?: string;
  error?: string;
};

function formatDate(value: string | null) {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "short",
    timeStyle: "medium"
  }).format(new Date(value));
}

function displaySeverity(error: Pick<AdminErrorEvent, "statusCode" | "severity">) {
  if (error.statusCode === 404 || error.statusCode >= 500 || error.severity === "critical") {
    return "critical";
  }
  return error.severity === "warning" ? "warning" : "critical";
}

function severityBadgeClass(severity: string) {
  if (severity === "critical") return "bg-red-50 text-red-700 border border-red-200";
  if (severity === "warning") return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-[#eafcff] text-cyanDeep border border-line";
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-line bg-white p-4 shadow-card">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(0,217,245,0.14),transparent_70%)]"
      />
      <p className="text-[10px] font-black uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-black text-midnight">{value}</p>
    </article>
  );
}

function Breakdown({ title, counts }: { title: string; counts?: Record<string, number> }) {
  const entries = Object.entries(counts ?? {}).filter(([, count]) => count > 0);
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-muted">
      <span className="font-black uppercase tracking-wide">{title}</span>
      {entries.map(([key, count]) => (
        <span className="rounded-full border border-line bg-white px-2 py-0.5 text-midnight" key={key}>
          {key} {count}
        </span>
      ))}
    </div>
  );
}

const TH = "px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted";

function EmailCell({ item }: { item: AdminErrorEvent }) {
  if (item.userEmail) {
    const source = describeEmailSource(item.userEmailSource);
    return (
      <>
        <span className="break-all">{item.userEmail}</span>
        {source.unverified ? (
          <span className="ml-1 text-[10px] font-semibold italic text-muted" title={`Hint only (${item.userEmailSource})`}>
            unverified
          </span>
        ) : null}
      </>
    );
  }
  return item.noEmailReason ? (
    <span className="rounded-full border border-line bg-[#f8fdfe] px-2 py-0.5 text-[10px] font-bold text-muted">
      {item.noEmailReason}
    </span>
  ) : (
    <span className="text-muted">N/A</span>
  );
}

function AdminErrorInbox() {
  const session = useAdminSession();
  const { token, handleUnauthorized } = session;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(() => filtersFromSearchParams(new URLSearchParams(searchParams.toString())), [searchParams]);
  const filterKey = filtersToUrlParams(filters).toString();

  // Cursor stack belongs to one filter set; a different key means page 1 again.
  const [cursorState, setCursorState] = useState<{ key: string; stack: string[] }>({ key: filterKey, stack: [] });
  const stack = cursorState.key === filterKey ? cursorState.stack : [];
  const cursor = stack.length > 0 ? stack[stack.length - 1] : undefined;

  const [errors, setErrors] = useState<AdminErrorEvent[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminErrorEvent | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reloadTick, setReloadTick] = useState(0);

  const applyFilters = useCallback(
    (next: ErrorFilters) => {
      const query = filtersToUrlParams(next).toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router]
  );

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    const headers = { Authorization: `Bearer ${token}` };

    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const listParams = filtersToBackendParams(filters, cursor);
        const statsParams = filtersToBackendParams(filters, undefined, { forStats: true });
        const [listResponse, statsResponse] = await Promise.all([
          fetch(`/bff/admin/errors?${listParams.toString()}`, { headers, cache: "no-store", signal: controller.signal }),
          fetch(`/bff/admin/errors/stats?${statsParams.toString()}`, { headers, cache: "no-store", signal: controller.signal })
        ]);

        if (listResponse.status === 401 || statsResponse.status === 401) {
          handleUnauthorized();
          throw new Error("Session expired. Sign in again.");
        }
        const payload = (await listResponse.json()) as InboxPayload;
        if (!listResponse.ok || payload.status !== "success") {
          throw new Error(payload.message ?? payload.error ?? "Could not load errors");
        }

        const nextErrors = payload.data?.errors ?? [];
        setErrors(nextErrors);
        setNextCursor(payload.data?.nextCursor ?? null);
        setTotal(typeof payload.data?.total === "number" ? payload.data.total : null);
        setSelectedId((current) =>
          current && nextErrors.some((item) => item.id === current) ? current : (nextErrors[0]?.id ?? null)
        );

        try {
          const statsPayload = (await statsResponse.json()) as InboxPayload;
          setStats(statsResponse.ok && statsPayload.status === "success" ? (statsPayload.data as ErrorStats) : null);
        } catch {
          setStats(null);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Could not load errors");
        setErrors([]);
        setNextCursor(null);
        setTotal(null);
        setStats(null);
        setSelectedId(null);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void load();
    return () => controller.abort();
    // `filters` is derived from filterKey; depending on the key avoids refetching on identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filterKey, cursor, reloadTick]);

  // The list omits authorizationHeader (hasAuthorization only); the detail endpoint has it.
  useEffect(() => {
    if (!token || !selectedId) {
      setDetail(null);
      return;
    }
    const controller = new AbortController();
    setIsLoadingDetail(true);
    (async () => {
      try {
        const response = await fetch(`/bff/admin/errors/${encodeURIComponent(selectedId)}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
          signal: controller.signal
        });
        if (response.status === 401) {
          handleUnauthorized();
          return;
        }
        const payload = (await response.json()) as InboxPayload;
        const full = payload.data?.error ?? (payload.data as unknown as AdminErrorEvent | undefined);
        if (response.ok && payload.status === "success" && full && full.id === selectedId) {
          setDetail(full);
        }
      } catch {
        // keep the list row; the cURL falls back to its placeholder
      } finally {
        if (!controller.signal.aborted) setIsLoadingDetail(false);
      }
    })();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedId, reloadTick]);

  const selected = useMemo(() => {
    const row = errors.find((item) => item.id === selectedId) ?? null;
    if (!row) return null;
    return detail && detail.id === row.id ? { ...row, ...detail } : row;
  }, [errors, selectedId, detail]);

  function mergeUpdated(updated: AdminErrorEvent) {
    setErrors((current) => current.map((item) => (item.id === updated.id ? { ...item, ...updated, authorizationHeader: undefined } : item)));
    setDetail((current) => (current && current.id === updated.id ? { ...current, ...updated } : current));
  }

  async function updateSelected(body: { resolved?: boolean; adminNotes?: string }) {
    if (!selected) return;
    setIsMutating(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/bff/admin/errors/${selected.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      const payload = (await response.json()) as InboxPayload;
      if (!response.ok || payload.status !== "success" || !payload.data?.error) {
        throw new Error(payload.message ?? payload.error ?? "Could not update error");
      }
      mergeUpdated(payload.data.error);
      setNotice("Saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update error");
    } finally {
      setIsMutating(false);
    }
  }

  async function claimSelected(body: Record<string, unknown>) {
    if (!selected) return;
    setIsMutating(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/bff/admin/errors/${encodeURIComponent(selected.id)}/claim`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      const payload = (await response.json()) as InboxPayload;
      if (!response.ok || payload.status !== "success") {
        // Guard refusals (409/400) carry the reason; show it verbatim.
        throw new Error(payload.message ?? payload.error ?? "Could not update the provisioning claim");
      }
      setNotice("Claim updated. Now press Run repair.");
      setReloadTick((tick) => tick + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the provisioning claim");
    } finally {
      setIsMutating(false);
    }
  }

  async function repairSelected() {
    if (!selected) return;
    setIsMutating(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/bff/admin/errors/${selected.id}/repair`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      const payload = (await response.json()) as InboxPayload;
      if (!response.ok || payload.status !== "success") {
        // 409 = the event's email is only a hint, so the backend refuses to repair; show its reason verbatim.
        throw new Error(payload.message ?? payload.error ?? "Could not run repair");
      }
      setNotice("Repair action completed");
      setReloadTick((tick) => tick + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not run repair");
    } finally {
      setIsMutating(false);
    }
  }

  const pageNumber = stack.length + 1;
  const pageSize = Number(filters.limit);

  return (
    <>
      <AdminNav />
      <div className="min-h-screen bg-cloud px-6 py-7 md:px-9">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-cyanDeep">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_8px_#00d9f5]" />
              Admin · Live
            </p>
            <h1 className="mt-1 font-display text-[26px] font-black tracking-tight text-midnight md:text-[30px]">
              Error Inbox
            </h1>
            <p className="mt-1 text-sm font-semibold text-muted">
              Server failures plus app and web client errors. Filters live in the URL, so a view is shareable.
            </p>
          </div>
          {token ? (
            <div className="flex gap-2">
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-xs font-bold text-midnight shadow-sm transition hover:border-cyan"
                onClick={() => setReloadTick((tick) => tick + 1)}
                type="button"
              >
                <RefreshCw aria-hidden="true" size={14} />
                Refresh
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
        ) : (
          <div className="grid gap-5">
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {error}
              </div>
            ) : null}
            {notice ? (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
                {notice}
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-4">
              <StatCard label="Unresolved" value={stats?.unresolved ?? "-"} />
              <StatCard label="Critical" value={stats?.critical ?? "-"} />
              <StatCard label="Payment/Provision" value={stats?.payment ?? "-"} />
              <StatCard label="Matching filters" value={stats?.total ?? total ?? "-"} />
            </div>
            {stats ? (
              <div className="grid gap-1.5">
                <Breakdown counts={stats.byArea} title="Area" />
                <Breakdown counts={stats.byPlatform} title="Platform" />
                <Breakdown counts={stats.byNoEmailReason} title="No email" />
              </div>
            ) : null}

            <ErrorFiltersPanel filters={filters} isLoading={isLoading} onApply={applyFilters} />

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
              <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-[#f8fdfe]">
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wide text-muted">Time</th>
                        <th className={TH}>Severity</th>
                        <th className={TH}>Source / Kind</th>
                        <th className={TH}>Area</th>
                        <th className={TH}>Email</th>
                        <th className={TH}>Platform / Version</th>
                        <th className={TH}>Screen</th>
                        <th className={TH}>Scenario / Stage</th>
                        <th className={TH}>API</th>
                        <th className={TH}>Status</th>
                        <th className={TH}>Message</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wide text-muted">State</th>
                      </tr>
                    </thead>
                    <tbody>
                      {errors.map((item) => {
                        const severity = displaySeverity(item);
                        return (
                          <tr
                            className={`cursor-pointer border-t border-line/60 transition hover:bg-[#fbfeff] ${
                              selectedId === item.id ? "bg-[#eafcff]" : ""
                            }`}
                            key={item.id}
                            onClick={() => setSelectedId(item.id)}
                          >
                            <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(item.createdAt)}</td>
                            <td className="px-3 py-3">
                              <span
                                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${severityBadgeClass(severity)}`}
                              >
                                {severity}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-xs text-muted">
                              {item.source ?? "server"}
                              <br />
                              {item.kind ?? "http_error"}
                            </td>
                            <td className="px-3 py-3 text-muted">{item.area}</td>
                            <td className="px-3 py-3 text-midnight">
                              <EmailCell item={item} />
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-xs text-muted">
                              {item.platform ?? "unknown"}
                              <br />
                              {item.appVersion ?? "-"}
                            </td>
                            <td className="px-3 py-3 text-xs text-muted">{item.screen ?? "-"}</td>
                            <td className="px-3 py-3 text-xs text-muted">
                              {item.scenario ?? "-"}
                              {item.stage ? <span className="block">{item.stage}</span> : null}
                            </td>
                            <td className="px-3 py-3 font-mono text-xs text-muted">
                              {item.method} {item.path}
                            </td>
                            <td className="px-3 py-3 font-bold text-midnight">{item.statusCode}</td>
                            <td className="max-w-[260px] px-3 py-3 text-midnight">{item.message}</td>
                            <td className="px-4 py-3 text-muted">{item.resolvedAt ? "Resolved" : "Open"}</td>
                          </tr>
                        );
                      })}
                      {errors.length === 0 ? (
                        <tr>
                          <td className="px-4 py-8 text-center font-bold text-muted" colSpan={12}>
                            {isLoading ? "Loading..." : "No errors found"}
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/60 px-4 py-3 text-xs font-semibold text-muted">
                  <span>
                    {errors.length > 0
                      ? `Showing ${(pageNumber - 1) * pageSize + 1}-${(pageNumber - 1) * pageSize + errors.length}`
                      : "Showing 0"}
                    {total != null ? ` of ${total}` : ""} · page {pageNumber}
                  </span>
                  <div className="flex gap-2">
                    <button
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-line bg-white px-3 font-bold text-midnight transition hover:border-cyan disabled:opacity-40"
                      disabled={stack.length === 0 || isLoading}
                      onClick={() => setCursorState({ key: filterKey, stack: stack.slice(0, -1) })}
                      type="button"
                    >
                      <ChevronLeft aria-hidden="true" size={14} />
                      Prev
                    </button>
                    <button
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-line bg-white px-3 font-bold text-midnight transition hover:border-cyan disabled:opacity-40"
                      disabled={!nextCursor || isLoading}
                      onClick={() => nextCursor && setCursorState({ key: filterKey, stack: [...stack, nextCursor] })}
                      type="button"
                    >
                      Next
                      <ChevronRight aria-hidden="true" size={14} />
                    </button>
                  </div>
                </div>
              </section>

              <aside className="rounded-2xl border border-line bg-white p-5 shadow-card">
                {selected ? (
                  <ErrorDetailPanel
                    detailLoaded={Boolean(detail && detail.id === selected.id)}
                    event={selected}
                    isLoadingDetail={isLoadingDetail}
                    isMutating={isMutating}
                    onClaim={(body) => void claimSelected(body)}
                    onNotice={setNotice}
                    onRepair={() => void repairSelected()}
                    onResolve={(adminNotes) => void updateSelected({ resolved: true, adminNotes })}
                    onSaveNotes={(adminNotes) => void updateSelected({ adminNotes })}
                  />
                ) : (
                  <p className="text-sm font-bold text-muted">Select an error row to inspect details.</p>
                )}
              </aside>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function AdminErrorInboxPage() {
  // useSearchParams needs a Suspense boundary for the client page to prerender.
  return (
    <Suspense fallback={null}>
      <AdminErrorInbox />
    </Suspense>
  );
}
