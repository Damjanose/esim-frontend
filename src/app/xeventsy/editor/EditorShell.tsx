"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Archive, Copy, Save, Send } from "lucide-react";
import { AdminNav } from "../../AdminNav";
import { AdminLoginCard } from "../../AdminLoginCard";
import { useAdminSession } from "../../useAdminSession";
import { adminFetch } from "../api";
import {
  draftFromRecord,
  draftToRequestBody,
  emptyDraft,
  hasVoteBlock,
  validateDraft,
  voteBlocksOf,
  type EditorDraft,
  type EventModalRecord
} from "../eventModal";
import { AudienceFrequencyTab } from "./AudienceFrequencyTab";
import { BlocksTab } from "./BlocksTab";
import { PreviewPanel } from "./PreviewPanel";
import { ResultsTab } from "./ResultsTab";
import { TitleField } from "./TitleField";
import { RulesTab } from "./RulesTab";
import { ScheduleTab } from "./ScheduleTab";
import TranslationsTab from "./TranslationsTab";
import {
  BLOCKS_V2_NOTE,
  EDITOR_TABS,
  isNewModalId,
  needsBlocksV2,
  splitBackendMessage,
  visibleTabs,
  type EditorTab
} from "./editor";

type RecordResponse = { eventModal: EventModalRecord };

const BUTTON =
  "inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-xs font-bold text-midnight shadow-sm transition hover:border-cyan disabled:cursor-not-allowed disabled:opacity-50";
const PRIMARY_BUTTON =
  "inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-midnight to-ink px-4 text-xs font-bold text-aqua shadow-glow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

const STATUS_CHIP: Record<string, string> = {
  new: "bg-slate-100 text-slate-600",
  draft: "bg-slate-100 text-slate-600",
  published: "bg-emerald-100 text-emerald-800",
  resolved: "bg-blue-100 text-blue-800",
  archived: "bg-slate-100 text-slate-500"
};

export function EditorShell({ id }: { id: string }) {
  const router = useRouter();
  const session = useAdminSession();
  const { token, handleUnauthorized } = session;
  const isNew = isNewModalId(id);

  const [draft, setDraft] = useState<EditorDraft>(emptyDraft);
  const [record, setRecord] = useState<EventModalRecord | null>(null);
  const [loaded, setLoaded] = useState(isNew);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [version, setVersion] = useState(0);
  const [tab, setTab] = useState<EditorTab>("content");
  const [confirmArchive, setConfirmArchive] = useState(false);

  const loadRecord = useCallback(
    async (nextToken: string) => {
      const result = await adminFetch<RecordResponse>(`/${encodeURIComponent(id)}`, {
        token: nextToken,
        onUnauthorized: handleUnauthorized
      });
      if (result.ok) {
        setRecord(result.data.eventModal);
        setDraft(draftFromRecord(result.data.eventModal));
        setDirty(false);
        setError([]);
      } else {
        setError(splitBackendMessage(result.message));
      }
      setLoaded(true);
    },
    [id, handleUnauthorized]
  );

  // Reloads only the saved record (used after results actions), keeping the draft the admin is editing.
  const refreshRecord = useCallback(async () => {
    if (!token) return;
    const result = await adminFetch<RecordResponse>(`/${encodeURIComponent(id)}`, {
      token,
      onUnauthorized: handleUnauthorized
    });
    if (result.ok) setRecord(result.data.eventModal);
    else setError(splitBackendMessage(result.message));
  }, [id, token, handleUnauthorized]);

  useEffect(() => {
    if (token && !isNew) void loadRecord(token);
  }, [token, isNew, loadRecord]);

  const draftRef = useRef(draft);
  draftRef.current = draft;

  const patchDraft = useCallback((patch: Partial<EditorDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setDirty(true);
  }, []);

  /** Creates (POST) or updates (PUT) the modal. Returns the saved record, or null on failure. */
  async function save(): Promise<EventModalRecord | null> {
    setSaving(true);
    setError([]);
    setNotice("");
    const snapshot = draft;
    const body = draftToRequestBody(draft, record ?? undefined);
    const result = record
      ? await adminFetch<RecordResponse>(`/${encodeURIComponent(record.id)}`, {
          token,
          method: "PUT",
          body,
          onUnauthorized: handleUnauthorized
        })
      : await adminFetch<RecordResponse>("", {
          token,
          method: "POST",
          body,
          onUnauthorized: handleUnauthorized
        });
    setSaving(false);

    if (!result.ok) {
      setError(splitBackendMessage(result.message));
      return null;
    }

    const saved = result.data.eventModal;
    setRecord(saved);
    // Edits typed while the request was in flight stay marked as unsaved.
    setDirty(draftRef.current !== snapshot);
    setVersion((current) => current + 1);
    return saved;
  }

  // Navigating to the new id remounts the shell, so do it only once the whole flow is finished.
  function goToCreated(id: string) {
    router.replace(`/xeventsy/${encodeURIComponent(id)}`);
  }

  async function handleSave() {
    const wasNew = record === null;
    const saved = await save();
    if (!saved) return;
    setNotice("Saved.");
    if (wasNew) goToCreated(saved.id);
  }

  async function handlePublish() {
    const problems = validateDraft(draft);
    if (problems.length > 0) {
      setError(problems);
      setNotice("");
      return;
    }
    const wasNew = record === null;
    const saved = await save();
    if (!saved) return;

    setSaving(true);
    const result = await adminFetch<RecordResponse>(`/${encodeURIComponent(saved.id)}/publish`, {
      token,
      method: "POST",
      onUnauthorized: handleUnauthorized
    });
    setSaving(false);

    if (result.ok) {
      setRecord(result.data.eventModal);
      setVersion((current) => current + 1);
      setNotice("Published.");
    } else {
      setError(splitBackendMessage(result.message));
    }
    // Saved already succeeded, so the modal exists even if publishing failed.
    if (wasNew) goToCreated(saved.id);
  }

  async function handleDuplicate() {
    if (!record) return;
    setSaving(true);
    setError([]);
    setNotice("");
    const result = await adminFetch<RecordResponse>(`/${encodeURIComponent(record.id)}/duplicate`, {
      token,
      method: "POST",
      onUnauthorized: handleUnauthorized
    });
    setSaving(false);
    if (result.ok) {
      router.push(`/xeventsy/${encodeURIComponent(result.data.eventModal.id)}`);
    } else {
      setError(splitBackendMessage(result.message));
    }
  }

  async function handleArchive() {
    if (!record) return;
    setSaving(true);
    setError([]);
    setNotice("");
    const result = await adminFetch<RecordResponse>(`/${encodeURIComponent(record.id)}/archive`, {
      token,
      method: "POST",
      onUnauthorized: handleUnauthorized
    });
    setSaving(false);
    setConfirmArchive(false);
    if (result.ok) {
      setRecord(result.data.eventModal);
      setNotice("Archived.");
    } else {
      setError(splitBackendMessage(result.message));
    }
  }

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

  const hasVote = hasVoteBlock(draft.blocks);
  const tabs = visibleTabs({ saved: record !== null, hasVote });
  const currentTab = tabs.includes(tab) ? tab : "content";
  const status = record?.status ?? "new";
  const title = draft.title.trim() || (isNew ? "New event modal" : "Untitled event modal");

  return (
    <>
      <AdminNav />
      <div className="min-h-screen bg-cloud px-6 py-7 md:px-9">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-cyanDeep">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_8px_#00d9f5]" />
              Admin · Event modal
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h1 className="font-display text-[26px] font-black tracking-tight text-midnight md:text-[30px]">
                {title}
              </h1>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${
                  STATUS_CHIP[status] ?? STATUS_CHIP.draft
                }`}
              >
                {status === "new" ? "Not saved yet" : status}
              </span>
              {dirty ? <span className="text-xs font-bold text-amber-700">Unsaved changes</span> : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link className={BUTTON} href="/xeventsy">
              <ArrowLeft aria-hidden="true" size={14} />
              Back to list
            </Link>
            <button
              className={BUTTON}
              disabled={saving || !loaded}
              onClick={() => void handleSave()}
              type="button"
            >
              <Save aria-hidden="true" size={14} />
              Save
            </button>
            <button
              className={PRIMARY_BUTTON}
              disabled={saving || !loaded || record?.status === "resolved" || record?.status === "archived"}
              onClick={() => void handlePublish()}
              type="button"
            >
              <Send aria-hidden="true" size={14} />
              Publish
            </button>
            {record ? (
              <button className={BUTTON} disabled={saving} onClick={() => void handleDuplicate()} type="button">
                <Copy aria-hidden="true" size={14} />
                Duplicate
              </button>
            ) : null}
            {record && record.status !== "archived" ? (
              confirmArchive ? (
                <span className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700">
                  Archive this modal for good?
                  <button
                    className="rounded-lg bg-red-700 px-3 py-1.5 text-white disabled:opacity-50"
                    disabled={saving}
                    onClick={() => void handleArchive()}
                    type="button"
                  >
                    Yes, archive
                  </button>
                  <button
                    className="rounded-lg border border-line px-3 py-1.5 text-midnight"
                    onClick={() => setConfirmArchive(false)}
                    type="button"
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <button className={BUTTON} disabled={saving} onClick={() => setConfirmArchive(true)} type="button">
                  <Archive aria-hidden="true" size={14} />
                  Archive
                </button>
              )
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
        {notice ? <p className="mb-4 text-sm font-bold text-emerald-700">{notice}</p> : null}
        {needsBlocksV2(draft.blocks) ? (
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            {BLOCKS_V2_NOTE}
          </p>
        ) : null}

        {!isNew && !loaded ? (
          <p className="text-sm font-semibold text-muted">Loading event modal…</p>
        ) : !loaded ? null : (
          <>
            <TitleField value={draft.title} onChange={(next) => patchDraft({ title: next })} />
            <div role="tablist" aria-label="Event modal sections" className="mb-6 flex flex-wrap gap-2">
              {EDITOR_TABS.filter((item) => tabs.includes(item.id)).map((item) => (
                <button
                  aria-selected={currentTab === item.id}
                  className={`h-9 rounded-full px-4 text-xs font-bold transition ${
                    currentTab === item.id
                      ? "bg-midnight text-aqua"
                      : "border border-line bg-white text-midnight hover:border-cyan"
                  }`}
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  role="tab"
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {currentTab === "content" ? (
              <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
                <div className="min-w-0 flex-1">
                  <BlocksTab
                    draft={draft}
                    onChange={patchDraft}
                    onUnauthorized={handleUnauthorized}
                    token={token}
                  />
                </div>
                <div className="w-full xl:w-[360px] xl:shrink-0">
                  <PreviewPanel
                    hasUnsavedChanges={dirty}
                    modalId={record?.id ?? null}
                    onUnauthorized={handleUnauthorized}
                    token={token}
                    version={version}
                  />
                </div>
              </div>
            ) : null}
            {currentTab === "schedule" ? <ScheduleTab draft={draft} onChange={patchDraft} /> : null}
            {currentTab === "audience" ? <AudienceFrequencyTab draft={draft} onChange={patchDraft} /> : null}
            {currentTab === "translations" ? <TranslationsTab draft={draft} onChange={patchDraft} /> : null}
            {currentTab === "rules" ? <RulesTab draft={draft} onChange={patchDraft} /> : null}
            {currentTab === "results" && record ? (
              <ResultsTab
                modalId={record.id}
                onChanged={() => void refreshRecord()}
                onUnauthorized={handleUnauthorized}
                resolution={record.resolution}
                status={record.status}
                token={token}
                voteBlocks={voteBlocksOf(record?.blocks ?? [])}
              />
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
