import { existsSync, readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as listProblems } from "@/app/bff/admin/troubleshoot/route";
import { POST as testMessage } from "@/app/bff/admin/troubleshoot/test/route";
import { PATCH as patchProblem } from "@/app/bff/admin/troubleshoot/[code]/route";
import { POST as addKeyword } from "@/app/bff/admin/troubleshoot/[code]/keywords/route";
import { GET as listUnmatched } from "@/app/bff/admin/troubleshoot/unmatched/route";
import { POST as dismissUnmatched } from "@/app/bff/admin/troubleshoot/unmatched/dismiss/route";
import { DELETE as deleteKeyword } from "@/app/bff/admin/troubleshoot/[code]/keywords/[id]/route";

describe("hidden admin troubleshooting page", () => {
  it("publishes a noindex /xtroubley route that is not linked from the public site", () => {
    expect(existsSync("src/app/xtroubley/page.tsx")).toBe(true);
    expect(readFileSync("src/app/page.tsx", "utf8")).not.toContain("/xtroubley");
    expect(readFileSync("src/app/xtroubley/page.tsx", "utf8")).toContain('"use client"');
    expect(readFileSync("src/app/xtroubley/layout.tsx", "utf8")).toContain("indexable: false");
  });

  it("uses the shared admin session and the troubleshoot proxy", () => {
    const pageSource = readFileSync("src/app/xtroubley/page.tsx", "utf8");
    expect(pageSource).toContain("useAdminSession");
    expect(pageSource).toContain("/bff/admin/troubleshoot");
    expect(pageSource).toContain("response.status === 401");
    expect(pageSource).toContain('method: "PATCH"');
    expect(pageSource).toContain('method: "DELETE"');
    expect(pageSource).toContain("Other languages update automatically after saving.");
    expect(pageSource).toContain("Single words can match too much. Prefer a phrase.");
    expect(pageSource).toContain("Use + for words in any order (esim + not working). End a word with * to match its forms (instal*).");
    expect(pageSource).toContain("Show deleted");
    expect(pageSource).toContain("No match");
    expect(pageSource).toContain("Unmatched messages");
    expect(pageSource).toContain(
      "Messages the assistant couldn't answer. Personal details are masked, and entries are deleted after 30 days."
    );
    expect(pageSource).toContain("No unmatched messages.");
    expect(pageSource).toContain("/bff/admin/troubleshoot/unmatched");
    expect(pageSource).toContain("/bff/admin/troubleshoot/unmatched/dismiss");
    expect(pageSource).toContain("Add as keyword");
    expect(pageSource).toContain("Dismiss");
  });

  it("is listed in the admin navigation", () => {
    const navSource = readFileSync("src/app/AdminNav.tsx", "utf8");
    expect(navSource).toContain("/xtroubley");
    expect(navSource).toContain("Troubleshooting");
  });
});

describe("admin troubleshoot BFF routes", () => {
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
  const params = <T>(value: T) => ({ params: Promise.resolve(value) });
  const url = "http://localhost/bff/admin/troubleshoot";

  function lastCall(fetchMock: ReturnType<typeof stubBackend>) {
    const [target, init = {}] = fetchMock.mock.calls[0];
    return { target: String(target), init, headers: new Headers(init.headers) };
  }

  it("GET lists problems with the admin token", async () => {
    const fetchMock = stubBackend({ problems: [] });
    const response = await listProblems(new Request(url, { headers: auth }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "success", data: { problems: [] } });
    const call = lastCall(fetchMock);
    expect(call.target).toMatch(/\/admin\/troubleshoot$/);
    expect(call.headers.get("Authorization")).toBe("Bearer admin-token");
  });

  it("POST test forwards the message", async () => {
    const fetchMock = stubBackend({ match: null, scores: [] });
    const response = await testMessage(
      new Request(`${url}/test`, { method: "POST", headers: auth, body: JSON.stringify({ message: "no data" }) })
    );
    expect(response.status).toBe(200);
    const call = lastCall(fetchMock);
    expect(call.target).toMatch(/\/admin\/troubleshoot\/test$/);
    expect(call.init.method).toBe("POST");
    expect(JSON.parse(String(call.init.body))).toEqual({ message: "no data" });
    expect(call.headers.get("Authorization")).toBe("Bearer admin-token");
  });

  it("PATCH forwards the body to the encoded problem code", async () => {
    const fetchMock = stubBackend({ problem: { code: "a/b" } });
    const response = await patchProblem(
      new Request(`${url}/x`, { method: "PATCH", headers: auth, body: JSON.stringify({ enabled: false }) }),
      params({ code: "a/b c" })
    );
    expect(response.status).toBe(200);
    const call = lastCall(fetchMock);
    expect(call.target).toMatch(/\/admin\/troubleshoot\/a%2Fb%20c$/);
    expect(call.init.method).toBe("PATCH");
    expect(JSON.parse(String(call.init.body))).toEqual({ enabled: false });
    expect(call.headers.get("Authorization")).toBe("Bearer admin-token");
  });

  it("POST keyword forwards the phrase to the encoded code", async () => {
    const fetchMock = stubBackend({ keyword: {}, restored: false, warning: "single_word" });
    const response = await addKeyword(
      new Request(`${url}/x/keywords`, { method: "POST", headers: auth, body: JSON.stringify({ phrase: "esim" }) }),
      params({ code: "no data/1" })
    );
    expect(response.status).toBe(200);
    expect((await response.json()).data.warning).toBe("single_word");
    const call = lastCall(fetchMock);
    expect(call.target).toMatch(/\/admin\/troubleshoot\/no%20data%2F1\/keywords$/);
    expect(call.init.method).toBe("POST");
    expect(JSON.parse(String(call.init.body))).toEqual({ phrase: "esim" });
    expect(call.headers.get("Authorization")).toBe("Bearer admin-token");
  });

  it("DELETE keyword encodes code and id", async () => {
    const fetchMock = stubBackend({ keyword: {} });
    const response = await deleteKeyword(
      new Request(`${url}/x/keywords/y`, { method: "DELETE", headers: auth }),
      params({ code: "a b", id: "k/1" })
    );
    expect(response.status).toBe(200);
    const call = lastCall(fetchMock);
    expect(call.target).toMatch(/\/admin\/troubleshoot\/a%20b\/keywords\/k%2F1$/);
    expect(call.init.method).toBe("DELETE");
    expect(call.headers.get("Authorization")).toBe("Bearer admin-token");
  });

  it("forwards only the message when the backend returns an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ status: "error", message: "Type a keyword.", code: "invalid_keyword" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        })
      )
    );
    const response = await addKeyword(
      new Request(`${url}/x/keywords`, { method: "POST", headers: auth, body: JSON.stringify({ phrase: "" }) }),
      params({ code: "x" })
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ status: "error", message: "Type a keyword." });
  });

  it("GET unmatched lists groups with the admin token (static segment, not [code])", async () => {
    const fetchMock = stubBackend({ groups: [] });
    const response = await listUnmatched(new Request(`${url}/unmatched`, { headers: auth }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "success", data: { groups: [] } });
    const call = lastCall(fetchMock);
    expect(call.target).toMatch(/\/admin\/troubleshoot\/unmatched$/);
    expect(call.headers.get("Authorization")).toBe("Bearer admin-token");
  });

  it("POST dismiss forwards the normalized text", async () => {
    const fetchMock = stubBackend({ dismissed: 2 });
    const response = await dismissUnmatched(
      new Request(`${url}/unmatched/dismiss`, {
        method: "POST",
        headers: auth,
        body: JSON.stringify({ normalized: "no data" })
      })
    );
    expect(response.status).toBe(200);
    expect((await response.json()).data.dismissed).toBe(2);
    const call = lastCall(fetchMock);
    expect(call.target).toMatch(/\/admin\/troubleshoot\/unmatched\/dismiss$/);
    expect(call.init.method).toBe("POST");
    expect(JSON.parse(String(call.init.body))).toEqual({ normalized: "no data" });
    expect(call.headers.get("Authorization")).toBe("Bearer admin-token");
  });

  it("rejects invalid JSON bodies with 400 and never calls the backend", async () => {
    const fetchMock = stubBackend({});
    const bad = (method: string) => new Request(url, { method, headers: auth, body: "{" });
    expect((await testMessage(bad("POST"))).status).toBe(400);
    expect((await patchProblem(bad("PATCH"), params({ code: "x" }))).status).toBe(400);
    expect((await addKeyword(bad("POST"), params({ code: "x" }))).status).toBe(400);
    expect((await dismissUnmatched(bad("POST"))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
