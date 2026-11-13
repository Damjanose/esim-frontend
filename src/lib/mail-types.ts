/** A mailbox the admin can read, as returned by GET /admin/mail/accounts. */
export type MailAccount = {
  id: string;
  address: string;
  label: string;
  active: boolean;
};

/** An IMAP folder. `specialUse` is the RFC 6154 flag (e.g. `\\Sent`, `\\Trash`) when the server reports one. */
export type MailFolder = {
  path: string;
  name: string;
  specialUse: string | null;
  unread: number;
};

/** One row in the message list. `preview` is a short plain-text excerpt, never the full body. */
export type MailMessageSummary = {
  uid: number;
  from: string;
  subject: string;
  date: string;
  seen: boolean;
  hasAttachments: boolean;
  preview: string;
};

export type MailAttachment = {
  id: string;
  filename: string;
  size: number;
  contentType: string;
};

/** A fully loaded message. `html` is already sanitized by the backend. */
export type MailMessage = {
  uid: number;
  folder: string;
  messageId: string | null;
  from: string;
  to: string[];
  cc: string[];
  subject: string;
  date: string;
  text: string;
  html: string | null;
  references: string[];
  attachments: MailAttachment[];
};
