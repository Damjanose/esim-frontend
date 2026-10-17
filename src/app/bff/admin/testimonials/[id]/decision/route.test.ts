import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("POST /bff/admin/testimonials/:id/decision", () => {
  it("forwards updatedAt and passes a backend 409 through as 409", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ status: "error", message: "Changed", code: "TESTIMONIAL_CHANGED" }),
          { status: 409, headers: { "content-type": "application/json" } }
        )
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("http://localhost:3000/bff/admin/testimonials/t1/decision", {
        method: "POST",
        headers: { Authorization: "Bearer admin-token", "content-type": "application/json" },
        body: JSON.stringify({ status: "approved", updatedAt: "2026-10-01T00:00:00.000Z" })
      }),
      { params: Promise.resolve({ id: "t1" }) }
    );

    expect(response.status).toBe(409);
    const call = fetchMock.mock.calls[0] as unknown as [unknown, RequestInit];
    expect(JSON.parse(String(call[1].body))).toEqual({
      status: "approved",
      updatedAt: "2026-10-01T00:00:00.000Z"
    });
  });
});
