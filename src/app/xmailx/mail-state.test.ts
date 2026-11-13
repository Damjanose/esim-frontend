import { describe, expect, it } from "vitest";
import type { MailAccount, MailFolder, MailMessage } from "../../lib/mail-types";
import {
  buildReply,
  initialMailState,
  isStale,
  mailStateReducer,
  totalUnread
} from "./mail-state";

const accounts: MailAccount[] = [
  { id: "sales", address: "sales@example.test", label: "Sales", active: true },
  { id: "support", address: "support@example.test", label: "Support", active: true }
];

const folders: MailFolder[] = [
  { path: "INBOX", name: "INBOX", specialUse: null, unread: 3 },
  { path: "Sent", name: "Sent", specialUse: "\\Sent", unread: 0 }
];

function message(overrides: Partial<MailMessage> = {}): MailMessage {
  return {
    uid: 42,
    folder: "INBOX",
    messageId: "<orig@example.test>",
    from: "Customer <customer@example.test>",
    to: ["sales@example.test", "other@example.test"],
    cc: ["team@example.test"],
    subject: "Need help",
    date: "2026-11-12T10:00:00Z",
    text: "First line\nSecond line",
    html: null,
    references: ["<root@example.test>"],
    attachments: [],
    ...overrides
  };
}

describe("mail state reducer", () => {
  it("starts on the first account, INBOX, page 1, with nothing selected", () => {
    const state = initialMailState(accounts);
    expect(state).toEqual({
      accounts,
      activeAccount: "sales",
      folders: [],
      folder: "INBOX",
      page: 1,
      messages: [],
      total: 0,
      selectedUid: null,
      generation: 0
    });
  });

  it("starts with no active account when there are no accounts", () => {
    expect(initialMailState([]).activeAccount).toBeNull();
  });

  it("selecting a mailbox resets folder, page, list and selection and bumps generation", () => {
    const loaded = {
      ...initialMailState(accounts),
      folders,
      folder: "Sent",
      page: 3,
      messages: [{ uid: 1, from: "a", subject: "s", date: "d", seen: false, hasAttachments: false, preview: "" }],
      total: 80,
      selectedUid: 1,
      generation: 4
    };
    const next = mailStateReducer(loaded, { type: "selectAccount", account: "support" });
    expect(next.activeAccount).toBe("support");
    expect(next.folder).toBe("INBOX");
    expect(next.page).toBe(1);
    expect(next.folders).toEqual([]);
    expect(next.messages).toEqual([]);
    expect(next.total).toBe(0);
    expect(next.selectedUid).toBeNull();
    expect(next.generation).toBe(5);
    expect(next.accounts).toBe(accounts);
  });

  it("selecting a folder clears the selection, resets page to 1 and bumps generation", () => {
    const state = { ...initialMailState(accounts), page: 2, selectedUid: 9, generation: 1 };
    const next = mailStateReducer(state, { type: "selectFolder", folder: "Sent" });
    expect(next.folder).toBe("Sent");
    expect(next.page).toBe(1);
    expect(next.selectedUid).toBeNull();
    expect(next.generation).toBe(2);
    expect(next.activeAccount).toBe("sales");
  });

  it("selecting a page clears the selection and bumps generation without changing the folder", () => {
    const state = { ...initialMailState(accounts), folder: "Sent", selectedUid: 9, generation: 1 };
    const next = mailStateReducer(state, { type: "selectPage", page: 4 });
    expect(next.page).toBe(4);
    expect(next.folder).toBe("Sent");
    expect(next.selectedUid).toBeNull();
    expect(next.generation).toBe(2);
  });

  it("does not mutate the previous state", () => {
    const state = initialMailState(accounts);
    mailStateReducer(state, { type: "selectPage", page: 2 });
    expect(state.page).toBe(1);
    expect(state.generation).toBe(0);
  });
});

describe("isStale", () => {
  it("treats a response from an older generation as stale", () => {
    const state = { ...initialMailState(accounts), generation: 3 };
    expect(isStale(2, state)).toBe(true);
    expect(isStale(3, state)).toBe(false);
  });

  it("ignores a response started before the mailbox was switched", () => {
    const before = initialMailState(accounts);
    const after = mailStateReducer(before, { type: "selectAccount", account: "support" });
    expect(isStale(before.generation, after)).toBe(true);
    expect(isStale(after.generation, after)).toBe(false);
  });
});

describe("buildReply", () => {
  it("prefixes the subject with a single Re:", () => {
    const reply = buildReply(message(), { all: false, myAddress: "sales@example.test" });
    expect(reply.subject).toBe("Re: Need help");
  });

  it("does not double an existing Re: prefix, regardless of case", () => {
    expect(buildReply(message({ subject: "Re: Need help" }), { all: false, myAddress: "x@y.test" }).subject).toBe(
      "Re: Need help"
    );
    expect(buildReply(message({ subject: "RE: Need help" }), { all: false, myAddress: "x@y.test" }).subject).toBe(
      "Re: Need help"
    );
    expect(buildReply(message({ subject: "re:  Re: Need help" }), { all: false, myAddress: "x@y.test" }).subject).toBe(
      "Re: Need help"
    );
  });

  it("sets inReplyTo to the original Message-ID and appends it to the references", () => {
    const reply = buildReply(message(), { all: false, myAddress: "sales@example.test" });
    expect(reply.inReplyTo).toBe("<orig@example.test>");
    expect(reply.references).toEqual(["<root@example.test>", "<orig@example.test>"]);
  });

  it("replies to the sender only for a plain reply", () => {
    const reply = buildReply(message(), { all: false, myAddress: "sales@example.test" });
    expect(reply.to).toEqual(["Customer <customer@example.test>"]);
    expect(reply.cc).toEqual([]);
  });

  it("reply-all copies the other recipients and excludes my own address", () => {
    const reply = buildReply(message(), { all: true, myAddress: "Sales@Example.test" });
    expect(reply.to).toEqual(["Customer <customer@example.test>"]);
    expect(reply.cc).toEqual(["other@example.test", "team@example.test"]);
    expect(reply.cc).not.toContain("sales@example.test");
  });

  it("reply-all does not repeat the sender in cc", () => {
    const msg = message({ to: ["customer@example.test", "sales@example.test"], cc: [] });
    const reply = buildReply(msg, { all: true, myAddress: "sales@example.test" });
    expect(reply.to).toEqual(["Customer <customer@example.test>"]);
    expect(reply.cc).toEqual([]);
  });

  it("quotes the original body under an attribution line", () => {
    const reply = buildReply(message(), { all: false, myAddress: "sales@example.test" });
    expect(reply.text).toContain("On 2026-11-12T10:00:00Z, Customer <customer@example.test> wrote:");
    expect(reply.text).toContain("> First line\n> Second line");
  });

  it("starts without references when the original has none and no Message-ID", () => {
    const reply = buildReply(message({ messageId: null, references: [] }), {
      all: false,
      myAddress: "sales@example.test"
    });
    expect(reply.inReplyTo).toBeNull();
    expect(reply.references).toEqual([]);
  });
});

describe("totalUnread", () => {
  it("sums the unread count across folders", () => {
    expect(totalUnread(folders)).toBe(3);
    expect(totalUnread([])).toBe(0);
  });
});
