"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquareQuote, RefreshCw } from "lucide-react";
import { AdminNav } from "../AdminNav";
import { AdminLoginCard } from "../AdminLoginCard";
import { useAdminSession } from "../useAdminSession";

type TestimonialRow = {
  id: string;
  userEmail: string;
  displayName: string;
  rating: number;
  body: string;
  status: "pending" | "approved" | "rejected" | string;
};

type ListPayload = {
  status?: string;
  data?: { testimonials?: TestimonialRow[] };
  message?: string;
};

export default function AdminTestimonialsPage() {
  const session = useAdminSession();
  const { token, handleUnauthorized } = session;
  const [rows, setRows] = useState<TestimonialRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(
    async (nextToken = token) => {
      if (!nextToken) return;
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch("/bff/admin/testimonials", {
          headers: { Authorization: `Bearer ${nextToken}` },
          cache: "no-store"
        });
        const payload = (await response.json()) as ListPayload;
        if (response.status === 401) {
          handleUnauthorized();
          throw new Error("Session expired. Sign in again.");
        }
        if (!response.ok || payload.status !== "success") {
          throw new Error(payload.message ?? "Could not load testimonials");
        }
        setRows(payload.data?.testimonials ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load testimonials");
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    },
    [handleUnauthorized, token]
  );

  useEffect(() => {
    if (token) void load(token);
  }, [load, token]);

  async function decide(id: string, status: "approved" | "rejected") {
    if (!token) return;
    setBusyId(id);
    setError("");
    try {
      const response = await fetch(`/bff/admin/testimonials/${encodeURIComponent(id)}/decision`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });
      const payload = (await response.json()) as { status?: string; message?: string };
      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? "Could not update testimonial");
      }
      setRows((current) => current.map((row) => (row.id === id ? { ...row, status } : row)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update testimonial");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex min-h-screen bg-cloud">
      <AdminNav />
      <div className="min-w-0 flex-1 px-6 py-7 md:px-9">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-cyanDeep">
              <MessageSquareQuote aria-hidden="true" size={14} />
              Admin
            </p>
            <h1 className="mt-1 font-display text-[26px] font-black tracking-tight text-midnight md:text-[30px]">
              Testimonials
            </h1>
            <p className="mt-1 text-sm font-semibold text-muted">
              Approve a quote to show it on the homepage. Rejecting removes it.
            </p>
          </div>
          {token ? (
            <button
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-xs font-bold text-midnight shadow-sm transition hover:border-cyan disabled:opacity-50"
              disabled={isLoading}
              onClick={() => void load()}
              type="button"
            >
              <RefreshCw aria-hidden="true" size={14} />
              Refresh
            </button>
          ) : null}
        </div>

        {error ? <p className="mb-4 text-sm font-bold text-red-700">{error}</p> : null}

        {!token ? (
          <AdminLoginCard
            email={session.email}
            error={session.error}
            isLoggingIn={session.isLoggingIn}
            onSubmit={async (event) => {
              const nextToken = await session.login(event);
              if (nextToken) void load(nextToken);
            }}
            password={session.password}
            setEmail={session.setEmail}
            setPassword={session.setPassword}
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-[10px] font-black uppercase tracking-[0.12em] text-muted">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Stars</th>
                  <th className="px-4 py-3">Quote</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"> </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-muted" colSpan={5}>
                      {isLoading ? "Loading…" : "No testimonials yet."}
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr className="border-b border-line last:border-0" key={row.id}>
                      <td className="px-4 py-3 align-top">
                        <div className="font-bold text-midnight">{row.displayName}</div>
                        <div className="text-xs text-muted">{row.userEmail}</div>
                      </td>
                      <td className="px-4 py-3 align-top text-cyanDeep" aria-label={`${row.rating} out of 5 stars`}>
                        {"★".repeat(row.rating)}
                      </td>
                      <td className="max-w-md px-4 py-3 align-top text-midnight">{row.body}</td>
                      <td className="px-4 py-3 align-top capitalize text-muted">{row.status}</td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex gap-2">
                          <button
                            className="rounded-lg bg-midnight px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                            disabled={busyId === row.id || row.status === "approved"}
                            onClick={() => void decide(row.id, "approved")}
                            type="button"
                          >
                            Approve
                          </button>
                          <button
                            className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-midnight disabled:opacity-50"
                            disabled={busyId === row.id || row.status === "rejected"}
                            onClick={() => void decide(row.id, "rejected")}
                            type="button"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
