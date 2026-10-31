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
  /** The earlier message this one replies to, as it is now; null when deleted or not a reply. */
  replyTo?: SupportReplyQuote | null;
  attachments: SupportAttachment[];
};

export type SupportReplyQuote = {
  id: string;
  senderKind: "user" | "admin";
  body: string | null;
  hasPhoto: boolean;
  /** First photo of the quoted message, for the quote thumbnail. */
  photoId?: string | null;
};

/** The order a conversation is about, as the admin thread endpoints send it (snake_case, like orders). */
export type SupportOrderRef = {
  id: number;
  code: string;
  package_id: string;
  iccid: string | null;
  status: string;
  lifecycle_status: string;
  created_at: string;
};

export type SupportRecentOrder = SupportOrderRef & { expires_at: string | null };

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
  /** Admin-only: the order the traveler linked to the conversation. Absent on some socket payloads. */
  order?: SupportOrderRef | null;
};

export type AdminJsonPayload<T> = {
  status?: string;
  data?: T;
  message?: string;
};
