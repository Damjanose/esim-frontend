import { afterEach, describe, expect, it, vi } from "vitest";
import { adminFetch, adminUpload } from "./api";

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("adminFetch", () => {
  it("returns the data of a success envelope and sends the bearer token without a body", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { status: "success", data: { id: "m1" } }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await adminFetch<{ id: string }>("/m1", { token: "tok" });

    expect(result).toEqual({ ok: true, data: { id: "m1" } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/bff/admin/event-modals/m1");
    expect(init.method).toBe("GET");
    expect(init.cache).toBe("no-store");
    expect(init.body).toBeUndefined();
    expect(init.headers).toEqual({ Authorization: "Bearer tok" });
  });

  it("uses the bare collection path for an empty path", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { status: "success", data: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await adminFetch<unknown[]>("", { token: "tok" });

    const [url] = fetchMock.mock.calls[0] as unknown as [string];
    expect(url).toBe("/bff/admin/event-modals");
  });

  it("sends a JSON body with the method and content type", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { status: "success", data: { ok: 1 } }));
    vi.stubGlobal("fetch", fetchMock);

    await adminFetch("/m1/preview", { token: "tok", method: "POST", body: { phase: "live" } });

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ phase: "live" }));
    expect(init.headers).toEqual({
      Authorization: "Bearer tok",
      "Content-Type": "application/json"
    });
  });

  it("passes through the backend error message", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(409, { status: "error", message: "Voting still open" })));

    const result = await adminFetch("/m1/resolution", { token: "tok", method: "PUT", body: {} });

    expect(result).toEqual({ ok: false, status: 409, message: "Voting still open" });
  });

  it("falls back to a generic message when the error has no message", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("boom", { status: 500 })));

    const result = await adminFetch("", { token: "tok" });

    expect(result).toEqual({ ok: false, status: 500, message: "Something went wrong." });
  });

  it("calls onUnauthorized on 401 and returns the error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(401, { message: "Unauthorized" })));
    const onUnauthorized = vi.fn();

    const result = await adminFetch("", { token: "tok", onUnauthorized });

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });

  it("does not call onUnauthorized for other errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(400, { status: "error", message: "Bad" })));
    const onUnauthorized = vi.fn();

    await adminFetch("", { token: "tok", onUnauthorized });

    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("never throws on a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("fetch failed");
    }));

    const result = await adminFetch("", { token: "tok" });

    expect(result).toEqual({ ok: false, status: 0, message: "Could not reach the server." });
  });
});

describe("adminUpload", () => {
  it("posts the file as multipart form data to the images route", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, { status: "success", data: { id: "img1", url: "/x/img1" } })
    );
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["png-bytes"], "banner.png", { type: "image/png" });

    const result = await adminUpload(file, { token: "tok" });

    expect(result).toEqual({ ok: true, data: { id: "img1", url: "/x/img1" } });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/bff/admin/event-modals/images");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get("file")).toBeInstanceOf(File);
    expect(init.headers).toEqual({ Authorization: "Bearer tok" });
  });

  it("returns the backend message and calls onUnauthorized on 401", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(413, { status: "error", message: "Too large" })));
    const file = new File(["x"], "a.png", { type: "image/png" });
    expect(await adminUpload(file, { token: "tok" })).toEqual({
      ok: false,
      status: 413,
      message: "Too large"
    });

    const onUnauthorized = vi.fn();
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(401, { message: "Unauthorized" })));
    await adminUpload(file, { token: "tok", onUnauthorized });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("never throws on a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("fetch failed");
    }));
    const file = new File(["x"], "a.png", { type: "image/png" });

    expect(await adminUpload(file, { token: "tok" })).toEqual({
      ok: false,
      status: 0,
      message: "Could not reach the server."
    });
  });
});
