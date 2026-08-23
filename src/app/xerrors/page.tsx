"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, LogOut } from "lucide-react";
import { AdminNav } from "../AdminNav";
import { AdminLoginCard } from "../AdminLoginCard";
import { useAdminSession } from "../useAdminSession";

type ErrorEvent = {
  id: string;
  requestId: string;
  userEmail: string | null;
  method: string;
  path: string;
  statusCode: number;
  severity: string;
  area: string;
  message: string;
  internalCode: string | null;
  safeRequestBody: unknown;
  safeQuery: unknown;
  providerName: string | null;
  providerStatusCode: number | null;
  providerMessage: string | null;
  providerEndpoint: string | null;
  relatedOrderId: string | null;
  relatedPaymentReference: string | null;
  relatedPackageId: string | null;
  relatedIccid: string | null;
  repairAction: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

type ErrorListPayload = {
  status?: string;
  data?: {
    errors?: ErrorEvent[];
    error?: ErrorEvent;
    repairResult?: unknown;
  };
  message?: string;
};

function formatDate(value: string | null) {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "short",
    timeStyle: "medium"
  }).format(new Date(value));
}

function stringifyJson(value: unknown) {
  if (value == null) return "N/A";
  return JSON.stringify(value, null, 2);
}

function buildSafeCurl(error: ErrorEvent) {
  const lines = [
    `curl -X ${error.method} "https://esim.uplisoft.com${error.path}"`,
    `  -H "Content-Type: application/json"`,
    `  -H "Authorization: Bearer <user-token>"`
  ];
  if (error.safeRequestBody && error.method !== "GET") {
    lines.push(`  --data '${JSON.stringify(error.safeRequestBody)}'`);
  }
  return lines.join(" \\\n");
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

export default function AdminErrorInboxPage() {
  const session = useAdminSession();
  const { token, handleUnauthorized } = session;

  const [errors, setErrors] = useState<ErrorEvent[]>([]);
  const [selectedError, setSelectedError] = useState<ErrorEvent | null>(null);
  const [filterEmail, setFilterEmail] = useState("");
  const [filterRequestId, setFilterRequestId] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [unresolvedOnly, setUnresolvedOnly] = useState(true);
  const [adminNotes, setAdminNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const summary = useMemo(() => {
    return {
      unresolved: errors.filter((item) => !item.resolvedAt).length,
      critical: errors.filter((item) => item.severity === "critical").length,
      payments: errors.filter((item) => item.area === "payments").length
    };
  }, [errors]);

  async function loadErrors(nextToken = token) {
    if (!nextToken) return;
    setIsLoading(true);
    setError("");
    setNotice("");

    const params = new URLSearchParams();
    if (filterEmail.trim()) params.set("email", filterEmail.trim());
    if (filterRequestId.trim()) params.set("requestId", filterRequestId.trim());
    if (filterArea) params.set("area", filterArea);
    if (filterSeverity) params.set("severity", filterSeverity);
    params.set("unresolvedOnly", String(unresolvedOnly));

    try {
      const response = await fetch(`/bff/admin/errors?${params.toString()}`, {
        headers: { Authorization: `Bearer ${nextToken}` },
        cache: "no-store"
      });
      const payload = (await response.json()) as ErrorListPayload;

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }

      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? "Could not load errors");
      }

      const nextErrors = payload.data?.errors ?? [];
      setErrors(nextErrors);
      setSelectedError((current) => {
        if (!current) return nextErrors[0] ?? null;
        return nextErrors.find((item) => item.id === current.id) ?? nextErrors[0] ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load errors");
      setErrors([]);
      setSelectedError(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (token) void loadErrors(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    setAdminNotes(selectedError?.adminNotes ?? "");
  }, [selectedError]);

  async function updateSelected(body: { resolved?: boolean; adminNotes?: string }) {
    if (!selectedError) return;
    setIsMutating(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/bff/admin/errors/${selectedError.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      const payload = (await response.json()) as ErrorListPayload;
      if (!response.ok || payload.status !== "success" || !payload.data?.error) {
        throw new Error(payload.message ?? "Could not update error");
      }
      setSelectedError(payload.data.error);
      setErrors((current) =>
        current.map((item) => (item.id === payload.data?.error?.id ? payload.data.error : item))
      );
      setNotice("Saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update error");
    } finally {
      setIsMutating(false);
    }
  }

  async function repairSelected() {
    if (!selectedError) return;
    setIsMutating(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/bff/admin/errors/${selectedError.id}/repair`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = (await response.json()) as ErrorListPayload;
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? "Could not run repair");
      }
      if (payload.data?.error) {
        setSelectedError(payload.data.error);
      }
      setNotice("Repair action completed");
      await loadErrors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not run repair");
    } finally {
      setIsMutating(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-cloud">
      <AdminNav />
      <div className="min-w-0 flex-1 px-6 py-7 md:px-9">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-cyanDeep">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_8px_#00d9f5]" />
              Admin · Live
            </p>
            <h1 className="mt-1 font-display text-[26px] font-black tracking-tight text-midnight md:text-[30px]">
              Error Inbox
            </h1>
            <p className="mt-1 text-sm font-semibold text-muted">Admin debugging for failed API requests.</p>
          </div>
          {token ? (
            <div className="flex gap-2">
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-xs font-bold text-midnight shadow-sm transition hover:border-cyan"
                onClick={() => void loadErrors()}
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
              <StatCard label="Unresolved" value={summary.unresolved} />
              <StatCard label="Critical" value={summary.critical} />
              <StatCard label="Payment/Provision" value={summary.payments} />
              <StatCard label="Loaded" value={errors.length} />
            </div>

            <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
              <div className="grid gap-3 md:grid-cols-6 md:items-end">
                <label className="text-xs font-bold text-muted">
                  Email
                  <input
                    className="mt-1 h-10 w-full rounded-xl border border-line px-2.5 text-sm font-normal text-midnight outline-none focus:border-cyan"
                    onChange={(event) => setFilterEmail(event.target.value)}
                    value={filterEmail}
                  />
                </label>
                <label className="text-xs font-bold text-muted">
                  Request ID
                  <input
                    className="mt-1 h-10 w-full rounded-xl border border-line px-2.5 text-sm font-normal text-midnight outline-none focus:border-cyan"
                    onChange={(event) => setFilterRequestId(event.target.value)}
                    value={filterRequestId}
                  />
                </label>
                <label className="text-xs font-bold text-muted">
                  Area
                  <select
                    className="mt-1 h-10 w-full rounded-xl border border-line px-2 text-sm font-normal text-midnight"
                    onChange={(event) => setFilterArea(event.target.value)}
                    value={filterArea}
                  >
                    <option value="">All</option>
                    <option value="payments">payments</option>
                    <option value="auth">auth</option>
                    <option value="packages">packages</option>
                    <option value="orders">orders</option>
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </label>
                <label className="text-xs font-bold text-muted">
                  Severity
                  <select
                    className="mt-1 h-10 w-full rounded-xl border border-line px-2 text-sm font-normal text-midnight"
                    onChange={(event) => setFilterSeverity(event.target.value)}
                    value={filterSeverity}
                  >
                    <option value="">All</option>
                    <option value="critical">critical</option>
                    <option value="warning">warning</option>
                    <option value="info">info</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-midnight">
                  <input
                    checked={unresolvedOnly}
                    onChange={(event) => setUnresolvedOnly(event.target.checked)}
                    type="checkbox"
                  />
                  Unresolved only
                </label>
                <button
                  className="h-10 rounded-xl bg-gradient-to-r from-midnight to-ink px-4 text-xs font-black text-aqua shadow-glow transition hover:opacity-90 disabled:opacity-50"
                  disabled={isLoading}
                  onClick={() => void loadErrors()}
                  type="button"
                >
                  {isLoading ? "Loading..." : "Apply"}
                </button>
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
              <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-[#f8fdfe]">
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wide text-muted">Time</th>
                        <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                          Severity
                        </th>
                        <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">Area</th>
                        <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                          Email
                        </th>
                        <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">API</th>
                        <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                          Status
                        </th>
                        <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                          Message
                        </th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wide text-muted">
                          State
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {errors.map((item) => (
                        <tr
                          className={`cursor-pointer border-t border-line/60 transition hover:bg-[#fbfeff] ${
                            selectedError?.id === item.id ? "bg-[#eafcff]" : ""
                          }`}
                          key={item.id}
                          onClick={() => setSelectedError(item)}
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(item.createdAt)}</td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${severityBadgeClass(item.severity)}`}
                            >
                              {item.severity}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-muted">{item.area}</td>
                          <td className="px-3 py-3 text-midnight">{item.userEmail ?? "N/A"}</td>
                          <td className="px-3 py-3 font-mono text-xs text-muted">
                            {item.method} {item.path}
                          </td>
                          <td className="px-3 py-3 font-bold text-midnight">{item.statusCode}</td>
                          <td className="px-3 py-3 text-midnight">{item.message}</td>
                          <td className="px-4 py-3 text-muted">{item.resolvedAt ? "Resolved" : "Open"}</td>
                        </tr>
                      ))}
                      {errors.length === 0 ? (
                        <tr>
                          <td className="px-4 py-8 text-center font-bold text-muted" colSpan={8}>
                            No errors found
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </section>

              <aside className="rounded-2xl border border-line bg-white p-5 shadow-card">
                {selectedError ? (
                  <div className="grid gap-3">
                    <h2 className="font-display text-lg font-black text-midnight">Error Details</h2>
                    <dl className="grid grid-cols-[130px_1fr] gap-2 text-sm">
                      <dt className="font-bold text-muted">Request ID</dt>
                      <dd className="font-mono text-xs text-midnight">{selectedError.requestId}</dd>
                      <dt className="font-bold text-muted">User</dt>
                      <dd className="text-midnight">{selectedError.userEmail ?? "N/A"}</dd>
                      <dt className="font-bold text-muted">API</dt>
                      <dd className="font-mono text-xs text-midnight">
                        {selectedError.method} {selectedError.path}
                      </dd>
                      <dt className="font-bold text-muted">Provider</dt>
                      <dd className="text-midnight">
                        {selectedError.providerName ?? "N/A"} {selectedError.providerStatusCode ?? ""}
                      </dd>
                      <dt className="font-bold text-muted">Payment</dt>
                      <dd className="text-midnight">{selectedError.relatedPaymentReference ?? "N/A"}</dd>
                      <dt className="font-bold text-muted">Package</dt>
                      <dd className="text-midnight">{selectedError.relatedPackageId ?? "N/A"}</dd>
                      <dt className="font-bold text-muted">ICCID</dt>
                      <dd className="text-midnight">{selectedError.relatedIccid ?? "N/A"}</dd>
                      <dt className="font-bold text-muted">Repair action</dt>
                      <dd className="text-midnight">{selectedError.repairAction ?? "N/A"}</dd>
                    </dl>

                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-muted">Safe request body</p>
                      <pre className="mt-1 max-h-40 overflow-auto rounded-xl bg-[#f8fdfe] p-2.5 text-xs text-midnight">
                        {stringifyJson(selectedError.safeRequestBody)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-muted">Safe query</p>
                      <pre className="mt-1 max-h-32 overflow-auto rounded-xl bg-[#f8fdfe] p-2.5 text-xs text-midnight">
                        {stringifyJson(selectedError.safeQuery)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-muted">Copy safe cURL</p>
                      <pre className="mt-1 max-h-40 overflow-auto rounded-xl bg-[#f8fdfe] p-2.5 text-xs text-midnight">
                        {buildSafeCurl(selectedError)}
                      </pre>
                    </div>

                    <label className="text-xs font-black uppercase tracking-wide text-muted">
                      Admin notes
                      <textarea
                        className="mt-1 min-h-24 w-full rounded-xl border border-line p-2.5 text-sm font-normal text-midnight outline-none focus:border-cyan"
                        onChange={(event) => setAdminNotes(event.target.value)}
                        value={adminNotes}
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-bold text-midnight transition hover:border-cyan disabled:opacity-50"
                        disabled={isMutating}
                        onClick={() => navigator.clipboard?.writeText(selectedError.requestId)}
                        type="button"
                      >
                        Copy request id
                      </button>
                      <button
                        className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-bold text-midnight transition hover:border-cyan disabled:opacity-50"
                        disabled={isMutating}
                        onClick={() => navigator.clipboard?.writeText(buildSafeCurl(selectedError))}
                        type="button"
                      >
                        Copy safe cURL
                      </button>
                      <button
                        className="rounded-lg bg-gradient-to-r from-midnight to-ink px-3 py-2 text-xs font-black text-aqua shadow-sm transition hover:opacity-90 disabled:opacity-50"
                        disabled={isMutating}
                        onClick={() => void updateSelected({ adminNotes })}
                        type="button"
                      >
                        Save notes
                      </button>
                      <button
                        className="rounded-lg bg-green-700 px-3 py-2 text-xs font-black text-white transition hover:bg-green-800 disabled:opacity-50"
                        disabled={isMutating}
                        onClick={() => void updateSelected({ resolved: true, adminNotes })}
                        type="button"
                      >
                        Mark resolved
                      </button>
                      {selectedError.repairAction ? (
                        <button
                          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-black text-red-700 transition hover:border-red-400 disabled:opacity-50"
                          disabled={isMutating}
                          onClick={() => void repairSelected()}
                          type="button"
                        >
                          Run repair
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm font-bold text-muted">Select an error row to inspect details.</p>
                )}
              </aside>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
