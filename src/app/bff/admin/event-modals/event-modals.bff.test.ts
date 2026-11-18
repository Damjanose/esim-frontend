import { beforeEach, describe, expect, it, vi } from "vitest";
import { backendFetch, backendFetchBinary, backendFetchFormData } from "@/lib/backend";
import * as list from "@/app/bff/admin/event-modals/route";
import * as detail from "@/app/bff/admin/event-modals/[id]/route";
import * as publish from "@/app/bff/admin/event-modals/[id]/publish/route";
import * as archive from "@/app/bff/admin/event-modals/[id]/archive/route";
import * as duplicate from "@/app/bff/admin/event-modals/[id]/duplicate/route";
import * as resolve from "@/app/bff/admin/event-modals/[id]/resolve/route";
import * as notifyWinners from "@/app/bff/admin/event-modals/[id]/winners/notify/route";
import * as preview from "@/app/bff/admin/event-modals/[id]/preview/route";
import * as resolution from "@/app/bff/admin/event-modals/[id]/resolution/route";
import * as disqualify from "@/app/bff/admin/event-modals/[id]/disqualify/route";
import * as scoreboard from "@/app/bff/admin/event-modals/[id]/scoreboard/route";
import * as entries from "@/app/bff/admin/event-modals/[id]/entries/route";
import * as entriesCsv from "@/app/bff/admin/event-modals/[id]/entries-csv/route";
import * as winners from "@/app/bff/admin/event-modals/[id]/winners/route";
import * as draw from "@/app/bff/admin/event-modals/[id]/winners/draw/route";
import * as images from "@/app/bff/admin/event-modals/images/route";
import * as image from "@/app/bff/admin/event-modals/images/[id]/route";

vi.mock("@/lib/backend", () => ({
  backendFetch: vi.fn(),
  backendFetchFormData: vi.fn(),
  backendFetchBinary: vi.fn()
}));

type Method = "GET" | "POST" | "PUT" | "DELETE";
type Handler = (request: Request, context: { params: Promise<{ id: string }> }) => Promise<Response>;

const auth = { Authorization: "Bearer admin-token" };
const BASE = "http://localhost/bff/admin/event-modals";

type JsonCase = {
  name: string;
  module: Record<string, unknown>;
  method: Method;
  id?: string;
  backendPath: string;
  body?: unknown;
};

const jsonCases: JsonCase[] = [
  { name: "list GET", module: list, method: "GET", backendPath: "/admin/event-modals" },
  {
    name: "list POST",
    module: list,
    method: "POST",
    backendPath: "/admin/event-modals",
    body: { title: "Promo" }
  },
  { name: "detail GET", module: detail, method: "GET", id: "m1", backendPath: "/admin/event-modals/m1" },
  {
    name: "detail PUT",
    module: detail,
    method: "PUT",
    id: "m1",
    backendPath: "/admin/event-modals/m1",
    body: { title: "Renamed" }
  },
  { name: "publish POST", module: publish, method: "POST", id: "m1", backendPath: "/admin/event-modals/m1/publish" },
  { name: "archive POST", module: archive, method: "POST", id: "m1", backendPath: "/admin/event-modals/m1/archive" },
  {
    name: "duplicate POST",
    module: duplicate,
    method: "POST",
    id: "m1",
    backendPath: "/admin/event-modals/m1/duplicate"
  },
  { name: "resolve POST", module: resolve, method: "POST", id: "m1", backendPath: "/admin/event-modals/m1/resolve" },
  {
    name: "winners notify POST",
    module: notifyWinners,
    method: "POST",
    id: "m1",
    backendPath: "/admin/event-modals/m1/winners/notify"
  },
  {
    name: "preview POST",
    module: preview,
    method: "POST",
    id: "m1",
    backendPath: "/admin/event-modals/m1/preview",
    body: { phase: "live", locale: "en" }
  },
  {
    name: "resolution PUT",
    module: resolution,
    method: "PUT",
    id: "m1",
    backendPath: "/admin/event-modals/m1/resolution",
    body: { resolution: { q1: "a" } }
  },
  {
    name: "disqualify POST",
    module: disqualify,
    method: "POST",
    id: "m1",
    backendPath: "/admin/event-modals/m1/disqualify",
    body: { userEmail: "fan@example.test", disqualified: true }
  },
  {
    name: "scoreboard GET",
    module: scoreboard,
    method: "GET",
    id: "m1",
    backendPath: "/admin/event-modals/m1/scoreboard"
  },
  { name: "entries GET", module: entries, method: "GET", id: "m1", backendPath: "/admin/event-modals/m1/entries" },
  { name: "winners GET", module: winners, method: "GET", id: "m1", backendPath: "/admin/event-modals/m1/winners" },
  {
    name: "winners POST",
    module: winners,
    method: "POST",
    id: "m1",
    backendPath: "/admin/event-modals/m1/winners",
    body: { userEmails: ["fan@example.test"], prize: "Free eSIM" }
  },
  {
    name: "winners DELETE",
    module: winners,
    method: "DELETE",
    id: "m1",
    backendPath: "/admin/event-modals/m1/winners"
  },
  {
    name: "winners draw POST",
    module: draw,
    method: "POST",
    id: "m1",
    backendPath: "/admin/event-modals/m1/winners/draw",
    body: { count: 2, prize: "Free eSIM" }
  }
];

function handlerOf(module: Record<string, unknown>, method: Method): Handler {
  const handler = module[method];
  if (typeof handler !== "function") throw new Error(`missing ${method} handler`);
  return handler as Handler;
}

function buildRequest(method: Method, body?: unknown, rawBody?: string): Request {
  const headers: Record<string, string> = { ...auth };
  if (body !== undefined || rawBody !== undefined) headers["Content-Type"] = "application/json";
  return new Request(BASE, {
    method,
    headers,
    body: rawBody ?? (body === undefined ? undefined : JSON.stringify(body))
  });
}

function contextFor(id?: string) {
  return { params: Promise.resolve({ id: id ?? "" }) };
}

describe("admin event-modals JSON BFF routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(jsonCases)("$name forwards to $backendPath with the admin token", async (testCase) => {
    vi.mocked(backendFetch).mockResolvedValue({ ok: true, data: { ok: true } });
    const handler = handlerOf(testCase.module, testCase.method);

    const response = await handler(buildRequest(testCase.method, testCase.body), contextFor(testCase.id));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "success", data: { ok: true } });
    const options = vi.mocked(backendFetch).mock.calls[0][1];
    expect(vi.mocked(backendFetch).mock.calls[0][0]).toBe(testCase.backendPath);
    expect(options).toMatchObject({ method: testCase.method, token: "admin-token" });
    if (testCase.body !== undefined) {
      expect(options).toMatchObject({ body: testCase.body });
    }
  });

  it.each(jsonCases)("$name passes backend errors through", async (testCase) => {
    vi.mocked(backendFetch).mockResolvedValue({ ok: false, status: 409, message: "This event modal is resolved" });
    const handler = handlerOf(testCase.module, testCase.method);

    const response = await handler(buildRequest(testCase.method, testCase.body), contextFor(testCase.id));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ status: "error", message: "This event modal is resolved" });
  });

  const bodyCases = jsonCases.filter((testCase) => testCase.body !== undefined);
  it.each(bodyCases)("$name returns 400 for an invalid JSON body without calling the backend", async (testCase) => {
    const handler = handlerOf(testCase.module, testCase.method);

    const response = await handler(buildRequest(testCase.method, undefined, "{not json"), contextFor(testCase.id));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ status: "error", message: "Invalid JSON body" });
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("encodes dynamic ids into the backend path", async () => {
    vi.mocked(backendFetch).mockResolvedValue({ ok: true, data: {} });

    await handlerOf(detail, "GET")(buildRequest("GET"), contextFor("a/b c"));

    expect(vi.mocked(backendFetch).mock.calls[0][0]).toBe("/admin/event-modals/a%2Fb%20c");
  });
});

describe("admin event-modals CSV BFF route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the backend CSV bytes with attachment headers", async () => {
    const csv = "email,disqualified,created_at,q1\nfan@example.test,false,2026-11-18,a\n";
    vi.mocked(backendFetchBinary).mockResolvedValue({
      ok: true,
      data: {
        buffer: new TextEncoder().encode(csv).buffer as ArrayBuffer,
        contentType: "text/csv; charset=utf-8",
        contentDisposition: 'attachment; filename="event-modal-m1-entries.csv"'
      }
    });

    const response = await entriesCsv.GET(buildRequest("GET"), contextFor("m1"));

    expect(backendFetchBinary).toHaveBeenCalledWith("/admin/event-modals/m1/entries.csv", { token: "admin-token" });
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("Content-Disposition")).toBe('attachment; filename="event-modal-m1-entries.csv"');
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.text()).toBe(csv);
  });

  it("falls back to a default attachment filename when the backend sends none", async () => {
    vi.mocked(backendFetchBinary).mockResolvedValue({
      ok: true,
      data: { buffer: new ArrayBuffer(0), contentType: "text/csv", contentDisposition: null }
    });

    const response = await entriesCsv.GET(buildRequest("GET"), contextFor("m1"));

    expect(response.headers.get("Content-Disposition")).toBe('attachment; filename="entries.csv"');
  });

  it("returns a JSON error with the backend status when the export fails", async () => {
    vi.mocked(backendFetchBinary).mockResolvedValue({ ok: false, status: 404, message: "Event modal not found" });

    const response = await entriesCsv.GET(buildRequest("GET"), contextFor("m1"));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ status: "error", message: "Event modal not found" });
  });
});

describe("admin event-modals image BFF routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uploads the multipart file to the backend with the admin token", async () => {
    vi.mocked(backendFetchFormData).mockResolvedValue({ ok: true, data: { id: "img1", url: "/x" } });
    const formData = new FormData();
    formData.append("file", new Blob(["png"], { type: "image/png" }), "banner.png");
    const request = new Request(`${BASE}/images`, { method: "POST", headers: auth, body: formData });

    const response = await images.POST(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "success", data: { id: "img1", url: "/x" } });
    const [path, options] = vi.mocked(backendFetchFormData).mock.calls[0];
    expect(path).toBe("/admin/event-modals/images");
    expect(options.token).toBe("admin-token");
    expect(options.formData.get("file")).toBeTruthy();
  });

  it("passes backend upload errors through", async () => {
    vi.mocked(backendFetchFormData).mockResolvedValue({ ok: false, status: 400, message: "file is required" });
    const formData = new FormData();
    const request = new Request(`${BASE}/images`, { method: "POST", headers: auth, body: formData });

    const response = await images.POST(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ status: "error", message: "file is required" });
  });

  it("returns 400 for a non-multipart upload body", async () => {
    const request = new Request(`${BASE}/images`, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: "{}"
    });

    const response = await images.POST(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ status: "error", message: "Invalid multipart body" });
    expect(backendFetchFormData).not.toHaveBeenCalled();
  });

  it("serves public image bytes without forwarding an admin token", async () => {
    vi.mocked(backendFetchBinary).mockResolvedValue({
      ok: true,
      data: {
        buffer: new Uint8Array([137, 80, 78, 71]).buffer as ArrayBuffer,
        contentType: "image/png",
        contentDisposition: null
      }
    });

    const response = await image.GET(new Request(`${BASE}/images/img1`), contextFor("img1"));

    const [path, options] = vi.mocked(backendFetchBinary).mock.calls[0];
    expect(path).toBe("/event-modals/images/img1");
    expect(options?.token).toBeUndefined();
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=3600");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([137, 80, 78, 71]));
  });

  it("returns a 404 JSON error when the image is missing", async () => {
    vi.mocked(backendFetchBinary).mockResolvedValue({ ok: false, status: 404, message: "Image not found" });

    const response = await image.GET(new Request(`${BASE}/images/nope`), contextFor("nope"));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ status: "error", message: "Image not found" });
  });
});
