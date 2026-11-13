"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Paperclip, Pencil } from "lucide-react";
import type { MailAccount, MailFolder, MailMessage, MailMessageSummary } from "../../lib/mail-types";
import { resolveButtonClasses } from "../components/buttonClasses";
import { MailCompose } from "./MailCompose";
import { MailReader } from "./MailReader";
import {
  buildReply,
  initialMailState,
  isStale,
  mailStateReducer,
  totalUnread,
  type ReplyDraft
} from "./mail-state";

const PAGE_SIZE = 30;
const POLL_INTERVAL_MS = 30_000;
const ACCOUNT_STORAGE_KEY = "xmailx:last-account";
const EMPTY_DRAFT: ReplyDraft = { to: [], cc: [], subject: "", text: "", inReplyTo: null, references: [] };

type ApiPayload<T> = {
  status?: string;
  message?: string;
  data?: T;
};

function readRememberedAccount(): string | null {
  try {
    return window.localStorage.getItem(ACCOUNT_STORAGE_KEY);
  } catch {
    return null;
  }
}

function rememberAccount(account: string): void {
  try {
    window.localStorage.setItem(ACCOUNT_STORAGE_KEY, account);
  } catch {
    // Storage can be blocked (private mode); the default account is used instead.
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(value)
  );
}

async function getData<T>(url: string, token: string, onUnauthorized: () => void): Promise<T> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  if (response.status === 401) {
    onUnauthorized();
    throw new Error("Session expired. Sign in again.");
  }
  if (response.status === 502) {
    throw new Error("Mail server unavailable");
  }
  const payload = (await response.json()) as ApiPayload<T>;
  if (!response.ok || payload.status !== "success" || payload.data === undefined) {
    throw new Error(payload.message ?? "Could not load mail");
  }
  return payload.data;
}

export function MailInbox({
  token,
  handleUnauthorized
}: {
  token: string;
  handleUnauthorized: () => void;
}) {
  const [mail, dispatch] = useReducer(mailStateReducer, [] as MailAccount[], initialMailState);
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [folders, setFolders] = useState<MailFolder[]>([]);
  const [messages, setMessages] = useState<MailMessageSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedUid, setSelectedUid] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeDraft, setComposeDraft] = useState<ReplyDraft>(EMPTY_DRAFT);
  // Read by async handlers so they can compare against the latest view (see isStale).
  const mailRef = useRef(mail);
  mailRef.current = mail;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await getData<{ accounts?: MailAccount[] }>(
          "/bff/admin/mail/accounts",
          token,
          handleUnauthorized
        );
        if (cancelled) return;
        const list = data.accounts ?? [];
        setAccounts(list);
        const remembered = readRememberedAccount();
        const chosen = list.find((account) => account.id === remembered) ?? list[0];
        if (chosen) dispatch({ type: "selectAccount", account: chosen.id });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load mailboxes");
      } finally {
        if (!cancelled) setAccountsLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, handleUnauthorized]);

  const refresh = useCallback(async () => {
    const snapshot = mailRef.current;
    const account = snapshot.activeAccount;
    if (!account) return;
    const generation = snapshot.generation;
    const base = `/bff/admin/mail/${encodeURIComponent(account)}`;
    const folderQuery = encodeURIComponent(snapshot.folder);

    setIsLoading(true);
    try {
      const [folderData, messageData] = await Promise.all([
        getData<{ folders?: MailFolder[] }>(`${base}/folders`, token, handleUnauthorized),
        getData<{ items?: MailMessageSummary[]; total?: number }>(
          `${base}/messages?folder=${folderQuery}&page=${snapshot.page}`,
          token,
          handleUnauthorized
        )
      ]);
      if (isStale(generation, mailRef.current)) return;
      setFolders(folderData.folders ?? []);
      setMessages(messageData.items ?? []);
      setTotal(messageData.total ?? 0);
      setError("");
    } catch (err) {
      if (isStale(generation, mailRef.current)) return;
      setError(err instanceof Error ? err.message : "Could not load mail");
    } finally {
      if (!isStale(generation, mailRef.current)) setIsLoading(false);
    }
  }, [token, handleUnauthorized]);

  const { activeAccount, folder, page, generation } = mail;
  useEffect(() => {
    if (!activeAccount) return;
    void refresh();
  }, [refresh, activeAccount, folder, page, generation]);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = window.setInterval(tick, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [refresh]);

  const handleAccountChange = (account: string) => {
    rememberAccount(account);
    // A draft is addressed from the mailbox it was opened in, so it closes on switch.
    setComposeOpen(false);
    setFolders([]);
    setMessages([]);
    setTotal(0);
    setSelectedUid(null);
    setError("");
    dispatch({ type: "selectAccount", account });
  };

  // Opening an unread row marks it read on the server (the reader's GET does that).
  // Mirror it locally right away so the row and the folder badge update without waiting for a poll.
  const handleSelect = (row: MailMessageSummary) => {
    setSelectedUid(row.uid);
    if (row.seen) return;
    const openedFolder = mail.folder;
    setMessages((previous) => previous.map((item) => (item.uid === row.uid ? { ...item, seen: true } : item)));
    setFolders((previous) =>
      previous.map((item) => (item.path === openedFolder && item.unread > 0 ? { ...item, unread: item.unread - 1 } : item))
    );
  };

  const activeAddress = accounts.find((account) => account.id === mail.activeAccount)?.address ?? "";

  const handleCompose = () => {
    setComposeDraft(EMPTY_DRAFT);
    setComposeOpen(true);
  };

  const handleReply = (message: MailMessage, options: { all: boolean }) => {
    setComposeDraft(buildReply(message, { all: options.all, myAddress: activeAddress }));
    setComposeOpen(true);
  };

  const handleFolderChange = (nextFolder: string) => {
    setMessages([]);
    setTotal(0);
    setSelectedUid(null);
    dispatch({ type: "selectFolder", folder: nextFolder });
  };

  const handlePageChange = (nextPage: number) => {
    setSelectedUid(null);
    dispatch({ type: "selectPage", page: nextPage });
  };

  if (accountsLoaded && accounts.length === 0) {
    return <p className="text-sm font-semibold text-muted">No mailboxes are set up yet.</p>;
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (mail.page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(total, mail.page * PAGE_SIZE);
  const unread = totalUnread(folders);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-bold text-midnight">
          <span>Mailbox</span>
          <select
            className="h-10 rounded-xl border border-line bg-white px-3 text-sm font-semibold text-midnight shadow-sm focus:border-cyan focus:outline-none"
            onChange={(event) => handleAccountChange(event.target.value)}
            value={mail.activeAccount ?? ""}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.label} · {account.address}
              </option>
            ))}
          </select>
        </label>
        {unread > 0 ? (
          <span className="rounded-full bg-cyan/15 px-2.5 py-1 text-xs font-black text-cyanDeep">
            {unread} unread
          </span>
        ) : null}
        {isLoading ? (
          <span className="text-xs font-semibold text-muted" role="status">
            Loading…
          </span>
        ) : null}
        <button
          className={`${resolveButtonClasses({ variant: "lit", size: "sm", disabled: !mail.activeAccount })} ml-auto`}
          disabled={!mail.activeAccount}
          onClick={handleCompose}
          type="button"
        >
          <Pencil aria-hidden="true" size={14} />
          Compose
        </button>
      </div>

      {mail.activeAccount ? (
        <MailCompose
          account={mail.activeAccount}
          accountLabel={accounts.find((account) => account.id === mail.activeAccount)?.label ?? ""}
          fromAddress={activeAddress}
          handleUnauthorized={handleUnauthorized}
          initial={composeDraft}
          onClose={() => setComposeOpen(false)}
          onSent={() => void refresh()}
          open={composeOpen}
          token={token}
        />
      ) : null}

      {error ? (
        <p className="text-sm font-bold text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[200px_minmax(0,1fr)_minmax(0,1.5fr)] lg:items-start">
        <aside aria-label="Folders" className="rounded-2xl border border-line bg-white p-2 shadow-sm">
          <ul className="flex flex-col gap-0.5">
            {folders.map((item) => {
              const current = item.path === mail.folder;
              return (
                <li key={item.path}>
                  <button
                    aria-current={current ? "true" : undefined}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                      current
                        ? "bg-cloud font-black text-midnight ring-1 ring-cyan"
                        : "font-semibold text-muted hover:bg-cloud hover:text-midnight"
                    }`}
                    onClick={() => handleFolderChange(item.path)}
                    type="button"
                  >
                    <span className="truncate">{item.name}</span>
                    {item.unread > 0 ? (
                      <span className="shrink-0 rounded-full bg-cyan/15 px-2 text-[11px] font-black text-cyanDeep">
                        {item.unread}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section aria-label="Messages" className="min-w-0 rounded-2xl border border-line bg-white shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3 text-xs font-semibold text-muted">
            <span>{total === 0 ? "No messages" : `${rangeStart}–${rangeEnd} of ${total}`}</span>
            <div className="flex gap-1.5">
              <button
                aria-label="Previous page"
                className={resolveButtonClasses({ variant: "ghost", size: "sm", disabled: mail.page <= 1 })}
                disabled={mail.page <= 1}
                onClick={() => handlePageChange(mail.page - 1)}
                type="button"
              >
                <ChevronLeft aria-hidden="true" size={14} />
              </button>
              <button
                aria-label="Next page"
                className={resolveButtonClasses({ variant: "ghost", size: "sm", disabled: mail.page >= pageCount })}
                disabled={mail.page >= pageCount}
                onClick={() => handlePageChange(mail.page + 1)}
                type="button"
              >
                <ChevronRight aria-hidden="true" size={14} />
              </button>
            </div>
          </div>
          <ul>
            {messages.map((message) => {
              const selected = message.uid === selectedUid;
              return (
                <li key={message.uid}>
                  <button
                    aria-pressed={selected}
                    className={`flex w-full min-w-0 gap-3 border-b border-line px-4 py-3 text-left transition hover:bg-cloud ${
                      selected ? "bg-cloud" : ""
                    }`}
                    onClick={() => handleSelect(message)}
                    type="button"
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${message.seen ? "bg-transparent" : "bg-cyan"}`}
                    />
                    {message.seen ? null : <span className="sr-only">Unread</span>}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span
                          className={`truncate text-sm text-midnight ${message.seen ? "font-semibold" : "font-black"}`}
                        >
                          {message.from}
                        </span>
                        <time className="shrink-0 text-[11px] font-semibold text-muted" dateTime={message.date}>
                          {formatDate(message.date)}
                        </time>
                      </span>
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span
                          className={`truncate text-sm text-midnight ${message.seen ? "font-medium" : "font-black"}`}
                        >
                          {message.subject || "(no subject)"}
                        </span>
                        {message.hasAttachments ? (
                          <Paperclip aria-label="Has attachments" className="shrink-0 text-muted" role="img" size={12} />
                        ) : null}
                      </span>
                      <span className="block truncate text-xs text-muted">{message.preview}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-label="Message" className="min-w-0 rounded-2xl border border-line bg-white shadow-sm">
          {selectedUid !== null && mail.activeAccount ? (
            <MailReader
              account={mail.activeAccount}
              folder={mail.folder}
              handleUnauthorized={handleUnauthorized}
              onChanged={() => void refresh()}
              onClose={() => setSelectedUid(null)}
              onReply={handleReply}
              token={token}
              uid={selectedUid}
            />
          ) : (
            <p className="p-6 text-sm font-semibold text-muted">Select a message to read it.</p>
          )}
        </section>
      </div>
    </div>
  );
}
