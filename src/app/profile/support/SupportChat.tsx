"use client";

import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, ImagePlus, Loader2, MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/app/components/Button";
import type { UserSupportThreadPayload } from "@/app/bff/user/support/thread/route";
import type { SupportMessage } from "@/app/xsupport/support-types";
import {
  SUPPORT_IMAGE_ACCEPT,
  SUPPORT_MAX_ATTACHMENTS,
  SUPPORT_POLL_MS,
  checkSupportComposer
} from "@/lib/userSupportChat";

const SIGN_IN_URL = `/signin?next=${encodeURIComponent("/profile/support")}`;

type Envelope<T> = { status?: string; data?: T; error?: string };

async function callBff<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, { cache: "no-store", ...init });
  if (response.status === 401) {
    window.location.assign(SIGN_IN_URL);
    throw new Error("Your session has expired. Please sign in again.");
  }
  const payload = (await response.json().catch(() => ({}))) as Envelope<T>;
  if (!response.ok) {
    throw new Error(payload.error ?? "Support is unavailable right now. Please try again.");
  }
  return payload.data as T;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/**
 * The traveler's side of the support chat (the admin side is /xsupport). One open
 * thread per account: the backend creates it on the first message, and once it is
 * solved the next message starts a new one. Polls through the BFF while visible.
 */
export function SupportChat() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [threadOpen, setThreadOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [solving, setSolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef(0);

  const load = useCallback(async () => {
    const request = ++requestRef.current;
    try {
      const data = await callBff<UserSupportThreadPayload>("/bff/user/support/thread");
      // A slower poll must not overwrite what a later send/solve already loaded.
      if (request !== requestRef.current) return;
      setMessages(data.messages ?? []);
      setThreadOpen(Boolean(data.thread));
      setLoadError(null);
    } catch (err) {
      if (request !== requestRef.current) return;
      setLoadError(err instanceof Error ? err.message : "Support is unavailable right now.");
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, SUPPORT_POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  const lastMessageId = messages[messages.length - 1]?.id;
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [lastMessageId]);

  async function send(event?: FormEvent) {
    event?.preventDefault();
    if (sending) return;
    const check = checkSupportComposer(draft, files);
    if (!check.ok) {
      setError(check.message);
      return;
    }

    setSending(true);
    setError(null);
    try {
      const attachmentIds: string[] = [];
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        const uploaded = await callBff<{ attachment: { id: string } }>("/bff/user/support/attachments", {
          method: "POST",
          body: form
        });
        attachmentIds.push(uploaded.attachment.id);
      }

      await callBff("/bff/user/support/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: check.body || null, attachmentIds })
      });

      setDraft("");
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your message was not sent. Please try again.");
    } finally {
      setSending(false);
    }
  }

  async function markSolved() {
    setSolving(true);
    setError(null);
    try {
      await callBff("/bff/user/support/thread/solved", { method: "POST" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not close the conversation. Please try again.");
    } finally {
      setSolving(false);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends, Shift+Enter adds a line (skip while an IME is composing).
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send();
    }
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    setError(null);
    setFiles((current) => [...current, ...Array.from(list)].slice(0, SUPPORT_MAX_ATTACHMENTS));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <section className="mt-6 flex h-[min(640px,calc(100dvh-220px))] min-h-[420px] flex-col overflow-hidden rounded-[20px] border border-outline/60 bg-surface shadow-brandCard">
      <header className="flex items-center justify-between gap-3 border-b border-outline/60 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brandBlue/10 text-brandBlue">
            <MessageCircle aria-hidden="true" size={18} />
          </span>
          <div>
            <p className="text-sm font-black text-brandInk">eSim2you support</p>
            <p className="text-xs text-onSurfaceVariant">We usually reply within one business day.</p>
          </div>
        </div>
        {threadOpen ? (
          <Button disabled={solving} onClick={() => void markSolved()} size="sm" type="button" variant="tint">
            {solving ? <Loader2 aria-hidden="true" className="animate-spin" size={14} /> : <CheckCircle2 aria-hidden="true" size={14} />}
            <span className="hidden sm:inline">Mark as solved</span>
            <span className="sm:hidden">Solved</span>
          </Button>
        ) : null}
      </header>

      <div aria-live="polite" className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-surfaceBright px-4 py-4 sm:px-5" ref={listRef}>
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-onSurfaceVariant">
            <Loader2 aria-hidden="true" className="animate-spin" size={16} />
            Loading your conversation…
          </p>
        ) : loadError && messages.length === 0 ? (
          <p className="text-sm text-error">{loadError}</p>
        ) : messages.length === 0 ? (
          <div className="mx-auto max-w-sm py-10 text-center">
            <p className="font-display text-lg font-black text-brandInk">How can we help?</p>
            <p className="mt-2 text-sm leading-6 text-onSurfaceVariant">
              Tell us your destination, phone model, and what you see. A screenshot helps.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const mine = message.senderKind === "user";
            return (
              <div className={`flex ${mine ? "justify-end" : "justify-start"}`} key={message.id}>
                <div
                  className={`max-w-[85%] rounded-[16px] px-3.5 py-2.5 sm:max-w-[75%] ${
                    mine
                      ? "bg-gradient-to-r from-brandBlue to-brandTeal text-white"
                      : "border border-outline/60 bg-surface text-brandInk"
                  }`}
                >
                  {message.body ? <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p> : null}
                  {message.attachments.map((attachment) => {
                    const src = `/bff/user/support/attachments/${encodeURIComponent(attachment.id)}`;
                    return (
                      <button
                        aria-label="Open photo"
                        className="mt-2 block overflow-hidden rounded-[12px]"
                        key={attachment.id}
                        onClick={() => setLightbox(src)}
                        type="button"
                      >
                        <img alt="Support attachment" className="max-h-60 w-auto object-cover" loading="lazy" src={src} />
                      </button>
                    );
                  })}
                  <p className={`mt-1 text-[10px] ${mine ? "text-white/75" : "text-onSurfaceVariant"}`}>
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form className="border-t border-outline/60 p-3 sm:p-4" onSubmit={(event) => void send(event)}>
        {files.length > 0 ? (
          <ul className="mb-2 flex flex-wrap gap-2">
            {files.map((file, index) => (
              <li
                className="flex max-w-[220px] items-center gap-1.5 rounded-[10px] bg-surfaceBright px-2.5 py-1 text-xs text-brandInk"
                key={`${file.name}-${index}`}
              >
                <span className="truncate">{file.name}</span>
                <button
                  aria-label={`Remove ${file.name}`}
                  className="text-onSurfaceVariant hover:text-brandInk"
                  onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                  type="button"
                >
                  <X aria-hidden="true" size={14} />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {error ? (
          <p className="mb-2 text-xs text-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex items-end gap-2">
          <input
            accept={SUPPORT_IMAGE_ACCEPT}
            className="hidden"
            multiple
            onChange={(event) => addFiles(event.target.files)}
            ref={fileInputRef}
            type="file"
          />
          <button
            aria-label="Add photo"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-outline text-onSurfaceVariant transition hover:text-brandBlue disabled:opacity-40"
            disabled={sending || files.length >= SUPPORT_MAX_ATTACHMENTS}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <ImagePlus aria-hidden="true" size={18} />
          </button>
          <label className="sr-only" htmlFor="support-chat-draft">
            Message
          </label>
          <textarea
            className="max-h-36 min-h-11 flex-1 resize-none rounded-[12px] border border-outline bg-surface px-3 py-2.5 text-base text-brandInk outline-none transition placeholder:text-onSurfaceVariant/60 focus:border-brandBlue focus:ring-4 focus:ring-brandBlue/15 sm:text-sm"
            disabled={sending}
            id="support-chat-draft"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Write a message…"
            rows={1}
            value={draft}
          />
          <Button aria-label="Send message" className="!h-11 w-11 shrink-0 !px-0" disabled={sending} type="submit">
            {sending ? <Loader2 aria-hidden="true" className="animate-spin" size={18} /> : <Send aria-hidden="true" size={18} />}
          </Button>
        </div>
      </form>

      {lightbox ? (
        <div
          aria-label="Photo preview"
          aria-modal="true"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
        >
          <img alt="Support attachment" className="max-h-[90vh] max-w-[90vw] object-contain" src={lightbox} />
        </div>
      ) : null}
    </section>
  );
}
