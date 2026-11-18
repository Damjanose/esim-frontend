"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Pencil } from "lucide-react";
import { AdminNav } from "../../AdminNav";
import { AdminLoginCard } from "../../AdminLoginCard";
import { useAdminSession } from "../../useAdminSession";
import { adminFetch } from "../api";
import { voteBlocksOf, type EventModalRecord } from "../eventModal";
import { ResultsTab } from "./ResultsTab";
import { splitBackendMessage } from "./editor";

type RecordResponse = { eventModal: EventModalRecord };

const BUTTON =
  "inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-xs font-bold text-midnight shadow-sm transition hover:border-cyan disabled:cursor-not-allowed disabled:opacity-50";

const STATUS_CHIP: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  published: "bg-emerald-100 text-emerald-800",
  resolved: "bg-blue-100 text-blue-800",
  archived: "bg-slate-100 text-slate-500"
};

export function ResultsShell({ id }: { id: string }) {
  const session = useAdminSession();
  const { token, handleUnauthorized } = session;

  const [record, setRecord] = useState<EventModalRecord | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string[]>([]);

  const loadRecord = useCallback(
    async (nextToken: string) => {
      const result = await adminFetch<RecordResponse>(`/${encodeURIComponent(id)}`, {
        token: nextToken,
        onUnauthorized: handleUnauthorized
      });
      if (result.ok) {
        setRecord(result.data.eventModal);
        setError([]);
      } else {
        setError(splitBackendMessage(result.message));
      }
      setLoaded(true);
    },
    [id, handleUnauthorized]
  );

  useEffect(() => {
    if (token) void loadRecord(token);
  }, [token, loadRecord]);

  if (!token) {
    return (
      <>
        <AdminNav />
        <div className="min-h-screen bg-cloud px-6 py-7 md:px-9">
          <AdminLoginCard
            email={session.email}
            error={session.error}
            isLoggingIn={session.isLoggingIn}
            onSubmit={(event) => void session.login(event)}
            password={session.password}
            setEmail={session.setEmail}
            setPassword={session.setPassword}
          />
        </div>
      </>
    );
  }

  const votes = record ? voteBlocksOf(record.blocks) : [];

  return (
    <>
      <AdminNav />
      <div className="min-h-screen bg-cloud px-6 py-7 md:px-9">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-cyanDeep">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_8px_#00d9f5]" />
              Admin · Results
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h1 className="font-display text-[26px] font-black tracking-tight text-midnight md:text-[30px]">
                {record?.title || "Event modal results"}
              </h1>
              {record ? (
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${
                    STATUS_CHIP[record.status] ?? STATUS_CHIP.draft
                  }`}
                >
                  {record.status}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link className={BUTTON} href="/xeventsy">
              <ArrowLeft aria-hidden="true" size={14} />
              Back to list
            </Link>
            {record ? (
              <Link className={BUTTON} href={`/xeventsy/${encodeURIComponent(record.id)}`}>
                <Pencil aria-hidden="true" size={14} />
                Edit
              </Link>
            ) : null}
          </div>
        </div>

        {error.length > 0 ? (
          <ul className="mb-4 list-disc space-y-1 pl-5 text-sm font-bold text-red-700">
            {error.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        ) : null}

        {!loaded ? (
          <p className="text-sm font-semibold text-muted">Loading results…</p>
        ) : record && votes.length > 0 ? (
          <ResultsTab
            modalId={record.id}
            onChanged={() => void loadRecord(token)}
            onUnauthorized={handleUnauthorized}
            resolution={record.resolution}
            status={record.status}
            token={token}
            voteBlocks={votes}
          />
        ) : record ? (
          <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Shown" value={record.stats.shown} />
              <StatCard label="Dismissed" value={record.stats.dismissed} />
              <StatCard label="Button clicks" value={record.stats.cta_clicked} />
            </div>
            <p className="mt-4 text-xs font-semibold text-muted">Counts every impression, not unique users.</p>
          </div>
        ) : null}
      </div>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-cloud p-4">
      <p className="text-[11px] font-black uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-black text-midnight">{value}</p>
    </div>
  );
}
