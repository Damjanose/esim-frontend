"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Paperclip } from "lucide-react";
import type { MailAttachment, MailMessage } from "../../lib/mail-types";
import { resolveButtonClasses } from "../components/buttonClasses";
import { buildSrcDoc, hasBlockedRemoteImages } from "./mail-html";

type ReplyOptions = { all: boolean };

type ApiPayload<T> = {
  status?: string;
  message?: string;
  data?: T;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function messageUrl(account: string, uid: number, folder: string) {
  return `/bff/admin/mail/${encodeURIComponent(account)}/messages/${uid}?folder=${encodeURIComponent(folder)}`;
}

/** Bearer-authenticated JSON call to the admin BFF. Throws a user-facing message on failure. */
async function requestMail<T>(
  url: string,
  init: RequestInit,
  token: string,
  onUnauthorized: () => void
): Promise<T | undefined> {
  const response = await fetch(url, {
    ...init,
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
  if (!response.ok || payload.status !== "success") {
    throw new Error(payload.message ?? "Could not load message");
  }
  return payload.data;
}

export function MailReader({
  account,
  folder,
  uid,
  token,
  handleUnauthorized,
  onClose,
  onReply,
  onChanged
}: {
  account: string;
  folder: string;
  uid: number;
  token: string;
  handleUnauthorized: () => void;
  onClose: () => void;
  onReply?: (message: MailMessage, options: ReplyOptions) => void;
  onChanged?: () => void;
}) {
  const [message, setMessage] = useState<MailMessage | null>(null);
  const [error, setError] = useState("");
  const [loadRemote, setLoadRemote] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  // The view the user is on right now. Async actions compare against it so a
  // late delete never closes a different message the user has since opened.
  const current = useRef({ account, folder, uid });
  current.current = { account, folder, uid };

  useEffect(() => {
    let cancelled = false;
    setMessage(null);
    setError("");
    setLoadRemote(false);
    setActionError("");

    void (async () => {
      try {
        const data = await requestMail<{ message: MailMessage }>(
          messageUrl(account, uid, folder),
          {},
          token,
          handleUnauthorized
        );
        if (cancelled) return;
        if (!data?.message) throw new Error("Could not load message");
        setMessage(data.message);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load message");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [account, folder, uid, token, handleUnauthorized]);

  const isCurrent = (view: { account: string; folder: string; uid: number }) =>
    current.current.account === view.account &&
    current.current.folder === view.folder &&
    current.current.uid === view.uid;

  const handleDelete = async () => {
    const view = { account, folder, uid };
    setBusy("delete");
    setActionError("");
    try {
      await requestMail(messageUrl(account, uid, folder), { method: "DELETE" }, token, handleUnauthorized);
      onChanged?.();
      if (isCurrent(view)) onClose();
    } catch (err) {
      if (isCurrent(view)) setActionError(err instanceof Error ? err.message : "Could not delete message");
    } finally {
      if (isCurrent(view)) setBusy(null);
    }
  };

  const handleDownload = async (attachment: MailAttachment) => {
    const view = { account, folder, uid };
    setBusy(attachment.id);
    setActionError("");
    try {
      const url = `/bff/admin/mail/${encodeURIComponent(account)}/messages/${uid}/attachments/${encodeURIComponent(
        attachment.id
      )}?folder=${encodeURIComponent(folder)}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok) throw new Error("Could not download attachment");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = attachment.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (err) {
      if (isCurrent(view)) setActionError(err instanceof Error ? err.message : "Could not download attachment");
    } finally {
      if (isCurrent(view)) setBusy(null);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col gap-3 p-5">
        <p role="alert" className="text-sm font-semibold text-error">
          {error}
        </p>
        <button
          className={resolveButtonClasses({ variant: "ghost", size: "sm" })}
          onClick={onClose}
          type="button"
        >
          Close
        </button>
      </div>
    );
  }

  if (!message) {
    return <p className="p-5 text-sm font-semibold text-muted">Loading message…</p>;
  }

  const showRemoteBanner = message.html !== null && !loadRemote && hasBlockedRemoteImages(message.html);
  const disabled = busy !== null;

  return (
    <article className="flex min-w-0 flex-col gap-4 p-5">
      <header className="flex flex-col gap-1 border-b border-line pb-4">
        <h2 className="text-lg font-black text-midnight">{message.subject || "(no subject)"}</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs text-muted">
          <dt className="font-bold">From</dt>
          <dd className="min-w-0 break-words">{message.from}</dd>
          <dt className="font-bold">To</dt>
          <dd className="min-w-0 break-words">{message.to.join(", ") || "—"}</dd>
          {message.cc.length > 0 ? (
            <>
              <dt className="font-bold">Cc</dt>
              <dd className="min-w-0 break-words">{message.cc.join(", ")}</dd>
            </>
          ) : null}
          <dt className="font-bold">Date</dt>
          <dd>
            <time dateTime={message.date}>{formatDate(message.date)}</time>
          </dd>
        </dl>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <button
          className={resolveButtonClasses({ variant: "tint", size: "sm", disabled })}
          disabled={disabled}
          onClick={() => onReply?.(message, { all: false })}
          type="button"
        >
          Reply
        </button>
        <button
          className={resolveButtonClasses({ variant: "tint", size: "sm", disabled })}
          disabled={disabled}
          onClick={() => onReply?.(message, { all: true })}
          type="button"
        >
          Reply all
        </button>
        <button
          className={resolveButtonClasses({ variant: "ghost", tone: "danger", size: "sm", disabled })}
          disabled={disabled}
          onClick={() => void handleDelete()}
          type="button"
        >
          {busy === "delete" ? "Deleting…" : "Delete"}
        </button>
        <button
          className={resolveButtonClasses({ variant: "ghost", size: "sm" })}
          onClick={onClose}
          type="button"
        >
          Close
        </button>
      </div>

      {actionError ? (
        <p role="alert" className="text-sm font-semibold text-error">
          {actionError}
        </p>
      ) : null}

      {message.attachments.length > 0 ? (
        <section aria-label="Attachments" className="flex flex-col gap-2">
          <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
            <Paperclip aria-hidden="true" size={12} />
            Attachments
          </h3>
          <ul className="flex flex-wrap gap-2">
            {message.attachments.map((attachment) => (
              <li key={attachment.id}>
                <button
                  className={resolveButtonClasses({ variant: "tint", size: "sm", disabled })}
                  disabled={disabled}
                  onClick={() => void handleDownload(attachment)}
                  type="button"
                >
                  <Download aria-hidden="true" size={14} />
                  <span className="max-w-[16rem] truncate">{attachment.filename}</span>
                  <span className="text-xs font-semibold opacity-70">{formatSize(attachment.size)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {message.html !== null ? (
        <div className="flex flex-col gap-2">
          {showRemoteBanner ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-cloud px-3 py-2 text-xs font-semibold text-midnight">
              <span>Remote images blocked</span>
              <button
                className="font-bold text-brandBlue underline-offset-2 hover:underline"
                onClick={() => setLoadRemote(true)}
                type="button"
              >
                Load images
              </button>
            </div>
          ) : null}
          <iframe
            className="h-[65vh] min-h-[320px] w-full rounded-xl border border-line bg-white"
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            srcDoc={buildSrcDoc(message.html, loadRemote)}
            title="Message body"
          />
        </div>
      ) : (
        <pre className="whitespace-pre-wrap break-words font-sans text-sm text-midnight">{message.text}</pre>
      )}
    </article>
  );
}
