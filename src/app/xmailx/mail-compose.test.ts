import { describe, expect, it } from "vitest";
import {
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS,
  attachmentError,
  buildSendFormData,
  splitAddresses,
  totalAttachmentBytes,
  validateCompose
} from "./mail-compose";

describe("splitAddresses", () => {
  it("splits on commas and semicolons and trims whitespace", () => {
    expect(splitAddresses(" a@x.test ,b@x.test;  c@x.test ")).toEqual(["a@x.test", "b@x.test", "c@x.test"]);
  });

  it("splits on whitespace between bare addresses", () => {
    expect(splitAddresses("a@x.test b@x.test\nc@x.test")).toEqual(["a@x.test", "b@x.test", "c@x.test"]);
  });

  it("keeps 'Name <addr>' forms whole, including a display name with spaces", () => {
    expect(splitAddresses("Jane Doe <jane@x.test>, bob@x.test")).toEqual(["Jane Doe <jane@x.test>", "bob@x.test"]);
  });

  it("does not split on a comma inside a quoted display name", () => {
    expect(splitAddresses('"Doe, Jane" <jane@x.test>; bob@x.test')).toEqual([
      '"Doe, Jane" <jane@x.test>',
      "bob@x.test"
    ]);
  });

  it("returns an empty list for blank input", () => {
    expect(splitAddresses("  ,; ")).toEqual([]);
    expect(splitAddresses("")).toEqual([]);
  });
});

describe("attachments", () => {
  it("sums attachment sizes", () => {
    expect(totalAttachmentBytes([{ size: 100 }, { size: 250 }])).toBe(350);
    expect(totalAttachmentBytes([])).toBe(0);
  });

  it("uses the backend limits: 10 files, 20 MB total", () => {
    expect(MAX_ATTACHMENTS).toBe(10);
    expect(MAX_ATTACHMENT_BYTES).toBe(20 * 1024 * 1024);
  });

  it("rejects more than 10 files", () => {
    const files = Array.from({ length: 11 }, () => ({ size: 1 }));
    expect(attachmentError(files)).toMatch(/10/);
    expect(attachmentError(files.slice(0, 10))).toBeNull();
  });

  it("rejects more than 20 MB in total", () => {
    expect(attachmentError([{ size: MAX_ATTACHMENT_BYTES }])).toBeNull();
    expect(attachmentError([{ size: MAX_ATTACHMENT_BYTES }, { size: 1 }])).toMatch(/20 MB/);
  });
});

describe("validateCompose", () => {
  const valid = {
    to: ["jane@x.test"],
    cc: [],
    subject: "Hello",
    text: "Body",
    files: []
  };

  it("accepts a complete message", () => {
    expect(validateCompose(valid)).toBeNull();
  });

  it("requires at least one recipient", () => {
    expect(validateCompose({ ...valid, to: [] })).toMatch(/recipient/i);
  });

  it("rejects malformed To and Cc addresses and names the bad one", () => {
    expect(validateCompose({ ...valid, to: ["not-an-address"] })).toContain("not-an-address");
    expect(validateCompose({ ...valid, cc: ["bob@"] })).toContain("bob@");
  });

  it("accepts 'Name <addr>' recipients", () => {
    expect(validateCompose({ ...valid, to: ["Jane <jane@x.test>"] })).toBeNull();
  });

  it("requires a non-blank body", () => {
    expect(validateCompose({ ...valid, text: "   " })).toMatch(/message/i);
  });

  it("does not require a subject", () => {
    expect(validateCompose({ ...valid, subject: "" })).toBeNull();
  });

  it("reports attachment limit errors", () => {
    expect(validateCompose({ ...valid, files: [{ size: MAX_ATTACHMENT_BYTES + 1 }] })).toMatch(/20 MB/);
  });
});

describe("buildSendFormData", () => {
  it("writes lists as JSON arrays and omits empty reply headers", () => {
    const form = buildSendFormData({
      to: ["jane@x.test"],
      cc: [],
      subject: "Hi",
      text: "Body",
      inReplyTo: null,
      references: [],
      files: []
    });
    expect(form.get("to")).toBe('["jane@x.test"]');
    expect(form.get("cc")).toBe("[]");
    expect(form.get("subject")).toBe("Hi");
    expect(form.get("text")).toBe("Body");
    expect(form.has("inReplyTo")).toBe(false);
    expect(form.get("references")).toBe("[]");
    expect(form.getAll("attachments")).toEqual([]);
  });

  it("carries reply headers and appends every attachment under 'attachments'", () => {
    const file = new File(["abc"], "a.txt", { type: "text/plain" });
    const form = buildSendFormData({
      to: ["jane@x.test"],
      cc: ["bob@x.test"],
      subject: "Re: Hi",
      text: "Reply",
      inReplyTo: "<orig@x.test>",
      references: ["<root@x.test>", "<orig@x.test>"],
      files: [file, file]
    });
    expect(form.get("inReplyTo")).toBe("<orig@x.test>");
    expect(form.get("references")).toBe('["<root@x.test>","<orig@x.test>"]');
    const attached = form.getAll("attachments");
    expect(attached).toHaveLength(2);
    expect((attached[0] as File).name).toBe("a.txt");
  });
});
