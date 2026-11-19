"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Send } from "lucide-react";
import {
  DEFAULT_UPDATE_BODY,
  DEFAULT_UPDATE_TITLE,
  canNotify,
  filterVersionUsers,
  type VersionUserFilter,
  type VersionUserRow
} from "@/lib/version-users";

type UsersPayload = { status?: string; data?: { users?: VersionUserRow[] }; message?: string };
type SendPayload = { status?: string; data?: { sentCount?: number; failureCount?: number }; message?: string };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function VersionUsersSection({
  token,
  handleUnauthorized
}: {
  token: string | null;
  handleUnauthorized: () => void;
}) {
  const [users, setUsers] = useState<VersionUserRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<VersionUserFilter>({ outdatedOnly: true, platform: "all" });

  const [openId, setOpenId] = useState<string | null>(null);
  const [title, setTitle] = useState(DEFAULT_UPDATE_TITLE);
  const [body, setBody] = useState(DEFAULT_UPDATE_BODY);
  const [isSending, setIsSending] = useState(false);
  const [results, setResults] = useState<Record<string, string>>({});

  async function loadUsers() {
    if (!token) return;
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/bff/admin/app-version/users", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      const payload = (await response.json()) as UsersPayload;

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success" || !payload.data?.users) {
        throw new Error(payload.message ?? "Could not load users");
      }

      setUsers(payload.data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load users");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const visible = useMemo(() => filterVersionUsers(users, filter), [users, filter]);

  function openForm(row: VersionUserRow) {
    setOpenId(row.deviceId);
    setTitle(DEFAULT_UPDATE_TITLE);
    setBody(DEFAULT_UPDATE_BODY);
  }

  async function send(row: VersionUserRow) {
    if (!token || !row.email) return;
    setIsSending(true);

    try {
      const response = await fetch(`/bff/admin/users/${encodeURIComponent(row.email)}/notify`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim() })
      });
      const payload = (await response.json()) as SendPayload;

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? "Could not send the notification");
      }

      const sent = payload.data?.sentCount ?? 0;
      const failed = payload.data?.failureCount ?? 0;
      setResults((current) => ({
        ...current,
        [row.deviceId]: sent > 0 ? `Sent to ${sent} device${sent === 1 ? "" : "s"}` : `Not delivered (${failed} failed)`
      }));
      setOpenId(null);
    } catch (err) {
      setResults((current) => ({
        ...current,
        [row.deviceId]: err instanceof Error ? err.message : "Could not send the notification"
      }));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-wide text-muted">Users and app versions</p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-midnight">
            <input
              checked={filter.outdatedOnly}
              onChange={(event) => setFilter((current) => ({ ...current, outdatedOnly: event.target.checked }))}
              type="checkbox"
            />
            Outdated only
          </label>
          <select
            className="h-8 rounded-lg border border-line bg-white px-2 text-[11px] font-bold text-midnight"
            onChange={(event) =>
              setFilter((current) => ({ ...current, platform: event.target.value as VersionUserFilter["platform"] }))
            }
            value={filter.platform}
          >
            <option value="all">All platforms</option>
            <option value="ios">iOS</option>
            <option value="android">Android</option>
          </select>
          <button
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[11px] font-bold text-midnight transition hover:border-cyan disabled:opacity-50"
            disabled={isLoading}
            onClick={() => void loadUsers()}
            type="button"
          >
            <RefreshCw aria-hidden="true" size={12} />
            {isLoading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {error ? <p className="mt-3 text-xs font-semibold text-red-700">{error}</p> : null}

      {visible.length === 0 ? (
        <p className="mt-4 text-xs font-semibold text-muted">{isLoading ? "Loading..." : "No matching devices"}</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-wide text-muted">
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Platform</th>
                <th className="px-3 py-2">Version</th>
                <th className="px-3 py-2">Last seen</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.map((row) => (
                <tr key={row.deviceId} className="align-top">
                  <td className="px-3 py-2 font-semibold text-midnight">
                    {row.email ?? <span className="text-muted">Anonymous install</span>}
                  </td>
                  <td className="px-3 py-2 text-muted">{row.platform === "ios" ? "iOS" : "Android"}</td>
                  <td className="px-3 py-2 text-midnight">
                    <span className="font-semibold">{row.version}</span>
                    {row.isOutdated ? (
                      <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-black text-red-700">
                        Outdated
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-muted">{formatDate(row.lastSeen)}</td>
                  <td className="px-3 py-2">
                    {!canNotify(row) ? (
                      <span className="text-[11px] font-semibold text-muted">Not signed in, can&apos;t be notified</span>
                    ) : openId === row.deviceId ? (
                      <div className="grid min-w-64 gap-2">
                        <input
                          className="h-9 rounded-lg border border-line px-2 text-xs text-midnight outline-none focus:border-cyan"
                          onChange={(event) => setTitle(event.target.value)}
                          value={title}
                        />
                        <textarea
                          className="min-h-16 rounded-lg border border-line px-2 py-1 text-xs text-midnight outline-none focus:border-cyan"
                          onChange={(event) => setBody(event.target.value)}
                          value={body}
                        />
                        <div className="flex gap-2">
                          <button
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-r from-midnight to-ink px-3 text-[11px] font-black text-aqua disabled:opacity-50"
                            disabled={isSending || (!title.trim() && !body.trim())}
                            onClick={() => void send(row)}
                            type="button"
                          >
                            <Send aria-hidden="true" size={12} />
                            {isSending ? "Sending..." : "Send"}
                          </button>
                          <button
                            className="inline-flex h-8 items-center rounded-lg border border-line bg-white px-3 text-[11px] font-bold text-midnight disabled:opacity-50"
                            disabled={isSending}
                            onClick={() => setOpenId(null)}
                            type="button"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[11px] font-bold text-midnight transition hover:border-cyan"
                          onClick={() => openForm(row)}
                          type="button"
                        >
                          <Send aria-hidden="true" size={12} />
                          Notify
                        </button>
                        {results[row.deviceId] ? (
                          <span className="text-[11px] font-semibold text-muted">{results[row.deviceId]}</span>
                        ) : null}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
