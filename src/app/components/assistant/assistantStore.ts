import type { AssistantReply, AssistantScreen, TranscriptEntry } from "@/lib/assistant/types";

/**
 * Module-level chat state. Every page renders its own Navbar (and so its own
 * launcher), so component state would reset on each navigation; this outlives
 * them for the whole tab, like the app's assistantStore. Memory-only on purpose:
 * a reload starts a fresh conversation.
 */
const transcripts = new Map<AssistantScreen, TranscriptEntry[]>();
let nextId = 0;
let teaserShown = false;

export const assistantStore = {
  transcript(screen: AssistantScreen): TranscriptEntry[] {
    return transcripts.get(screen) ?? [];
  },
  setTranscript(screen: AssistantScreen, entries: TranscriptEntry[]) {
    transcripts.set(screen, entries);
  },
  newId(): string {
    nextId += 1;
    return `m${nextId}`;
  },
  /** One teaser per tab session, not one per page view. */
  claimTeaser(): boolean {
    if (teaserShown) return false;
    teaserShown = true;
    return true;
  }
};

/**
 * Memory-only cache of AI replies (the app's assistantReplyCache), so asking the
 * same thing again skips the round-trip. A reply depends on what the previous
 * reply did, so that is part of the key.
 */
const CACHE_TTL_MS = 30 * 60 * 1000;
const CACHE_MAX_ENTRIES = 50;
const replies = new Map<string, { reply: AssistantReply; storedAt: number }>();

export function replyCacheKey(parts: { screen: AssistantScreen; text: string; previous: string }): string {
  const question = parts.text.toLowerCase().replace(/[\s\p{P}]+/gu, " ").trim();
  return [parts.screen, question, parts.previous].join("|");
}

export const replyCache = {
  get(key: string): AssistantReply | null {
    const entry = replies.get(key);
    if (!entry) return null;
    if (Date.now() - entry.storedAt > CACHE_TTL_MS) {
      replies.delete(key);
      return null;
    }
    // Re-insert so insertion order doubles as least-recently-used order.
    replies.delete(key);
    replies.set(key, entry);
    return entry.reply;
  },
  set(key: string, reply: AssistantReply) {
    replies.delete(key);
    replies.set(key, { reply, storedAt: Date.now() });
    while (replies.size > CACHE_MAX_ENTRIES) {
      const oldest = replies.keys().next().value;
      if (oldest === undefined) break;
      replies.delete(oldest);
    }
  }
};
