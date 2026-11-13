/**
 * Pure helpers for the compose dialog. No React, no fetch.
 *
 * Multipart field names (the backend send route must read exactly these):
 *   to, cc, references  JSON array of strings, e.g. '["a@x.test"]'
 *   subject, text       plain strings
 *   inReplyTo           the original Message-ID, omitted for new mail
 *   attachments         one repeated file field per attachment
 */

export const MAX_ATTACHMENTS = 10;
export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

const ADDRESS_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

/**
 * Splits a recipient field into addresses. Commas and semicolons separate entries,
 * whitespace separates bare addresses, and a `Name <addr>` form stays one entry.
 * Separators inside `<...>` or double quotes do not split.
 */
export function splitAddresses(input: string): string[] {
  const parts: string[] = [];
  let current = "";
  let inAngle = false;
  let inQuotes = false;

  for (const char of input) {
    if (char === '"') inQuotes = !inQuotes;
    else if (char === "<") inAngle = true;
    else if (char === ">") inAngle = false;

    if (!inAngle && !inQuotes && (char === "," || char === ";")) {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  parts.push(current);

  return parts.flatMap((part) => part.match(/[^<>]*<[^>]*>|\S+/g) ?? []).map((entry) => entry.trim()).filter(Boolean);
}

/** The bare address inside `Name <addr>`, or the trimmed value when there are no angle brackets. */
export function bareAddress(value: string): string {
  const match = /<([^>]+)>/.exec(value);
  return (match ? match[1] : value).trim();
}

export function isValidAddress(value: string): boolean {
  return ADDRESS_PATTERN.test(bareAddress(value));
}

export function totalAttachmentBytes(files: { size: number }[]): number {
  return files.reduce((sum, file) => sum + file.size, 0);
}

/** Error text when the attachment selection exceeds the limits, otherwise null. */
export function attachmentError(files: { size: number }[]): string | null {
  if (files.length > MAX_ATTACHMENTS) {
    return `You can attach up to ${MAX_ATTACHMENTS} files.`;
  }
  if (totalAttachmentBytes(files) > MAX_ATTACHMENT_BYTES) {
    return "Attachments can be up to 20 MB in total.";
  }
  return null;
}

export type ComposeInput = {
  to: string[];
  cc: string[];
  subject: string;
  text: string;
  files: { size: number }[];
};

/** Returns the first user-facing problem with the draft, or null when it can be sent. */
export function validateCompose(input: ComposeInput): string | null {
  if (input.to.length === 0) {
    return "Add at least one recipient.";
  }
  const badTo = input.to.find((address) => !isValidAddress(address));
  if (badTo !== undefined) {
    return `"${badTo}" is not a valid email address.`;
  }
  const badCc = input.cc.find((address) => !isValidAddress(address));
  if (badCc !== undefined) {
    return `"${badCc}" is not a valid email address.`;
  }
  if (input.text.trim() === "") {
    return "Write a message before sending.";
  }
  return attachmentError(input.files);
}

export type SendFields = {
  to: string[];
  cc: string[];
  subject: string;
  text: string;
  inReplyTo: string | null;
  references: string[];
  files: File[];
};

export function buildSendFormData(fields: SendFields): FormData {
  const form = new FormData();
  form.set("to", JSON.stringify(fields.to));
  form.set("cc", JSON.stringify(fields.cc));
  form.set("subject", fields.subject);
  form.set("text", fields.text);
  if (fields.inReplyTo) form.set("inReplyTo", fields.inReplyTo);
  form.set("references", JSON.stringify(fields.references));
  for (const file of fields.files) {
    form.append("attachments", file);
  }
  return form;
}
