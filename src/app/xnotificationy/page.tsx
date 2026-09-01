"use client";

import { FormEvent, useEffect, useState } from "react";
import { Bell, Pencil, RefreshCw, Send, Trash2, X } from "lucide-react";
import { AdminNav } from "../AdminNav";
import { AdminLoginCard } from "../AdminLoginCard";
import { useAdminSession } from "../useAdminSession";

type NotificationMessage = {
  id: string;
  title: string | null;
  body: string | null;
  createdAt: string;
  updatedAt: string;
};

type ListPayload = {
  status?: string;
  data?: { notifications?: NotificationMessage[] };
  message?: string;
};

type MutatePayload = {
  status?: string;
  data?: { notification?: NotificationMessage };
  message?: string;
};

type SendPayload = {
  status?: string;
  data?: { sentCount?: number; failureCount?: number };
  message?: string;
};

export default function AdminNotificationsPage() {
  const session = useAdminSession();
  const { token, handleUnauthorized } = session;

  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newFieldsInvalid, setNewFieldsInvalid] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editFieldsInvalid, setEditFieldsInvalid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadNotifications(nextToken = token) {
    if (!nextToken) return;
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/bff/admin/notifications", {
        headers: { Authorization: `Bearer ${nextToken}` },
        cache: "no-store"
      });
      const payload = (await response.json()) as ListPayload;

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? "Could not load notifications");
      }

      setNotifications(payload.data?.notifications ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load notifications");
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (token) void loadNotifications(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function createNotification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTitle.trim() && !newBody.trim()) {
      setNewFieldsInvalid(true);
      setError("Enter a title, a body, or both.");
      return;
    }

    setNewFieldsInvalid(false);
    setIsCreating(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/bff/admin/notifications", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), body: newBody.trim() })
      });
      const payload = (await response.json()) as MutatePayload;

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success" || !payload.data?.notification) {
        throw new Error(payload.message ?? "Could not create notification");
      }

      setNotifications((current) => [payload.data!.notification!, ...current]);
      setNewTitle("");
      setNewBody("");
      setNotice("Notification added.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create notification");
    } finally {
      setIsCreating(false);
    }
  }

  function startEditing(row: NotificationMessage) {
    setEditingId(row.id);
    setEditTitle(row.title ?? "");
    setEditBody(row.body ?? "");
    setEditFieldsInvalid(false);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditTitle("");
    setEditBody("");
    setEditFieldsInvalid(false);
  }

  async function saveEdit(id: string) {
    if (!editTitle.trim() && !editBody.trim()) {
      setEditFieldsInvalid(true);
      setError("Enter a title, a body, or both.");
      return;
    }

    setEditFieldsInvalid(false);
    setIsSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/bff/admin/notifications/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim(), body: editBody.trim() })
      });
      const payload = (await response.json()) as MutatePayload;

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success" || !payload.data?.notification) {
        throw new Error(payload.message ?? "Could not save notification");
      }

      const updated = payload.data.notification;
      setNotifications((current) => current.map((row) => (row.id === id ? updated : row)));
      cancelEditing();
      setNotice("Notification updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save notification");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteNotification(id: string) {
    setBusyId(id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/bff/admin/notifications/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = (await response.json()) as { status?: string; message?: string };

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? "Could not delete notification");
      }

      setNotifications((current) => current.filter((row) => row.id !== id));
      setNotice("Notification deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete notification");
    } finally {
      setBusyId(null);
    }
  }

  async function sendNotification(id: string) {
    setBusyId(id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/bff/admin/notifications/${encodeURIComponent(id)}/send`, {
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
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_8px_#00d9f5]" />
              Admin · Live
            </p>
            <h1 className="mt-1 font-display text-[26px] font-black tracking-tight text-midnight md:text-[30px]">
              Push notifications
            </h1>
            <p className="mt-1 text-sm font-semibold text-muted">
              Maintain a list of title + body notifications and send any of them to every device with the app
              installed.
            </p>
          </div>
          {token ? (
            <button
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-xs font-bold text-midnight shadow-sm transition hover:border-cyan disabled:opacity-50"
              disabled={isLoading}
              onClick={() => void loadNotifications()}
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
              if (nextToken) void loadNotifications(nextToken);
            }}
            password={session.password}
            setEmail={session.setEmail}
            setPassword={session.setPassword}
          />
        ) : (
          <>
            <form
              className="mb-6 rounded-2xl border border-line bg-white p-5 shadow-card"
              onSubmit={createNotification}
            >
              <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-midnight">Add notification</h2>
              <p className="mb-3 text-xs font-semibold text-muted">Fill in a title, a body, or both.</p>
              <label className="block text-sm font-bold text-midnight" htmlFor="new-title">
                Title
              </label>
              <input
                aria-invalid={newFieldsInvalid}
                className={`mt-1.5 h-11 w-full rounded-xl border px-3.5 text-sm outline-none transition focus:ring-2 focus:ring-cyan/20 ${
                  newFieldsInvalid ? "border-red-400 focus:border-red-400" : "border-line focus:border-cyan"
                }`}
                id="new-title"
                onChange={(event) => {
                  setNewTitle(event.target.value);
                  if (newFieldsInvalid) setNewFieldsInvalid(false);
                }}
                value={newTitle}
              />
              {newFieldsInvalid ? <p className="mt-1 text-xs font-bold text-red-700">Enter a title, a body, or both.</p> : null}
              <label className="mt-4 block text-sm font-bold text-midnight" htmlFor="new-body">
                Body
              </label>
              <textarea
                aria-invalid={newFieldsInvalid}
                className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-cyan/20 ${
                  newFieldsInvalid ? "border-red-400 focus:border-red-400" : "border-line focus:border-cyan"
                }`}
                id="new-body"
                onChange={(event) => {
                  setNewBody(event.target.value);
                  if (newFieldsInvalid) setNewFieldsInvalid(false);
                }}
                rows={2}
                value={newBody}
              />
              {newFieldsInvalid ? <p className="mt-1 text-xs font-bold text-red-700">Enter a title, a body, or both.</p> : null}
              <button
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-midnight to-ink px-4 text-xs font-bold text-aqua shadow-glow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isCreating}
                type="submit"
              >
                {isCreating ? "Adding..." : "Add notification"}
              </button>
            </form>

            <div className="rounded-2xl border border-line bg-white shadow-card">
              {notifications.length === 0 && !isLoading ? (
                <p className="p-6 text-sm font-semibold text-muted">No notifications yet.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {notifications.map((row) => (
                    <li className="p-5" key={row.id}>
                      {editingId === row.id ? (
                        <div>
                          <input
                            aria-invalid={editFieldsInvalid}
                            className={`mb-1 h-10 w-full rounded-xl border px-3 text-sm outline-none ${
                              editFieldsInvalid ? "border-red-400 focus:border-red-400" : "border-line focus:border-cyan"
                            }`}
                            onChange={(event) => {
                              setEditTitle(event.target.value);
                              if (editFieldsInvalid) setEditFieldsInvalid(false);
                            }}
                            value={editTitle}
                          />
                          <textarea
                            aria-invalid={editFieldsInvalid}
                            className={`mb-1 w-full rounded-xl border px-3 py-2 text-sm outline-none ${
                              editFieldsInvalid ? "border-red-400 focus:border-red-400" : "border-line focus:border-cyan"
                            }`}
                            onChange={(event) => {
                              setEditBody(event.target.value);
                              if (editFieldsInvalid) setEditFieldsInvalid(false);
                            }}
                            rows={2}
                            value={editBody}
                          />
                          {editFieldsInvalid ? (
                            <p className="mb-2 text-xs font-bold text-red-700">Enter a title, a body, or both.</p>
                          ) : null}
                          <div className="flex gap-2">
                            <button
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-midnight px-3 text-xs font-bold text-aqua disabled:opacity-50"
                              disabled={isSaving}
                              onClick={() => void saveEdit(row.id)}
                              type="button"
                            >
                              {isSaving ? "Saving..." : "Save"}
                            </button>
                            <button
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-bold text-midnight"
                              onClick={cancelEditing}
                              type="button"
                            >
                              <X aria-hidden="true" size={14} />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            {row.title ? (
                              <div className="flex items-center gap-2">
                                <Bell aria-hidden="true" className="text-cyanDeep" size={16} />
                                <p className="font-bold text-midnight">{row.title}</p>
                              </div>
                            ) : null}
                            {row.body ? (
                              <p className={row.title ? "mt-1 text-sm text-muted" : "text-sm text-muted"}>{row.body}</p>
                            ) : null}
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <button
                              aria-label="Send"
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-midnight to-ink px-3 text-xs font-bold text-aqua shadow-glow disabled:opacity-50"
                              disabled={busyId === row.id}
                              onClick={() => void sendNotification(row.id)}
                              type="button"
                            >
                              <Send aria-hidden="true" size={14} />
                              Send
                            </button>
                            <button
                              aria-label="Edit"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-midnight disabled:opacity-50"
                              disabled={busyId === row.id}
                              onClick={() => startEditing(row)}
                              type="button"
                            >
                              <Pencil aria-hidden="true" size={14} />
                            </button>
                            <button
                              aria-label="Delete"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-red-700 disabled:opacity-50"
                              disabled={busyId === row.id}
                              onClick={() => void deleteNotification(row.id)}
                              type="button"
                            >
                              <Trash2 aria-hidden="true" size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
