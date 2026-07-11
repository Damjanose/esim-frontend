"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type AdminLoginResponse = {
  status?: string;
  data?: {
    token?: string;
  };
  message?: string;
};

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

const ADMIN_TOKEN_STORAGE_KEY = "velocity-admin-dashboard-token";

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

export default function AdminErrorInboxPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [errors, setErrors] = useState<ErrorEvent[]>([]);
  const [selectedError, setSelectedError] = useState<ErrorEvent | null>(null);
  const [filterEmail, setFilterEmail] = useState("");
  const [filterRequestId, setFilterRequestId] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [unresolvedOnly, setUnresolvedOnly] = useState(true);
  const [adminNotes, setAdminNotes] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
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
      const response = await fetch(`/api/admin/errors?${params.toString()}`, {
        headers: { Authorization: `Bearer ${nextToken}` },
        cache: "no-store"
      });
      const payload = (await response.json()) as ErrorListPayload;

      if (response.status === 401) {
        sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
        setToken("");
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
    const storedToken = sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
    if (!storedToken) return;
    setToken(storedToken);
    void loadErrors(storedToken);
  }, []);

  useEffect(() => {
    setAdminNotes(selectedError?.adminNotes ?? "");
  }, [selectedError]);

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
      await loadErrors(nextToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid admin credentials");
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function updateSelected(body: { resolved?: boolean; adminNotes?: string }) {
    if (!selectedError) return;
    setIsMutating(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/errors/${selectedError.id}`, {
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
      const response = await fetch(`/api/admin/errors/${selectedError.id}/repair`, {
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

  function logout() {
    sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    setToken("");
    setErrors([]);
    setSelectedError(null);
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black">Error Inbox</h1>
            <p className="text-sm font-semibold text-slate-600">Admin debugging for failed API requests.</p>
          </div>
          {token ? (
            <div className="flex gap-2">
              <button className="rounded border bg-white px-3 py-2 text-sm font-bold" onClick={() => void loadErrors()} type="button">
                Refresh
              </button>
              <button className="rounded border bg-white px-3 py-2 text-sm font-bold" onClick={logout} type="button">
                Logout
              </button>
            </div>
          ) : null}
        </div>

        {!token ? (
          <form className="max-w-md rounded border bg-white p-4" onSubmit={handleLogin}>
            <label className="block text-sm font-bold" htmlFor="admin-email">Email</label>
            <input className="mt-1 h-10 w-full rounded border px-3" id="admin-email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
            <label className="mt-3 block text-sm font-bold" htmlFor="admin-password">Password</label>
            <input className="mt-1 h-10 w-full rounded border px-3" id="admin-password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
            {error ? <p className="mt-3 text-sm font-bold text-red-700">{error}</p> : null}
            <button className="mt-4 h-10 w-full rounded bg-slate-950 px-3 text-sm font-black text-white" disabled={isLoggingIn} type="submit">
              {isLoggingIn ? "Signing in..." : "Sign in"}
            </button>
          </form>
        ) : (
          <div className="grid gap-4">
            {error ? <div className="rounded border border-red-300 bg-red-50 p-3 text-sm font-bold text-red-800">{error}</div> : null}
            {notice ? <div className="rounded border border-green-300 bg-green-50 p-3 text-sm font-bold text-green-800">{notice}</div> : null}

            <div className="grid gap-2 sm:grid-cols-4">
              <div className="rounded border bg-white p-3"><p className="text-xs font-bold uppercase text-slate-500">Unresolved</p><p className="text-2xl font-black">{summary.unresolved}</p></div>
              <div className="rounded border bg-white p-3"><p className="text-xs font-bold uppercase text-slate-500">Critical</p><p className="text-2xl font-black">{summary.critical}</p></div>
              <div className="rounded border bg-white p-3"><p className="text-xs font-bold uppercase text-slate-500">Payment/Provision</p><p className="text-2xl font-black">{summary.payments}</p></div>
              <div className="rounded border bg-white p-3"><p className="text-xs font-bold uppercase text-slate-500">Loaded</p><p className="text-2xl font-black">{errors.length}</p></div>
            </div>

            <section className="rounded border bg-white p-3">
              <div className="grid gap-2 md:grid-cols-6">
                <label className="text-sm font-bold">Email<input className="mt-1 h-10 w-full rounded border px-2 font-normal" onChange={(event) => setFilterEmail(event.target.value)} value={filterEmail} /></label>
                <label className="text-sm font-bold">Request ID<input className="mt-1 h-10 w-full rounded border px-2 font-normal" onChange={(event) => setFilterRequestId(event.target.value)} value={filterRequestId} /></label>
                <label className="text-sm font-bold">Area<select className="mt-1 h-10 w-full rounded border px-2 font-normal" onChange={(event) => setFilterArea(event.target.value)} value={filterArea}><option value="">All</option><option value="payments">payments</option><option value="auth">auth</option><option value="packages">packages</option><option value="orders">orders</option><option value="user">user</option><option value="admin">admin</option></select></label>
                <label className="text-sm font-bold">Severity<select className="mt-1 h-10 w-full rounded border px-2 font-normal" onChange={(event) => setFilterSeverity(event.target.value)} value={filterSeverity}><option value="">All</option><option value="critical">critical</option><option value="warning">warning</option><option value="info">info</option></select></label>
                <label className="mt-7 flex items-center gap-2 text-sm font-bold"><input checked={unresolvedOnly} onChange={(event) => setUnresolvedOnly(event.target.checked)} type="checkbox" /> Unresolved only</label>
                <button className="mt-6 h-10 rounded bg-slate-950 px-3 text-sm font-black text-white" disabled={isLoading} onClick={() => void loadErrors()} type="button">{isLoading ? "Loading..." : "Apply"}</button>
              </div>
            </section>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
              <section className="overflow-hidden rounded border bg-white">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead className="bg-slate-900 text-white">
                      <tr>
                        <th className="px-3 py-2">Time</th>
                        <th className="px-3 py-2">Severity</th>
                        <th className="px-3 py-2">Area</th>
                        <th className="px-3 py-2">Email</th>
                        <th className="px-3 py-2">API</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Message</th>
                        <th className="px-3 py-2">State</th>
                      </tr>
                    </thead>
                    <tbody>
                      {errors.map((item) => (
                        <tr className={`cursor-pointer border-t ${selectedError?.id === item.id ? "bg-cyan-50" : ""}`} key={item.id} onClick={() => setSelectedError(item)}>
                          <td className="px-3 py-2 whitespace-nowrap">{formatDate(item.createdAt)}</td>
                          <td className="px-3 py-2 font-bold">{item.severity}</td>
                          <td className="px-3 py-2">{item.area}</td>
                          <td className="px-3 py-2">{item.userEmail ?? "N/A"}</td>
                          <td className="px-3 py-2 font-mono text-xs">{item.method} {item.path}</td>
                          <td className="px-3 py-2 font-bold">{item.statusCode}</td>
                          <td className="px-3 py-2">{item.message}</td>
                          <td className="px-3 py-2">{item.resolvedAt ? "Resolved" : "Open"}</td>
                        </tr>
                      ))}
                      {errors.length === 0 ? (
                        <tr><td className="px-3 py-6 text-center font-bold text-slate-500" colSpan={8}>No errors found</td></tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </section>

              <aside className="rounded border bg-white p-3">
                {selectedError ? (
                  <div className="grid gap-3">
                    <h2 className="text-lg font-black">Error Details</h2>
                    <dl className="grid grid-cols-[130px_1fr] gap-2 text-sm">
                      <dt className="font-bold">Request ID</dt><dd className="font-mono text-xs">{selectedError.requestId}</dd>
                      <dt className="font-bold">User</dt><dd>{selectedError.userEmail ?? "N/A"}</dd>
                      <dt className="font-bold">API</dt><dd className="font-mono text-xs">{selectedError.method} {selectedError.path}</dd>
                      <dt className="font-bold">Provider</dt><dd>{selectedError.providerName ?? "N/A"} {selectedError.providerStatusCode ?? ""}</dd>
                      <dt className="font-bold">Payment</dt><dd>{selectedError.relatedPaymentReference ?? "N/A"}</dd>
                      <dt className="font-bold">Package</dt><dd>{selectedError.relatedPackageId ?? "N/A"}</dd>
                      <dt className="font-bold">ICCID</dt><dd>{selectedError.relatedIccid ?? "N/A"}</dd>
                      <dt className="font-bold">Repair action</dt><dd>{selectedError.repairAction ?? "N/A"}</dd>
                    </dl>

                    <div>
                      <p className="text-sm font-black">Safe request body</p>
                      <pre className="mt-1 max-h-40 overflow-auto rounded bg-slate-100 p-2 text-xs">{stringifyJson(selectedError.safeRequestBody)}</pre>
                    </div>
                    <div>
                      <p className="text-sm font-black">Safe query</p>
                      <pre className="mt-1 max-h-32 overflow-auto rounded bg-slate-100 p-2 text-xs">{stringifyJson(selectedError.safeQuery)}</pre>
                    </div>
                    <div>
                      <p className="text-sm font-black">Copy safe cURL</p>
                      <pre className="mt-1 max-h-40 overflow-auto rounded bg-slate-100 p-2 text-xs">{buildSafeCurl(selectedError)}</pre>
                    </div>

                    <label className="text-sm font-black">Admin notes<textarea className="mt-1 min-h-24 w-full rounded border p-2 font-normal" onChange={(event) => setAdminNotes(event.target.value)} value={adminNotes} /></label>
                    <div className="flex flex-wrap gap-2">
                      <button className="rounded border bg-white px-3 py-2 text-sm font-bold" disabled={isMutating} onClick={() => navigator.clipboard?.writeText(selectedError.requestId)} type="button">Copy request id</button>
                      <button className="rounded border bg-white px-3 py-2 text-sm font-bold" disabled={isMutating} onClick={() => navigator.clipboard?.writeText(buildSafeCurl(selectedError))} type="button">Copy safe cURL</button>
                      <button className="rounded bg-slate-950 px-3 py-2 text-sm font-bold text-white" disabled={isMutating} onClick={() => void updateSelected({ adminNotes })} type="button">Save notes</button>
                      <button className="rounded bg-green-700 px-3 py-2 text-sm font-bold text-white" disabled={isMutating} onClick={() => void updateSelected({ resolved: true, adminNotes })} type="button">Mark resolved</button>
                      {selectedError.repairAction ? (
                        <button className="rounded bg-red-700 px-3 py-2 text-sm font-bold text-white" disabled={isMutating} onClick={() => void repairSelected()} type="button">Run repair</button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm font-bold text-slate-500">Select an error row to inspect details.</p>
                )}
              </aside>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
