import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath: (...args: unknown[]) => revalidatePath(...args) }));

import { POST } from "./route";

const SECRET = "test-holo-secret";

function sign(body: string, secret = SECRET) {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

function request(body: string, signature?: string) {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (signature) headers.set("X-Holo-Signature", signature);
  return new Request("https://esim.uplisoft.com/bff/blog/revalidate", { method: "POST", headers, body });
}

describe("POST /bff/blog/revalidate", () => {
  beforeEach(() => {
    revalidatePath.mockClear();
    vi.stubEnv("HOLO_WEBHOOK_SECRET", SECRET);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("rejects unsigned or wrongly signed calls", async () => {
    const body = JSON.stringify({ slugs: ["a-post"] });
    expect((await POST(request(body))).status).toBe(401);
    expect((await POST(request(body, sign(body, "other")))).status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("answers 503 without a configured secret", async () => {
    vi.stubEnv("HOLO_WEBHOOK_SECRET", "");
    const body = JSON.stringify({ slugs: ["a-post"] });
    expect((await POST(request(body, sign(body)))).status).toBe(503);
  });

  it("revalidates the index, each valid slug and the sitemaps", async () => {
    const body = JSON.stringify({ slugs: ["new-slug", "old-slug", "../xloginy"] });
    const res = await POST(request(body, sign(body)));
    expect(res.status).toBe(200);
    expect(revalidatePath.mock.calls.map((call) => call[0])).toEqual([
      "/blog",
      "/blog/new-slug",
      "/blog/old-slug",
      "/sitemap.xml",
      "/sitemaps/blog.xml"
    ]);
  });
});
