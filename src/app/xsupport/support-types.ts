export type SupportThreadStatus = "unread" | "read" | "solved";

export type SupportAttachment = {
  id: string;
  mimeType: string;
  byteSize: number;
};

export type SupportMessage = {
  id: string;
  threadId: string;
  senderKind: "user" | "admin";
  senderEmail: string;
  body: string | null;
  createdAt: string;
  /** Set when the admin edited the reply's text. */
  editedAt?: string | null;
  attachments: SupportAttachment[];
};

export type SupportThread = {
  id: string;
  userEmail: string;
  status: SupportThreadStatus;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  solvedAt: string | null;
  solvedBy: "user" | "admin" | null;
  createdAt: string;
  /** When the traveler last had the chat open (admin-only read receipts). */
  userReadAt?: string | null;
  /** Admin-only: the traveler's phone, from their latest mobile-app message (debugging aid). */
  deviceModel?: string | null;
  deviceOs?: string | null;
};

export type AdminJsonPayload<T> = {
  status?: string;
  data?: T;
  message?: string;
};
