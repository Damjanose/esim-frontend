import { describe, expect, it } from "vitest";
import { ID_PATTERN, SESSION_IDLE_MS } from "@/lib/analytics-events/contract";
import { getSessionId, getVisitorId, type KeyValueStore } from "./visitor";

function memoryStore(): KeyValueStore & { writes: number; data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    writes: 0,
    getItem(key) {
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      this.writes += 1;
      data.set(key, value);
    }
  };
}

describe("getVisitorId", () => {
  it("makes a random id that matches the contract pattern and reuses it", () => {
    const storage = memoryStore();
    const first = getVisitorId(storage, true);
    expect(first).toMatch(ID_PATTERN);
    expect(getVisitorId(storage, true)).toBe(first);
  });

  it("writes nothing to storage and returns null when consent is false", () => {
    const storage = memoryStore();
    expect(getVisitorId(storage, false)).toBeNull();
    expect(storage.writes).toBe(0);
  });

  it("replaces a stored id that does not match the pattern", () => {
    const storage = memoryStore();
    storage.setItem("esim2you_analytics_visitor", "bad id!");
    const id = getVisitorId(storage, true);
    expect(id).toMatch(ID_PATTERN);
    expect(id).not.toBe("bad id!");
  });
});

describe("getSessionId", () => {
  const start = Date.UTC(2026, 10, 26, 10, 0, 0);

  it("keeps the same session while activity is recent", () => {
    const storage = memoryStore();
    const first = getSessionId(storage, true, start);
    expect(first).toMatch(ID_PATTERN);
    expect(getSessionId(storage, true, start + SESSION_IDLE_MS - 1000)).toBe(first);
  });

  it("starts a new session after 30 idle minutes", () => {
    const storage = memoryStore();
    const first = getSessionId(storage, true, start);
    const second = getSessionId(storage, true, start + SESSION_IDLE_MS + 1);
    expect(second).not.toBe(first);
    expect(second).toMatch(ID_PATTERN);
  });

  it("writes nothing to storage when consent is false", () => {
    const storage = memoryStore();
    expect(getSessionId(storage, false, start)).toBeNull();
    expect(storage.writes).toBe(0);
  });
});
