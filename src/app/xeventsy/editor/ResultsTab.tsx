"use client";

import { useEffect, useState } from "react";
import { Download, RefreshCw, Send, Trash2, Trophy, UserCheck, UserX } from "lucide-react";
import { adminFetch, type AdminResult } from "../api";
import { textOf, type Block, type EventModalRecord } from "../eventModal";
import {
  answerLabel,
  buildResolutionBody,
  emptyResolutionInput,
  inputsFromResolution,
  parseEmails,
  type ResolutionInput
} from "./results";

type Status = EventModalRecord["status"];

type Common = {
  modalId: string;
  token: string;
  onUnauthorized: () => void;
};

export type ResultsTabProps = Common & {
  voteBlocks: Block[];
  status: Status;
  resolution?: unknown;
  onChanged: () => void;
};

type EntryRow = {
  userEmail: string;
  answers: Record<string, unknown>;
  disqualified: boolean;
  createdAt: string;
};

type EntriesData = {
  voteBlocks: Block[];
  users: EntryRow[];
  total: number;
  truncated: boolean;
};

type ScoreboardData = {
  totalEntrants: number;
  perfectScorers: number;
  top: Array<{ userEmail: string; score: number; correctBlockIds: string[] }>;
};

type Winner = {
  userEmail: string;
  score: number;
  prize: string | null;
  method: "draw" | "manual";
  notifiedAt: string | null;
  notifyResult: unknown;
  createdAt: string;
};

type NotifyRow = {
  userEmail: string;
  push: { sent: number; failed: number } | "error";
  email: "sent" | "failed";
  notified: boolean;
};

const ACCOUNT_DELETION_WARNING =
  "If a winner deletes their account their winner record is deleted with it. Contact winners and deliver prizes promptly.";
const NOTIFY_NOTE =
  "A winner is only marked notified when the push reached a device or the email was sent; you can retry after 30 seconds.";

const FIELD =
  "h-10 w-full rounded-xl border border-line bg-white px-3 text-sm text-midnight outline-none transition focus:ring-2 focus:ring-cyan/20";
const BUTTON =
  "inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-xs font-bold text-midnight shadow-sm transition hover:border-cyan disabled:cursor-not-allowed disabled:opacity-50";
const PRIMARY_BUTTON =
  "inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-midnight to-ink px-4 text-xs font-bold text-aqua shadow-glow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";
const SECTION = "rounded-2xl border border-line bg-white p-5 shadow-card";
const EYEBROW = "text-[10px] font-black uppercase tracking-[0.12em] text-cyanDeep";

function Message({ tone, text }: { tone: "error" | "notice"; text: string | null }) {
  if (!text) return null;
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`text-sm font-bold ${tone === "error" ? "text-red-700" : "text-emerald-700"}`}
    >
      {text}
    </p>
  );
}

function formatTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

// Shared by every section: a failed call hands the message to the section and
// a 401 reaches the shell once.
function callAdmin<T>(
  common: Common,
  path: string,
  method: string,
  body?: unknown
): Promise<AdminResult<T>> {
  return adminFetch<T>(`/${encodeURIComponent(common.modalId)}${path}`, {
    token: common.token,
    method,
    body,
    onUnauthorized: common.onUnauthorized
  });
}

function EntriesSection({ common, status }: { common: Common; status: Status }) {
  const [data, setData] = useState<EntriesData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const result = await callAdmin<EntriesData>(common, "/entries", "GET");
    if (result.ok) {
      setData(result.data);
      setError(null);
    } else {
      setError(result.message);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [common.modalId, common.token]);

  async function downloadCsv() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `/bff/admin/event-modals/${encodeURIComponent(common.modalId)}/entries-csv`,
        { headers: { Authorization: `Bearer ${common.token}` }, cache: "no-store" }
      );
      if (response.status === 401) {
        common.onUnauthorized();
        return;
      }
      if (!response.ok) {
        const json = (await response.json().catch(() => null)) as { message?: unknown } | null;
        setError(typeof json?.message === "string" ? json.message : "Could not download the CSV.");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `event-modal-${common.modalId}-entries.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function setDisqualified(userEmail: string, disqualified: boolean) {
    setBusy(true);
    setError(null);
    setNotice(null);
    const result = await callAdmin<{ updated: number }>(common, "/disqualify", "POST", {
      userEmail,
      disqualified
    });
    setBusy(false);
    if (result.ok) {
      setNotice(disqualified ? `Disqualified ${userEmail}.` : `Reinstated ${userEmail}.`);
      await load();
    } else {
      setError(result.message);
    }
  }

  const resolved = status === "resolved";

  return (
    <section className={SECTION} aria-labelledby="results-entries">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={EYEBROW}>Entries</p>
          <h2 id="results-entries" className="mt-1 text-sm font-black text-midnight">
            {data ? `${data.total} entrant${data.total === 1 ? "" : "s"}` : "Entrants"}
          </h2>
        </div>
        <button type="button" className={BUTTON} onClick={downloadCsv} disabled={busy}>
          <Download aria-hidden="true" size={14} />
          Download CSV
        </button>
      </div>
      {data?.truncated ? (
        <p className="mb-3 text-xs font-semibold text-muted">
          Showing the first 5000 entrants. Download the CSV for the full list.
        </p>
      ) : null}
      <Message tone="error" text={error} />
      <Message tone="notice" text={notice} />

      {data && data.users.length === 0 ? (
        <p className="text-sm font-semibold text-muted">No entries yet.</p>
      ) : null}
      {data && data.users.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-[10px] font-black uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="py-2 pr-3">Email</th>
                {data.voteBlocks.map((block) => (
                  <th className="py-2 pr-3" key={block.id}>
                    {textOf(block.props.question) || block.id}
                  </th>
                ))}
                <th className="py-2 pr-3">Entered</th>
                <th className="py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.users.map((row) => (
                <tr key={row.userEmail}>
                  <td className="py-2.5 pr-3 font-semibold text-midnight">
                    {row.userEmail}
                    {row.disqualified ? (
                      <span className="ml-2 rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-black uppercase text-red-700">
                        Disqualified
                      </span>
                    ) : null}
                  </td>
                  {data.voteBlocks.map((block) => (
                    <td className="py-2.5 pr-3 text-muted" key={block.id}>
                      {answerLabel(block, row.answers[block.id])}
                    </td>
                  ))}
                  <td className="py-2.5 pr-3 text-xs text-muted">{formatTime(row.createdAt)}</td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      className={BUTTON}
                      disabled={busy || resolved}
                      onClick={() => setDisqualified(row.userEmail, !row.disqualified)}
                    >
                      {row.disqualified ? (
                        <UserCheck aria-hidden="true" size={14} />
                      ) : (
                        <UserX aria-hidden="true" size={14} />
                      )}
                      {row.disqualified ? "Reinstate" : "Disqualify"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

function ResolutionSection({
  common,
  voteBlocks,
  status,
  resolution,
  onSaved
}: {
  common: Common;
  voteBlocks: Block[];
  status: Status;
  resolution: unknown;
  onSaved: () => void;
}) {
  const [inputs, setInputs] = useState<Record<string, ResolutionInput>>(() =>
    inputsFromResolution(voteBlocks, resolution)
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Re-prefill only when the saved resolution or the block ids change, not on
  // every parent render (the shell passes a new voteBlocks array each time).
  const prefillKey = JSON.stringify([resolution ?? null, voteBlocks.map((block) => block.id)]);
  useEffect(() => {
    setInputs(inputsFromResolution(voteBlocks, resolution));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillKey]);

  function patch(blockId: string, next: Partial<ResolutionInput>) {
    setInputs((current) => ({
      ...current,
      [blockId]: { ...(current[blockId] ?? emptyResolutionInput()), ...next }
    }));
  }

  async function save() {
    setError(null);
    setNotice(null);
    const built = buildResolutionBody(voteBlocks, inputs);
    if (!built.ok) {
      setError(built.message);
      return;
    }
    setBusy(true);
    const result = await callAdmin<unknown>(common, "/resolution", "PUT", built.body);
    setBusy(false);
    if (result.ok) {
      setNotice("Result saved.");
      onSaved();
    } else {
      setError(result.message);
    }
  }

  const locked = status === "resolved" || status === "archived";

  return (
    <section className={SECTION} aria-labelledby="results-resolution">
      <p className={EYEBROW}>Real result</p>
      <h2 id="results-resolution" className="mt-1 text-sm font-black text-midnight">
        Correct answers
      </h2>
      <p className="mt-1 text-xs font-semibold text-muted">
        Enter the correct answer for every vote block. Voting must be closed before you save.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {voteBlocks.map((block) => {
          const questionType = block.props.questionType;
          const input = inputs[block.id] ?? emptyResolutionInput();
          const options = Array.isArray(block.props.options)
            ? (block.props.options as Array<{ id: string; label: unknown }>)
            : [];
          const label = textOf(block.props.question) || block.id;
          const id = `result-${block.id}`;
          return (
            <div key={block.id}>
              <label className="block text-sm font-bold text-midnight" htmlFor={id}>
                {label}
              </label>
              {questionType === "choice" ? (
                <select
                  id={id}
                  className={`${FIELD} mt-1.5`}
                  value={input.optionId}
                  onChange={(event) => patch(block.id, { optionId: event.target.value })}
                  disabled={locked}
                >
                  <option value="">Pick the correct answer</option>
                  {options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {textOf(option.label) || option.id}
                    </option>
                  ))}
                </select>
              ) : null}
              {questionType === "exact_score" ? (
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    id={id}
                    aria-label={`${label}: home score`}
                    type="number"
                    min={0}
                    max={99}
                    className={FIELD}
                    value={input.home}
                    onChange={(event) => patch(block.id, { home: event.target.value })}
                    disabled={locked}
                  />
                  <span className="text-sm font-black text-muted">-</span>
                  <input
                    aria-label={`${label}: away score`}
                    type="number"
                    min={0}
                    max={99}
                    className={FIELD}
                    value={input.away}
                    onChange={(event) => patch(block.id, { away: event.target.value })}
                    disabled={locked}
                  />
                </div>
              ) : null}
              {questionType === "number" ? (
                <input
                  id={id}
                  type="number"
                  className={`${FIELD} mt-1.5`}
                  value={input.value}
                  onChange={(event) => patch(block.id, { value: event.target.value })}
                  disabled={locked}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" className={PRIMARY_BUTTON} onClick={save} disabled={busy || locked}>
          Save result
        </button>
        <Message tone="error" text={error} />
        <Message tone="notice" text={notice} />
      </div>
    </section>
  );
}

function ScoreboardSection({ common, hasResolution }: { common: Common; hasResolution: boolean }) {
  const [data, setData] = useState<ScoreboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasResolution) {
      setData(null);
      setError(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const result = await callAdmin<ScoreboardData>(common, "/scoreboard", "GET");
      if (cancelled) return;
      if (result.ok) {
        setData(result.data);
        setError(null);
      } else {
        setData(null);
        setError(result.message);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [common.modalId, common.token, hasResolution]);

  return (
    <section className={SECTION} aria-labelledby="results-scoreboard">
      <p className={EYEBROW}>Scoreboard</p>
      <h2 id="results-scoreboard" className="mt-1 text-sm font-black text-midnight">
        Scores
      </h2>
      {!hasResolution ? (
        <p className="mt-3 text-sm font-semibold text-muted">Save the real result to see the scoreboard.</p>
      ) : null}
      <Message tone="error" text={error} />
      {data ? (
        <>
          <p className="mt-3 text-sm font-semibold text-muted">
            {data.totalEntrants} entrant{data.totalEntrants === 1 ? "" : "s"} · {data.perfectScorers} perfect
            score{data.perfectScorers === 1 ? "" : "s"}
          </p>
          {data.top.length === 0 ? (
            <p className="mt-2 text-sm font-semibold text-muted">No scores to show.</p>
          ) : (
            <ol className="mt-3 divide-y divide-line">
              {data.top.map((row, index) => (
                <li className="flex items-center justify-between gap-3 py-2 text-sm" key={row.userEmail}>
                  <span className="min-w-0 truncate font-semibold text-midnight">
                    {index + 1}. {row.userEmail}
                  </span>
                  <span className="shrink-0 text-xs font-bold text-muted">
                    {row.score} point{row.score === 1 ? "" : "s"} · {row.correctBlockIds.length} correct
                  </span>
                </li>
              ))}
            </ol>
          )}
        </>
      ) : null}
    </section>
  );
}

function WinnersSection({
  common,
  status,
  onResolved
}: {
  common: Common;
  status: Status;
  onResolved: () => void;
}) {
  const [winners, setWinners] = useState<Winner[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState("1");
  const [drawPrize, setDrawPrize] = useState("");
  const [manualText, setManualText] = useState("");
  const [manualPrize, setManualPrize] = useState("");
  const [confirming, setConfirming] = useState<"clear" | "resolve" | null>(null);
  const [notifyRows, setNotifyRows] = useState<NotifyRow[] | null>(null);

  async function load() {
    const result = await callAdmin<{ winners: Winner[] }>(common, "/winners", "GET");
    if (result.ok) {
      setWinners(result.data.winners);
    } else {
      setError(result.message);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [common.modalId, common.token]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
    } finally {
      setBusy(false);
      setConfirming(null);
    }
  }

  function draw() {
    const parsed = Number(count);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 50) {
      setError("Enter a number of winners from 1 to 50.");
      return;
    }
    void run(async () => {
      const result = await callAdmin<{ winners: Winner[] }>(common, "/winners/draw", "POST", {
        count: parsed,
        prize: drawPrize.trim() || undefined
      });
      if (result.ok) {
        setNotice(`Drew ${result.data.winners.length} winner${result.data.winners.length === 1 ? "" : "s"}.`);
        await load();
      } else {
        setError(result.message);
      }
    });
  }

  function pickManually() {
    const userEmails = parseEmails(manualText);
    if (userEmails.length === 0) {
      setError("Enter at least one email address.");
      return;
    }
    void run(async () => {
      const result = await callAdmin<{ winners: Winner[] }>(common, "/winners", "POST", {
        userEmails,
        prize: manualPrize.trim() || undefined
      });
      if (result.ok) {
        setNotice(`Added ${result.data.winners.length} winner${result.data.winners.length === 1 ? "" : "s"}.`);
        setManualText("");
        await load();
      } else {
        setError(result.message);
      }
    });
  }

  function clearWinners() {
    void run(async () => {
      const result = await callAdmin<{ cleared: number }>(common, "/winners", "DELETE");
      if (result.ok) {
        setNotice(`Cleared ${result.data.cleared} winner${result.data.cleared === 1 ? "" : "s"}.`);
        await load();
      } else {
        setError(result.message);
      }
    });
  }

  function resolve() {
    void run(async () => {
      const result = await callAdmin<unknown>(common, "/resolve", "POST");
      if (result.ok) {
        setNotice("Giveaway resolved.");
        onResolved();
      } else {
        setError(result.message);
      }
    });
  }

  function notify() {
    void run(async () => {
      const result = await callAdmin<{ results: NotifyRow[] }>(common, "/winners/notify", "POST");
      if (result.ok) {
        setNotifyRows(result.data.results);
        await load();
      } else {
        setError(result.message);
      }
    });
  }

  const resolved = status === "resolved";
  const editable = !resolved && !busy;

  return (
    <section className={SECTION} aria-labelledby="results-winners">
      <p className={EYEBROW}>Winners</p>
      <h2 id="results-winners" className="mt-1 text-sm font-black text-midnight">
        Winners
      </h2>

      <div
        role="note"
        className="mt-3 flex gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs font-semibold text-amber-900"
      >
        {ACCOUNT_DELETION_WARNING}
      </div>

      <Message tone="error" text={error} />
      <Message tone="notice" text={notice} />

      {winners && winners.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-[10px] font-black uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Score</th>
                <th className="py-2 pr-3">Prize</th>
                <th className="py-2 pr-3">Method</th>
                <th className="py-2">Notified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {winners.map((winner) => (
                <tr key={winner.userEmail}>
                  <td className="py-2.5 pr-3 font-semibold text-midnight">{winner.userEmail}</td>
                  <td className="py-2.5 pr-3 text-muted">{winner.score}</td>
                  <td className="py-2.5 pr-3 text-muted">{winner.prize || "—"}</td>
                  <td className="py-2.5 pr-3 text-muted">{winner.method}</td>
                  <td className="py-2.5 text-xs text-muted">
                    {winner.notifiedAt ? formatTime(winner.notifiedAt) : "Not yet"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-3 text-sm font-semibold text-muted">No winners yet.</p>
      )}

      {!resolved ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-line p-4">
            <p className="text-sm font-black text-midnight">Draw</p>
            <label className="mt-3 block text-xs font-bold text-midnight" htmlFor="draw-count">
              Number of winners (1 to 50)
            </label>
            <input
              id="draw-count"
              type="number"
              min={1}
              max={50}
              className={`${FIELD} mt-1`}
              value={count}
              onChange={(event) => setCount(event.target.value)}
              disabled={!editable}
            />
            <label className="mt-3 block text-xs font-bold text-midnight" htmlFor="draw-prize">
              Prize (optional)
            </label>
            <input
              id="draw-prize"
              className={`${FIELD} mt-1`}
              value={drawPrize}
              onChange={(event) => setDrawPrize(event.target.value)}
              disabled={!editable}
            />
            <button type="button" className={`${PRIMARY_BUTTON} mt-4`} onClick={draw} disabled={!editable}>
              Draw winners
            </button>
          </div>

          <div className="rounded-xl border border-line p-4">
            <p className="text-sm font-black text-midnight">Pick manually</p>
            <label className="mt-3 block text-xs font-bold text-midnight" htmlFor="manual-emails">
              Emails, one per line
            </label>
            <textarea
              id="manual-emails"
              rows={4}
              className="mt-1 w-full rounded-xl border border-line bg-white p-3 text-sm text-midnight outline-none focus:ring-2 focus:ring-cyan/20"
              value={manualText}
              onChange={(event) => setManualText(event.target.value)}
              disabled={!editable}
            />
            <label className="mt-3 block text-xs font-bold text-midnight" htmlFor="manual-prize">
              Prize (optional)
            </label>
            <input
              id="manual-prize"
              className={`${FIELD} mt-1`}
              value={manualPrize}
              onChange={(event) => setManualPrize(event.target.value)}
              disabled={!editable}
            />
            <button type="button" className={`${PRIMARY_BUTTON} mt-4`} onClick={pickManually} disabled={!editable}>
              Add winners
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {!resolved && winners && winners.length > 0 ? (
          confirming === "clear" ? (
            <>
              <span className="text-xs font-bold text-red-700">Remove every winner?</span>
              <button type="button" className={BUTTON} onClick={clearWinners} disabled={busy}>
                <Trash2 aria-hidden="true" size={14} />
                Yes, clear winners
              </button>
              <button type="button" className={BUTTON} onClick={() => setConfirming(null)} disabled={busy}>
                Cancel
              </button>
            </>
          ) : (
            <button type="button" className={BUTTON} onClick={() => setConfirming("clear")} disabled={busy}>
              <Trash2 aria-hidden="true" size={14} />
              Clear winners
            </button>
          )
        ) : null}

        {status === "published" ? (
          confirming === "resolve" ? (
            <>
              <span className="text-xs font-bold text-red-700">Resolve the giveaway? It cannot be reopened.</span>
              <button type="button" className={PRIMARY_BUTTON} onClick={resolve} disabled={busy}>
                <Trophy aria-hidden="true" size={14} />
                Yes, resolve
              </button>
              <button type="button" className={BUTTON} onClick={() => setConfirming(null)} disabled={busy}>
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              className={BUTTON}
              onClick={() => setConfirming("resolve")}
              disabled={busy || !winners || winners.length === 0}
            >
              <Trophy aria-hidden="true" size={14} />
              Resolve
            </button>
          )
        ) : null}

        {resolved ? (
          <button type="button" className={PRIMARY_BUTTON} onClick={notify} disabled={busy}>
            <Send aria-hidden="true" size={14} />
            Notify winners
          </button>
        ) : null}
        <button type="button" className={BUTTON} onClick={() => void load()} disabled={busy}>
          <RefreshCw aria-hidden="true" size={14} />
          Refresh
        </button>
      </div>

      {resolved ? <p className="mt-3 text-xs font-semibold text-muted">{NOTIFY_NOTE}</p> : null}

      {notifyRows ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="text-[10px] font-black uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Push</th>
                <th className="py-2 pr-3">Email sent</th>
                <th className="py-2">Notified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {notifyRows.map((row) => (
                <tr key={row.userEmail}>
                  <td className="py-2.5 pr-3 font-semibold text-midnight">{row.userEmail}</td>
                  <td className="py-2.5 pr-3 text-muted">
                    {row.push === "error" ? "Error" : `${row.push.sent} sent, ${row.push.failed} failed`}
                  </td>
                  <td className="py-2.5 pr-3 text-muted">{row.email}</td>
                  <td className="py-2.5 text-muted">{row.notified ? "Yes" : "No, retry later"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

export function ResultsTab({
  modalId,
  voteBlocks,
  status,
  token,
  onUnauthorized,
  onChanged,
  resolution
}: ResultsTabProps) {
  const common: Common = { modalId, token, onUnauthorized };
  const hasResolution = resolution !== null && resolution !== undefined;

  if (voteBlocks.length === 0) {
    return (
      <p className="rounded-2xl border border-line bg-white p-5 text-sm font-semibold text-muted">
        Add a vote block in the Blocks tab to run a giveaway. Results need at least one vote block.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <EntriesSection common={common} status={status} />
      <ResolutionSection
        common={common}
        voteBlocks={voteBlocks}
        status={status}
        resolution={resolution}
        onSaved={onChanged}
      />
      <ScoreboardSection common={common} hasResolution={hasResolution} />
      <WinnersSection common={common} status={status} onResolved={onChanged} />
    </div>
  );
}
