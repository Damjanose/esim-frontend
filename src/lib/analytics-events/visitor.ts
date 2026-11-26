import { ID_PATTERN, SESSION_IDLE_MS } from "./contract";

export type KeyValueStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export const VISITOR_STORAGE_KEY = "esim2you_analytics_visitor";
export const SESSION_STORAGE_KEY = "esim2you_analytics_session";
const VISITOR_KEY = VISITOR_STORAGE_KEY;
const SESSION_KEY = SESSION_STORAGE_KEY;

export function randomId(): string {
  return crypto.randomUUID();
}

function readSafely(storage: KeyValueStore, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeSafely(storage: KeyValueStore, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {
    // Storage can be blocked (private windows); the id then lasts for this page only.
  }
}

/** The visitor id, created once and kept in storage. Null and no write when analytics consent is missing. */
export function getVisitorId(storage: KeyValueStore, consent: boolean, makeId: () => string = randomId): string | null {
  if (!consent) return null;
  const stored = readSafely(storage, VISITOR_KEY);
  if (stored && ID_PATTERN.test(stored)) return stored;
  const id = makeId();
  writeSafely(storage, VISITOR_KEY, id);
  return id;
}

/** The session id. A new one starts after SESSION_IDLE_MS without activity. Null and no write without consent. */
export function getSessionId(
  storage: KeyValueStore,
  consent: boolean,
  now: number = Date.now(),
  makeId: () => string = randomId
): string | null {
  if (!consent) return null;
  let current: { id: string; last: number } | null = null;
  try {
    const parsed = JSON.parse(readSafely(storage, SESSION_KEY) ?? "null") as { id?: unknown; last?: unknown } | null;
    if (parsed && typeof parsed.id === "string" && ID_PATTERN.test(parsed.id) && typeof parsed.last === "number") {
      current = { id: parsed.id, last: parsed.last };
    }
  } catch {
    current = null;
  }
  const id = current && now - current.last <= SESSION_IDLE_MS ? current.id : makeId();
  writeSafely(storage, SESSION_KEY, JSON.stringify({ id, last: now }));
  return id;
}
