import { existsSync, readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as getPromo, PUT as putPromo } from "@/app/bff/admin/games-streak-promo/route";
import { GET as getClaims } from "@/app/bff/admin/games-streak-promo/claims/route";

describe("hidden admin games streak promo page", () => {
  it("publishes a noindex /xstreaky route that is not linked from the public site", () => {
    expect(existsSync("src/app/xstreaky/page.tsx")).toBe(true);
    expect(readFileSync("src/app/page.tsx", "utf8")).not.toContain("/xstreaky");
    expect(readFileSync("src/app/xstreaky/page.tsx", "utf8")).toContain('"use client"');
    expect(readFileSync("src/app/xstreaky/layout.tsx", "utf8")).toContain("indexable: false");
  });

  it("uses the shared admin session and the admin streak-promo proxy", () => {
    const pageSource = readFileSync("src/app/xstreaky/page.tsx", "utf8");
    expect(pageSource).toContain("useAdminSession");
    expect(pageSource).toContain("/bff/admin/games-streak-promo");
    expect(pageSource).toContain("response.status === 401");
    expect(pageSource).toContain('method: "PUT"');
  });

  it("is listed in the admin navigation", () => {
    const navSource = readFileSync("src/app/AdminNav.tsx", "utf8");
    expect(navSource).toContain("/xstreaky");
    expect(navSource).toContain("Games streak promo");
  });
});

describe("admin streak promo BFF routes", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubBackend(data: unknown) {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) =>
      new Response(JSON.stringify({ status: "success", data }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  const auth = { Authorization: "Bearer admin-token" };

  it("forwards GET and PUT to the backend admin endpoint with the admin token", async () => {
    const fetchMock = stubBackend({ settings: { enabled: true } });

    const got = await getPromo(new Request("http://localhost/bff/admin/games-streak-promo", { headers: auth }));
    expect(got.status).toBe(200);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/admin/games/streak-promo");

    const put = await putPromo(
      new Request("http://localhost/bff/admin/games-streak-promo", {
        method: "PUT",
        headers: auth,
        body: JSON.stringify({ enabled: false })
      })
    );
    expect(put.status).toBe(200);
    const [, init = {}] = fetchMock.mock.calls[1];
    expect(init.method).toBe("PUT");
    expect(JSON.parse(String(init.body))).toEqual({ enabled: false });
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer admin-token");
  });

  it("rejects a PUT with an invalid JSON body", async () => {
    const response = await putPromo(
      new Request("http://localhost/bff/admin/games-streak-promo", { method: "PUT", headers: auth, body: "{" })
    );
    expect(response.status).toBe(400);
  });

  it("clamps the claims limit", async () => {
    const fetchMock = stubBackend({ claims: [] });
    await getClaims(new Request("http://localhost/bff/admin/games-streak-promo/claims?limit=9999", { headers: auth }));
    expect(String(fetchMock.mock.calls[0][0])).toContain("/admin/games/streak-promo/claims?limit=200");
  });
});
