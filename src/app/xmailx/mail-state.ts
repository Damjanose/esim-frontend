import type { MailAccount, MailFolder, MailMessage, MailMessageSummary } from "../../lib/mail-types";

/**
 * Pure state for the admin mailbox page. No React, no fetch.
 *
 * `generation` is bumped on every navigation (mailbox, folder, page). A request
 * records the generation it started with, and its response is applied only if
 * `isStale` says it still matches, so late responses from a previous view are dropped.
 */
export type MailState = {
  accounts: MailAccount[];
  activeAccount: string | null;
  folders: MailFolder[];
  folder: string;
  page: number;
  messages: MailMessageSummary[];
  total: number;
  selectedUid: number | null;
  generation: number;
};

export type MailAction =
  | { type: "selectAccount"; account: string }
  | { type: "selectFolder"; folder: string }
  | { type: "selectPage"; page: number };

export function initialMailState(accounts: MailAccount[]): MailState {
  return {
    accounts,
    activeAccount: accounts[0]?.id ?? null,
    folders: [],
    folder: "INBOX",
    page: 1,
    messages: [],
    total: 0,
    selectedUid: null,
    generation: 0
  };
}

export function mailStateReducer(state: MailState, action: MailAction): MailState {
  switch (action.type) {
    case "selectAccount":
      return {
        ...state,
        activeAccount: action.account,
        folders: [],
        folder: "INBOX",
        page: 1,
        messages: [],
        total: 0,
        selectedUid: null,
        generation: state.generation + 1
      };
    case "selectFolder":
      return {
        ...state,
        folder: action.folder,
        page: 1,
        selectedUid: null,
        generation: state.generation + 1
      };
    case "selectPage":
      return {
        ...state,
        page: action.page,
        selectedUid: null,
        generation: state.generation + 1
      };
  }
}

/** True when a response was requested under an older view and must be ignored. */
export function isStale(responseGeneration: number, state: MailState): boolean {
  return responseGeneration !== state.generation;
}

export type ReplyDraft = {
  to: string[];
  cc: string[];
  subject: string;
  text: string;
  inReplyTo: string | null;
  references: string[];
};

/** Lowercased bare address from `Name <addr>` or a plain address. */
function bareAddress(value: string): string {
  const match = /<([^>]+)>/.exec(value);
  return (match ? match[1] : value).trim().toLowerCase();
}

function withReplyPrefix(subject: string): string {
  const stripped = subject.replace(/^(\s*re:\s*)+/i, "").trim();
  return `Re: ${stripped}`;
}

function quoteBody(message: MailMessage): string {
  const quoted = message.text
    .split(/\r?\n/)
    .map((line) => (line ? `> ${line}` : ">"))
    .join("\n");
  return `\n\nOn ${message.date}, ${message.from} wrote:\n${quoted}`;
}

export function buildReply(
  message: MailMessage,
  options: { all: boolean; myAddress: string }
): ReplyDraft {
  const me = bareAddress(options.myAddress);
  const sender = bareAddress(message.from);

  const cc: string[] = [];
  if (options.all) {
    const seen = new Set<string>([me, sender]);
    for (const address of [...message.to, ...message.cc]) {
      const key = bareAddress(address);
      if (seen.has(key)) continue;
      seen.add(key);
      cc.push(address);
    }
  }

  const references = [...message.references];
  if (message.messageId && !references.includes(message.messageId)) {
    references.push(message.messageId);
  }

  return {
    to: [message.from],
    cc,
    subject: withReplyPrefix(message.subject),
    text: quoteBody(message),
    inReplyTo: message.messageId,
    references
  };
}

/** Sum of unread messages across all folders, for the mailbox badge. */
export function totalUnread(folders: MailFolder[]): number {
  return folders.reduce((sum, folder) => sum + folder.unread, 0);
}
