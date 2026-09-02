"use client";

import { useEffect, useState } from "react";
import { Activity, RefreshCw, Send } from "lucide-react";
import { AdminNav } from "../AdminNav";
import { AdminLoginCard } from "../AdminLoginCard";
import { useAdminSession } from "../useAdminSession";

type ActivityRow = {
  identifier: string;
  identifierType: string;
  lastUsedAt: string;
  notifyIntervalDays: number;
  nextNotifyAt: string;
  lastNotifiedAt: string | null;
};

type ListPayload = { status?: string; data?: { activity?: ActivityRow[] }; message?: string };
type SettingsPayload = { status?: string; data?: { intervalDays?: number }; message?: string };
type SendPayload = { status?: string; data?: { sentCount?: number; failureCount?: number }; message?: string };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export default function AdminActivityPage() {
  const session = useAdminSession();
  const { token, handleUnauthorized } = session;

  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [intervalDays, setIntervalDays] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  async function loadActivity(nextToken = token) {
    if (!nextToken) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/bff/admin/activity", {
        headers: { Authorization: `Bearer ${nextToken}` },
        cache: "no-store"
      });
      const payload = (await response.json()) as ListPayload;
      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? "Could not load activity");
      }
      setActivity(payload.data?.activity ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load activity");
      setActivity([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadSettings(nextToken = token) {
    if (!nextToken) return;
    try {
      const response = await fetch("/bff/admin/activity/settings", {
        headers: { Authorization: `Bearer ${nextToken}` },
        cache: "no-store"
      });
      const payload = (await response.json()) as SettingsPayload;
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (response.ok && payload.status === "success" && typeof payload.data?.intervalDays === "number") {
        setIntervalDays(payload.data.intervalDays);
        setDraft(String(payload.data.intervalDays));
      }
    } catch {
      // Settings load failure is non-fatal; the list above still renders.
    }
  }

  useEffect(() => {
    if (token) {
      void loadActivity(token);
      void loadSettings(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function saveInterval() {
    const parsed = Number(draft);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      setError("Interval must be a positive whole number of days.");
      return;
    }
    setIsSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/bff/admin/activity/settings", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ intervalDays: parsed })
      });
      const payload = (await response.json()) as SettingsPayload;
      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success" || typeof payload.data?.intervalDays !== "number") {
        throw new Error(payload.message ?? "Could not save the interval");
      }
      setIntervalDays(payload.data.intervalDays);
      setNotice(`Notify interval set to ${payload.data.intervalDays} day(s).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the interval");
    } finally {
      setIsSaving(false);
    }
  }

  async function sendNow() {
    setIsSending(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/bff/admin/activity/notify-now", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = (await response.json()) as SendPayload;
      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? "Could not send notification");
      }
      const sentCount = payload.data?.sentCount ?? 0;
      const failureCount = payload.data?.failureCount ?? 0;
      setNotice(
        failureCount > 0
          ? `Sent to ${sentCount} device(s), ${failureCount} failed.`
          : `Sent to ${sentCount} device(s).`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send notification");
    } finally {
      setIsSending(false);
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
              User activity
            </h1>
            <p className="mt-1 text-sm font-semibold text-muted">
              See when each user last opened the app, set the inactivity re-engagement interval, and send a
              re-engagement push on demand.
            </p>
          </div>
          {token ? (
            <button
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-xs font-bold text-midnight shadow-sm transition hover:border-cyan disabled:opacity-50"
              disabled={isLoading}
              onClick={() => void loadActivity()}
              type="button"
            >
              <RefreshCw aria-hidden="true" size={14} />
              Refresh
            </button>
          ) : null}
        </div>

        {error ? <p className="mb-4 text-sm font-bold text-red-700">{error}</p> : null}
        {notice ? <p className="mb-4 text-sm font-bold text-emerald-700">{notice}</p> : null}

        {!token ? (
          <AdminLoginCard
            email={session.email}
            error={session.error}
            isLoggingIn={session.isLoggingIn}
            onSubmit={async (event) => {
              const nextToken = await session.login(event);
              if (nextToken) {
                void loadActivity(nextToken);
                void loadSettings(nextToken);
              }
            }}
            password={session.password}
            setEmail={session.setEmail}
            setPassword={session.setPassword}
          />
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-end gap-4 rounded-2xl border border-line bg-white p-5 shadow-card">
              <div>
                <label className="block text-sm font-bold text-midnight" htmlFor="interval-days">
                  Notify after inactivity of
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    className="h-11 w-24 rounded-xl border border-line px-3 text-sm outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/20"
                    id="interval-days"
                    inputMode="numeric"
                    onChange={(event) => setDraft(event.target.value)}
                    value={draft}
                  />
                  <span className="text-sm font-semibold text-muted">days</span>
                </div>
                {intervalDays !== null ? (
                  <p className="mt-1 text-xs font-semibold text-muted">Currently {intervalDays} day(s).</p>
                ) : null}
              </div>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-midnight to-ink px-4 text-xs font-bold text-aqua shadow-glow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSaving}
                onClick={() => void saveInterval()}
                type="button"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-xs font-bold text-midnight shadow-sm transition hover:border-cyan disabled:opacity-50"
                disabled={isSending}
                onClick={() => void sendNow()}
                type="button"
              >
                <Send aria-hidden="true" size={14} />
                {isSending ? "Sending..." : "Send now"}
              </button>
            </div>

            <div className="rounded-2xl border border-line bg-white shadow-card">
              {activity.length === 0 && !isLoading ? (
                <p className="p-6 text-sm font-semibold text-muted">No activity recorded yet.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-xs font-black uppercase tracking-wide text-muted">
                      <th className="px-5 py-3">Identifier</th>
                      <th className="px-5 py-3">Last used</th>
                      <th className="px-5 py-3">Next auto-notify</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {activity.map((row) => (
                      <tr key={`${row.identifierType}:${row.identifier}`}>
                        <td className="px-5 py-3 font-semibold text-midnight">
                          <div className="flex items-center gap-2">
                            <Activity aria-hidden="true" className="text-cyanDeep" size={14} />
                            {row.identifierType === "email"
                              ? row.identifier
                              : `${row.identifierType === "device" ? "Device" : row.identifierType}: ${row.identifier}`}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-muted">{formatDate(row.lastUsedAt)}</td>
                        <td className="px-5 py-3 text-muted">{formatDate(row.nextNotifyAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
