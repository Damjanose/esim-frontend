"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, LogOut, RefreshCw, RotateCcw, X } from "lucide-react";
import { AdminNav } from "../AdminNav";
import { AdminLoginCard } from "../AdminLoginCard";
import { useAdminSession } from "../useAdminSession";

const LANGUAGE_COUNT = 9;

type AdminKeyword = {
  id: string;
  phrase: string;
  normalized: string;
  source: "seed" | "admin";
  deletedAt: string | null;
};

type AdminProblem = {
  code: string;
  answer: string;
  action: "open_esims" | "open_marketplace" | "open_profile_settings" | null;
  supportTopic: string;
  escalateOnly: boolean;
  enabled: boolean;
  sortOrder: number;
  translatedCount: number;
  translationStatus: "done" | "pending" | "failed";
  keywords: AdminKeyword[];
};

type ScoreHit = { code: string; score: number; hits: string[] };

type UnmatchedGroup = {
  normalized: string;
  sample: string;
  count: number;
  langs: string[];
  screens: string[];
  lastSeen: string;
  suggestion: string | null;
};

type Envelope<T> = { status?: string; data?: T; message?: string };

type AdminFetch = <T>(path: string, init?: RequestInit) => Promise<T>;

function translationLabel(problem: AdminProblem): string {
  const n = problem.translatedCount;
  if (problem.translationStatus === "done") return `${LANGUAGE_COUNT}/${LANGUAGE_COUNT} translated`;
  if (problem.translationStatus === "failed") return `Translation failed (${n}/${LANGUAGE_COUNT})`;
  return `Translating… (${n}/${LANGUAGE_COUNT})`;
}

const TRANSLATION_CLASSES: Record<AdminProblem["translationStatus"], string> = {
  done: "border-green-200 bg-green-50 text-green-700",
  pending: "border-cyan/40 bg-[rgba(0,217,245,0.08)] text-cyanDeep",
  failed: "border-red-200 bg-red-50 text-red-700"
};

function preview(answer: string): string {
  return answer.length > 80 ? `${answer.slice(0, 80)}…` : answer;
}

function ProblemCard({
  problem,
  expanded,
  onToggleExpanded,
  adminFetch,
  onProblemUpdated,
  onReload
}: {
  problem: AdminProblem;
  expanded: boolean;
  onToggleExpanded: () => void;
  adminFetch: AdminFetch;
  onProblemUpdated: (problem: AdminProblem) => void;
  onReload: () => Promise<void>;
}) {
  const [answerDraft, setAnswerDraft] = useState(problem.answer);
  const [phrase, setPhrase] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setAnswerDraft(problem.answer);
  }, [problem.answer]);

  const base = `/bff/admin/troubleshoot/${encodeURIComponent(problem.code)}`;
  const liveKeywords = problem.keywords.filter((keyword) => !keyword.deletedAt);
  const deletedKeywords = problem.keywords.filter((keyword) => keyword.deletedAt);

  async function run(work: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await work();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  async function patch(body: Record<string, unknown>) {
    const payload = await adminFetch<Envelope<{ problem: AdminProblem }>>(base, {
      method: "PATCH",
      body: JSON.stringify(body)
    });
    if (payload.data?.problem) onProblemUpdated(payload.data.problem);
    else await onReload();
  }

  const saveAnswer = () => run(() => patch({ answer: answerDraft }));
  const toggleEnabled = () => run(() => patch({ enabled: !problem.enabled }));

  async function addKeyword(value: string) {
    const payload = await adminFetch<Envelope<{ keyword: AdminKeyword; restored: boolean; warning: string | null }>>(
      `${base}/keywords`,
      { method: "POST", body: JSON.stringify({ phrase: value }) }
    );
    await onReload();
    if (payload.data?.warning === "single_word") {
      setNotice("Single words can match too much. Prefer a phrase.");
    }
  }

  const submitKeyword = () =>
    run(async () => {
      await addKeyword(phrase.trim());
      setPhrase("");
    });

  const restoreKeyword = (keyword: AdminKeyword) => run(() => addKeyword(keyword.phrase));

  const deleteKeyword = (keyword: AdminKeyword) =>
    run(async () => {
      await adminFetch(`${base}/keywords/${encodeURIComponent(keyword.id)}`, { method: "DELETE" });
      await onReload();
    });

  return (
    <li className="rounded-2xl border border-line bg-white shadow-card">
      <div className="flex flex-wrap items-center gap-3 p-4">
        <button
          aria-expanded={expanded}
          aria-label={`${expanded ? "Collapse" : "Expand"} ${problem.code}`}
          className="flex min-w-0 flex-1 items-start gap-2 text-left"
          onClick={onToggleExpanded}
          type="button"
        >
          {expanded ? (
            <ChevronDown aria-hidden="true" className="mt-0.5 shrink-0" size={16} />
          ) : (
            <ChevronRight aria-hidden="true" className="mt-0.5 shrink-0" size={16} />
          )}
          <span className="min-w-0">
            <span className="block text-sm font-black text-midnight">{problem.code}</span>
            <span className="block truncate text-xs font-semibold text-muted">{preview(problem.answer)}</span>
          </span>
        </button>
        <span className="text-xs font-bold text-muted">{liveKeywords.length} keywords</span>
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black ${TRANSLATION_CLASSES[problem.translationStatus]}`}
        >
          {translationLabel(problem)}
        </span>
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-midnight">
          <input
            checked={problem.enabled}
            className="h-4 w-4 accent-cyan"
            disabled={busy}
            onChange={() => void toggleEnabled()}
            type="checkbox"
          />
          {problem.enabled ? "Enabled" : "Disabled"}
        </label>
      </div>

      {/* The enable toggle sits in the header, so its errors must show while collapsed too. */}
      {!expanded && error ? (
        <div className="mx-4 mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
          {error}
        </div>
      ) : null}

      {expanded ? (
        <div className="grid gap-5 border-t border-line p-4">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
              {error}
            </div>
          ) : null}
          {notice ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
              {notice}
            </div>
          ) : null}

          <div>
            <label className="block text-xs font-bold text-muted" htmlFor={`answer-${problem.code}`}>
              English answer
            </label>
            <textarea
              className="mt-1 min-h-[96px] w-full rounded-xl border border-line px-3 py-2 text-sm text-midnight outline-none focus:border-cyan"
              id={`answer-${problem.code}`}
              disabled={busy}
              maxLength={2000}
              onChange={(event) => setAnswerDraft(event.target.value)}
              value={answerDraft}
            />
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                className="h-9 rounded-xl bg-gradient-to-r from-midnight to-ink px-5 text-xs font-black text-aqua shadow-glow transition hover:opacity-90 disabled:opacity-50"
                disabled={busy || answerDraft === problem.answer}
                onClick={() => void saveAnswer()}
                type="button"
              >
                Save
              </button>
              <span className="text-[11px] font-semibold text-muted">
                Other languages update automatically after saving.
              </span>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-muted">Keywords</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {liveKeywords.length === 0 ? (
                <li className="text-xs font-semibold text-muted">No keywords</li>
              ) : (
                liveKeywords.map((keyword) => (
                  <li
                    className="inline-flex items-center gap-1 rounded-full border border-line bg-cloud px-3 py-1 text-xs font-semibold text-midnight"
                    key={keyword.id}
                  >
                    {keyword.phrase}
                    <button
                      aria-label={`Delete keyword ${keyword.phrase}`}
                      className="rounded-full p-0.5 text-muted transition hover:text-red-600 disabled:opacity-50"
                      disabled={busy}
                      onClick={() => void deleteKeyword(keyword)}
                      type="button"
                    >
                      <X aria-hidden="true" size={12} />
                    </button>
                  </li>
                ))
              )}
            </ul>

            <div className="mt-3 flex flex-wrap gap-2">
              <input
                aria-label="New keyword"
                className="h-9 min-w-[220px] flex-1 rounded-xl border border-line px-3 text-sm text-midnight outline-none focus:border-cyan"
                onChange={(event) => setPhrase(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && phrase.trim() && !busy) void submitKeyword();
                }}
                placeholder="Add a keyword"
                value={phrase}
              />
              <button
                className="h-9 rounded-xl border border-line bg-white px-4 text-xs font-bold text-midnight shadow-sm transition hover:border-cyan disabled:opacity-50"
                disabled={busy || !phrase.trim()}
                onClick={() => void submitKeyword()}
                type="button"
              >
                Add
              </button>
            </div>
            <p className="mt-2 text-[11px] font-semibold text-muted">
              Use + for words in any order (esim + not working). End a word with * to match its forms (instal*).
            </p>

            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-midnight">
              <input
                checked={showDeleted}
                className="h-4 w-4 accent-cyan"
                onChange={(event) => setShowDeleted(event.target.checked)}
                type="checkbox"
              />
              Show deleted
            </label>
            {showDeleted ? (
              <ul className="mt-2 grid gap-1">
                {deletedKeywords.length === 0 ? (
                  <li className="text-xs font-semibold text-muted">No deleted keywords</li>
                ) : (
                  deletedKeywords.map((keyword) => (
                    <li className="flex items-center gap-2 text-xs font-semibold text-muted" key={keyword.id}>
                      <span className="line-through">{keyword.phrase}</span>
                      <button
                        className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[11px] font-bold text-midnight transition hover:border-cyan disabled:opacity-50"
                        disabled={busy}
                        onClick={() => void restoreKeyword(keyword)}
                        type="button"
                      >
                        <RotateCcw aria-hidden="true" size={11} />
                        Restore
                      </button>
                    </li>
                  ))
                )}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}
    </li>
  );
}

function formatLastSeen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function UnmatchedCard({
  group,
  problems,
  adminFetch,
  onResolved,
  onWarning
}: {
  group: UnmatchedGroup;
  problems: AdminProblem[];
  adminFetch: AdminFetch;
  onResolved: (normalized: string, reloadProblems: boolean) => Promise<void>;
  onWarning: (message: string) => void;
}) {
  const suggested = problems.some((problem) => problem.code === group.suggestion) ? group.suggestion : null;
  const [code, setCode] = useState(suggested ?? problems[0]?.code ?? "");
  const [phrase, setPhrase] = useState(group.sample);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // The problems list can arrive after this card mounts; prefer the suggestion once it does.
  useEffect(() => {
    if (code || problems.length === 0) return;
    const known = problems.some((problem) => problem.code === group.suggestion);
    setCode(known && group.suggestion ? group.suggestion : problems[0].code);
  }, [code, problems, group.suggestion]);

  async function dismissRequest() {
    await adminFetch("/bff/admin/troubleshoot/unmatched/dismiss", {
      method: "POST",
      body: JSON.stringify({ normalized: group.normalized })
    });
  }

  async function run(work: () => Promise<boolean>) {
    setBusy(true);
    setError("");
    try {
      const reloadProblems = await work();
      await onResolved(group.normalized, reloadProblems);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      setBusy(false);
    }
  }

  const addAsKeyword = () =>
    run(async () => {
      const payload = await adminFetch<Envelope<{ warning: string | null }>>(
        `/bff/admin/troubleshoot/${encodeURIComponent(code)}/keywords`,
        { method: "POST", body: JSON.stringify({ phrase: phrase.trim() }) }
      );
      if (payload.data?.warning === "single_word") {
        onWarning("Single words can match too much. Prefer a phrase.");
      }
      try {
        await dismissRequest();
      } catch {
        // The keyword is saved: refresh the problems anyway and leave only the dismiss to retry.
        await onResolved("", true);
        throw new Error("Keyword added, but this message couldn't be dismissed. Press Dismiss to try again.");
      }
      return true;
    });

  const dismiss = () =>
    run(async () => {
      await dismissRequest();
      return false;
    });

  return (
    <li className="rounded-2xl border border-line bg-white p-4 shadow-card">
      <p className="text-sm font-black text-midnight">{group.sample}</p>
      <p className="mt-1 text-xs font-semibold text-muted">
        {group.count}x · {group.langs.join(", ")} · last seen {formatLastSeen(group.lastSeen)}
      </p>
      {error ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
          {error}
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          aria-label="Problem"
          className="h-9 rounded-xl border border-line bg-white px-3 text-xs font-bold text-midnight outline-none focus:border-cyan"
          onChange={(event) => setCode(event.target.value)}
          value={code}
        >
          {problems.map((problem) => (
            <option key={problem.code} value={problem.code}>
              {problem.code}
            </option>
          ))}
        </select>
        <input
          aria-label="Keyword phrase"
          className="h-9 min-w-[220px] flex-1 rounded-xl border border-line px-3 text-sm text-midnight outline-none focus:border-cyan"
          onChange={(event) => setPhrase(event.target.value)}
          value={phrase}
        />
        <button
          className="h-9 rounded-xl bg-gradient-to-r from-midnight to-ink px-4 text-xs font-black text-aqua shadow-glow transition hover:opacity-90 disabled:opacity-50"
          disabled={busy || !code || !phrase.trim()}
          onClick={() => void addAsKeyword()}
          type="button"
        >
          Add as keyword
        </button>
        <button
          className="h-9 rounded-xl border border-line bg-white px-4 text-xs font-bold text-midnight shadow-sm transition hover:border-cyan disabled:opacity-50"
          disabled={busy}
          onClick={() => void dismiss()}
          type="button"
        >
          Dismiss
        </button>
      </div>
    </li>
  );
}

export default function AdminTroubleshootPage() {
  const session = useAdminSession();
  const { token, handleUnauthorized } = session;

  const [problems, setProblems] = useState<AdminProblem[]>([]);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [unmatched, setUnmatched] = useState<UnmatchedGroup[]>([]);
  const [isLoadingUnmatched, setIsLoadingUnmatched] = useState(false);
  const [unmatchedError, setUnmatchedError] = useState("");
  const [unmatchedNotice, setUnmatchedNotice] = useState("");

  const [message, setMessage] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [testError, setTestError] = useState("");
  const [testResult, setTestResult] = useState<{ match: ScoreHit | null; scores: ScoreHit[] } | null>(null);

  async function adminFetch<T>(path: string, init: RequestInit = {}, nextToken = token): Promise<T> {
    const response = await fetch(path, {
      ...init,
      headers: { Authorization: `Bearer ${nextToken}`, "Content-Type": "application/json" },
      cache: "no-store"
    });
    // A proxy or framework error page isn't JSON; fall back to a readable message.
    const payload = (await response.json().catch(() => ({}))) as { status?: string; message?: string };
    if (response.status === 401) {
      handleUnauthorized();
      throw new Error("Session expired. Sign in again.");
    }
    if (!response.ok || payload.status !== "success") {
      throw new Error(payload.message ?? "Request failed");
    }
    return payload as T;
  }

  async function load(nextToken = token) {
    if (!nextToken) return;
    setIsLoading(true);
    setError("");
    try {
      const payload = await adminFetch<Envelope<{ problems: AdminProblem[] }>>(
        "/bff/admin/troubleshoot",
        {},
        nextToken
      );
      setProblems(payload.data?.problems ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the troubleshooting problems");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadUnmatched(nextToken = token) {
    if (!nextToken) return;
    setIsLoadingUnmatched(true);
    setUnmatchedError("");
    try {
      const payload = await adminFetch<Envelope<{ groups: UnmatchedGroup[] }>>(
        "/bff/admin/troubleshoot/unmatched",
        {},
        nextToken
      );
      setUnmatched(payload.data?.groups ?? []);
    } catch (err) {
      setUnmatchedError(err instanceof Error ? err.message : "Could not load the unmatched messages");
    } finally {
      setIsLoadingUnmatched(false);
    }
  }

  async function resolveUnmatched(normalized: string, reloadProblems: boolean) {
    setUnmatched((current) => current.filter((group) => group.normalized !== normalized));
    if (reloadProblems) await load();
  }

  useEffect(() => {
    if (token) {
      void load(token);
      void loadUnmatched(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function runTest() {
    const text = message.trim();
    if (!text) return;
    setIsTesting(true);
    setTestError("");
    try {
      const payload = await adminFetch<Envelope<{ match: ScoreHit | null; scores: ScoreHit[] }>>(
        "/bff/admin/troubleshoot/test",
        { method: "POST", body: JSON.stringify({ message: text }) }
      );
      setTestResult({ match: payload.data?.match ?? null, scores: payload.data?.scores ?? [] });
    } catch (err) {
      setTestResult(null);
      setTestError(err instanceof Error ? err.message : "Could not test the message");
    } finally {
      setIsTesting(false);
    }
  }

  function replaceProblem(updated: AdminProblem) {
    setProblems((current) => current.map((item) => (item.code === updated.code ? updated : item)));
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
              Assistant troubleshooting
            </h1>
            <p className="mt-1 max-w-2xl text-sm font-semibold text-muted">
              Edit the answers and keywords the in-app assistant uses to recognise common problems.
            </p>
          </div>
          {token ? (
            <div className="flex gap-2">
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-xs font-bold text-midnight shadow-sm transition hover:border-cyan disabled:opacity-50"
                disabled={isLoading}
                onClick={() => {
                  void load();
                  void loadUnmatched();
                }}
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
          <div className="grid max-w-5xl gap-5">
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {error}
              </div>
            ) : null}

            <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
              <p className="text-[10px] font-black uppercase tracking-wide text-muted">Test a message</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  aria-label="Message to test"
                  className="h-10 min-w-[240px] flex-1 rounded-xl border border-line px-3 text-sm text-midnight outline-none focus:border-cyan"
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !isTesting) void runTest();
                  }}
                  placeholder="Type what a traveler might say"
                  value={message}
                />
                <button
                  className="h-10 rounded-xl bg-gradient-to-r from-midnight to-ink px-5 text-xs font-black text-aqua shadow-glow transition hover:opacity-90 disabled:opacity-50"
                  disabled={isTesting || !message.trim()}
                  onClick={() => void runTest()}
                  type="button"
                >
                  {isTesting ? "Testing..." : "Test"}
                </button>
              </div>
              {testError ? <p className="mt-3 text-xs font-bold text-red-700">{testError}</p> : null}
              {testResult ? (
                <div className="mt-4">
                  <p className="text-sm font-black text-midnight">
                    {testResult.match ? `Matched: ${testResult.match.code}` : "No match"}
                  </p>
                  {testResult.scores.length > 0 ? (
                    <ul className="mt-2 grid gap-1">
                      {testResult.scores.map((score) => (
                        <li className="text-xs font-semibold text-muted" key={score.code}>
                          <span className="font-black text-midnight">{score.code}</span> · score {score.score} ·{" "}
                          {score.hits.join(", ")}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </section>

            <section>
              <p className="mb-3 text-[10px] font-black uppercase tracking-wide text-muted">Problems</p>
              {problems.length === 0 ? (
                <p className="text-xs font-semibold text-muted">{isLoading ? "Loading..." : "No problems found"}</p>
              ) : (
                <ul className="grid gap-3">
                  {problems.map((problem) => (
                    <ProblemCard
                      adminFetch={adminFetch}
                      expanded={expandedCode === problem.code}
                      key={problem.code}
                      onProblemUpdated={replaceProblem}
                      onReload={() => load()}
                      onToggleExpanded={() => setExpandedCode((current) => (current === problem.code ? null : problem.code))}
                      problem={problem}
                    />
                  ))}
                </ul>
              )}
            </section>

            <section>
              <p className="text-[10px] font-black uppercase tracking-wide text-muted">Unmatched messages</p>
              <p className="mb-3 mt-1 text-xs font-semibold text-muted">
                {"Messages the assistant couldn't answer. Personal details are masked, and entries are deleted after 30 days."}
              </p>
              {unmatchedError ? (
                <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {unmatchedError}
                </div>
              ) : null}
              {unmatchedNotice ? (
                <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                  {unmatchedNotice}
                </div>
              ) : null}
              {unmatched.length === 0 ? (
                <p className="text-xs font-semibold text-muted">
                  {isLoadingUnmatched ? "Loading..." : unmatchedError ? "" : "No unmatched messages."}
                </p>
              ) : (
                <ul className="grid gap-3">
                  {unmatched.map((group) => (
                    <UnmatchedCard
                      adminFetch={adminFetch}
                      group={group}
                      key={group.normalized}
                      onResolved={resolveUnmatched}
                      onWarning={setUnmatchedNotice}
                      problems={problems}
                    />
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </>
  );
}
