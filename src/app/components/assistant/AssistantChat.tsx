"use client";

import Lottie from "lottie-react";
import { ArrowRight, ArrowUp, Square, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import thinkingAnimation from "@/../public/lottie/assistant-thinking.json";
import { t } from "@/lib/assistant/copy";
import {
  LOCAL_REPLY_DELAY_MS,
  clarifyChoices,
  localReplyFor,
  matchFAQ,
  refineLocalReply,
  resolveClarifyFollowUp,
  timeoutFallbackReply,
  type LocalReply
} from "@/lib/assistant/localReplies";
import {
  assistantActionHref,
  assistantScreenForPath,
  featuredDestinationForPath,
  toAssistantDestinations,
  toAssistantOrderSummaries
} from "@/lib/assistant/navigation";
import {
  buildAssistantSuggestions,
  greetingKeyFor,
  matchScreenPreset,
  outOfScopeReply,
  type AssistantSuggestion
} from "@/lib/assistant/suggestions";
import type {
  AssistantAction,
  AssistantChatMessage,
  AssistantContext,
  AssistantDestination,
  AssistantErrorKind,
  AssistantFilterPayload,
  AssistantOrderSummary,
  AssistantReply,
  AssistantScreen,
  TranscriptEntry
} from "@/lib/assistant/types";
import type { OrderSummary } from "@/lib/order-groups";
import { fetchPackageOptions } from "@/services/packages";
import { assistantStore, replyCache, replyCacheKey } from "./assistantStore";

const MAX_INPUT_CHARS = 500;
/** Backstop for a slow network; the backend itself gives the model ~2.5s. */
const CLIENT_TIMEOUT_MS = 6_000;

type Session = {
  signedIn: boolean;
  destinations: AssistantDestination[];
  orders: AssistantOrderSummary[];
  hasBillingAddress: boolean | null;
};

const EMPTY_SESSION: Session = { signedIn: false, destinations: [], orders: [], hasBillingAddress: null };

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    const payload = (await response.json()) as { data?: T };
    return payload.data ?? null;
  } catch {
    return null;
  }
}

/** Signed-in state, the catalog (for local destination matching) and, signed in, orders for the top-up/trip chips. */
async function loadSession(pathname: string): Promise<Session> {
  const [status, packages] = await Promise.all([
    getJson<{ signedIn: boolean }>("/bff/auth/status"),
    fetchPackageOptions().catch(() => [])
  ]);
  const signedIn = status?.signedIn === true;
  const destinations = toAssistantDestinations(packages);
  const screen = assistantScreenForPath(pathname, signedIn);
  if (screen === "marketplace") return { signedIn, destinations, orders: [], hasBillingAddress: null };

  const [orders, billing] = await Promise.all([
    getJson<{ orders: OrderSummary[] }>("/bff/user/orders"),
    screen === "profile" ? getJson<{ billingAddress: unknown }>("/bff/user/billing-address") : null
  ]);
  return {
    signedIn,
    destinations,
    orders: toAssistantOrderSummaries(orders?.orders ?? [], packages),
    hasBillingAddress: billing ? billing.billingAddress != null : null
  };
}

class AssistantRequestError extends Error {
  constructor(readonly kind: AssistantErrorKind) {
    super(kind);
  }
}

/** Thrown when Stop (or a newer message) aborted the request; the chat ignores it. */
class AssistantAbortedError extends Error {}

async function sendAssistantMessage(
  input: { screen: AssistantScreen; messages: AssistantChatMessage[] },
  signal: AbortSignal
): Promise<AssistantReply> {
  // One controller for both Stop and the timeout; combining signals natively needs iOS Safari 17.4+.
  let timedOut = false;
  const request = new AbortController();
  const onStop = () => request.abort();
  signal.addEventListener("abort", onStop);
  const timer = setTimeout(() => {
    timedOut = true;
    request.abort();
  }, CLIENT_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch("/bff/assistant/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ ...input, lang: "en" }),
      signal: request.signal
    });
  } catch {
    if (timedOut) throw new AssistantRequestError("timeout");
    if (signal.aborted) throw new AssistantAbortedError();
    throw new AssistantRequestError("failed");
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", onStop);
  }
  if (response.status === 429) throw new AssistantRequestError("rate_limited");
  if (response.status === 503) {
    const body = (await response.json().catch(() => null)) as { code?: string } | null;
    throw new AssistantRequestError(body?.code === "assistant_timeout" ? "timeout" : "unavailable");
  }
  if (!response.ok) throw new AssistantRequestError("failed");
  const payload = (await response.json().catch(() => null)) as { data?: AssistantReply } | null;
  if (!payload?.data || typeof payload.data.reply !== "string") throw new AssistantRequestError("failed");
  return payload.data;
}

function lastAssistant(transcript: TranscriptEntry[]) {
  const last = [...transcript].reverse().find((entry) => entry.role === "assistant");
  return last?.role === "assistant" ? last : null;
}

function previousFilters(transcript: TranscriptEntry[]): AssistantFilterPayload | null {
  const action = lastAssistant(transcript)?.action;
  return action?.type === "apply_filters" ? action.payload : null;
}

function toApiMessages(transcript: TranscriptEntry[]): AssistantChatMessage[] {
  return transcript.flatMap((entry): AssistantChatMessage[] => {
    if (entry.role === "user") return [{ role: "user", content: entry.text }];
    if (entry.role !== "assistant") return [];
    const action = entry.action;
    if (!action) return [{ role: "assistant", content: entry.text }];
    // What the reply showed, so the AI refines it ("cheaper"); the label is UI only.
    return [
      {
        role: "assistant",
        content: entry.text,
        action: action.type === "apply_filters" ? { type: action.type, payload: action.payload } : { type: action.type }
      }
    ];
  });
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(query.matches);
    const onChange = () => setReduce(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduce;
}

/**
 * The assistant conversation (the app's AssistantChat). Typed text is answered
 * locally first (clarify follow-ups, screen presets, FAQ, filter parsing) and
 * only open-ended questions reach the AI. Buttons navigate with the router and
 * close the chat, the conversation itself stays for the rest of the visit.
 */
export function AssistantChat({ onClose, pathname }: { onClose: () => void; pathname: string }) {
  const router = useRouter();
  const reduceMotion = usePrefersReducedMotion();
  const [session, setSession] = useState<Session | null>(null);
  const signedIn = session?.signedIn ?? false;
  const screen = assistantScreenForPath(pathname, signedIn);
  const destinations = session?.destinations ?? EMPTY_SESSION.destinations;

  const [transcript, setTranscriptState] = useState<TranscriptEntry[]>(() => assistantStore.transcript(screen));
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const mounted = useRef(true);
  /**
   * Bumped by every send and by Stop. A reply whose id is no longer current was
   * stopped or replaced by a newer message, so it is dropped (and its fetch aborted).
   */
  const requestId = useRef(0);
  const inFlight = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    void loadSession(pathname).then((loaded) => {
      if (!cancelled) setSession(loaded);
    });
    return () => {
      cancelled = true;
      mounted.current = false;
    };
  }, [pathname]);

  // The screen can only change once the session loads (guest → signed in); show that screen's conversation.
  useEffect(() => {
    setTranscriptState(assistantStore.transcript(screen));
  }, [screen]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTo({ top: list.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" });
  }, [reduceMotion, sending, transcript.length]);

  const context = useMemo<AssistantContext>(() => {
    const loaded = session ?? EMPTY_SESSION;
    if (screen === "esims") return { screen, orders: loaded.orders };
    if (screen === "profile") return { screen, orders: loaded.orders, hasBillingAddress: loaded.hasBillingAddress };
    return {
      screen: "marketplace",
      isGuest: !loaded.signedIn,
      featuredDestination: featuredDestinationForPath(pathname, loaded.destinations)
    };
  }, [pathname, screen, session]);

  const suggestions = useMemo(() => buildAssistantSuggestions(context), [context]);

  const setTranscript = useCallback(
    (next: TranscriptEntry[]) => {
      // The store outlives this component, so a reply that lands after closing still shows on reopen.
      assistantStore.setTranscript(screen, next);
      if (mounted.current) setTranscriptState(next);
    },
    [screen]
  );

  const runAction = useCallback(
    (action: AssistantAction) => {
      const href = assistantActionHref(action, { signedIn, currentPath: pathname });
      if (!href) return;
      onClose();
      router.push(href);
    },
    [onClose, pathname, router, signedIn]
  );

  const renderLocalReply = useCallback((reply: LocalReply): TranscriptEntry => {
    const summary = reply.summary
      ?.map((part) => ("text" in part ? part.text : t(part.key, part.params)))
      .join(" · ");
    return {
      id: assistantStore.newId(),
      role: "assistant",
      text: t(reply.replyKey, { ...reply.replyParams, ...(summary ? { summary } : {}) }),
      action: reply.action && reply.actionLabelKey ? { ...reply.action, label: t(reply.actionLabelKey) } : null,
      ...(reply.clarify ? { clarify: reply.clarify } : {})
    };
  }, []);

  /** `preset` is a chip's canned reply; typed text is matched locally before falling back to the AI. */
  const send = useCallback(
    async (rawText: string, preset?: LocalReply) => {
      const text = rawText.trim().slice(0, MAX_INPUT_CHARS);
      if (!text) return;
      // A new message while thinking replaces the pending one.
      inFlight.current?.abort();
      const controller = new AbortController();
      inFlight.current = controller;
      const id = ++requestId.current;
      const isCurrent = () => requestId.current === id;
      const before = assistantStore.transcript(screen);
      const previous = previousFilters(before);
      const pendingClarify = lastAssistant(before)?.clarify ?? null;
      const withUser: TranscriptEntry[] = [...before, { id: assistantStore.newId(), role: "user", text }];
      setTranscript(withUser);
      setDraft("");
      setSending(true);

      // An answer to the last "packages or trip plan?" question wins over everything else.
      let local: LocalReply | null = preset ?? null;
      if (!local && pendingClarify) local = resolveClarifyFollowUp(text, pendingClarify, context, destinations);
      if (!local) local = matchScreenPreset(text, context);
      // Places, filters and navigation before the FAQ, so "I want to travel to Japan" shows Japan plans.
      if (!local) local = localReplyFor(text, context, destinations);
      if (!local) local = matchFAQ(text);

      if (local) {
        // Same thinking loader as a real AI reply, without the round-trip.
        await wait(LOCAL_REPLY_DELAY_MS);
        if (!isCurrent()) return;
        setTranscript([...assistantStore.transcript(screen), renderLocalReply(refineLocalReply(local, previous, destinations))]);
        if (mounted.current) setSending(false);
        return;
      }

      const lastAction = lastAssistant(withUser)?.action ?? null;
      const cacheKey = replyCacheKey({
        screen,
        text,
        previous: lastAction
          ? JSON.stringify({ type: lastAction.type, payload: "payload" in lastAction ? lastAction.payload : null })
          : pendingClarify
            ? `clarify:${pendingClarify.destination}`
            : ""
      });
      try {
        let reply = replyCache.get(cacheKey);
        if (reply) {
          await wait(LOCAL_REPLY_DELAY_MS);
        } else {
          reply = await sendAssistantMessage({ screen, messages: toApiMessages(withUser) }, controller.signal);
          replyCache.set(cacheKey, reply);
        }
        if (!isCurrent()) return;
        const outOfScope = reply.outOfScope ? outOfScopeReply(context) : null;
        const clarifySlug = reply.clarify?.destination;
        const clarify =
          clarifySlug && destinations.some((destination) => destination.slug === clarifySlug)
            ? { destination: clarifySlug }
            : undefined;
        setTranscript([
          ...assistantStore.transcript(screen),
          outOfScope
            ? {
                id: assistantStore.newId(),
                role: "assistant",
                text: t(outOfScope.textKey),
                action: { ...outOfScope.action, label: t(outOfScope.actionLabelKey) }
              }
            : {
                id: assistantStore.newId(),
                role: "assistant",
                text: reply.reply,
                // A question offers its own two choices instead of a single action.
                action: clarify ? null : reply.action,
                ...(clarify ? { clarify } : {})
              }
        ]);
      } catch (error) {
        if (!isCurrent() || error instanceof AssistantAbortedError) return;
        const kind = error instanceof AssistantRequestError ? error.kind : "failed";
        // The AI was too slow: a local best guess ("Show plans for Japan") beats an error.
        const fallback = kind === "timeout" ? timeoutFallbackReply(text, destinations) : null;
        if (fallback) {
          setTranscript([...assistantStore.transcript(screen), renderLocalReply(refineLocalReply(fallback, previous, destinations))]);
          return;
        }
        setTranscript([
          ...assistantStore.transcript(screen),
          {
            id: assistantStore.newId(),
            role: "error",
            text: t(`assistant.error.${kind}`),
            action: { type: "open_support", label: t("assistant.reportProblem") }
          }
        ]);
      } finally {
        if (isCurrent()) {
          inFlight.current = null;
          if (mounted.current) setSending(false);
        }
      }
    },
    [context, destinations, renderLocalReply, screen, setTranscript]
  );

  /** Stops waiting for the current reply and cancels its request. */
  const stop = useCallback(() => {
    requestId.current++;
    inFlight.current?.abort();
    inFlight.current = null;
    setSending(false);
    inputRef.current?.focus();
  }, []);

  // Closing the chat cancels a pending reply's request.
  useEffect(() => () => inFlight.current?.abort(), []);

  const handleSuggestion = (suggestion: AssistantSuggestion) => {
    if (suggestion.action) {
      runAction(suggestion.action);
      return;
    }
    void send(t(suggestion.labelKey, suggestion.labelParams), suggestion.reply);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void send(draft);
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send(draft);
    }
  };

  const clearConversation = () => {
    stop();
    setTranscript([]);
    setDraft("");
    inputRef.current?.focus();
  };

  const hasDraft = draft.trim().length > 0;
  // While thinking with an empty input the button stops; typing turns it back into send.
  const showStop = sending && !hasDraft;

  const chip = (suggestion: AssistantSuggestion, compact: boolean) => {
    const label = t(suggestion.labelKey, suggestion.labelParams);
    return (
      <button
        className={[
          "rounded-full px-3.5 py-2 text-left text-body-sm font-semibold transition disabled:opacity-40",
          compact ? "max-w-[240px] shrink-0 truncate" : "max-w-full",
          suggestion.primary
            ? "bg-gradient-to-b from-litTop to-brandBlue text-white shadow-lit hover:brightness-[1.04] active:translate-y-[2px] active:shadow-litPressed"
            : "bg-brandBlue/[0.08] text-brandBlue hover:bg-brandBlue/[0.11] active:bg-brandBlue/[0.14]"
        ].join(" ")}
        key={suggestion.id}
        onClick={() => handleSuggestion(suggestion)}
        type="button"
      >
        {label}
      </button>
    );
  };

  const actionButton = (action: AssistantAction, label: string, key?: string) => {
    if (!assistantActionHref(action, { signedIn, currentPath: pathname })) return null;
    return (
      <button
        // Wraps long labels, so it stays hand-sized; painted like a lit `Button`.
        className="inline-flex items-center gap-1.5 self-start rounded-full bg-gradient-to-b from-litTop to-brandBlue px-3.5 py-2 text-body-sm font-semibold text-white shadow-lit transition hover:brightness-[1.04] active:translate-y-[2px] active:shadow-litPressed motion-reduce:active:translate-y-0"
        key={key}
        onClick={() => runAction(action)}
        type="button"
      >
        {label}
        <ArrowRight aria-hidden="true" size={15} />
      </button>
    );
  };

  return (
    <section
      aria-label={t("assistant.title")}
      className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-surface sm:static sm:inset-auto sm:z-auto sm:mb-3 sm:h-[min(640px,calc(100dvh-140px))] sm:w-[400px] sm:rounded-[24px] sm:border sm:border-outline/60 sm:shadow-[0_24px_70px_rgba(6,17,49,0.22)] motion-safe:sm:animate-[assistant-card_220ms_ease-out]"
      role="dialog"
    >
      <header className="flex items-center gap-3 border-b border-outline/50 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] sm:pt-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-brandBlue/15 to-brandTeal/20">
          <Image alt="" className="h-[90%] w-[90%] object-contain" height={40} src="/images/assistant-astronaut.png" width={40} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-title-sm font-bold text-brandInk">{t("assistant.title")}</h2>
          <p className="truncate text-body-sm text-onSurfaceVariant">{t(`assistant.subtitle.${screen}`)}</p>
        </div>
        {transcript.length > 0 ? (
          <button
            aria-label={t("assistant.clear")}
            className="grid h-9 w-9 place-items-center rounded-full bg-surfaceBright text-onSurfaceVariant transition hover:text-brandInk"
            onClick={clearConversation}
            type="button"
          >
            <Trash2 aria-hidden="true" size={17} />
          </button>
        ) : null}
        <button
          aria-label={t("assistant.close")}
          className="grid h-9 w-9 place-items-center rounded-full bg-surfaceBright text-onSurfaceVariant transition hover:text-brandInk"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={18} />
        </button>
      </header>

      <div aria-live="polite" className="flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-4 py-4" ref={listRef}>
        <div className="flex">
          <p className="max-w-[85%] whitespace-pre-line rounded-[18px] rounded-tl-[6px] bg-surfaceBright px-3.5 py-2.5 text-body-md text-onSurface">
            {t(greetingKeyFor(context))}
          </p>
        </div>
        {transcript.length === 0 ? (
          <div className="flex flex-wrap gap-2 pb-1 pt-1">{suggestions.map((suggestion) => chip(suggestion, false))}</div>
        ) : null}

        {transcript.map((entry) => {
          if (entry.role === "user") {
            return (
              <div className="flex justify-end" key={entry.id}>
                <p className="max-w-[85%] whitespace-pre-line break-words rounded-[18px] rounded-tr-[6px] bg-brandBlue px-3.5 py-2.5 text-body-md text-white">
                  {entry.text}
                </p>
              </div>
            );
          }
          if (entry.role === "error") {
            return (
              <div className="flex" key={entry.id}>
                <div className="flex max-w-[85%] flex-col gap-2 rounded-[18px] rounded-tl-[6px] bg-brandBlue/[0.06] px-3.5 py-2.5">
                  <p className="text-body-sm text-onSurfaceVariant">{entry.text}</p>
                  {entry.action ? actionButton(entry.action, entry.action.label) : null}
                </div>
              </div>
            );
          }
          return (
            <div className="flex" key={entry.id}>
              <div className="flex max-w-[85%] flex-col gap-2 rounded-[18px] rounded-tl-[6px] bg-surfaceBright px-3.5 py-2.5">
                <p className="whitespace-pre-line break-words text-body-md text-onSurface">{entry.text}</p>
                {entry.action ? actionButton(entry.action, entry.action.label) : null}
                {entry.clarify
                  ? clarifyChoices(entry.clarify, context, destinations).map((choice) =>
                      actionButton(choice.action, t(choice.labelKey), choice.labelKey)
                    )
                  : null}
              </div>
            </div>
          );
        })}

        {sending ? (
          <div className="flex items-center gap-1.5" role="status">
            <span aria-hidden="true" className="h-10 w-10">
              <Lottie animationData={thinkingAnimation} autoplay={!reduceMotion} loop={!reduceMotion} />
            </span>
            <span className="text-body-sm text-onSurfaceVariant">{t("assistant.thinking")}</span>
          </div>
        ) : null}
      </div>

      {transcript.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto border-t border-outline/50 px-4 py-2 [scrollbar-width:none]">
          {suggestions.map((suggestion) => chip(suggestion, true))}
        </div>
      ) : null}

      <form
        className="flex items-end gap-2 border-t border-outline/50 px-3 pb-[max(8px,env(safe-area-inset-bottom))] pt-2"
        onSubmit={onSubmit}
      >
        <textarea
          aria-label={t("assistant.inputLabel")}
          className="max-h-[110px] min-h-[42px] flex-1 resize-none rounded-[21px] bg-surfaceBright px-4 py-2.5 text-[16px] leading-[22px] text-onSurface outline-none placeholder:text-onSurfaceVariant/70 focus-visible:ring-2 focus-visible:ring-brandBlue/40 sm:text-body-md"
          maxLength={MAX_INPUT_CHARS}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onInputKeyDown}
          placeholder={t("assistant.placeholder")}
          ref={inputRef}
          rows={1}
          value={draft}
        />
        {showStop ? (
          <button
            aria-label={t("assistant.stop")}
            className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-brandInk text-white transition hover:bg-brandInk/90"
            onClick={stop}
            type="button"
          >
            <Square aria-hidden="true" fill="currentColor" size={15} />
          </button>
        ) : (
          <button
            aria-label={t("assistant.send")}
            className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-brandBlue text-white transition hover:bg-brandBlue/90 disabled:opacity-40"
            disabled={!hasDraft}
            type="submit"
          >
            <ArrowUp aria-hidden="true" size={19} />
          </button>
        )}
      </form>
    </section>
  );
}
