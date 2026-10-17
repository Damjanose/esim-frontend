type SupportLiveMessage = {
  id?: string;
  threadId?: string;
  body?: string | null;
  createdAt?: string;
  attachments?: unknown[];
};

type SupportLivePayload<T extends SupportLiveMessage> = {
  threadId?: string;
  message?: T;
};

export function supportLiveThreadId(payload: {
  threadId?: string;
  message?: { threadId?: string };
}): string | null {
  const id = payload.threadId ?? payload.message?.threadId;
  return typeof id === "string" && id.trim() ? id : null;
}

export function supportSocketMessageForThread<T extends { id?: string; threadId?: string }>(
  payload: SupportLivePayload<T>,
  selectedThreadId: string | null
): T | null {
  const message = payload.message;
  if (!message || !selectedThreadId) return null;
  const fromPayload = payload.threadId ?? message.threadId;
  return fromPayload === selectedThreadId ? message : null;
}

export function previewFromSupportMessage(input: {
  body?: string | null;
  attachments?: unknown[];
}): string {
  const text = input.body?.trim() ?? "";
  if (text) return text;
  return (input.attachments?.length ?? 0) > 0 ? "Photo" : "";
}

export function applyMessagePreviewToThreads<
  T extends { id: string; lastMessageAt: string; lastMessagePreview: string | null }
>(
  threads: T[],
  threadId: string,
  message: { createdAt: string; body?: string | null; attachments?: unknown[] }
): T[] {
  const preview = previewFromSupportMessage(message);
  const next = threads.map((thread) =>
    thread.id === threadId
      ? {
          ...thread,
          lastMessageAt: message.createdAt,
          lastMessagePreview: preview || thread.lastMessagePreview
        }
      : thread
  );
  return next.sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
}

export function shouldAlertAdminOfIncomingMessage(input: {
  senderKind?: string;
  threadId: string | null;
  selectedThreadId: string | null;
  pageVisible: boolean;
}): boolean {
  if (input.senderKind !== "user" || !input.threadId) return false;
  if (!input.pageVisible) return true;
  return input.selectedThreadId !== input.threadId;
}

export const SUPPORT_TYPING_IDLE_MS = 1_500;

export function nextAdminTypingEmit(input: {
  hasDraft: boolean;
  currentlyEmitting: boolean;
}): "start" | "stop" | null {
  if (input.hasDraft && !input.currentlyEmitting) return "start";
  if (!input.hasDraft && input.currentlyEmitting) return "stop";
  return null;
}

/**
 * Admin-only read receipt for an admin reply: "seen" once the traveler had the chat open
 * at or after the reply was sent.
 */
export function adminReceiptState(messageCreatedAt: string, userReadAt: string | null | undefined): "sent" | "seen" {
  if (!userReadAt) return "sent";
  return new Date(userReadAt).getTime() >= new Date(messageCreatedAt).getTime() ? "seen" : "sent";
}

/** "Apple iPhone 15 Pro · iOS 18.2" for the admin-only device highlight; null hides it. */
export function formatSupportDevice(thread: { deviceModel?: string | null; deviceOs?: string | null }): string | null {
  if (!thread.deviceModel) return null;
  return thread.deviceOs ? `${thread.deviceModel} · ${thread.deviceOs}` : thread.deviceModel;
}

type QuotedMessage = {
  id: string;
  body: string | null;
  attachments?: { id: string }[];
  replyTo?: { id: string; body: string | null; hasPhoto: boolean; photoId?: string | null } | null;
};

/** `support:message_updated`: swap in the edited message and refresh replies quoting it. */
export function applyEditedSupportMessage<T extends QuotedMessage>(list: T[], updated: T): T[] {
  return list.map((item) => {
    if (item.id === updated.id) return updated;
    if (item.replyTo?.id !== updated.id) return item;
    const photoId = updated.attachments?.[0]?.id ?? null;
    return { ...item, replyTo: { ...item.replyTo, body: updated.body, hasPhoto: Boolean(photoId), photoId } };
  });
}

/** `support:message_deleted`: drop it; replies to it lose their quote (the backend clears replyToId). */
export function applyDeletedSupportMessage<T extends QuotedMessage>(list: T[], messageId: string): T[] {
  return list
    .filter((item) => item.id !== messageId)
    .map((item) => (item.replyTo?.id === messageId ? { ...item, replyTo: null } : item));
}

/** How long the original message stays highlighted after clicking its quote. */
export const SUPPORT_QUOTE_FLASH_MS = 1_500;

/** DOM id of a chat row, so a reply quote can scroll to the message it quotes. */
export function supportMessageDomId(messageId: string): string {
  return `support-msg-${messageId}`;
}

/** One-line text for a reply quote: the body, else "Photo". */
export function supportQuoteSnippet(quote: { body: string | null; hasPhoto: boolean }): string {
  const text = quote.body?.replace(/\s+/g, " ").trim() ?? "";
  return text || (quote.hasPhoto ? "Photo" : "");
}

/** Drag distance (px) a bubble must travel toward the middle before letting go replies. */
export const SUPPORT_REPLY_DRAG_TRIGGER = 56;
const SUPPORT_REPLY_DRAG_MAX = 80;

/**
 * Pointer drag -> bubble offset for swipe-to-reply. Your own bubbles (right side) move left,
 * the other person's (left side) move right; dragging the other way does nothing.
 */
export function supportReplyDragOffset(deltaX: number, mine: boolean): number {
  const toward = mine ? -deltaX : deltaX;
  if (toward <= 0) return 0;
  const capped = Math.min(toward, SUPPORT_REPLY_DRAG_MAX);
  return mine ? -capped : capped;
}
