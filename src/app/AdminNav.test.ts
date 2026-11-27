import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/xloginy" }));
vi.mock("./useAdminSession", () => ({ useAdminSession: () => ({ token: "", logout: () => {} }) }));

import { adminNavGroups } from "./AdminNav";

describe("admin sidebar groups", () => {
  const source = readFileSync("src/app/AdminNav.tsx", "utf8");
  const linkHrefs = [...source.matchAll(/\{ href: "(\/x[a-z]+)", label:/g)].map((match) => match[1]);

  it("lists every admin route in exactly one group", () => {
    const grouped = adminNavGroups.flatMap((group) => group.hrefs);
    expect([...grouped].sort()).toEqual([...linkHrefs].sort());
    expect(new Set(grouped).size).toBe(grouped.length);
  });

  it("names the groups by what an admin is doing", () => {
    expect(adminNavGroups.map((group) => group.title)).toEqual(["Growth", "Money", "People", "Product", "System"]);
  });
});
