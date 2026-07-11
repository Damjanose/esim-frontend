import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("hidden admin error inbox", () => {
  it("publishes a hidden /xerrors route without public navigation links", () => {
    expect(existsSync("src/app/xerrors/page.tsx")).toBe(true);

    const homeSource = readFileSync("src/app/page.tsx", "utf8");
    const errorInboxSource = readFileSync("src/app/xerrors/page.tsx", "utf8");

    expect(homeSource).not.toContain("/xerrors");
    expect(errorInboxSource).toContain('"use client"');
    expect(errorInboxSource).toContain("sessionStorage");
  });

  it("renders utility filters, table columns, and plain error detail actions", () => {
    const errorInboxSource = readFileSync("src/app/xerrors/page.tsx", "utf8");

    expect(errorInboxSource).toContain("/api/admin/login");
    expect(errorInboxSource).toContain("/api/admin/errors");
    expect(errorInboxSource).toContain("Error Inbox");
    expect(errorInboxSource).toContain("Email");
    expect(errorInboxSource).toContain("Request ID");
    expect(errorInboxSource).toContain("Severity");
    expect(errorInboxSource).toContain("Area");
    expect(errorInboxSource).toContain("API");
    expect(errorInboxSource).toContain("Status");
    expect(errorInboxSource).toContain("Message");
    expect(errorInboxSource).toContain("State");
    expect(errorInboxSource).toContain("Copy safe cURL");
    expect(errorInboxSource).toContain("Mark resolved");
    expect(errorInboxSource).toContain("Repair action");
  });

  it("adds local admin API proxy routes for error inbox operations", () => {
    expect(existsSync("src/app/api/admin/errors/route.ts")).toBe(true);
    expect(existsSync("src/app/api/admin/errors/[id]/route.ts")).toBe(true);
    expect(existsSync("src/app/api/admin/errors/[id]/repair/route.ts")).toBe(true);

    const listProxy = readFileSync("src/app/api/admin/errors/route.ts", "utf8");
    const detailProxy = readFileSync("src/app/api/admin/errors/[id]/route.ts", "utf8");
    const repairProxy = readFileSync("src/app/api/admin/errors/[id]/repair/route.ts", "utf8");

    expect(listProxy).toContain("/admin/errors");
    expect(listProxy).toContain("Authorization");
    expect(detailProxy).toContain("/admin/errors/");
    expect(detailProxy).toContain("PATCH");
    expect(repairProxy).toContain("/repair");
    expect(repairProxy).toContain("POST");
  });
});
