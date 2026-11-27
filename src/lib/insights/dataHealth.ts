/** A platform counts as stale after a day without events. */
export const DATA_HEALTH_STALE_MS = 24 * 60 * 60 * 1000;

export type PlatformHealth =
  | { tone: "ok"; label: string }
  | { tone: "waiting"; label: string }
  | { tone: "stale"; label: string };

/**
 * One platform card on Data health. "No events yet" (neutral) when the platform has never sent
 * one, which is normal right after collection is switched on; red only when events used to
 * arrive and have stopped for a day.
 */
export function platformHealth(latest: string | null, now: number, collectionEnabled: boolean): PlatformHealth {
  if (!latest) {
    return { tone: "waiting", label: collectionEnabled ? "No events yet" : "Collection is off" };
  }
  const at = new Date(latest).toLocaleString("en-GB");
  if (now - Date.parse(latest) > DATA_HEALTH_STALE_MS) {
    return { tone: "stale", label: `Nothing for 24 hours (last ${at})` };
  }
  return { tone: "ok", label: at };
}

/** What each platform counts, shown under its card. */
export const PLATFORM_HINTS: Record<"ios" | "android" | "web", string> = {
  ios: "App opens from start-up. Screens and searches need an app build with event tracking.",
  android: "App opens from start-up. Screens and searches need an app build with event tracking.",
  web: "Only visitors who accept analytics cookies. Your own visits are not counted while you are signed in here."
};
