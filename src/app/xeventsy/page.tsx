"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Megaphone, Plus, RefreshCw } from "lucide-react";
import { AdminNav } from "../AdminNav";
import { AdminLoginCard } from "../AdminLoginCard";
import { useAdminSession } from "../useAdminSession";
import { adminFetch } from "./api";
import { hasVoteBlock, type EventModalRecord } from "./eventModal";
import { resultsHref } from "./editor/editor";

// Chip colors per stored time state (computed by the backend at read time).
const TIME_STATE_CHIP: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  scheduled: "bg-amber-100 text-amber-800",
  live: "bg-emerald-100 text-emerald-800",
  closed: "bg-orange-100 text-orange-800",
  resolved: "bg-blue-100 text-blue-800",
  ended: "bg-slate-100 text-slate-500",
  archived: "bg-slate-100 text-slate-500"
};

const ROW_BUTTON =
  "inline-flex h-8 items-center rounded-lg border border-line bg-white px-3 text-xs font-bold text-midnight transition hover:border-cyan disabled:cursor-not-allowed disabled:opacity-50";

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export default function AdminEventModalsPage() {
  const session = useAdminSession();
  const { token, handleUnauthorized } = session;

  const [modals, setModals] = useState<EventModalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);
  const [timeZone, setTimeZone] = useState("");

  useEffect(() => {
    // Set after mount so the server render and the first client render match.
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  const loadModals = useCallback(
    async (nextToken: string) => {
      setIsLoading(true);
      setError("");
      const result = await adminFetch<{ eventModals: EventModalRecord[] }>("", {
        token: nextToken,
        onUnauthorized: handleUnauthorized
      });
      setIsLoading(false);
      if (result.ok) {
        setModals(result.data.eventModals ?? []);
      } else {
        setModals([]);
        setError(result.message);
      }
    },
    [handleUnauthorized]
  );

  useEffect(() => {
    if (token) void loadModals(token);
  }, [token, loadModals]);

  async function runAction(id: string, action: "publish" | "duplicate" | "archive", successNotice: string) {
    setBusyId(id);
    setError("");
    setNotice("");
    const result = await adminFetch<unknown>(`/${encodeURIComponent(id)}/${action}`, {
      token,
      method: "POST",
      onUnauthorized: handleUnauthorized
    });
    setBusyId(null);
    setConfirmArchiveId(null);
    if (result.ok) {
      setNotice(successNotice);
      await loadModals(token);
    } else {
      setError(result.message);
    }
  }

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
              Event modals
            </h1>
            <p className="mt-1 text-sm font-semibold text-muted">
              Promo and giveaway modals shown inside the app. Create, schedule, publish and track them here.
            </p>
          </div>
          {token ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="inline-flex h-10 items-center rounded-xl border border-line bg-white px-4 text-xs font-bold text-midnight shadow-sm transition hover:border-cyan disabled:opacity-50"
                disabled={isLoading}
                onClick={() => void loadModals(token)}
                type="button"
              >
                <RefreshCw aria-hidden="true" className="mr-2" size={14} />
                Refresh
              </button>
              <Link
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-midnight to-ink px-4 text-xs font-bold text-aqua shadow-glow transition hover:opacity-90"
                href="/xeventsy/new?template=match"
              >
                <Plus aria-hidden="true" size={14} />
                New match giveaway
              </Link>
              <Link
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-xs font-bold text-midnight shadow-sm transition hover:border-cyan"
                href="/xeventsy/new?template=promo"
              >
                <Plus aria-hidden="true" size={14} />
                New promo (image)
              </Link>
              <Link
                className="inline-flex h-10 items-center rounded-xl px-2 text-xs font-bold text-muted underline-offset-2 hover:underline"
                href="/xeventsy/new"
              >
                Blank
              </Link>
            </div>
          ) : null}
        </div>

        {error ? <p className="mb-4 text-sm font-bold text-red-700">{error}</p> : null}
        {notice ? <p className="mb-4 text-sm font-bold text-emerald-700">{notice}</p> : null}

        {!token ? (
          <AdminLoginCard
            email={session.email}
            error={session.error}
            isLoggingIn={session.isLoggingIn}
            onSubmit={(event) => void session.login(event)}
            password={session.password}
            setEmail={session.setEmail}
            setPassword={session.setPassword}
          />
        ) : (
          <div className="rounded-2xl border border-line bg-white shadow-card">
            {modals.length === 0 && !isLoading ? (
              <p className="p-6 text-sm font-semibold text-muted">
                No event modals yet. Create one to get started.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-xs font-black uppercase tracking-wide text-muted">
                      <th className="px-5 py-3">Title</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Schedule{timeZone ? ` (${timeZone})` : ""}</th>
                      <th className="px-5 py-3">Shown / dismissed / CTA</th>
                      <th className="px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {modals.map((modal) => {
                      const busy = busyId === modal.id;
                      const archiving = confirmArchiveId === modal.id;
                      return (
                        <tr key={modal.id}>
                          <td className="px-5 py-3 font-semibold text-midnight">
                            <div className="flex flex-wrap items-center gap-2">
                              <span>{modal.title}</span>
                              {hasVoteBlock(modal.blocks) ? (
                                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-violet-800">
                                  Giveaway
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${
                                TIME_STATE_CHIP[modal.timeState] ?? TIME_STATE_CHIP.draft
                              }`}
                            >
                              {modal.timeState}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-muted">
                            {formatDateTime(modal.startsAt)} → {formatDateTime(modal.displayUntil)}
                          </td>
                          <td className="px-5 py-3 text-muted">
                            {modal.stats.shown} / {modal.stats.dismissed} / {modal.stats.cta_clicked}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link className={ROW_BUTTON} href={`/xeventsy/${modal.id}`}>
                                Edit
                              </Link>
                              {hasVoteBlock(modal.blocks) && modal.status !== "draft" ? (
                                <Link className={`${ROW_BUTTON} border-cyan`} href={resultsHref(modal.id)}>
                                  Results
                                </Link>
                              ) : null}
                              <button
                                className={ROW_BUTTON}
                                disabled={busy}
                                onClick={() => void runAction(modal.id, "duplicate", "Duplicated as a draft.")}
                                type="button"
                              >
                                Duplicate
                              </button>
                              {modal.status === "draft" ? (
                                <button
                                  className={ROW_BUTTON}
                                  disabled={busy}
                                  onClick={() => void runAction(modal.id, "publish", "Published.")}
                                  type="button"
                                >
                                  Publish
                                </button>
                              ) : null}
                              {modal.status !== "archived" && !archiving ? (
                                <button
                                  className={ROW_BUTTON}
                                  disabled={busy}
                                  onClick={() => setConfirmArchiveId(modal.id)}
                                  type="button"
                                >
                                  Archive
                                </button>
                              ) : null}
                              {archiving ? (
                                <>
                                  <button
                                    className={`${ROW_BUTTON} border-red-300 text-red-700`}
                                    disabled={busy}
                                    onClick={() => void runAction(modal.id, "archive", "Archived.")}
                                    type="button"
                                  >
                                    Confirm archive
                                  </button>
                                  <button
                                    className={ROW_BUTTON}
                                    disabled={busy}
                                    onClick={() => setConfirmArchiveId(null)}
                                    type="button"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
