import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ACCESS_COOKIE } from "@/lib/session";
import { GET as getThread } from "./thread/route";
import { POST as postMessage } from "./messages/route";
import { POST as postSolved } from "./thread/solved/route";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const signedIn = `${ACCESS_COOKIE}=good-token`;

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("/bff/user/support", () => {
  it("proxies the traveler's open thread with their bearer token", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ status: "success", data: { thread: null, messages: [] } }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await getThread(
      new Request("http://localhost:3000/bff/user/support/thread", { headers: { cookie: signedIn } })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "success", data: { thread: null, messages: [] } });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/support\/thread$/);
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer good-token");
  });

  it("returns 401 without calling the API when signed out", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await getThread(new Request("http://localhost:3000/bff/user/support/thread"));

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards only body and attachmentIds when sending", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ status: "success", data: {} }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await postMessage(
      new Request("http://localhost:3000/bff/user/support/messages", {
        method: "POST",
        headers: { cookie: signedIn, "content-type": "application/json" },
        body: JSON.stringify({ body: "Hi", attachmentIds: ["a1"], userEmail: "spoof@example.com" })
      })
    );

    expect(response.status).toBe(200);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({ body: "Hi", attachmentIds: ["a1"] });
  });

  it("passes backend validation errors through", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ status: "error", error: "Message is too long." }, 400)));

    const response = await postSolved(
      new Request("http://localhost:3000/bff/user/support/thread/solved", { method: "POST", headers: { cookie: signedIn } })
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("Message is too long.");
  });
});
