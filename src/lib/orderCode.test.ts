import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isOrderCode, receiptDownloadPath } from "./orderCode";

describe("order codes", () => {
  it("accepts backend order codes and rejects anything path-like", () => {
    expect(isOrderCode("20240101-123456")).toBe(true);
    expect(isOrderCode("ES-7F3K9Q")).toBe(true);
    expect(isOrderCode("")).toBe(false);
    expect(isOrderCode("../admin")).toBe(false);
    expect(isOrderCode("a/b")).toBe(false);
    expect(isOrderCode("x".repeat(65))).toBe(false);
  });

  it("builds the same-origin BFF receipt path", () => {
    expect(receiptDownloadPath("ES-7F3K9Q")).toBe("/bff/orders/ES-7F3K9Q/receipt");
  });
});

describe("receipt wiring", () => {
  it("order detail page offers the receipt download", () => {
    const page = readFileSync("src/app/account/[orderId]/page.tsx", "utf8");
    expect(page).toContain("receiptDownloadPath(order.code)");
  });

  it("/orders/[code] never renders an order the backend refused", () => {
    const page = readFileSync("src/app/orders/[code]/page.tsx", "utf8");
    expect(page).toContain("if (!receipt?.ok) notFound();");
    expect(page).toContain("redirect(`/account/${own.id}`)");
  });
});
