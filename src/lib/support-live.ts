type SupportLiveMessage = {
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

export function supportSocketMessageForThread<T extends { threadId?: string }>(
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
