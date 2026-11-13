"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Paperclip, X } from "lucide-react";
import { resolveButtonClasses } from "../components/buttonClasses";
import type { ReplyDraft } from "./mail-state";
import {
  MAX_ATTACHMENTS,
  attachmentError,
  buildSendFormData,
  splitAddresses,
  totalAttachmentBytes,
  validateCompose
} from "./mail-compose";

type ApiPayload<T> = {
  status?: string;
  message?: string;
  data?: T;
};

const INPUT_CLASSES =
  "w-full rounded-xl border border-line bg-white px-3 text-sm text-midnight shadow-sm focus:border-cyan focus:outline-none";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MailCompose({
  open,
  account,
  fromAddress,
  accountLabel,
  initial,
  token,
  handleUnauthorized,
  onClose,
  onSent
}: {
  open: boolean;
  /** Mailbox id used in the BFF URL (the same key as the rest of the mail routes). */
  account: string;
  /** The mailbox address, shown read-only as the sender. */
  fromAddress: string;
  accountLabel: string;
  initial?: ReplyDraft;
  token: string;
  handleUnauthorized: () => void;
  onClose: () => void;
  onSent: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialRef = useRef(initial);
  initialRef.current = initial;
  const ids = useId();

  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // Native <dialog> is opened and closed from the `open` prop. Each opening starts from `initial`.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      const draft = initialRef.current;
      setTo(draft ? draft.to.join(", ") : "");
      setCc(draft ? draft.cc.join(", ") : "");
      setSubject(draft ? draft.subject : "");
      setText(draft ? draft.text : "");
      setFiles([]);
      setError("");
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const dismiss = () => {
    if (sending) return;
    onClose();
  };

  const handlePickFiles = (picked: FileList | null) => {
    if (!picked || picked.length === 0) return;
    const candidate = [...files, ...Array.from(picked)];
    const problem = attachmentError(candidate);
    if (problem) {
      setError(problem);
    } else {
      setFiles(candidate);
      setError("");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setFiles((previous) => previous.filter((_, position) => position !== index));
    setError("");
  };

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;

    const toList = splitAddresses(to);
    const ccList = splitAddresses(cc);
    const problem = validateCompose({ to: toList, cc: ccList, subject, text, files });
    if (problem) {
      setError(problem);
      return;
    }

    setSending(true);
    setError("");
    try {
      const response = await fetch(`/bff/admin/mail/${encodeURIComponent(account)}/send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: buildSendFormData({
          to: toList,
          cc: ccList,
          subject: subject.trim(),
          text,
          inReplyTo: initial?.inReplyTo ?? null,
          references: initial?.references ?? [],
          files
        }),
        cache: "no-store"
      });
      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (response.status === 502) {
        throw new Error("Mail server unavailable");
      }
      const payload = (await response.json().catch(() => ({}))) as ApiPayload<unknown>;
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? "Could not send message");
      }
      setSending(false);
      onSent();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message");
      setSending(false);
    }
  };

  const totalSize = totalAttachmentBytes(files);
  const fromId = `${ids}-from`;
  const toId = `${ids}-to`;
  const ccId = `${ids}-cc`;
  const subjectId = `${ids}-subject`;
  const textId = `${ids}-text`;

  return (
    <dialog
      aria-labelledby={`${ids}-title`}
      className="m-auto w-[min(640px,calc(100vw-2rem))] rounded-2xl border border-line bg-white p-0 shadow-xl backdrop:bg-midnight/40"
      onCancel={(event) => {
        // Escape should not drop a message that is still being sent.
        if (sending) event.preventDefault();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) dismiss();
      }}
      onClose={() => {
        if (open) onClose();
      }}
      ref={dialogRef}
    >
      <form className="flex flex-col gap-4 p-5" onSubmit={(event) => void handleSend(event)}>
        <header className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-midnight" id={`${ids}-title`}>
            {initial?.subject ? "Reply" : "New message"}
          </h2>
        </header>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-muted" htmlFor={fromId}>
              From
            </label>
            <input
              className={`${INPUT_CLASSES} h-10 bg-cloud text-muted`}
              id={fromId}
              readOnly
              value={`${accountLabel} <${fromAddress}>`}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-muted" htmlFor={toId}>
              To
            </label>
            <input
              autoComplete="off"
              className={`${INPUT_CLASSES} h-10`}
              id={toId}
              onChange={(event) => setTo(event.target.value)}
              placeholder="name@example.com, other@example.com"
              value={to}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-muted" htmlFor={ccId}>
              Cc
            </label>
            <input
              autoComplete="off"
              className={`${INPUT_CLASSES} h-10`}
              id={ccId}
              onChange={(event) => setCc(event.target.value)}
              value={cc}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-muted" htmlFor={subjectId}>
              Subject
            </label>
            <input
              className={`${INPUT_CLASSES} h-10`}
              id={subjectId}
              onChange={(event) => setSubject(event.target.value)}
              value={subject}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-muted" htmlFor={textId}>
              Message
            </label>
            <textarea
              className={`${INPUT_CLASSES} min-h-[180px] py-2`}
              id={textId}
              onChange={(event) => setText(event.target.value)}
              value={text}
            />
          </div>
        </div>

        <section aria-label="Attachments" className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              className={resolveButtonClasses({ variant: "tint", size: "sm", disabled: sending })}
              disabled={sending}
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <Paperclip aria-hidden="true" size={14} />
              Attach files
            </button>
            <input
              className="hidden"
              multiple
              onChange={(event) => handlePickFiles(event.target.files)}
              ref={fileInputRef}
              tabIndex={-1}
              type="file"
            />
            <span className="text-xs font-semibold text-muted">
              {files.length} of {MAX_ATTACHMENTS} · {formatSize(totalSize)} of 20 MB
            </span>
          </div>
          {files.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {files.map((file, index) => (
                <li
                  className="flex max-w-full items-center gap-1.5 rounded-full bg-cloud py-1 pl-3 pr-1 text-xs font-semibold text-midnight"
                  key={`${file.name}-${index}`}
                >
                  <span className="max-w-[14rem] truncate">{file.name}</span>
                  <span className="text-muted">{formatSize(file.size)}</span>
                  <button
                    aria-label={`Remove ${file.name}`}
                    className="flex h-5 w-5 items-center justify-center rounded-full text-muted hover:bg-white hover:text-midnight disabled:opacity-50"
                    disabled={sending}
                    onClick={() => handleRemoveFile(index)}
                    type="button"
                  >
                    <X aria-hidden="true" size={12} />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <div aria-live="assertive" className="min-h-[1.25rem]">
          {error ? (
            <p className="text-sm font-bold text-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <footer className="flex flex-wrap justify-end gap-2">
          <button
            className={resolveButtonClasses({ variant: "ghost", size: "md", disabled: sending })}
            disabled={sending}
            onClick={dismiss}
            type="button"
          >
            Cancel
          </button>
          <button
            className={resolveButtonClasses({ variant: "lit", size: "md", disabled: sending })}
            disabled={sending}
            type="submit"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
