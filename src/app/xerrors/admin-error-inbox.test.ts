import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const XERRORS_SOURCES = [
  "src/app/xerrors/page.tsx",
  "src/app/xerrors/ErrorFiltersPanel.tsx",
  "src/app/xerrors/ErrorDetailPanel.tsx"
]
  .map((path) => readFileSync(path, "utf8"))
  .join("\n");

describe("hidden admin error inbox", () => {
  it("publishes a hidden /xerrors route without public navigation links", () => {
    expect(existsSync("src/app/xerrors/page.tsx")).toBe(true);

    const homeSource = readFileSync("src/app/page.tsx", "utf8");
    const errorInboxSource = readFileSync("src/app/xerrors/page.tsx", "utf8");
    const hookSource = readFileSync("src/app/useAdminSession.ts", "utf8");

    expect(homeSource).not.toContain("/xerrors");
    expect(errorInboxSource).toContain('"use client"');
    expect(errorInboxSource).toContain("useAdminSession");
    expect(hookSource).toContain("readAdminTokenCookie");
  });

  it("renders utility filters, table columns, and plain error detail actions", () => {
    const errorInboxSource = XERRORS_SOURCES;
    const hookSource = readFileSync("src/app/useAdminSession.ts", "utf8");

    expect(hookSource).toContain("/bff/admin/login");
    expect(errorInboxSource).toContain("/bff/admin/errors");
    expect(errorInboxSource).toContain("/bff/admin/errors/stats");
    expect(errorInboxSource).toContain("filtersToBackendParams");
    expect(errorInboxSource).toContain("Error Inbox");
    expect(errorInboxSource).toContain("Email");
    expect(errorInboxSource).toContain("Request ID");
    expect(errorInboxSource).toContain("Area");
    expect(errorInboxSource).toContain("API");
    expect(errorInboxSource).toContain("Status");
    expect(errorInboxSource).toContain("Message");
    expect(errorInboxSource).toContain("State");
    expect(errorInboxSource).toContain("Copy email");
    expect(errorInboxSource).toContain("Copy cURL");
    expect(errorInboxSource).toContain("authorizationHeader");
    expect(errorInboxSource).toContain("Copy full report");
    expect(errorInboxSource).toContain("displayBackendResponse");
    expect(errorInboxSource).toContain("backendResponse");
    expect(errorInboxSource).toContain("Mark resolved");
    expect(errorInboxSource).toContain("Repair action");
    expect(errorInboxSource).not.toContain('option value="info"');
    expect(errorInboxSource).not.toContain('option value="warning"');
  });

  it("binds filters to the URL, paginates by cursor and shows the new context columns", () => {
    const page = readFileSync("src/app/xerrors/page.tsx", "utf8");
    const filtersPanel = readFileSync("src/app/xerrors/ErrorFiltersPanel.tsx", "utf8");
    const detail = readFileSync("src/app/xerrors/ErrorDetailPanel.tsx", "utf8");

    expect(page).toContain("useSearchParams");
    expect(page).toContain("router.replace");
    expect(page).toContain("Suspense");
    expect(page).toContain("nextCursor");
    expect(page).toContain("Prev");
    expect(page).toContain("Next");
    for (const column of ["Source / Kind", "Platform / Version", "Screen", "Scenario / Stage"]) {
      expect(page).toContain(column);
    }
    expect(page).toContain("noEmailReason");
    expect(page).toContain("unverified");
    for (const label of ["Kind", "Source", "Severity", "Status class", "Platform", "App version", "Scenario", "No-email reason", "IP", "Page size", "Sort"]) {
      expect(filtersPanel).toContain(label);
    }
    for (const label of ["Device", "Stack", "API call trail", "Client context", "Email source"]) {
      expect(detail).toContain(label);
    }
    // The list omits the token; the detail fetch supplies it.
    expect(page).toContain("/bff/admin/errors/${encodeURIComponent(selectedId)}");
  });

  it("treats a 401 from detail, save/resolve and repair as a lost admin session before parsing JSON", () => {
    const page = readFileSync("src/app/xerrors/page.tsx", "utf8");
    for (const fn of ["updateSelected", "repairSelected"]) {
      const body = page.slice(page.indexOf(`async function ${fn}`));
      const fetchAt = body.indexOf("await fetch");
      const unauthorizedAt = body.indexOf("response.status === 401");
      const jsonAt = body.indexOf("await response.json()");
      expect(unauthorizedAt).toBeGreaterThan(fetchAt);
      expect(unauthorizedAt).toBeLessThan(jsonAt);
    }
    const detail = page.slice(page.indexOf("/bff/admin/errors/${encodeURIComponent(selectedId)}"));
    expect(detail.indexOf("response.status === 401")).toBeLessThan(detail.indexOf("await response.json()"));
  });

  it("offers provisioning-claim recovery from the detail record without browser dialogs", () => {
    const detail = readFileSync("src/app/xerrors/ErrorDetailPanel.tsx", "utf8");
    const page = readFileSync("src/app/xerrors/page.tsx", "utf8");
    expect(existsSync("src/app/bff/admin/errors/[id]/claim/route.ts")).toBe(true);
    for (const label of ["Provisioning claim", "Attach Airalo order id", "Attach provider result", "Mark safe to retry", "I checked Airalo and no order exists", "needs review", "Find the order in Airalo by description containing"]) {
      expect(detail).toContain(label);
    }
    expect(detail).not.toContain("confirm(");
    expect(detail).toContain("detailLoaded ? <ClaimSection");
    expect(page).toContain("/claim`");
    const claimFn = page.slice(page.indexOf("async function claimSelected"));
    expect(claimFn.indexOf("response.status === 401")).toBeLessThan(claimFn.indexOf("await response.json()"));
    expect(claimFn).toContain("setReloadTick");
  });

  it("adds the stats proxy next to the list proxy", () => {
    expect(existsSync("src/app/bff/admin/errors/stats/route.ts")).toBe(true);
    expect(readFileSync("src/app/bff/admin/errors/stats/route.ts", "utf8")).toContain("/admin/errors/stats");
  });

  it("renders hidden admin navigation between error inbox and purchase dashboard", () => {
    expect(existsSync("src/app/AdminNav.tsx")).toBe(true);

    const errorInboxSource = readFileSync("src/app/xerrors/page.tsx", "utf8");
    const navSource = readFileSync("src/app/AdminNav.tsx", "utf8");

    expect(errorInboxSource).toContain("AdminNav");
    expect(navSource).toContain("/xloginy");
    expect(navSource).toContain("/xerrors");
    expect(navSource).toContain("Purchase dashboard");
    expect(navSource).toContain("Error Inbox");
  });

  it("adds local admin API proxy routes for error inbox operations", () => {
    expect(existsSync("src/app/bff/admin/errors/route.ts")).toBe(true);
    expect(existsSync("src/app/bff/admin/errors/[id]/route.ts")).toBe(true);
    expect(existsSync("src/app/bff/admin/errors/[id]/repair/route.ts")).toBe(true);

    const listProxy = readFileSync("src/app/bff/admin/errors/route.ts", "utf8");
    const detailProxy = readFileSync("src/app/bff/admin/errors/[id]/route.ts", "utf8");
    const repairProxy = readFileSync("src/app/bff/admin/errors/[id]/repair/route.ts", "utf8");

    expect(listProxy).toContain("/admin/errors");
    expect(listProxy).toContain("Authorization");
    expect(detailProxy).toContain("/admin/errors/");
    expect(detailProxy).toContain("PATCH");
    expect(repairProxy).toContain("/repair");
    expect(repairProxy).toContain("POST");
  });
});
