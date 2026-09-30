"use client";

import { FormEvent, useEffect, useState } from "react";
import { LogOut, Search, Send, RotateCcw, Trash2 } from "lucide-react";
import { MarketplaceOpenActionFields } from "./MarketplaceOpenActionFields";
import {
  EMPTY_OPEN_ACTION_DRAFT,
  openActionRequestBody,
  type OpenActionDraft,
} from "./marketplaceOpenAction";

type UserSearchResult = { email: string; hasDeviceToken: boolean };

type SearchPayload = { status?: string; data?: { users?: UserSearchResult[] }; message?: string };

type IndividualNotification = {
  id: string;
  // Backend's UserNotification.userEmail is nullable: onDelete: SetNull clears it
  // if the linked account is later deleted, so the history can outlive the user.
  userEmail: string | null;
  title: string | null;
  body: string | null;
  sentCount: number;
  failureCount: number;
  sentByAdminEmail: string | null;
  createdAt: string;
};

type HistoryPayload = { status?: string; data?: { notifications?: IndividualNotification[] }; message?: string };

type SendPayload = { status?: string; data?: { sentCount?: number; failureCount?: number }; message?: string };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function IndividualNotificationsTab({
  token,
  handleUnauthorized,
}: {
  token: string;
  handleUnauthorized: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected] = useState<UserSearchResult | null>(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [openActionDraft, setOpenActionDraft] = useState<OpenActionDraft>(EMPTY_OPEN_ACTION_DRAFT);
  const [fieldsInvalid, setFieldsInvalid] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [history, setHistory] = useState<IndividualNotification[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [forceLogoutKind, setForceLogoutKind] = useState<"unlinked" | "all" | null>(null);
  const [isClearingHistory, setIsClearingHistory] = useState(false);

  async function loadHistory() {
    if (!token) return;
    setIsLoadingHistory(true);
    try {
      const response = await fetch("/bff/admin/notifications/individual", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const payload = (await response.json()) as HistoryPayload;
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? "Could not load notification history");
      }
      setHistory(payload.data?.notifications ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load notification history");
    } finally {
      setIsLoadingHistory(false);
    }
  }

  useEffect(() => {
    void loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      void (async () => {
        setIsSearching(true);
        try {
          const response = await fetch(`/bff/admin/users/search?q=${encodeURIComponent(trimmed)}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          });
          const payload = (await response.json()) as SearchPayload;
          if (response.status === 401) {
            handleUnauthorized();
            return;
          }
          if (!response.ok || payload.status !== "success") {
            throw new Error(payload.message ?? "Could not search users");
          }
          setResults(payload.data?.users ?? []);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not search users");
        } finally {
          setIsSearching(false);
        }
      })();
    }, 300);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, token]);

  async function forceLogout(kind: "unlinked" | "all") {
    const confirmed = window.confirm(
      kind === "all"
        ? "Force-logout every signed-in account? All users must sign in again."
        : "Force-logout every account with no linked device? Those users must sign in again."
    );
    if (!confirmed) return;

    setForceLogoutKind(kind);
    setError("");
    setNotice("");

    const path =
      kind === "all" ? "/bff/admin/users/force-logout-all" : "/bff/admin/users/force-logout-unlinked";
    const failMessage =
      kind === "all" ? "Could not force-logout all users" : "Could not force-logout unlinked users";

    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = (await response.json()) as {
        status?: string;
        data?: { loggedOutCount?: number };
        message?: string;
      };
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? failMessage);
      }
      const count = payload.data?.loggedOutCount ?? 0;
      if (kind === "all") {
        setNotice(
          count === 1
            ? "Forced 1 account to sign in again."
            : `Forced ${count} accounts to sign in again.`
        );
      } else {
        setNotice(
          count === 1
            ? "Forced 1 unlinked account to sign in again."
            : `Forced ${count} unlinked accounts to sign in again.`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : failMessage);
    } finally {
      setForceLogoutKind(null);
    }
  }

  function pickUser(user: UserSearchResult) {
    setSelected(user);
    setResults([]);
    setQuery("");
    setError("");
    setNotice("");
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    if (!title.trim() && !body.trim()) {
      setFieldsInvalid(true);
      setError("Enter a title, a body, or both.");
      return;
    }

    setFieldsInvalid(false);
    setIsSending(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/bff/admin/users/${encodeURIComponent(selected.email)}/notify`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          ...openActionRequestBody(openActionDraft),
        }),
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
        sentCount === 0
          ? "Sent to 0 devices — this user has no linked device."
          : failureCount > 0
            ? `Sent to ${sentCount} device(s), ${failureCount} failed.`
            : `Sent to ${sentCount} device(s).`
      );
      setTitle("");
      setBody("");
      setOpenActionDraft(EMPTY_OPEN_ACTION_DRAFT);
      setSelected(null);
      void loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send notification");
    } finally {
      setIsSending(false);
    }
  }

  async function resendNotification(notification: IndividualNotification) {
    if (!notification.userEmail) {
      setError("Cannot resend to a deleted account.");
      return;
    }

    setBusyId(notification.id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/bff/admin/users/${encodeURIComponent(notification.userEmail)}/notify`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: notification.title,
          body: notification.body,
        }),
      });
      const payload = (await response.json()) as SendPayload;

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? "Could not resend notification");
      }

      const sentCount = payload.data?.sentCount ?? 0;
      const failureCount = payload.data?.failureCount ?? 0;
      setNotice(
        sentCount === 0
          ? "Sent to 0 devices — this user has no linked device."
          : failureCount > 0
            ? `Resent to ${sentCount} device(s), ${failureCount} failed.`
            : `Resent to ${sentCount} device(s).`
      );
      void loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend notification");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteHistoryItem(id: string) {
    if (!window.confirm("Delete this notification from history?")) return;

    setBusyId(id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/bff/admin/notifications/individual/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = (await response.json()) as { status?: string; message?: string };

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? "Could not delete notification");
      }

      setHistory((current) => current.filter((row) => row.id !== id));
      setNotice("Notification deleted from history.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete notification");
    } finally {
      setBusyId(null);
    }
  }

  async function clearAllHistory() {
    if (!window.confirm("Delete all notifications from history? This cannot be undone.")) return;

    setIsClearingHistory(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/bff/admin/notifications/individual", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = (await response.json()) as { status?: string; message?: string };

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? "Could not clear history");
      }

      setHistory([]);
      setNotice("All notifications cleared from history.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not clear history");
    } finally {
      setIsClearingHistory(false);
    }
  }

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-line bg-white p-5 shadow-card">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-sm font-black uppercase tracking-wide text-midnight">Send to a user</h2>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-line px-3 text-xs font-bold text-midnight transition hover:bg-cloud disabled:cursor-not-allowed disabled:opacity-60"
              disabled={forceLogoutKind !== null}
              onClick={() => void forceLogout("unlinked")}
              type="button"
            >
              <LogOut aria-hidden="true" size={14} />
              {forceLogoutKind === "unlinked" ? "Signing out..." : "Force-logout unlinked"}
            </button>
            <button
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-red-200 px-3 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={forceLogoutKind !== null}
              onClick={() => void forceLogout("all")}
              type="button"
            >
              <LogOut aria-hidden="true" size={14} />
              {forceLogoutKind === "all" ? "Signing out..." : "Force-logout all"}
            </button>
          </div>
        </div>

        {!selected ? (
          <div className="relative">
            <label className="block text-sm font-bold text-midnight" htmlFor="user-search">
              Find a user by email
            </label>
            <div className="relative mt-1.5">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                size={16}
              />
              <input
                className="h-11 w-full rounded-xl border border-line pl-9 pr-3.5 text-sm outline-none transition focus:border-cyan focus:ring-2 focus:ring-cyan/20"
                id="user-search"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="name@example.com"
                value={query}
              />
            </div>
            {isSearching ? <p className="mt-1.5 text-xs font-semibold text-muted">Searching...</p> : null}
            {results.length > 0 ? (
              <ul className="absolute z-10 mt-1.5 w-full rounded-xl border border-line bg-white shadow-card">
                {results.map((user) => (
                  <li key={user.email}>
                    <button
                      className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm hover:bg-cloud"
                      onClick={() => pickUser(user)}
                      type="button"
                    >
                      <span className="font-semibold text-midnight">{user.email}</span>
                      {!user.hasDeviceToken ? (
                        <span className="text-xs font-bold text-muted">no device linked</span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <form onSubmit={send}>
            <div className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-cloud px-3.5 py-2.5">
              <p className="text-sm font-bold text-midnight">
                Sending to: <span className="font-black">{selected.email}</span>
                {!selected.hasDeviceToken ? (
                  <span className="ml-2 text-xs font-bold text-red-700">no device linked</span>
                ) : null}
              </p>
              <button className="text-xs font-bold text-muted hover:text-midnight" onClick={() => setSelected(null)} type="button">
                Change
              </button>
            </div>

            <label className="block text-sm font-bold text-midnight" htmlFor="individual-title">
              Title
            </label>
            <input
              aria-invalid={fieldsInvalid}
              className={`mt-1.5 h-11 w-full rounded-xl border px-3.5 text-sm outline-none transition focus:ring-2 focus:ring-cyan/20 ${
                fieldsInvalid ? "border-red-400 focus:border-red-400" : "border-line focus:border-cyan"
              }`}
              id="individual-title"
              onChange={(event) => {
                setTitle(event.target.value);
                if (fieldsInvalid) setFieldsInvalid(false);
              }}
              value={title}
            />
            <label className="mt-4 block text-sm font-bold text-midnight" htmlFor="individual-body">
              Body
            </label>
            <textarea
              aria-invalid={fieldsInvalid}
              className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-cyan/20 ${
                fieldsInvalid ? "border-red-400 focus:border-red-400" : "border-line focus:border-cyan"
              }`}
              id="individual-body"
              onChange={(event) => {
                setBody(event.target.value);
                if (fieldsInvalid) setFieldsInvalid(false);
              }}
              rows={2}
              value={body}
            />
            <MarketplaceOpenActionFields
              draft={openActionDraft}
              idPrefix="individual"
              onChange={setOpenActionDraft}
            />
            {fieldsInvalid ? <p className="mt-1 text-xs font-bold text-red-700">Enter a title, a body, or both.</p> : null}

            <button
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-midnight to-ink px-4 text-xs font-bold text-aqua shadow-glow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSending}
              type="submit"
            >
              <Send aria-hidden="true" size={14} />
              {isSending ? "Sending..." : "Send"}
            </button>
          </form>
        )}
      </div>

      {error ? <p className="mb-4 text-sm font-bold text-red-700">{error}</p> : null}
      {notice ? <p className="mb-4 text-sm font-bold text-emerald-700">{notice}</p> : null}

      <div className="rounded-2xl border border-line bg-white shadow-card">
        <div className="flex items-center justify-between gap-3 border-b border-line p-5">
          <h2 className="text-sm font-black uppercase tracking-wide text-midnight">Send history</h2>
          {history.length > 0 ? (
            <button
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-red-200 px-3 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isClearingHistory || busyId !== null}
              onClick={() => void clearAllHistory()}
              type="button"
            >
              <Trash2 aria-hidden="true" size={14} />
              {isClearingHistory ? "Clearing..." : "Clear all"}
            </button>
          ) : null}
        </div>
        {history.length === 0 && !isLoadingHistory ? (
          <p className="p-6 text-sm font-semibold text-muted">No individual notifications sent yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {history.map((row) => (
              <li className="p-5" key={row.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-midnight">{row.userEmail ?? "(deleted account)"}</p>
                    {row.title ? <p className="mt-1 text-sm font-bold text-midnight">{row.title}</p> : null}
                    {row.body ? <p className="mt-1 text-sm text-muted">{row.body}</p> : null}
                    <p className="mt-2 text-xs font-semibold text-muted">
                      {formatDate(row.createdAt)}
                      {row.sentByAdminEmail ? ` · sent by ${row.sentByAdminEmail}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <p className="text-xs font-bold text-muted">
                      {row.sentCount} sent{row.failureCount > 0 ? `, ${row.failureCount} failed` : ""}
                    </p>
                    <div className="flex gap-2">
                      <button
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-line px-2.5 text-xs font-bold text-midnight transition hover:bg-cloud disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={busyId !== null}
                        onClick={() => void resendNotification(row)}
                        title="Resend this notification"
                        type="button"
                      >
                        <RotateCcw aria-hidden="true" size={12} />
                        {busyId === row.id ? "Resending..." : "Resend"}
                      </button>
                      <button
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-200 px-2.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={busyId !== null}
                        onClick={() => void deleteHistoryItem(row.id)}
                        title="Delete from history"
                        type="button"
                      >
                        <Trash2 aria-hidden="true" size={12} />
                        {busyId === row.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
