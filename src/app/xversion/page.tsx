"use client";

import { useEffect, useState } from "react";
import { LogOut, RefreshCw } from "lucide-react";
import { AdminNav } from "../AdminNav";
import { AdminLoginCard } from "../AdminLoginCard";
import { useAdminSession } from "../useAdminSession";

const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

type AppVersionPayload = {
  status?: string;
  data?: { version?: string; updatedAt?: string | null };
  message?: string;
};

function formatUpdatedAt(value: string | null | undefined) {
  if (!value) return "Never set";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function AdminVersionPage() {
  const session = useAdminSession();
  const { token, handleUnauthorized } = session;

  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadVersion(nextToken = token) {
    if (!nextToken) return;
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/bff/admin/app-version", {
        headers: { Authorization: `Bearer ${nextToken}` },
        cache: "no-store"
      });
      const payload = (await response.json()) as AppVersionPayload;

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success" || !payload.data?.version) {
        throw new Error(payload.message ?? "Could not load minimum app version");
      }

      setCurrentVersion(payload.data.version);
      setUpdatedAt(payload.data.updatedAt ?? null);
      setDraft(payload.data.version);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load minimum app version");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (token) void loadVersion(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function save() {
    if (!VERSION_PATTERN.test(draft.trim())) {
      setError("Version must look like major.minor.patch, e.g. 1.2.0.");
      return;
    }

    setIsSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/bff/admin/app-version", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ version: draft.trim() })
      });
      const payload = (await response.json()) as AppVersionPayload;

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success" || !payload.data?.version) {
        throw new Error(payload.message ?? "Could not save minimum app version");
      }

      setCurrentVersion(payload.data.version);
      setUpdatedAt(payload.data.updatedAt ?? null);
      setDraft(payload.data.version);
      setNotice(`Minimum app version set to ${payload.data.version}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save minimum app version");
    } finally {
      setIsSaving(false);
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
              App version
            </h1>
            <p className="mt-1 text-sm font-semibold text-muted">
              Set the minimum mobile app version. Users on an older build see an update prompt on next launch.
            </p>
          </div>
          {token ? (
            <div className="flex gap-2">
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-xs font-bold text-midnight shadow-sm transition hover:border-cyan disabled:opacity-50"
                disabled={isLoading}
                onClick={() => void loadVersion()}
                type="button"
              >
                <RefreshCw aria-hidden="true" size={14} />
                {isLoading ? "Loading..." : "Refresh"}
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

            <section className="max-w-md rounded-2xl border border-line bg-white p-5 shadow-card">
              <p className="text-[10px] font-black uppercase tracking-wide text-muted">Current minimum version</p>
              <p className="mt-1 font-display text-2xl font-black text-midnight">
                {currentVersion ?? (isLoading ? "Loading..." : "—")}
              </p>
              <p className="mt-1 text-xs font-semibold text-muted">Last updated: {formatUpdatedAt(updatedAt)}</p>

              <label className="mt-5 block text-xs font-bold text-muted">
                New minimum version
                <input
                  className="mt-1 h-10 w-full rounded-xl border border-line px-3 text-sm font-normal text-midnight outline-none focus:border-cyan"
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="1.2.0"
                  value={draft}
                />
              </label>

              <button
                className="mt-4 h-10 w-full rounded-xl bg-gradient-to-r from-midnight to-ink text-xs font-black text-aqua shadow-glow transition hover:opacity-90 disabled:opacity-50"
                disabled={isSaving}
                onClick={() => void save()}
                type="button"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
