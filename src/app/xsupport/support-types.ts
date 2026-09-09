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
};

export type AdminJsonPayload<T> = {
  status?: string;
  data?: T;
  message?: string;
};
