"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, ImagePlus, RefreshCw, Send, X } from "lucide-react";
import { io, type Socket } from "socket.io-client";
import { getPublicSocketUrl } from "@/lib/support-socket";
import type {
  AdminJsonPayload,
  SupportMessage,
  SupportThread,
  SupportThreadStatus
} from "./support-types";

const TABS: Array<{ id: SupportThreadStatus; label: string }> = [
  { id: "unread", label: "Unread" },
  { id: "read", label: "Open" },
  { id: "solved", label: "Solved" }
];

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(value)
  );
}

async function readJson<T>(response: Response): Promise<AdminJsonPayload<T>> {
  return (await response.json()) as AdminJsonPayload<T>;
}

function AuthedImage({
  token,
  attachmentId,
  alt,
  onOpen
}: {
  token: string;
  attachmentId: string;
  alt: string;
  onOpen?: (src: string) => void;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    void (async () => {
      try {
        const response = await fetch(`/bff/admin/support/attachments/${encodeURIComponent(attachmentId)}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store"
        });
        if (!response.ok || cancelled) return;
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setSrc(objectUrl);
      } catch {
        // Leave the placeholder visible.
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachmentId, token]);

  if (!src) {
    return <div className="h-36 w-36 animate-pulse rounded-xl bg-cloud" />;
  }

  return (
    <button
      className="block overflow-hidden rounded-xl border border-line"
      onClick={() => onOpen?.(src)}
      type="button"
    >
      <img alt={alt} className="max-h-52 max-w-full object-cover" src={src} />
    </button>
  );
}

type SupportInboxProps = {
  token: string;
  handleUnauthorized: () => void;
};

export function SupportInbox({ token, handleUnauthorized }: SupportInboxProps) {
  const [tab, setTab] = useState<SupportThreadStatus>("unread");
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [selectedThread, setSelectedThread] = useState<SupportThread | null>(null);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSolving, setIsSolving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const tabRef = useRef<SupportThreadStatus>(tab);
  const listRequestRef = useRef(0);
  const threadRequestRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  selectedIdRef.current = selectedId;
  tabRef.current = tab;

  const filteredThreads = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return threads;
    return threads.filter((thread) => thread.userEmail.toLowerCase().includes(needle));
  }, [search, threads]);

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  const handleAuthStatus = useCallback(
    (status: number) => {
      if (status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
    },
    [handleUnauthorized]
  );

  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await fetch("/bff/admin/support/threads?status=unread", {
        headers: authHeaders,
        cache: "no-store"
      });
      handleAuthStatus(response.status);
      const payload = await readJson<{ threads?: SupportThread[] }>(response);
      if (response.ok && payload.status === "success") {
        setUnreadCount(payload.data?.threads?.length ?? 0);
      }
    } catch {
      // Badge refresh is best-effort; the list fetch reports errors.
    }
  }, [authHeaders, handleAuthStatus]);

  const loadThreads = useCallback(
    async (status: SupportThreadStatus) => {
      const requestId = ++listRequestRef.current;
      setIsLoadingList(true);
      setError("");
      try {
        const response = await fetch(`/bff/admin/support/threads?status=${encodeURIComponent(status)}`, {
          headers: authHeaders,
          cache: "no-store"
        });
        handleAuthStatus(response.status);
        const payload = await readJson<{ threads?: SupportThread[] }>(response);
        if (!response.ok || payload.status !== "success") {
          throw new Error(payload.message ?? "Could not load support threads");
        }
        if (requestId !== listRequestRef.current) return;
        setThreads(payload.data?.threads ?? []);
        if (status === "unread") {
          setUnreadCount(payload.data?.threads?.length ?? 0);
        } else {
          void loadUnreadCount();
        }
      } catch (err) {
        if (requestId !== listRequestRef.current) return;
        setError(err instanceof Error ? err.message : "Could not load support threads");
        setThreads([]);
      } finally {
        if (requestId === listRequestRef.current) setIsLoadingList(false);
      }
    },
    [authHeaders, handleAuthStatus, loadUnreadCount]
  );

  const refreshThreads = useCallback(() => {
    void loadThreads(tabRef.current);
  }, [loadThreads]);

  const openThread = useCallback(
    async (threadId: string) => {
      const requestId = ++threadRequestRef.current;
      const previousId = selectedIdRef.current;
      if (previousId && previousId !== threadId) {
        socketRef.current?.emit("support:leave", { threadId: previousId });
      }
      setSelectedId(threadId);
      setIsLoadingThread(true);
      setError("");
      try {
        const response = await fetch(`/bff/admin/support/threads/${encodeURIComponent(threadId)}`, {
          headers: authHeaders,
          cache: "no-store"
        });
        handleAuthStatus(response.status);
        const payload = await readJson<{ thread?: SupportThread; messages?: SupportMessage[] }>(response);
        if (!response.ok || payload.status !== "success" || !payload.data?.thread) {
          throw new Error(payload.message ?? "Could not load conversation");
        }
        if (requestId !== threadRequestRef.current) return;

        let thread = payload.data.thread;
        setMessages(payload.data.messages ?? []);
        setSelectedThread(thread);

        if (thread.status === "unread") {
          const readResponse = await fetch(`/bff/admin/support/threads/${encodeURIComponent(threadId)}/read`, {
            method: "POST",
            headers: authHeaders
          });
          handleAuthStatus(readResponse.status);
          const readPayload = await readJson<{ thread?: SupportThread }>(readResponse);
          if (readResponse.ok && readPayload.status === "success" && readPayload.data?.thread) {
            if (requestId !== threadRequestRef.current) return;
            thread = readPayload.data.thread;
            setSelectedThread(thread);
          }
        }

        if (requestId !== threadRequestRef.current || selectedIdRef.current !== threadId) return;
        socketRef.current?.emit("support:join", { threadId });
        if (tab === "unread") {
          setThreads((current) => current.filter((item) => item.id !== threadId));
        } else {
          setThreads((current) => current.map((item) => (item.id === thread.id ? thread : item)));
        }
        void loadUnreadCount();
      } catch (err) {
        if (requestId !== threadRequestRef.current) return;
        setError(err instanceof Error ? err.message : "Could not load conversation");
      } finally {
        if (requestId === threadRequestRef.current) setIsLoadingThread(false);
      }
    },
    [authHeaders, handleAuthStatus, loadUnreadCount, tab]
  );

  useEffect(() => {
    void loadThreads(tab);
  }, [loadThreads, tab]);

  useEffect(() => {
    const socket = io(getPublicSocketUrl(), {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      auth: { token }
    });
    socketRef.current = socket;

    socket.on("connect_error", (socketError) => {
      if (socketError.message === "unauthorized") {
        handleUnauthorized();
        return;
      }
      setError("Live updates are unavailable. Refresh to reconnect.");
    });
    socket.on("connect", () => {
      setError("");
      void loadThreads(tabRef.current);
    });
    socket.on("disconnect", (reason) => {
      if (reason !== "io client disconnect") {
        setNotice("Live updates paused. Reconnecting…");
      }
    });
    socket.on("support:thread_updated", (thread: SupportThread) => {
      setThreads((current) => {
        const belongsHere = thread.status === tabRef.current;
        const without = current.filter((item) => item.id !== thread.id);
        if (!belongsHere) return without;
        return [thread, ...without].sort(
          (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
        );
      });
      setSelectedThread((current) => (current?.id === thread.id ? thread : current));
      void loadUnreadCount().catch(() => {
        // List refresh failures already surface via REST; keep the socket alive.
      });
    });

    socket.on(
      "support:message",
      (payload: { threadId?: string; message?: SupportMessage }) => {
        const message = payload.message;
        if (!message || payload.threadId !== selectedIdRef.current) return;
        setMessages((current) =>
          current.some((item) => item.id === message.id) ? current : [...current, message]
        );
      }
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [handleUnauthorized, loadThreads, loadUnreadCount, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedId]);

  useEffect(() => {
    if (!lightbox) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setLightbox(null);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightbox]);

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    if (!selectedId || isSending) return;
    const text = draft.trim();
    if (!text && !pendingFile) return;
    const requestId = threadRequestRef.current;
    const activeThreadId = selectedId;

    setIsSending(true);
    setError("");
    setNotice("");
    try {
      const attachmentIds: string[] = [];
      if (pendingFile) {
        const formData = new FormData();
        formData.append("file", pendingFile);
        const uploadResponse = await fetch(
          `/bff/admin/support/threads/${encodeURIComponent(selectedId)}/attachments`,
          {
            method: "POST",
            headers: authHeaders,
            body: formData
          }
        );
        handleAuthStatus(uploadResponse.status);
        const uploadPayload = await readJson<{ attachment?: { id: string } }>(uploadResponse);
        if (!uploadResponse.ok || uploadPayload.status !== "success" || !uploadPayload.data?.attachment?.id) {
          throw new Error(uploadPayload.message ?? "Could not upload the photo");
        }
        attachmentIds.push(uploadPayload.data.attachment.id);
      }

      const response = await fetch(`/bff/admin/support/threads/${encodeURIComponent(selectedId)}/messages`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          body: text || null,
          attachmentIds
        })
      });
      handleAuthStatus(response.status);
      const payload = await readJson<{ message?: SupportMessage }>(response);
      if (!response.ok || payload.status !== "success" || !payload.data?.message) {
        throw new Error(payload.message ?? "Could not send the message");
      }
      const sentMessage = payload.data.message;
      if (requestId !== threadRequestRef.current || selectedIdRef.current !== activeThreadId) return;
      setMessages((current) =>
        current.some((item) => item.id === sentMessage.id)
          ? current
          : [...current, sentMessage]
      );
      setDraft("");
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the message");
    } finally {
      setIsSending(false);
    }
  }

  async function markSolved() {
    if (!selectedId || isSolving || selectedThread?.status === "solved") return;
    setIsSolving(true);
    setError("");
    setNotice("");
    const requestId = threadRequestRef.current;
    const activeThreadId = selectedId;
    try {
      const response = await fetch(`/bff/admin/support/threads/${encodeURIComponent(selectedId)}/solved`, {
        method: "POST",
        headers: authHeaders
      });
      handleAuthStatus(response.status);
      const payload = await readJson<{ thread?: SupportThread }>(response);
      if (!response.ok || payload.status !== "success" || !payload.data?.thread) {
        throw new Error(payload.message ?? "Could not mark the issue as solved");
      }
      const thread = payload.data.thread;
      if (requestId !== threadRequestRef.current || selectedIdRef.current !== activeThreadId) return;
      setSelectedThread(thread);
      setNotice("Marked as solved. It now lives in the archive.");
      if (tab !== "solved") {
        setThreads((current) => current.filter((item) => item.id !== thread.id));
        setSelectedId(null);
        setMessages([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark the issue as solved");
    } finally {
      setIsSolving(false);
    }
  }

  return (
    <>
      {error ? (
        <p aria-live="assertive" className="mb-4 text-sm font-bold text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p aria-live="polite" className="mb-4 text-sm font-bold text-emerald-700" role="status">
          {notice}
        </p>
      ) : null}

      <div className="flex min-h-[70vh] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card md:flex-row">
        <aside className={`${selectedId ? "hidden md:flex" : "flex"} w-full shrink-0 flex-col border-b border-line md:max-w-sm md:border-b-0 md:border-r`}>
          <div className="border-b border-line p-4">
            <div className="flex gap-1 rounded-xl bg-cloud p-1">
              {TABS.map((item) => (
                <button
                  className={`relative flex-1 rounded-lg px-2 py-1.5 text-[11px] font-black uppercase tracking-wide transition ${
                    tab === item.id ? "bg-white text-midnight shadow-sm" : "text-muted hover:text-midnight"
                  }`}
                  key={item.id}
                  onClick={() => {
                    threadRequestRef.current += 1;
                    setTab(item.id);
                    setSelectedId(null);
                    setSelectedThread(null);
                    setMessages([]);
                    setNotice("");
                  }}
                  type="button"
                >
                  {item.label}
                  {item.id === "unread" && unreadCount > 0 ? (
                    <span className="ml-1 inline-flex min-w-4 items-center justify-center rounded-full bg-cyan px-1 text-[9px] font-black text-midnight">
                      {unreadCount}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
            <label className="sr-only" htmlFor="support-search">
              Search conversations by email
            </label>
            <input
              className="mt-3 h-10 w-full rounded-xl border border-line px-3 text-sm outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/20"
              id="support-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by email"
              value={search}
            />
            <button
              aria-label="Refresh conversations"
              className="mt-2 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-line bg-white text-xs font-bold text-midnight transition hover:border-cyan disabled:opacity-50"
              disabled={isLoadingList}
              onClick={refreshThreads}
              type="button"
            >
              <RefreshCw aria-hidden="true" className={isLoadingList ? "animate-spin" : undefined} size={14} />
              {isLoadingList ? "Refreshing…" : "Refresh conversations"}
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoadingList && threads.length === 0 ? (
              <p className="p-5 text-sm font-semibold text-muted">Loading conversations…</p>
            ) : null}
            {!isLoadingList && filteredThreads.length === 0 ? (
              <p className="p-5 text-sm font-semibold text-muted">
                {tab === "unread"
                  ? "No unread conversations."
                  : tab === "read"
                    ? "No open conversations."
                    : "No solved conversations yet."}
              </p>
            ) : null}
            {filteredThreads.map((thread) => {
              const active = thread.id === selectedId;
              return (
                <button
                  className={`flex w-full items-start gap-3 border-b border-line px-4 py-3 text-left transition ${
                    active ? "bg-[#eafcff]" : "hover:bg-cloud"
                  }`}
                  key={thread.id}
                  onClick={() => void openThread(thread.id)}
                  type="button"
                >
                  <span className="relative mt-1.5 h-2.5 w-2.5 shrink-0">
                    {thread.status === "unread" ? (
                      <span className="absolute inset-0 rounded-full bg-cyan shadow-[0_0_8px_#00d9f5]" />
                    ) : (
                      <span className="absolute inset-0 rounded-full bg-line" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-bold text-midnight">{thread.userEmail}</span>
                      <span className="shrink-0 text-[10px] font-semibold text-muted">
                        {formatDate(thread.lastMessageAt)}
                      </span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-xs font-semibold text-muted">
                      {thread.lastMessagePreview || "Photo"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className={`${selectedId ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col`}>
          {!selectedId ? (
            <div className="grid flex-1 place-items-center p-8 text-center">
              <p className="text-sm font-semibold text-muted">
                Select a conversation to reply. Unread threads show a cyan badge until you open them.
              </p>
            </div>
          ) : (
            <>
              <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
                <div>
                  <button
                    aria-label="Back to support conversations"
                    className="mr-2 inline-flex rounded-lg p-1 text-muted hover:bg-cloud hover:text-midnight md:hidden"
                    onClick={() => {
                       threadRequestRef.current += 1;
                      socketRef.current?.emit("support:leave", { threadId: selectedId });
                      setSelectedId(null);
                    }}
                    type="button"
                  >
                    <ArrowLeft aria-hidden="true" size={18} />
                  </button>
                  <p className="text-sm font-black text-midnight">{selectedThread?.userEmail ?? "Conversation"}</p>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
                    {selectedThread?.status ?? tab}
                  </p>
                </div>
                {selectedThread?.status !== "solved" ? (
                  <button
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-white px-3 text-xs font-bold text-midnight shadow-sm transition hover:border-cyan disabled:opacity-50"
                    disabled={isSolving}
                    onClick={() => void markSolved()}
                    type="button"
                  >
                    <CheckCircle2 aria-hidden="true" size={14} />
                    {isSolving ? "Solving…" : "Mark as solved"}
                  </button>
                ) : (
                  <span className="text-xs font-bold uppercase tracking-wide text-emerald-700">Archived</span>
                )}
              </header>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-cloud/40 px-5 py-4">
                {isLoadingThread ? (
                  <p className="text-sm font-semibold text-muted">Loading messages…</p>
                ) : null}
                {messages.map((message) => {
                  const fromAdmin = message.senderKind === "admin";
                  return (
                    <div className={`flex ${fromAdmin ? "justify-end" : "justify-start"}`} key={message.id}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                          fromAdmin
                            ? "bg-gradient-to-r from-midnight to-ink text-aqua"
                            : "border border-line bg-white text-midnight"
                        }`}
                      >
                        {message.body ? (
                          <p className="whitespace-pre-wrap text-sm font-semibold">{message.body}</p>
                        ) : null}
                        {message.attachments.map((attachment) => (
                          <div className="mt-2" key={attachment.id}>
                            <AuthedImage
                              alt="Support attachment"
                              attachmentId={attachment.id}
                              onOpen={setLightbox}
                              token={token}
                            />
                          </div>
                        ))}
                        <p className={`mt-1 text-[10px] font-semibold ${fromAdmin ? "text-aqua/70" : "text-muted"}`}>
                          {formatDate(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {selectedThread?.status === "solved" ? (
                <p className="border-t border-line px-5 py-3 text-xs font-semibold text-muted">
                  This issue is solved. The reporter no longer sees it; reply is disabled.
                </p>
              ) : (
                <form className="border-t border-line p-4" onSubmit={(event) => void sendMessage(event)}>
                  {pendingFile ? (
                    <p className="mb-2 flex items-center justify-between rounded-lg bg-cloud px-3 py-1.5 text-xs font-semibold text-midnight">
                      <span className="truncate">{pendingFile.name}</span>
                      <button
                        aria-label="Remove selected attachment"
                        className="ml-2 text-muted hover:text-midnight"
                        onClick={() => {
                          setPendingFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        type="button"
                      >
                        <X size={14} />
                      </button>
                    </p>
                  ) : null}
                  <div className="flex items-end gap-2">
                    <textarea
                      className="min-h-[44px] flex-1 resize-none rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/20"
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          event.currentTarget.form?.requestSubmit();
                        }
                      }}
                      placeholder="Reply to this traveler…"
                      rows={2}
                      value={draft}
                    />
                    <input
                      accept={IMAGE_ACCEPT}
                      className="hidden"
                      onChange={(event) => setPendingFile(event.target.files?.[0] ?? null)}
                      ref={fileInputRef}
                      type="file"
                    />
                    <button
                      aria-label="Attach an image"
                      className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-white text-midnight transition hover:border-cyan"
                      onClick={() => fileInputRef.current?.click()}
                      type="button"
                    >
                      <ImagePlus aria-hidden="true" size={16} />
                    </button>
                    <button
                      className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-gradient-to-r from-midnight to-ink px-4 text-xs font-bold text-aqua shadow-glow transition hover:opacity-90 disabled:opacity-50"
                      disabled={isSending || (!draft.trim() && !pendingFile)}
                      type="submit"
                    >
                      <Send aria-hidden="true" size={14} />
                      {isSending ? "Sending" : "Send"}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </section>
      </div>

      {lightbox ? (
        <div
          aria-label="Support attachment preview"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/70 p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
        >
          {/* vh/vw caps, not % of the overlay: grid/button max-h-full lets the
              image's intrinsic size win (min-height: auto) and looks zoomed. */}
          <img
            alt="Support attachment preview"
            className="h-auto max-h-[90vh] w-auto max-w-[90vw] rounded-2xl object-contain"
            onClick={(event) => event.stopPropagation()}
            src={lightbox}
          />
        </div>
      ) : null}
    </>
  );
}
